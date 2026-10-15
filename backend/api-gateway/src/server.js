import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { openApiSpec } from './openapi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: [config.frontendOrigin, 'http://localhost:5173'],
  credentials: true,
}));

app.use((request, response, next) => {
  authenticateCognitoRequest(request)
    .then(() => next())
    .catch((error) => {
      response.status(error.statusCode || 401).json({
        success: false,
        message: error.message || 'Cognito authentication is required.',
      });
    });
});

const assetsDir = path.isAbsolute(config.assetsDir)
  ? config.assetsDir
  : path.resolve(__dirname, '../../..', config.assetsDir);

app.use('/assets', express.static(assetsDir));

app.get('/api-docs/openapi.json', (_request, response) => {
  response.json(openApiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Wonderland API Documentation',
}));

app.use('/api/auth', proxyRequest('/api/auth', config.authServiceUrl, '/auth'));
app.use('/api/users', proxyRequest('/api/users', config.userServiceUrl, '/users'));
app.use('/api/business', proxyRequest('/api/business', config.businessServiceUrl, '/business'));
app.get('/api/platform-data', proxyRequest('/api/platform-data', config.businessServiceUrl, '/business/platform-data'));

app.get('/health', (_request, response) => {
  response.json({ service: 'api-gateway', status: 'ok' });
});

app.listen(config.port, () => {
  console.log(`API Gateway running on http://127.0.0.1:${config.port}`);
});

function proxyRequest(publicPrefix, targetBaseUrl, servicePrefix) {
  return async (request, response) => {
    try {
      const targetUrl = new URL(request.originalUrl.replace(publicPrefix, servicePrefix), targetBaseUrl);
      const headers = copyRequestHeaders(request.headers);
      const hasBody = !['GET', 'HEAD'].includes(request.method);
      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: hasBody ? request : undefined,
        duplex: hasBody ? 'half' : undefined,
      });

      response.status(upstreamResponse.status);
      copyResponseHeaders(upstreamResponse.headers, response);
      response.send(Buffer.from(await upstreamResponse.arrayBuffer()));
    } catch (error) {
      response.status(502).json({
        success: false,
        message: `Gateway proxy failed: ${error.message}`,
      });
    }
  };
}

function copyRequestHeaders(headers) {
  const forwarded = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    if (shouldSkipHeader(key)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => forwarded.append(key, item));
      return;
    }

    if (value !== undefined) {
      forwarded.set(key, value);
    }
  });
  return forwarded;
}

function copyResponseHeaders(headers, response) {
  headers.forEach((value, key) => {
    if (!shouldSkipHeader(key) && key.toLowerCase() !== 'set-cookie') {
      response.setHeader(key, value);
    }
  });

  const setCookies = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [];

  if (setCookies.length > 0) {
    response.setHeader('set-cookie', setCookies);
    return;
  }

  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    response.setHeader('set-cookie', setCookie);
  }
}

function shouldSkipHeader(headerName) {
  return [
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
  ].includes(headerName.toLowerCase());
}

async function authenticateCognitoRequest(request) {
  if (!isCognitoEnabled() || request.method === 'OPTIONS') {
    return;
  }

  // Cognito mode never forwards browser-provided profile cookies to services.
  request.headers.cookie = '';
  const accessToken = bearerToken(request.headers.authorization);
  if (!accessToken) {
    if (requiresCognitoAuthentication(request.path)) {
      throw authorizationError('Cognito login is required.');
    }
    return;
  }

  const profile = await cognitoProfile(accessToken);
  request.headers.cookie = profileCookieHeader(profile);
}

function isCognitoEnabled() {
  return Boolean(config.cognitoUserPoolId && config.cognitoUserPoolClientId && config.cognitoRegion);
}

function requiresCognitoAuthentication(pathname) {
  if (pathname === '/api/platform-data' || pathname === '/health' || pathname.startsWith('/assets/')) {
    return false;
  }
  if (pathname === '/api/auth/login' || pathname === '/api/auth/register' || pathname === '/api/auth/confirm-registration') {
    return false;
  }
  if (/^\/api\/business\/bookings\/[^/]+\/check-in$/.test(pathname)) {
    return false;
  }
  return pathname.startsWith('/api/users') || pathname.startsWith('/api/business');
}

function bearerToken(authorization) {
  const match = /^Bearer\s+(.+)$/i.exec(String(authorization || ''));
  return match ? match[1].trim() : '';
}

async function cognitoProfile(accessToken) {
  const cognitoResponse = await fetch(`https://cognito-idp.${config.cognitoRegion}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.GetUser',
    },
    body: JSON.stringify({ AccessToken: accessToken }),
  });
  const user = await cognitoResponse.json().catch(() => ({}));
  if (!cognitoResponse.ok) {
    throw authorizationError(user.message || 'Cognito access token is invalid or expired.');
  }

  // GetUser verifies the exact access token with Cognito before these claims are used.
  const claims = parseVerifiedAccessTokenClaims(accessToken);
  const attributes = Object.fromEntries((user.UserAttributes || []).map(({ Name, Value }) => [Name, Value]));
  const groups = Array.isArray(claims['cognito:groups']) ? claims['cognito:groups'] : [];
  const type = groups.includes('Administrators') ? 'admin' : 'visitor';

  return {
    name: attributes.name || attributes.email || user.Username,
    email: attributes.email || user.Username,
    contact: attributes['custom:contact_number'] || '',
    type,
  };
}

function parseVerifiedAccessTokenClaims(accessToken) {
  const parts = accessToken.split('.');
  if (parts.length !== 3) {
    throw authorizationError('Cognito access token is malformed.');
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw authorizationError('Cognito access token is malformed.');
  }

  const expectedIssuer = `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}`;
  if (claims.token_use !== 'access' || claims.client_id !== config.cognitoUserPoolClientId || claims.iss !== expectedIssuer) {
    throw authorizationError('Cognito access token is not valid for this application.');
  }
  return claims;
}

function profileCookieHeader(profile) {
  return [
    `wonderland_profile_name=${encodeURIComponent(profile.name)}`,
    `wonderland_profile_email=${encodeURIComponent(profile.email)}`,
    `wonderland_profile_contact=${encodeURIComponent(profile.contact)}`,
    `wonderland_profile_type=${encodeURIComponent(profile.type)}`,
  ].join('; ');
}

function authorizationError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

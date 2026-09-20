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

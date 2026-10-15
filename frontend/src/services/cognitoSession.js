const sessionKey = 'wonderland_cognito_session';

export function isCognitoConfigured() {
  return Boolean(
    import.meta.env.VITE_COGNITO_USER_POOL_ID
    && import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID
    && import.meta.env.VITE_COGNITO_REGION,
  );
}

export function saveCognitoSession(authentication) {
  if (!authentication?.access_token) {
    return;
  }

  window.sessionStorage.setItem(sessionKey, JSON.stringify({
    accessToken: authentication.access_token,
    expiresAt: Date.now() + (Number(authentication.expires_in || 3600) * 1000),
  }));
}

export function cognitoAccessToken() {
  const serialized = window.sessionStorage.getItem(sessionKey);
  if (!serialized) {
    return '';
  }

  try {
    const session = JSON.parse(serialized);
    if (!session.accessToken || Number(session.expiresAt) <= Date.now()) {
      clearCognitoSession();
      return '';
    }
    return session.accessToken;
  } catch {
    clearCognitoSession();
    return '';
  }
}

export function clearCognitoSession() {
  window.sessionStorage.removeItem(sessionKey);
}

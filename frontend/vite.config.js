import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_API_GATEWAY_URL || 'http://127.0.0.1:8089';
  const proxyTarget = {
    target: backendUrl,
    changeOrigin: true,
  };

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': proxyTarget,
        '/assets': proxyTarget,
      },
    },
  };
});

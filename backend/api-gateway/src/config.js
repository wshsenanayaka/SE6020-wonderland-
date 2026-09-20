import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8089),
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:4001',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://127.0.0.1:4002',
  businessServiceUrl: process.env.BUSINESS_SERVICE_URL || 'http://127.0.0.1:4003',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173',
  assetsDir: process.env.ASSETS_DIR || 'frontend/public/assets',
};

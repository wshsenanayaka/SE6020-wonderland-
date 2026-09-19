import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173',
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@wonderland.com',
  defaultAdminHash: process.env.DEFAULT_ADMIN_HASH || '$2y$12$2RYtiV.c4Mha0KnY4LBswe5mH9lSpFP9IL7IWp1wj5YTc4TNfTQ22',
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'wonderland_db',
};

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

export const config = {
  port: Number(process.env.PORT || 4003),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173',
  projectRoot,
  assetsDir: process.env.ASSETS_DIR || path.join(projectRoot, 'assets'),
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'wonderland_db',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeCurrency: process.env.STRIPE_CURRENCY || 'usd',
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL || 'http://127.0.0.1:5173/payment-success?session_id={CHECKOUT_SESSION_ID}',
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL || 'http://127.0.0.1:5173/payment-cancel',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || 'Wonderland Theme Park <no-reply@wonderland.local>',
};

config.activityImageDir = path.join(config.assetsDir, 'images', 'activities');

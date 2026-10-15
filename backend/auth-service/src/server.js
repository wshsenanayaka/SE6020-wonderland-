import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors({ origin: [config.frontendOrigin, 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.get('/health', (_request, response) => response.json({ service: 'auth-service', status: 'ok' }));
app.use((error, _request, response, _next) => {
  response.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Authentication request failed.',
  });
});

app.listen(config.port, () => {
  console.log(`Auth service running on http://127.0.0.1:${config.port}`);
});

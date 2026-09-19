import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(cors({ origin: [config.frontendOrigin, 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use('/users', userRoutes);
app.get('/health', (_request, response) => response.json({ service: 'user-service', status: 'ok' }));

app.listen(config.port, () => {
  console.log(`User service running on http://127.0.0.1:${config.port}`);
});

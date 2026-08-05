import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import scoreRoutes from './routes/score.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import publishRoutes from './routes/publish.routes';
import scheduleRoutes from './routes/schedule.routes';
import barackRoutes from './routes/barack.routes';
import { ApiResponse } from './types';

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// 1. Configure CORS
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// 2. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check Endpoint
app.get('/', (req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    message: '🚀 AGP Competition Management System - REST API Backend Online!',
    data: {
      serverTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
    },
  });
});

app.get('/api/health', (req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    message: 'Backend status: OK (Healthy)',
  });
});

// 4. API Route Bindings
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/baracks', barackRoutes);

// 5. 404 Route Handler
app.use((req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.originalUrl}' (${req.method}) tidak ditemukan pada server API.`,
  });
});

// 6. Global Error Handling Middleware
app.use((err: any, req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada Express API Backend.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 7. Start Express Server Listener
app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AGP REST API Backend Server Berjalan!`);
  console.log(`🌐 Host: http://${HOST}:${PORT}`);
  console.log(`🔗 Local Access: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

export default app;

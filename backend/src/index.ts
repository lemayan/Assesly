import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import examsRouter from './routes/exams';
import questionsRouter from './routes/questions';
import resultsRouter from './routes/results';
import aiRouter from './routes/ai';
import adminRouter from './routes/admin';
import seedRouter from './routes/seed';

const app = express();
const prisma = new PrismaClient();

// Middleware
const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const isProd = process.env.NODE_ENV === 'production';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin or non-browser requests
      if (!origin) return callback(null, true);
      // In development, allow any origin to simplify local/LAN testing
      if (!isProd) return callback(null, true);
      // In production, allow only configured origins
      if (envOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/exams', examsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seed', seedRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';
const server = app.listen(port, host, () => {
  const addr = server.address();
  console.log('API listening on', addr);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { Pool } from 'pg';
import { createPhieuNhapKhoRouter } from './routes/phieuNhapKhoRoutes';

export function createApp(pool: Pool): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/phieu-nhap-kho', createPhieuNhapKhoRouter(pool));

  return app;
}

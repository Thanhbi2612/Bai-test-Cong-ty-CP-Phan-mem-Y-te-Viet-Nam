import { Router } from 'express';
import { Pool } from 'pg';
import { PhieuNhapKhoController } from '../controllers/phieuNhapKhoController';
import { PhieuNhapKhoService } from '../services/phieuNhapKhoService';

export function createPhieuNhapKhoRouter(pool: Pool): Router {
  const router = Router();
  const service = new PhieuNhapKhoService(pool);
  const controller = new PhieuNhapKhoController(service);

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}

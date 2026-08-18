import { Request, Response } from 'express';
import {
  PhieuNhapKhoService,
  PhieuNhapKhoNotFoundError,
  SoPhieuDaTonTaiError,
  SttTrungError,
} from '../services/phieuNhapKhoService';
import { validatePhieuNhapKho } from '../validators/phieuNhapKhoValidator';

export class PhieuNhapKhoController {
  constructor(private readonly service: PhieuNhapKhoService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { valid, errors } = validatePhieuNhapKho(req.body);
    if (!valid) {
      res.status(400).json({ message: 'Du lieu khong hop le', errors });
      return;
    }

    try {
      const created = await this.service.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof SoPhieuDaTonTaiError || err instanceof SttTrungError) {
        res.status(409).json({ message: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ message: 'Loi he thong khi luu phieu nhap kho' });
    }
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.service.findAll();
      res.status(200).json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Loi he thong khi lay danh sach phieu nhap kho' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'id khong hop le' });
      return;
    }
    try {
      const item = await this.service.findById(id);
      res.status(200).json(item);
    } catch (err) {
      if (err instanceof PhieuNhapKhoNotFoundError) {
        res.status(404).json({ message: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ message: 'Loi he thong khi lay phieu nhap kho' });
    }
  };
}

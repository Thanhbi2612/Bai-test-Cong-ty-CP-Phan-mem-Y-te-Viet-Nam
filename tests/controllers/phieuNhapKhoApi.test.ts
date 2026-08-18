import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import { PhieuNhapKhoController } from '../../src/controllers/phieuNhapKhoController';
import { PhieuNhapKhoNotFoundError, SoPhieuDaTonTaiError, SttTrungError } from '../../src/services/phieuNhapKhoService';

function buildApp(service: any) {
  const app = express();
  app.use(express.json());
  const controller = new PhieuNhapKhoController(service);
  const router = Router();
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  app.use('/api/phieu-nhap-kho', router);
  return app;
}

function validPayload() {
  return {
    so_phieu: 'PNK001',
    ngay_nhap: '2026-08-18',
    nguoi_giao: 'Nguyen Van A',
    chi_tiet: [
      { stt: 1, ten_vat_tu: 'Bong bang', don_vi_tinh: 'hop', so_luong_chung_tu: 10, so_luong_thuc_nhap: 10, don_gia: 15000 },
    ],
  };
}

describe('POST /api/phieu-nhap-kho', () => {
  it('tra ve 201 va phieu da luu khi du lieu hop le', async () => {
    const service = { create: jest.fn().mockResolvedValue({ id: 1, ...validPayload() }) };
    const app = buildApp(service);

    const res = await request(app).post('/api/phieu-nhap-kho').send(validPayload());

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(service.create).toHaveBeenCalledWith(validPayload());
  });

  it('tra ve 400 khi du lieu khong hop le', async () => {
    const service = { create: jest.fn() };
    const app = buildApp(service);

    const res = await request(app).post('/api/phieu-nhap-kho').send({ ...validPayload(), so_phieu: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('tra ve 409 khi so phieu bi trung', async () => {
    const service = { create: jest.fn().mockRejectedValue(new SoPhieuDaTonTaiError('PNK001')) };
    const app = buildApp(service);

    const res = await request(app).post('/api/phieu-nhap-kho').send(validPayload());

    expect(res.status).toBe(409);
  });

  it('tra ve 500 khi service loi khong xac dinh', async () => {
    const service = { create: jest.fn().mockRejectedValue(new Error('db down')) };
    const app = buildApp(service);

    const res = await request(app).post('/api/phieu-nhap-kho').send(validPayload());

    expect(res.status).toBe(500);
  });

  it('tra ve 409 khi 2 dong chi tiet trung stt (phat hien o tang DB)', async () => {
    const service = { create: jest.fn().mockRejectedValue(new SttTrungError()) };
    const app = buildApp(service);

    const res = await request(app).post('/api/phieu-nhap-kho').send(validPayload());

    expect(res.status).toBe(409);
  });

  it('tra ve 400 va khong goi service khi 2 dong chi tiet trung stt (phat hien o tang validate)', async () => {
    const service = { create: jest.fn() };
    const app = buildApp(service);
    const payload = validPayload();
    payload.chi_tiet.push({ ...payload.chi_tiet[0], stt: 1 });

    const res = await request(app).post('/api/phieu-nhap-kho').send(payload);

    expect(res.status).toBe(400);
    expect(service.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/phieu-nhap-kho/:id', () => {
  it('tra ve 404 khi khong tim thay', async () => {
    const service = { findById: jest.fn().mockRejectedValue(new PhieuNhapKhoNotFoundError(999)) };
    const app = buildApp(service);

    const res = await request(app).get('/api/phieu-nhap-kho/999');

    expect(res.status).toBe(404);
  });

  it('tra ve 400 khi id khong hop le', async () => {
    const service = { findById: jest.fn() };
    const app = buildApp(service);

    const res = await request(app).get('/api/phieu-nhap-kho/abc');

    expect(res.status).toBe(400);
    expect(service.findById).not.toHaveBeenCalled();
  });

  it('tra ve 200 va phieu khi tim thay', async () => {
    const service = { findById: jest.fn().mockResolvedValue({ id: 1, so_phieu: 'PNK001' }) };
    const app = buildApp(service);

    const res = await request(app).get('/api/phieu-nhap-kho/1');

    expect(res.status).toBe(200);
    expect(res.body.so_phieu).toBe('PNK001');
  });
});

describe('GET /api/phieu-nhap-kho', () => {
  it('tra ve danh sach phieu nhap kho', async () => {
    const service = { findAll: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]) };
    const app = buildApp(service);

    const res = await request(app).get('/api/phieu-nhap-kho');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('tra ve mang rong khi chua co phieu nao', async () => {
    const service = { findAll: jest.fn().mockResolvedValue([]) };
    const app = buildApp(service);

    const res = await request(app).get('/api/phieu-nhap-kho');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

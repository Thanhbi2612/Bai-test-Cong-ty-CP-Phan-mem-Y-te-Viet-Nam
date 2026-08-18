import {
  PhieuNhapKhoService,
  SoPhieuDaTonTaiError,
  SttTrungError,
  PhieuNhapKhoNotFoundError,
} from '../../src/services/phieuNhapKhoService';
import { PhieuNhapKhoInput } from '../../src/models/phieuNhapKho';

function makeInput(): PhieuNhapKhoInput {
  return {
    so_phieu: 'PNK001',
    ngay_nhap: '2026-08-18',
    nguoi_giao: 'Nguyen Van A',
    chi_tiet: [
      { stt: 1, ten_vat_tu: 'Bong bang', don_vi_tinh: 'hop', so_luong_chung_tu: 10, so_luong_thuc_nhap: 10, don_gia: 15000 },
      { stt: 2, ten_vat_tu: 'Cong bam', don_vi_tinh: 'cai', so_luong_chung_tu: 5, so_luong_thuc_nhap: 4, don_gia: 20000 },
    ],
  };
}

function createMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

function createMockPool(client: any) {
  return {
    connect: jest.fn().mockResolvedValue(client),
    query: jest.fn(),
  } as any;
}

describe('PhieuNhapKhoService.create', () => {
  it('luu phieu nhap kho va cac dong chi tiet trong 1 transaction', async () => {
    const client = createMockClient();
    const header = { id: 1, so_phieu: 'PNK001', tong_thanh_tien: 230000 };

    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [header] }) // insert header
      .mockResolvedValueOnce({
        rows: [
          { id: 10, stt: 1, thanh_tien: 150000 },
          { id: 11, stt: 2, thanh_tien: 80000 },
        ],
      }) // insert chi_tiet (bulk, 1 cau lenh cho ca 2 dong)
      .mockResolvedValueOnce(undefined); // COMMIT

    const pool = createMockPool(client);
    const service = new PhieuNhapKhoService(pool);

    const result = await service.create(makeInput());

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(result.id).toBe(1);
    expect(result.chi_tiet).toHaveLength(2);
    expect(client.release).toHaveBeenCalled();
  });

  it('gan thoi diem ky (ky_luc) khi co chu_ky, va de null khi khong ky', async () => {
    const client = createMockClient();
    const header = { id: 1, so_phieu: 'PNK001', tong_thanh_tien: 230000 };

    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [header] }) // insert header
      .mockResolvedValueOnce({
        rows: [
          { id: 10, stt: 1 },
          { id: 11, stt: 2 },
        ],
      }) // insert chi_tiet (bulk)
      .mockResolvedValueOnce(undefined); // COMMIT

    const pool = createMockPool(client);
    const service = new PhieuNhapKhoService(pool);

    const input: PhieuNhapKhoInput = {
      ...makeInput(),
      thu_kho: 'Tran Thi B',
      thu_kho_chu_ky: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    };
    await service.create(input);

    const [insertSql, insertValues] = client.query.mock.calls[1];
    const columns = insertSql.match(/INSERT INTO phieu_nhap_kho \(([^)]+)\)/)[1].split(',').map((c: string) => c.trim());

    const thuKhoChuKyIdx = columns.indexOf('thu_kho_chu_ky');
    const thuKhoKyLucIdx = columns.indexOf('thu_kho_ky_luc');
    const nguoiLapPhieuKyLucIdx = columns.indexOf('nguoi_lap_phieu_ky_luc');

    expect(insertValues[thuKhoChuKyIdx]).toBe(input.thu_kho_chu_ky);
    expect(insertValues[thuKhoKyLucIdx]).toEqual(expect.any(String));
    expect(insertValues[nguoiLapPhieuKyLucIdx]).toBeNull();
  });

  it('rollback va nem SoPhieuDaTonTaiError khi so_phieu bi trung (unique violation)', async () => {
    const client = createMockClient();
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce({ code: '23505', constraint: 'phieu_nhap_kho_so_phieu_key' }) // insert header fails
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const pool = createMockPool(client);
    const service = new PhieuNhapKhoService(pool);

    await expect(service.create(makeInput())).rejects.toBeInstanceOf(SoPhieuDaTonTaiError);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('rollback va nem lai loi khong xac dinh', async () => {
    const client = createMockClient();
    const unexpected = new Error('connection lost');
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(unexpected)
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const pool = createMockPool(client);
    const service = new PhieuNhapKhoService(pool);

    await expect(service.create(makeInput())).rejects.toThrow('connection lost');
    expect(client.release).toHaveBeenCalled();
  });

  it('nem SttTrungError (khong phai SoPhieuDaTonTaiError) khi trung STT dong chi tiet', async () => {
    const client = createMockClient();
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, so_phieu: 'PNK001' }] }) // insert header ok
      .mockRejectedValueOnce({
        code: '23505',
        constraint: 'phieu_nhap_kho_chi_tiet_phieu_nhap_kho_id_stt_key',
      }) // insert chi_tiet fails: trung stt
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const pool = createMockPool(client);
    const service = new PhieuNhapKhoService(pool);

    await expect(service.create(makeInput())).rejects.toBeInstanceOf(SttTrungError);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('nem loi goc neu la unique violation tren constraint khong xac dinh', async () => {
    const client = createMockClient();
    const dbErr = { code: '23505', constraint: 'some_other_constraint' };
    client.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockRejectedValueOnce(dbErr)
      .mockResolvedValueOnce(undefined); // ROLLBACK

    const pool = createMockPool(client);
    const service = new PhieuNhapKhoService(pool);

    await expect(service.create(makeInput())).rejects.toBe(dbErr);
  });

  it('nem loi ngay khi khong lay duoc connection tu pool (khong goi BEGIN/ROLLBACK)', async () => {
    const client = createMockClient();
    const pool = createMockPool(client);
    pool.connect.mockRejectedValueOnce(new Error('pool exhausted'));

    const service = new PhieuNhapKhoService(pool);

    await expect(service.create(makeInput())).rejects.toThrow('pool exhausted');
    expect(client.query).not.toHaveBeenCalled();
    expect(client.release).not.toHaveBeenCalled();
  });
});

describe('PhieuNhapKhoService.findById', () => {
  it('nem PhieuNhapKhoNotFoundError khi khong tim thay', async () => {
    const client = createMockClient();
    const pool = createMockPool(client);
    pool.query.mockResolvedValueOnce({ rows: [] });

    const service = new PhieuNhapKhoService(pool);
    await expect(service.findById(999)).rejects.toBeInstanceOf(PhieuNhapKhoNotFoundError);
  });

  it('tra ve phieu kem chi tiet khi tim thay', async () => {
    const client = createMockClient();
    const pool = createMockPool(client);
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, so_phieu: 'PNK001' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, stt: 1, phieu_nhap_kho_id: 1 }] });

    const service = new PhieuNhapKhoService(pool);
    const result = await service.findById(1);
    expect(result.id).toBe(1);
    expect(result.chi_tiet).toHaveLength(1);
  });
});

describe('PhieuNhapKhoService.findAll', () => {
  it('tra ve mang rong khi khong co phieu nao', async () => {
    const client = createMockClient();
    const pool = createMockPool(client);
    pool.query.mockResolvedValueOnce({ rows: [] });

    const service = new PhieuNhapKhoService(pool);
    const result = await service.findAll();

    expect(result).toEqual([]);
    expect(pool.query).toHaveBeenCalledTimes(1); // khong query chi tiet vi khong co header nao
  });

  it('tra ve danh sach phieu kem chi tiet tuong ung, gom trong 1 truy van chi tiet duy nhat', async () => {
    const client = createMockClient();
    const pool = createMockPool(client);
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }) // headers
      .mockResolvedValueOnce({ rows: [{ id: 10, stt: 1, phieu_nhap_kho_id: 1 }] }); // chi tiet ca 2 phieu

    const service = new PhieuNhapKhoService(pool);
    const result = await service.findAll();

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0].chi_tiet).toHaveLength(1);
    expect(result[1].chi_tiet).toHaveLength(0);
  });
});

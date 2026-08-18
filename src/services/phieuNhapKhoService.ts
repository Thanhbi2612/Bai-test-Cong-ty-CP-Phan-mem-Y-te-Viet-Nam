import { Pool } from 'pg';
import { PhieuNhapKho, PhieuNhapKhoInput, SIGNER_ROLES } from '../models/phieuNhapKho';
import { tinhThanhTien, tinhTongThanhTien } from './phieuNhapKhoCalc';

// Voi moi vai tro ky, neu client gui kem *_chu_ky thi server tu gan thoi diem ky (NOW),
// client khong duoc tu gui *_ky_luc len.
function buildChuKyValues(input: PhieuNhapKhoInput): Array<string | null> {
  const now = new Date();
  return SIGNER_ROLES.flatMap((role) => {
    const chuKy = input[`${role}_chu_ky`] ?? null;
    return [chuKy, chuKy ? now.toISOString() : null];
  });
}

const CHU_KY_COLUMNS = SIGNER_ROLES.flatMap((role) => [`${role}_chu_ky`, `${role}_ky_luc`]);

export class SoPhieuDaTonTaiError extends Error {
  constructor(soPhieu: string) {
    super(`So phieu "${soPhieu}" da ton tai`);
    this.name = 'SoPhieuDaTonTaiError';
  }
}

export class SttTrungError extends Error {
  constructor() {
    super('Co it nhat 2 dong chi tiet trung STT trong cung 1 phieu');
    this.name = 'SttTrungError';
  }
}

export class PhieuNhapKhoNotFoundError extends Error {
  constructor(id: number) {
    super(`Khong tim thay phieu nhap kho id=${id}`);
    this.name = 'PhieuNhapKhoNotFoundError';
  }
}

const UNIQUE_VIOLATION = '23505';
const SO_PHIEU_UNIQUE_CONSTRAINT = 'phieu_nhap_kho_so_phieu_key';
const STT_UNIQUE_CONSTRAINT = 'phieu_nhap_kho_chi_tiet_phieu_nhap_kho_id_stt_key';

export class PhieuNhapKhoService {
  constructor(private readonly pool: Pool) {}

  async create(input: PhieuNhapKhoInput): Promise<PhieuNhapKho> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const tongThanhTien = tinhTongThanhTien(input.chi_tiet);

      const columns = [
        'so_phieu', 'ngay_nhap', 'don_vi', 'bo_phan', 'no', 'co', 'nguoi_giao',
        'theo_loai_chung_tu', 'theo_so_chung_tu', 'theo_ngay_chung_tu', 'theo_don_vi',
        'nhap_tai_kho', 'dia_diem', 'tong_tien_bang_chu', 'so_chung_tu_goc_kem',
        'nguoi_lap_phieu', 'nguoi_giao_hang', 'thu_kho', 'ke_toan_truong',
        ...CHU_KY_COLUMNS,
        'tong_thanh_tien',
      ];
      const values = [
        input.so_phieu,
        input.ngay_nhap,
        input.don_vi ?? null,
        input.bo_phan ?? null,
        input.no ?? null,
        input.co ?? null,
        input.nguoi_giao,
        input.theo_loai_chung_tu ?? null,
        input.theo_so_chung_tu ?? null,
        input.theo_ngay_chung_tu ?? null,
        input.theo_don_vi ?? null,
        input.nhap_tai_kho ?? null,
        input.dia_diem ?? null,
        input.tong_tien_bang_chu ?? null,
        input.so_chung_tu_goc_kem ?? null,
        input.nguoi_lap_phieu ?? null,
        input.nguoi_giao_hang ?? null,
        input.thu_kho ?? null,
        input.ke_toan_truong ?? null,
        ...buildChuKyValues(input),
        tongThanhTien,
      ];
      const placeholders = values.map((_, idx) => `$${idx + 1}`).join(',');

      const headerResult = await client.query(
        `INSERT INTO phieu_nhap_kho (${columns.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values,
      );
      const header = headerResult.rows[0];

      const chiTietRows = [];
      for (const line of input.chi_tiet) {
        const thanhTien = tinhThanhTien(line.so_luong_thuc_nhap, line.don_gia);
        const res = await client.query(
          `INSERT INTO phieu_nhap_kho_chi_tiet
            (phieu_nhap_kho_id, stt, ten_vat_tu, ma_so, don_vi_tinh,
             so_luong_chung_tu, so_luong_thuc_nhap, don_gia, thanh_tien)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING *`,
          [
            header.id,
            line.stt,
            line.ten_vat_tu,
            line.ma_so ?? null,
            line.don_vi_tinh,
            line.so_luong_chung_tu ?? 0,
            line.so_luong_thuc_nhap,
            line.don_gia,
            thanhTien,
          ],
        );
        chiTietRows.push(res.rows[0]);
      }

      await client.query('COMMIT');

      return { ...header, chi_tiet: chiTietRows };
    } catch (err: any) {
      await client.query('ROLLBACK');
      if (err?.code === UNIQUE_VIOLATION) {
        if (err.constraint === STT_UNIQUE_CONSTRAINT) {
          throw new SttTrungError();
        }
        if (err.constraint === SO_PHIEU_UNIQUE_CONSTRAINT) {
          throw new SoPhieuDaTonTaiError(input.so_phieu);
        }
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<PhieuNhapKho[]> {
    const headers = await this.pool.query('SELECT * FROM phieu_nhap_kho ORDER BY ngay_nhap DESC, id DESC');
    const results: PhieuNhapKho[] = [];
    for (const header of headers.rows) {
      const chiTiet = await this.pool.query(
        'SELECT * FROM phieu_nhap_kho_chi_tiet WHERE phieu_nhap_kho_id = $1 ORDER BY stt',
        [header.id],
      );
      results.push({ ...header, chi_tiet: chiTiet.rows });
    }
    return results;
  }

  async findById(id: number): Promise<PhieuNhapKho> {
    const headerResult = await this.pool.query('SELECT * FROM phieu_nhap_kho WHERE id = $1', [id]);
    if (headerResult.rows.length === 0) {
      throw new PhieuNhapKhoNotFoundError(id);
    }
    const chiTiet = await this.pool.query(
      'SELECT * FROM phieu_nhap_kho_chi_tiet WHERE phieu_nhap_kho_id = $1 ORDER BY stt',
      [id],
    );
    return { ...headerResult.rows[0], chi_tiet: chiTiet.rows };
  }
}

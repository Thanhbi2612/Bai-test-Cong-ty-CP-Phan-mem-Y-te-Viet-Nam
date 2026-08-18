import { Pool, PoolClient } from 'pg';
import { ChiTiet, ChiTietInput, PhieuNhapKho, PhieuNhapKhoInput, SIGNER_ROLES } from '../models/phieuNhapKho';
import { tinhThanhTien, tinhTongThanhTien } from './phieuNhapKhoCalc';

function buildChuKyValues(input: PhieuNhapKhoInput): Array<string | null> {
  const now = new Date();
  return SIGNER_ROLES.flatMap((role) => {
    const chuKy = input[`${role}_chu_ky`] ?? null;
    return [chuKy, chuKy ? now.toISOString() : null];
  });
}

const CHU_KY_COLUMNS = SIGNER_ROLES.flatMap((role) => [`${role}_chu_ky`, `${role}_ky_luc`]);

const HEADER_COLUMNS = [
  'so_phieu', 'ngay_nhap', 'don_vi', 'bo_phan', 'no', 'co', 'nguoi_giao',
  'theo_loai_chung_tu', 'theo_so_chung_tu', 'theo_ngay_chung_tu', 'theo_don_vi',
  'nhap_tai_kho', 'dia_diem', 'tong_tien_bang_chu', 'so_chung_tu_goc_kem',
  'nguoi_lap_phieu', 'nguoi_giao_hang', 'thu_kho', 'ke_toan_truong',
  ...CHU_KY_COLUMNS,
  'tong_thanh_tien',
];

const CHI_TIET_COLUMNS = [
  'phieu_nhap_kho_id', 'stt', 'ten_vat_tu', 'ma_so', 'don_vi_tinh',
  'so_luong_chung_tu', 'so_luong_thuc_nhap', 'don_gia', 'thanh_tien',
];

function placeholdersForRow(columnCount: number, offset: number): string {
  return Array.from({ length: columnCount }, (_, i) => `$${offset + i + 1}`).join(',');
}

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

      const header = await this.insertHeader(client, input);
      const chiTiet = await this.insertChiTiet(client, header.id, input.chi_tiet);

      await client.query('COMMIT');

      return { ...header, chi_tiet: chiTiet };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw this.toDomainError(err, input.so_phieu);
    } finally {
      client.release();
    }
  }

  private async insertHeader(client: PoolClient, input: PhieuNhapKhoInput): Promise<PhieuNhapKho> {
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
      tinhTongThanhTien(input.chi_tiet),
    ];

    const result = await client.query(
      `INSERT INTO phieu_nhap_kho (${HEADER_COLUMNS.join(', ')})
       VALUES (${placeholdersForRow(values.length, 0)})
       RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  private async insertChiTiet(client: PoolClient, phieuNhapKhoId: number, lines: ChiTietInput[]): Promise<ChiTiet[]> {
    const values: unknown[] = [];
    const rows = lines.map((line) => {
      const thanhTien = tinhThanhTien(line.so_luong_thuc_nhap, line.don_gia);
      const rowValues = [
        phieuNhapKhoId,
        line.stt,
        line.ten_vat_tu,
        line.ma_so ?? null,
        line.don_vi_tinh,
        line.so_luong_chung_tu ?? 0,
        line.so_luong_thuc_nhap,
        line.don_gia,
        thanhTien,
      ];
      const placeholders = placeholdersForRow(rowValues.length, values.length);
      values.push(...rowValues);
      return `(${placeholders})`;
    });

    const result = await client.query(
      `INSERT INTO phieu_nhap_kho_chi_tiet (${CHI_TIET_COLUMNS.join(', ')})
       VALUES ${rows.join(', ')}
       RETURNING *`,
      values,
    );
    return result.rows;
  }

  private toDomainError(err: any, soPhieu: string): Error {
    if (err?.code === UNIQUE_VIOLATION) {
      if (err.constraint === STT_UNIQUE_CONSTRAINT) {
        return new SttTrungError();
      }
      if (err.constraint === SO_PHIEU_UNIQUE_CONSTRAINT) {
        return new SoPhieuDaTonTaiError(soPhieu);
      }
    }
    return err;
  }

  async findAll(): Promise<PhieuNhapKho[]> {
    const headers = await this.pool.query('SELECT * FROM phieu_nhap_kho ORDER BY ngay_nhap DESC, id DESC');
    if (headers.rows.length === 0) return [];

    const ids = headers.rows.map((h) => h.id);
    const chiTietByPhieu = await this.findChiTietByPhieuIds(ids);

    return headers.rows.map((header) => ({
      ...header,
      chi_tiet: chiTietByPhieu.get(header.id) ?? [],
    }));
  }

  async findById(id: number): Promise<PhieuNhapKho> {
    const headerResult = await this.pool.query('SELECT * FROM phieu_nhap_kho WHERE id = $1', [id]);
    if (headerResult.rows.length === 0) {
      throw new PhieuNhapKhoNotFoundError(id);
    }
    const chiTietByPhieu = await this.findChiTietByPhieuIds([id]);
    return { ...headerResult.rows[0], chi_tiet: chiTietByPhieu.get(id) ?? [] };
  }

  private async findChiTietByPhieuIds(ids: number[]): Promise<Map<number, ChiTiet[]>> {
    const result = await this.pool.query(
      'SELECT * FROM phieu_nhap_kho_chi_tiet WHERE phieu_nhap_kho_id = ANY($1) ORDER BY phieu_nhap_kho_id, stt',
      [ids],
    );

    const byPhieu = new Map<number, ChiTiet[]>();
    for (const row of result.rows) {
      const list = byPhieu.get(row.phieu_nhap_kho_id) ?? [];
      list.push(row);
      byPhieu.set(row.phieu_nhap_kho_id, list);
    }
    return byPhieu;
  }
}

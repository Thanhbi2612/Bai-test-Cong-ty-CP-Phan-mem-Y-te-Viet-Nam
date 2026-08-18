import { PhieuNhapKhoInput } from '../models/phieuNhapKho';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isNonNegativeNumber(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function validatePhieuNhapKho(input: Partial<PhieuNhapKhoInput>): ValidationResult {
  const errors: string[] = [];

  if (!input.so_phieu || !input.so_phieu.trim()) {
    errors.push('so_phieu (So phieu) la bat buoc');
  }

  if (!input.ngay_nhap || !isValidCalendarDate(input.ngay_nhap)) {
    errors.push('ngay_nhap (Ngay nhap) la bat buoc va phai la ngay hop le dinh dang YYYY-MM-DD');
  }

  if (!input.nguoi_giao || !input.nguoi_giao.trim()) {
    errors.push('nguoi_giao (Ho va ten nguoi giao) la bat buoc');
  }

  if (!input.chi_tiet || input.chi_tiet.length === 0) {
    errors.push('chi_tiet: phieu nhap kho phai co it nhat 1 dong vat tu');
  } else {
    const sttSeen = new Set<number>();

    input.chi_tiet.forEach((line, idx) => {
      const pos = idx + 1;
      if (!line.ten_vat_tu || !line.ten_vat_tu.trim()) {
        errors.push(`chi_tiet[${pos}].ten_vat_tu la bat buoc`);
      }
      if (!line.don_vi_tinh || !line.don_vi_tinh.trim()) {
        errors.push(`chi_tiet[${pos}].don_vi_tinh la bat buoc`);
      }
      if (line.so_luong_thuc_nhap === undefined || line.so_luong_thuc_nhap === null) {
        errors.push(`chi_tiet[${pos}].so_luong_thuc_nhap la bat buoc`);
      } else if (!isNonNegativeNumber(line.so_luong_thuc_nhap)) {
        errors.push(`chi_tiet[${pos}].so_luong_thuc_nhap phai la so khong am`);
      }
      if (line.don_gia === undefined || line.don_gia === null) {
        errors.push(`chi_tiet[${pos}].don_gia la bat buoc`);
      } else if (!isNonNegativeNumber(line.don_gia)) {
        errors.push(`chi_tiet[${pos}].don_gia phai la so khong am`);
      }
      if (
        line.so_luong_chung_tu !== undefined &&
        line.so_luong_chung_tu !== null &&
        !isNonNegativeNumber(line.so_luong_chung_tu)
      ) {
        errors.push(`chi_tiet[${pos}].so_luong_chung_tu phai la so khong am`);
      }

      if (line.stt !== undefined && line.stt !== null) {
        if (sttSeen.has(line.stt)) {
          errors.push(`chi_tiet[${pos}].stt bi trung voi mot dong khac trong cung phieu`);
        }
        sttSeen.add(line.stt);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

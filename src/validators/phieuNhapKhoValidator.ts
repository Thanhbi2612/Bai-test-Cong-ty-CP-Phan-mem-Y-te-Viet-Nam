import { PhieuNhapKhoInput, SIGNER_ROLES } from '../models/phieuNhapKho';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MA_SO_RE = /^[A-Za-z0-9]+$/;
const CHU_KY_DATA_URI_RE = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

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

function isPositiveInteger(value: unknown): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function validateRequiredNonNegative(errors: string[], value: unknown, label: string): void {
  if (value === undefined || value === null) {
    errors.push(`${label} la bat buoc`);
  } else if (!isNonNegativeNumber(value)) {
    errors.push(`${label} phai la so khong am`);
  }
}

function validateHeader(input: Partial<PhieuNhapKhoInput>, errors: string[]): void {
  if (!input.so_phieu || !input.so_phieu.trim()) {
    errors.push('so_phieu (So phieu) la bat buoc');
  }

  if (!input.ngay_nhap || !isValidCalendarDate(input.ngay_nhap)) {
    errors.push('ngay_nhap (Ngay nhap) la bat buoc va phai la ngay hop le dinh dang YYYY-MM-DD');
  }

  if (!input.nguoi_giao || !input.nguoi_giao.trim()) {
    errors.push('nguoi_giao (Ho va ten nguoi giao) la bat buoc');
  }

  validateTheoNgayChungTu(input, errors);
  validateChuKy(input, errors);
}

function validateChuKy(input: Partial<PhieuNhapKhoInput>, errors: string[]): void {
  for (const role of SIGNER_ROLES) {
    const chuKy = input[`${role}_chu_ky`];
    if (!chuKy) continue;

    if (!CHU_KY_DATA_URI_RE.test(chuKy)) {
      errors.push(`${role}_chu_ky phai la anh PNG dang data URI base64 hop le`);
    }
    if (!input[role] || !input[role]!.trim()) {
      errors.push(`${role} (ho ten) la bat buoc khi da co ${role}_chu_ky`);
    }
  }
}

function validateTheoNgayChungTu(input: Partial<PhieuNhapKhoInput>, errors: string[]): void {
  const { theo_ngay_chung_tu, ngay_nhap } = input;
  if (!theo_ngay_chung_tu) return;

  if (!isValidCalendarDate(theo_ngay_chung_tu)) {
    errors.push('theo_ngay_chung_tu (Ngay chung tu) phai la ngay hop le dinh dang YYYY-MM-DD');
    return;
  }

  if (ngay_nhap && isValidCalendarDate(ngay_nhap) && theo_ngay_chung_tu > ngay_nhap) {
    errors.push('theo_ngay_chung_tu (Ngay chung tu) khong duoc sau ngay_nhap (Ngay nhap kho)');
  }
}

function validateChiTietLine(line: PhieuNhapKhoInput['chi_tiet'][number], pos: number, sttSeen: Set<number>, errors: string[]): void {
  const prefix = `chi_tiet[${pos}]`;

  if (!line.ten_vat_tu || !line.ten_vat_tu.trim()) {
    errors.push(`${prefix}.ten_vat_tu la bat buoc`);
  }
  if (!line.don_vi_tinh || !line.don_vi_tinh.trim()) {
    errors.push(`${prefix}.don_vi_tinh la bat buoc`);
  }
  if (line.ma_so && !MA_SO_RE.test(line.ma_so)) {
    errors.push(`${prefix}.ma_so chi duoc chua chu va so, khong duoc ky tu dac biet`);
  }

  validateRequiredNonNegative(errors, line.so_luong_chung_tu, `${prefix}.so_luong_chung_tu`);
  validateRequiredNonNegative(errors, line.so_luong_thuc_nhap, `${prefix}.so_luong_thuc_nhap`);
  validateRequiredNonNegative(errors, line.don_gia, `${prefix}.don_gia`);

  validateStt(line.stt, prefix, sttSeen, errors);
}

function validateStt(stt: number | undefined | null, prefix: string, sttSeen: Set<number>, errors: string[]): void {
  if (stt === undefined || stt === null) {
    errors.push(`${prefix}.stt la bat buoc`);
    return;
  }
  if (!isPositiveInteger(stt)) {
    errors.push(`${prefix}.stt phai la so nguyen duong`);
    return;
  }
  if (sttSeen.has(stt)) {
    errors.push(`${prefix}.stt bi trung voi mot dong khac trong cung phieu`);
    return;
  }
  sttSeen.add(stt);
}

function validateChiTiet(input: Partial<PhieuNhapKhoInput>, errors: string[]): void {
  if (!input.chi_tiet || input.chi_tiet.length === 0) {
    errors.push('chi_tiet: phieu nhap kho phai co it nhat 1 dong vat tu');
    return;
  }

  const sttSeen = new Set<number>();
  input.chi_tiet.forEach((line, idx) => validateChiTietLine(line, idx + 1, sttSeen, errors));
}

export function validatePhieuNhapKho(input: Partial<PhieuNhapKhoInput>): ValidationResult {
  const errors: string[] = [];

  validateHeader(input, errors);
  validateChiTiet(input, errors);

  return { valid: errors.length === 0, errors };
}

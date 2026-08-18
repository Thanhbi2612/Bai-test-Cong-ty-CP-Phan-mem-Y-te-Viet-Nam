import { validatePhieuNhapKho } from '../../src/validators/phieuNhapKhoValidator';
import { PhieuNhapKhoInput } from '../../src/models/phieuNhapKho';

function validInput(): PhieuNhapKhoInput {
  return {
    so_phieu: 'PNK001',
    ngay_nhap: '2026-08-18',
    nguoi_giao: 'Nguyen Van A',
    chi_tiet: [
      {
        stt: 1,
        ten_vat_tu: 'Bong bang y te',
        don_vi_tinh: 'hop',
        so_luong_chung_tu: 10,
        so_luong_thuc_nhap: 10,
        don_gia: 15000,
      },
    ],
  };
}

describe('validatePhieuNhapKho', () => {
  it('chap nhan du lieu hop le', () => {
    const result = validatePhieuNhapKho(validInput());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('bao loi khi thieu so_phieu', () => {
    const input = { ...validInput(), so_phieu: '' };
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('so_phieu'))).toBe(true);
  });

  it('bao loi khi ngay_nhap sai dinh dang', () => {
    const input = { ...validInput(), ngay_nhap: '18/08/2026' };
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ngay_nhap'))).toBe(true);
  });

  it('bao loi khi thieu nguoi_giao', () => {
    const input = { ...validInput(), nguoi_giao: '   ' };
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nguoi_giao'))).toBe(true);
  });

  it('bao loi khi khong co dong chi tiet nao', () => {
    const input = { ...validInput(), chi_tiet: [] };
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('chi_tiet'))).toBe(true);
  });

  it('bao loi khi dong chi tiet thieu ten_vat_tu hoac don_vi_tinh', () => {
    const input = validInput();
    input.chi_tiet[0].ten_vat_tu = '';
    input.chi_tiet[0].don_vi_tinh = '';
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ten_vat_tu'))).toBe(true);
    expect(result.errors.some((e) => e.includes('don_vi_tinh'))).toBe(true);
  });

  it('bao loi khi so_luong_thuc_nhap hoac don_gia am', () => {
    const input = validInput();
    input.chi_tiet[0].so_luong_thuc_nhap = -1;
    input.chi_tiet[0].don_gia = -5;
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('so_luong_thuc_nhap'))).toBe(true);
    expect(result.errors.some((e) => e.includes('don_gia'))).toBe(true);
  });

  it('bao loi khi so_luong_chung_tu am', () => {
    const input = validInput();
    input.chi_tiet[0].so_luong_chung_tu = -3;
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('so_luong_chung_tu'))).toBe(true);
  });

  it.each(['2026-13-45', '2026-02-30', '2026-00-10'])(
    'bao loi khi ngay_nhap la ngay khong ton tai trong lich: %s',
    (badDate) => {
      const input = { ...validInput(), ngay_nhap: badDate };
      const result = validatePhieuNhapKho(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ngay_nhap'))).toBe(true);
    },
  );

  it('chap nhan nam nhuan hop le (2028-02-29)', () => {
    const input = { ...validInput(), ngay_nhap: '2028-02-29' };
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(true);
  });

  it('bao loi khi so_luong_thuc_nhap hoac don_gia la chuoi khong phai so', () => {
    const input = validInput();
    // @ts-expect-error - gia lap du lieu bi loi tu client gui len
    input.chi_tiet[0].so_luong_thuc_nhap = 'abc';
    // @ts-expect-error
    input.chi_tiet[0].don_gia = 'xyz';
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('so_luong_thuc_nhap'))).toBe(true);
    expect(result.errors.some((e) => e.includes('don_gia'))).toBe(true);
  });

  it('chap nhan so dang chuoi so hop le (vd tu form HTML)', () => {
    const input = validInput();
    // @ts-expect-error - form HTML gui gia tri dang string
    input.chi_tiet[0].so_luong_thuc_nhap = '10';
    // @ts-expect-error
    input.chi_tiet[0].don_gia = '15000';
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(true);
  });

  it('bao loi khi 2 dong chi tiet trung stt', () => {
    const input = validInput();
    input.chi_tiet.push({
      stt: 1,
      ten_vat_tu: 'Cong bam',
      don_vi_tinh: 'cai',
      so_luong_chung_tu: 5,
      so_luong_thuc_nhap: 5,
      don_gia: 20000,
    });
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('stt bi trung'))).toBe(true);
  });

  it('gom tat ca loi tu nhieu dong chi tiet khac nhau', () => {
    const input: PhieuNhapKhoInput = {
      so_phieu: 'PNK001',
      ngay_nhap: '2026-08-18',
      nguoi_giao: 'Nguyen Van A',
      chi_tiet: [
        { stt: 1, ten_vat_tu: '', don_vi_tinh: 'hop', so_luong_chung_tu: 1, so_luong_thuc_nhap: 1, don_gia: 1000 },
        { stt: 2, ten_vat_tu: 'B', don_vi_tinh: '', so_luong_chung_tu: 1, so_luong_thuc_nhap: 1, don_gia: 1000 },
      ],
    };
    const result = validatePhieuNhapKho(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.startsWith('chi_tiet[1]'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('chi_tiet[2]'))).toBe(true);
  });
});

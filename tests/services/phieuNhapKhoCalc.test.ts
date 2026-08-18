import { tinhThanhTien, tinhTongThanhTien } from '../../src/services/phieuNhapKhoCalc';

describe('tinhThanhTien', () => {
  it('nhan so luong voi don gia', () => {
    expect(tinhThanhTien(10, 1500)).toBe(15000);
  });

  it('lam tron 2 chu so thap phan', () => {
    expect(tinhThanhTien(3, 12.345)).toBeCloseTo(37.04, 2);
  });

  it('tra ve 0 khi so luong = 0', () => {
    expect(tinhThanhTien(0, 1000)).toBe(0);
  });
});

describe('tinhTongThanhTien', () => {
  it('cong tong thanh tien cua nhieu dong', () => {
    const chiTiet = [
      { stt: 1, ten_vat_tu: 'A', don_vi_tinh: 'cai', so_luong_chung_tu: 10, so_luong_thuc_nhap: 10, don_gia: 1000 },
      { stt: 2, ten_vat_tu: 'B', don_vi_tinh: 'hop', so_luong_chung_tu: 5, so_luong_thuc_nhap: 5, don_gia: 2000 },
    ];
    expect(tinhTongThanhTien(chiTiet)).toBe(10000 + 10000);
  });

  it('tra ve 0 khi khong co dong nao', () => {
    expect(tinhTongThanhTien([])).toBe(0);
  });
});

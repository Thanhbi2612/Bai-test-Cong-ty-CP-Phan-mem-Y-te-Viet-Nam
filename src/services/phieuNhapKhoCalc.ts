import { ChiTietInput } from '../models/phieuNhapKho';

export function tinhThanhTien(soLuongThucNhap: number, donGia: number): number {
  return Math.round(soLuongThucNhap * donGia * 100) / 100;
}

export function tinhTongThanhTien(chiTiet: ChiTietInput[]): number {
  return Math.round(
    chiTiet.reduce((sum, line) => sum + tinhThanhTien(line.so_luong_thuc_nhap, line.don_gia), 0) * 100,
  ) / 100;
}

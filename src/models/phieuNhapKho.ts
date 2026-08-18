export interface ChiTietInput {
  stt: number;
  ten_vat_tu: string;
  ma_so?: string;
  don_vi_tinh: string;
  so_luong_chung_tu: number;
  so_luong_thuc_nhap: number;
  don_gia: number;
}

export interface ChiTiet extends ChiTietInput {
  id: number;
  phieu_nhap_kho_id: number;
  thanh_tien: number;
}

export interface PhieuNhapKhoInput {
  so_phieu: string;
  ngay_nhap: string; // ISO date (YYYY-MM-DD)
  don_vi?: string;
  bo_phan?: string;
  no?: string;
  co?: string;
  nguoi_giao: string;
  theo_loai_chung_tu?: string;
  theo_so_chung_tu?: string;
  theo_ngay_chung_tu?: string;
  theo_don_vi?: string;
  nhap_tai_kho?: string;
  dia_diem?: string;
  tong_tien_bang_chu?: string;
  so_chung_tu_goc_kem?: string;
  nguoi_lap_phieu?: string;
  nguoi_giao_hang?: string;
  thu_kho?: string;
  ke_toan_truong?: string;
  chi_tiet: ChiTietInput[];
}

export interface PhieuNhapKho extends Omit<PhieuNhapKhoInput, 'chi_tiet'> {
  id: number;
  tong_thanh_tien: number;
  created_at: string;
  updated_at: string;
  chi_tiet: ChiTiet[];
}

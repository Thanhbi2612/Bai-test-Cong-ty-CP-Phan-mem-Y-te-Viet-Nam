-- Phieu nhap kho (Mau so 01-VT, Thong tu 200/2014/TT-BTC)
-- Bang chinh (header) va bang chi tiet (line items) theo mo hinh 1-n.

CREATE TABLE IF NOT EXISTS phieu_nhap_kho (
    id                  SERIAL PRIMARY KEY,
    so_phieu            VARCHAR(50) NOT NULL UNIQUE,   -- "So"
    ngay_nhap           DATE NOT NULL,                  -- "Ngay ... thang ... nam ..."
    don_vi              VARCHAR(255),                   -- "Don vi"
    bo_phan             VARCHAR(255),                   -- "Bo phan"
    no                  VARCHAR(50),                    -- "No" (tai khoan ke toan)
    co                  VARCHAR(50),                    -- "Co" (tai khoan ke toan)
    nguoi_giao          VARCHAR(255) NOT NULL,          -- "Ho va ten nguoi giao"
    theo_loai_chung_tu  VARCHAR(100),                   -- "Theo ... so ..."
    theo_so_chung_tu    VARCHAR(100),
    theo_ngay_chung_tu  DATE,
    theo_don_vi         VARCHAR(255),                   -- "... cua ..."
    nhap_tai_kho        VARCHAR(255),                   -- "Nhap tai kho"
    dia_diem            VARCHAR(255),                   -- "dia diem"
    tong_tien_bang_chu  VARCHAR(500),                   -- "Tong so tien (viet bang chu)"
    so_chung_tu_goc_kem VARCHAR(255),                   -- "So chung tu goc kem theo"
    nguoi_lap_phieu     VARCHAR(255),
    nguoi_giao_hang     VARCHAR(255),
    thu_kho             VARCHAR(255),
    ke_toan_truong      VARCHAR(255),
    tong_thanh_tien     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phieu_nhap_kho_chi_tiet (
    id                      SERIAL PRIMARY KEY,
    phieu_nhap_kho_id       INTEGER NOT NULL REFERENCES phieu_nhap_kho(id) ON DELETE CASCADE,
    stt                     INTEGER NOT NULL,                  -- "S T T"
    ten_vat_tu              VARCHAR(500) NOT NULL,              -- "Ten, nhan hieu, quy cach pham chat vat tu..."
    ma_so                   VARCHAR(50),                        -- "Ma so"
    don_vi_tinh             VARCHAR(50) NOT NULL,               -- "Don vi tinh"
    so_luong_chung_tu       NUMERIC(18, 3) NOT NULL DEFAULT 0,  -- "So luong - Theo chung tu"
    so_luong_thuc_nhap      NUMERIC(18, 3) NOT NULL DEFAULT 0,  -- "So luong - Thuc nhap"
    don_gia                 NUMERIC(18, 2) NOT NULL DEFAULT 0,  -- "Don gia"
    thanh_tien              NUMERIC(18, 2) NOT NULL DEFAULT 0,  -- "Thanh tien" = so_luong_thuc_nhap * don_gia
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (phieu_nhap_kho_id, stt)
);

CREATE INDEX IF NOT EXISTS idx_pnk_chi_tiet_phieu_id ON phieu_nhap_kho_chi_tiet(phieu_nhap_kho_id);
CREATE INDEX IF NOT EXISTS idx_pnk_ngay_nhap ON phieu_nhap_kho(ngay_nhap);

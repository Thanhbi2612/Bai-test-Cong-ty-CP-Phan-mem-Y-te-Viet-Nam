-- Xac nhan dien tu noi bo (khong phai chu ky so PKI/CA) cho 4 vai tro
-- ky tren phieu nhap kho: nguoi lap phieu, nguoi giao hang, thu kho, ke toan truong.
-- Chu ky duoc luu duoi dang anh PNG base64 (data URI) ve tu canvas tren web,
-- kem thoi diem ky de truy vet.

ALTER TABLE phieu_nhap_kho
    ADD COLUMN IF NOT EXISTS nguoi_lap_phieu_chu_ky   TEXT,
    ADD COLUMN IF NOT EXISTS nguoi_lap_phieu_ky_luc    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS nguoi_giao_hang_chu_ky    TEXT,
    ADD COLUMN IF NOT EXISTS nguoi_giao_hang_ky_luc     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS thu_kho_chu_ky             TEXT,
    ADD COLUMN IF NOT EXISTS thu_kho_ky_luc              TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ke_toan_truong_chu_ky      TEXT,
    ADD COLUMN IF NOT EXISTS ke_toan_truong_ky_luc       TIMESTAMPTZ;

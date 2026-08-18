# Quản lý tồn kho - Phiếu nhập kho

Bài test của VIMES: viết chương trình nhập liệu và lưu Phiếu nhập kho (Mẫu 01-VT) vào database.

Dùng Node.js + TypeScript + Express + PostgreSQL.


Mở trình duyệt vào `http://localhost:3000` là thấy form nhập phiếu nhập kho, bên dưới có bảng liệt kê các phiếu đã lưu.

## Cấu trúc DB

Lưu vào 2 bảng, quan hệ 1-nhiều:

- `phieu_nhap_kho`: thông tin chung của phiếu (số phiếu, ngày, đơn vị, người giao, nợ/có...)
- `phieu_nhap_kho_chi_tiet`: từng dòng vật tư trong phiếu (tên, đơn vị tính, số lượng, đơn giá...)

File SQL ở `src/db/migrations/001_create_phieu_nhap_kho.sql`.

## Cấu trúc code

```
src/
  config/db.ts       # kết nối PostgreSQL
  db/                 # migration
  models/             # kiểu dữ liệu
  validators/         # check dữ liệu đầu vào
  services/           # logic lưu DB, tính toán
  controllers/        # xử lý request
  routes/
public/index.html      # form nhập liệu + bảng danh sách
tests/                   # unit test
```

## API

- `POST /api/phieu-nhap-kho` - tạo phiếu mới (kèm chi tiết vật tư)
- `GET /api/phieu-nhap-kho` - lấy danh sách
- `GET /api/phieu-nhap-kho/:id` - lấy 1 phiếu

 Link production :  https://vimes-ton-kho.vercel.app
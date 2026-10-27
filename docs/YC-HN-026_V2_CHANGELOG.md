# CHANGELOG — YC-HN-026 V2 / v1.2.20-RC

**Ngày:** 26/10/2026. **Nền:** v1.2.19-RC. **Trạng thái:** Đã sửa mã nguồn và kiểm thử cục bộ; chưa deploy.

## Sửa lỗi báo cáo ma trận

- `apps-script/Code.gs` trong `reportMatrix_()`: mỗi nhóm trường/nghề có thêm chỉ tiêu `participated` tăng với **mọi** hồ sơ `TRANG_THAI_THAM_GIA==='DA_THAM_GIA'`, kể cả `DA_BO_HOC=true`. Vẫn giữ `learning` là nhóm đã tham gia và chưa bỏ học, `dropout` là nhóm con bỏ học.
- `public/app.js` `exportSummaryOrMatrix()`: đổi tiêu đề ma trận thành **Đã tham gia**, dùng **`r.participated`** thay `r.learning`. Từ chối xuất rõ ràng khi backend chưa cung cấp `participated` hoặc số liệu nhỏ hơn `dropout`, tránh 0/NaN âm thầm.
- `apps-script/Code.gs`, `public/app.js`, `public/index.html`, `package.json`: đồng bộ nhãn `v1.2.20-RC`, đường module được gắn phiên bản tránh cache cũ.
- Tests: điều chỉnh test phiên bản/nhãn, thêm test backend dữ liệu 10 hồ sơ/2 cơ sở/2 nghề/2 người bỏ học, các bộ lọc riêng, quyền tài khoản trường, và kiểm tra XLSX ma trận nhận số dạng số.

## Bảo toàn

- Không đổi `overview_().k.participated` vì đã đúng.
- Không đổi `courseEndParticipated`, logic `NGAY_KET_THUC_DU_KIEN`, quyền xuất chỉ trường gán, kiểm phiên bản/nhật ký, cập nhật một dòng khi lưu.
- **`public/xlsx-export.js` hoàn toàn không đổi** so với bản nền, gồm chức năng 25 cột, Wrap Text, chiều cao dòng và mẫu ma trận.
- Không thay đổi hoặc truy cập dữ liệu production.

## Đối chiếu dữ liệu theo ảnh người dùng

Khi cùng bộ lọc và dữ liệu nguồn: website `Đã tham gia = 1.343`, `Bỏ học = 44`; hai báo cáo Excel theo cơ sở/nghề dự kiến hiển thị `Đã tham gia = 1.343` (thay 1.299), `Bỏ học = 44`. Đây là đối chiếu từ ảnh, **chưa xác nhận bằng dữ liệu live**.

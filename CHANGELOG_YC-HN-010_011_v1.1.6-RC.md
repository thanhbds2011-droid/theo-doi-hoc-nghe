# CHANGELOG v1.1.6-RC — YC-HN-010 + YC-HN-011

## Các file thay đổi
- `public/app.js`: biểu mẫu 15 trường mới, cửa sổ Chi tiết, parser Excel 25 cột hai hàng tiêu đề và 2.326 hồ sơ thực, Excel export .xlsx, tối ưu xóa một dòng sau xác nhận.
- `public/index.html`: hiển thị phiên bản v1.1.6-RC.
- `public/templates/MAU_NHAP_HO_SO_HOC_NGHE.xlsx`: mẫu 25 cột A:Y chuẩn, hai hàng tiêu đề.
- `apps-script/Code.gs`: 40 cột hồ sơ, bổ sung 15 trường mới, hàm sao lưu + migrate `nangCapDuLieuHocNgheYC011`, lưu/sửa/xuất/nhập đủ trường; cache khóa quyết định khi xem trước.
- `package.json`: phiên bản.
- `tests/backend.test.js`: cập nhật schema 94 cột và kiểm thử lưu/sửa/export/bulk.
- `tests/ui-yc006.test.js`: cập nhật baseline phiên bản.
- `tests/browser_yc011_real_excel.py`: xác minh đọc Excel nguồn trong browser mô phỏng.
- `tests/browser_yc011_export.py`: xác minh file .xlsx xuất hợp lệ.

## Kiểm thử
- `node --check public/app.js`: đạt.
- `node --check` bản sao `Code.gs` với đuôi `.js`: đạt.
- `node --test tests/*.test.js`: 75/75 đạt.
- Chromium đọc chính file nguồn: 2.326 hồ sơ, 25 trường/dòng, 0 cột chưa ánh xạ: đạt.
- Chromium xuất file .xlsx rồi kiểm tra nội dung ZIP/XML, ô gộp M1:N1 và dữ liệu văn bản: đạt.
- Chưa kiểm thử Vercel production, Apps Script deployment thực hoặc ghi 2.326 hồ sơ vào Sheets thực.

## Giới hạn đã biết
- Hồ sơ import bởi Admin tiếp tục thuộc Admin; chưa có cơ chế phân công hàng loạt cho nhân viên khác.
- Mẫu xuất Excel giữ cấu trúc 25 cột nghiệp vụ, không tự sao chép nguyên kiểu dáng mọi ô từ file người dùng đã gửi.
- Sau khi server xác nhận xóa, giao diện không đọc lại toàn danh sách; riêng khi xóa khiến trang cuối không còn hợp lệ, cần tải đúng trang mới.

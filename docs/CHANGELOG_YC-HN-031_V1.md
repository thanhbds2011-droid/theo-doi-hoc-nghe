# CHANGELOG – YC-HN-031 V1 / v1.2.25-RC

## Đã thay đổi

- **Backend (`apps-script/Code.gs`):** Tạo `schoolTradeIndex_()` để suy ra quan hệ cơ sở–nghề từ quyết định chưa xóa; chỉ cần một lượt đọc vùng 11 cột liên quan cho toàn bộ index ở lần cache miss; chỉ gửi nghề thuộc trường qua `visibleSchoolTrades_()` trong `bootstrap_`.
- **Đồng bộ:** Bổ sung mã `tradeScopeRevision` theo từng trường; khi Quản trị viên nhập, thêm, sửa trường/nghề hoặc xóa hồ sơ, cập nhật revision nội bộ toàn cục và revision của đúng trường bị ảnh hưởng. Cập nhật tình trạng không làm thay đổi revision danh sách nghề.
- **Frontend (`public/app.js`):** Khi revision của trường thay đổi, tải lại danh mục đã lọc; tự làm mới lựa chọn nghề trong Tổng quan, Hồ sơ và Báo cáo; nếu nghề đang chọn không còn hợp lệ, đặt về Tất cả nghề và chỉ cập nhật khu vực kết quả.
- **Phiên bản:** `public/index.html`, `public/app.js`, `apps-script/Code.gs`, `package.json` được đồng bộ `v1.2.25-RC`.
- **Kiểm thử:** Thêm `tests/yc031-school-trades.test.js` và `tests/browser_yc031_school_trades.py`; cập nhật đúng chuỗi phiên bản trong những bài kiểm thử cũ.

## Được bảo toàn

Không sửa `api/rpc.js`, `api/config.js`, `public/styles.css`, `public/xlsx-export.js` hoặc cấu trúc Google Sheets. Không sửa biểu đồ, cách đếm báo cáo, bốn mẫu Excel, cơ chế đăng nhập/phân quyền hoặc nghiệp vụ học nghề.

## Giới hạn

Không triển khai production và không ghi Sheets thật. Kết quả kiểm thử Chromium là mô phỏng API bằng dữ liệu giả, không phải benchmark tải thực tế.

# HƯỚNG DẪN TRIỂN KHAI YC-HN-027 V2 — v1.2.21-RC

## Điều đã thay đổi

**Quản trị viên (`ADMIN`):** toàn quyền như trước. **Nhân viên (`NHAN_VIEN`):** xem toàn bộ hồ sơ, tổng quan, báo cáo; cập nhật tình trạng trên hồ sơ của mọi trường, không phân công; không thêm/sửa/xóa hoặc quản lý tệp/danh mục/tài khoản/nhật ký. **Cơ sở đào tạo (`CO_SO_DAO_TAO`):** chỉ trong trường được gán, giữ quyền xuất/in đã chốt.

**Phải cập nhật đồng bộ frontend và Apps Script**: giao diện và quyền backend cùng thay đổi. Không thể chỉ sửa Vercel hoặc chỉ thay Code.gs.

## 1. Sao lưu

- Tải lại ZIP GitHub và `Code.gs` bản `v1.2.20-RC`; ghi lại ID của Apps Script deployment đang chạy và cấu hình Vercel (không đưa secret vào ZIP).
- Giữ bản snapshot dữ liệu Sheets hiện tại và bản sao lưu theo quy trình nội bộ. Không yêu cầu thay đổi cấu trúc dữ liệu Sheets.

## 2. Triển khai staging

1. Tạo phiên bản thử nghiệm riêng của Apps Script từ `Code.gs` đầy đủ `v1.2.21-RC`; nếu dùng dự án hiện tại, vào **Deploy → Manage deployments → Edit → New version → Deploy** rồi xác minh deployment URL được Vercel gọi.
2. Cập nhật GitHub/Vercel bằng tất cả tệp trong **thư mục gốc dự án** bên trong ZIP, không upload một thư mục cha gây sai đường dẫn. Kiểm tra đúng cấu hình `GAS_WEB_APP_URL`, `GOOGLE_CLIENT_ID`, `API_SHARED_SECRET` trên môi trường staging (không công khai giá trị).
3. Tải mới website, kiểm tra footer `v1.2.21-RC` và script `/app.js?v=1.2.21-RC`; dùng Ctrl+Shift+R nếu trình duyệt dùng cache.
4. Kiểm thử với ít nhất 3 Gmail cấp vai trò thật A/B/C. Dùng hồ sơ staging hoặc dữ liệu thử phi định danh, không tự cập nhật hàng loạt dữ liệu thật.

## 3. Trường hợp bắt buộc

- **A:** 6 menu, xem/sửa/xóa/tạo hồ sơ theo đúng quyền hiện hành.
- **B:** đúng 3 menu, thấy tất cả trường C/D; chọn lọc trường bất kỳ; cập nhật tình trạng 1 hồ sơ mỗi trường; không thấy icon thêm/sửa/xóa hay quản lý tệp. Sau lưu, bảng giữ bộ lọc/trang phù hợp.
- **C:** chỉ trường mình, kể cả gọi API với `truong` của trường D vẫn không nhận dữ liệu D.
- Kiểm soát xung đột: B và C đồng thời sửa tình trạng cùng hồ sơ, người đến sau với phiên bản cũ phải bị từ chối.
- Kiểm Nhật ký từ tài khoản A: người cập nhật là Gmail B hoặc C thực tế.
- Kiểm Báo cáo, Hoàn thành khóa học, Xuất Excel danh sách 25 cột, báo cáo ma trận và In của C.

## 4. Hoàn tác

- Nếu gặp sai quyền, lỗi hiển thị hoặc số liệu, khôi phục ngay **cả** Apps Script deployment (phiên bản trước) và Vercel (deployment `v1.2.20-RC`) thay vì chỉ một tầng. Thử lại phân quyền A/B/C.
- Không tự sửa cột `QUYEN` cũ trong Google Sheets để khắc phục: backend lấy quyền từ `VAI_TRO`, không tin metadata quyền cũ.

## 5. Hạn chế kiểm chứng

- Đã chạy kiểm thử Node.js và Chromium với dữ liệu giả lập; chưa thử trên Apps Script + Sheets production hoặc trên Gmail thực của bạn. Tài liệu này **không** xác nhận đã cập nhật website thật.
- Không chỉnh thuật toán nghiệp vụ tháng bỏ học, không đổi mẫu Excel đã nghiệm thu.

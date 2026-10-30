# Changelog – YC-HN-034 V3 / v1.2.28-RC

## Thay đổi chính

1. Đổi nhãn người dùng **Xuất Excel** → **Xuất báo cáo** tại Hồ sơ và Báo cáo, hộp thoại, nút xác nhận, thông báo tải danh sách.
2. Bỏ tình trạng `Khác` và nhập tùy ý trong biểu mẫu học nghề; không đổi Giới tính `Khác`.
3. Backend từ chối `customStatusName` và mọi mã chưa được ADMIN phê duyệt khi gán mới, kể cả qua import/bulk. Không gỡ kiểm tra `PHIEN_BAN`, quyền, khóa ghi.
4. Thêm quản trị danh mục **Tình trạng học nghề** cho ADMIN: xem, thêm, phê duyệt, ngừng sử dụng, số hồ sơ liên quan, xem danh sách hồ sơ.
5. Thêm phân loại metadata `ACTIVE`, `INACTIVE`, `PENDING` trong **tab Cấu hình hệ thống hiện có**. Không có metadata = PENDING, tránh phê duyệt nhầm tình trạng cũ.
6. Gắn nhãn tình trạng lịch sử riêng theo từng hồ sơ trả về cho người xem có quyền; giữ nguyên số liệu thống kê từ dữ liệu nguồn.
7. Tăng revision `STATUS` sau khi quản trị, dùng đồng bộ cache hiện hành; ghi nhật ký.
8. Thêm/điều chỉnh kiểm thử hợp lệ và quyền truy cập; cập nhật các bài kiểm thử cũ từng giả định người dùng được nhập tình trạng tự do.

## Những thứ không đổi

- 7 tab và 94 tiêu đề Google Sheets, không thêm cột/tab.
- Quy tắc tổng hợp, Đã tham gia gồm Bỏ học, Hoàn thành theo ngày dự kiến.
- Toàn bộ định dạng và bốn mẫu xuất Excel; không sửa `public/xlsx-export.js`.
- Phân quyền 3 vai trò, hiển thị chức danh, lọc nghề theo trường, sắp xếp A–Z, tháng bỏ học 1–6, cache/đồng bộ V5.
- `api/rpc.js`, `api/config.js` và `public/styles.css`.

## Phạm vi thay đổi

- `public/app.js` – UI, quản trị trạng thái, nhãn, hiển thị lịch sử.
- `apps-script/Code.gs` – kiểm tra quyền, danh mục tình trạng, lịch sử, cache và log.
- `public/index.html`, `package.json` – chỉ đổi phiên bản.
- Tests, README, tài liệu phiên bản mới.

## Hạn chế xác minh

Kiểm thử Node.js giả lập được chạy; chưa kết nối Apps Script/Sheets staging hoặc production; chưa xác nhận tải 10–20 người. Trình duyệt Chromium trong môi trường này chặn truy cập origin kiểm thử cục bộ nên chưa có kiểm thử tương tác Chromium cho bản V3 này.

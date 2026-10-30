# KẾT QUẢ KIỂM THỬ – YC-HN-034 V3

**Nền:** v1.2.27-RC  
**Bản sửa:** v1.2.28-RC

## Kiểm thử đã thực chạy

- `npm run check`: kiểm tra cú pháp `api/rpc.js`, `api/config.js`, `public/app.js` – **đạt**.
- `npm test`: **222/222 bài Node.js đạt** (0 failed).
- Test backend sử dụng mô phỏng Google Sheets/Apps Script cho các trường hợp:
  - ADMIN tạo tình trạng, gán cho hồ sơ, ngừng sử dụng và phê duyệt lại.
  - Tình trạng ngừng sử dụng vẫn hiển thị tên trên hồ sơ cũ; không thể gán vào hồ sơ mới.
  - Tình trạng tự do cũ mặc định ở trạng thái cần rà soát, không tự được phê duyệt.
  - Từ chối payload `customStatusName` ở tạo/cập nhật hồ sơ.
  - NHAN_VIEN và CO_SO_DAO_TAO bị backend từ chối thao tác quản lý tình trạng.
  - Không cho đổi tên tình trạng đang có hồ sơ liên kết.
- Test frontend kiểm tra hai nút `Xuất báo cáo`, giữ nguyên `Nhập Excel`, loại bỏ ô `Khác` nhập tự do; giữ nguyên `Khác` của Giới tính.
- Các bài kiểm thử hồi quy của phiên bản trước được giữ lại; những bài đã mã hóa yêu cầu nhập tự do cũ được cập nhật theo nghiệp vụ mới.

## Giới hạn

- Chromium tương tác: **chưa chạy thành công** do chính sách trình duyệt trên môi trường kiểm thử ngăn truy cập origin thử nghiệm; không tuyên bố đã đạt browser E2E V3.
- Chưa có kiểm thử ghi trên Apps Script/Google Sheets staging, production hay kiểm thử tải 10–20 người đồng thời.
- Kết quả trên mô phỏng **không thay thế nghiệm thu tích hợp**. Cần thử các luồng người dùng thật trên staging trước khi cập nhật website hiện hành.

# KẾT QUẢ KIỂM THỬ – YC-HN-032 V2

**Phiên bản:** v1.2.26-RC  
**Địa điểm:** Môi trường cục bộ, Chromium và mock API; **không truy cập production**.

| Hạng mục | Kết quả | Giới hạn |
|---|---|---|
| `npm run check` | PASS | Cú pháp JS, không thực thi Apps Script production |
| `npm test` | **209/209 PASS** | 5 bài YC032 mới, các bài cũ đã cập nhật version/kiểm tra phù hợp |
| Chromium YC027 | PASS | Phân quyền ba vai trò giả lập |
| Chromium YC028 | PASS | Chức danh và Excel/Print giả lập |
| Chromium YC029 V4 | PASS | Badge chức danh và màn hình nhỏ |
| Chromium YC029 V5 | PASS | Kiểm tra phiên, bảo vệ ghi đè giả lập |
| Chromium YC030 | PASS | Tháng bỏ học 1–6 |
| Chromium YC031 | PASS | Trường A/B không thấy nghề khác, revision đúng trường |
| Chromium YC032 | PASS | ADMIN/NHAN_VIEN đổi trường ở 3 menu, reset/giữ nghề, không request khi đổi, A–Z tiếng Việt, cập nhật map sau thay đổi |

### Đã kiểm tra

- Chỉ nghề có quyết định chưa bị xóa; không bị nhân đôi theo số quyết định; hiển thị nghề ngừng sử dụng có quyết định.
- Chọn **Tất cả cơ sở** tạo hợp nghề từ nhiều trường; chọn từng trường chỉ nhận nghề của trường đó. Danh mục đầy đủ vẫn phục vụ Thêm/Sửa hồ sơ.
- `Intl.Collator('vi')`: sắp xếp tên tiếng Việt, có dấu; mã nghề là tiêu chí phụ ổn định. Tất cả nghề đứng đầu.
- Khi thay đổi lựa chọn trường: không gọi backend; giữ nghề có trong cả hai trường, reset nghề không thuộc trường mới; không xóa từ khóa, năm, ngày và tình trạng trong form.
- Khi quan hệ trường–nghề đổi: tài khoản ADMIN/NHAN_VIEN nhận revision chung; tài khoản CO_SO_DAO_TAO vẫn chỉ nhận revision/trades của trường được cấp.
- Bốn mẫu Excel và `api/rpc.js`, `public/styles.css`, `public/xlsx-export.js` giữ nguyên **byte-for-byte** so với ZIP nguồn, ngoại trừ URL cache-busting của module trong app.

### Chưa kiểm chứng / không cam kết

- Không xác minh thực trên Sheets/Apps Script/Vercel staging hoặc production; chưa đo cache miss, thời gian đăng nhập, quota.
- Không có phép kiểm thử tải đồng thời thực với 4, 10, 20 người. Không tuyên bố đáp ứng mức tải đó khi chưa nghiệm thu.
- Trình duyệt có thể tạm hiển thị danh mục trước lần kiểm tra revision tiếp theo; đồng bộ không phải realtime tức thì.

**Kết luận:** Kiểm thử cục bộ và giả lập đạt; đủ điều kiện bàn giao **staging**, chưa phải xác nhận production.

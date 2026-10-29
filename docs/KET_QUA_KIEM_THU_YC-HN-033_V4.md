# KẾT QUẢ KIỂM THỬ YC-HN-033 V4 – v1.2.27-RC

- Cơ sở: mã nguồn ZIP v1.2.26-RC, không kết nối production.
- `npm run check`: **Đạt** – kiểm tra cú pháp `api/rpc.js`, `api/config.js`, `public/app.js`.
- `node --test tests/*.test.js`: **215/215 đạt**, 0 lỗi.
- `tests/browser_yc030_months.py`: **Đạt** – tháng 1–6, không khóa theo số tháng hỗ trợ.
- `tests/browser_yc032_dependent_trades.py`: **Đạt** – ADMIN/NHAN_VIEN, trường A/B, ba menu, quyền trường.
- `tests/browser_yc031_school_trades.py`: **Đạt** – phân quyền nghề theo cơ sở.
- `tests/browser_yc029_v5_two_clients.py`: **Đạt** – phát hiện thay đổi, xử lý xung đột hai máy giả lập.
- Kiểm thử mới: năm bài frontend/kiểm tra phạm vi YC033, hai bài backend thực thi mô phỏng dữ liệu `3,5`/cập nhật Excel; tất cả đạt.
- Định dạng `xlsx-export.js` **không sửa**; hai mẫu ma trận đổi thứ tự các hàng đầu vào trước khi xuất, các tổng vẫn được kiểm tra.

**Chưa có:** đo thời gian hoặc kiểm thử bền trên Apps Script/Google Sheets staging/production với 10–20 tài khoản, kiểm tra trên bộ dữ liệu của người dùng thực tế. Không thể cam kết hệ thống không bao giờ phát sinh lỗi.

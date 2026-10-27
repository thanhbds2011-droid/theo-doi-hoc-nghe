# BÁO CÁO KIỂM THỬ YC-HN-027 V2 / v1.2.21-RC

**Môi trường:** Node.js kiểm thử giả lập Apps Script + Google Sheets; Chromium/Playwright mock, không truy cập Vercel/GAS/Sheets production.

- `npm run check`: ĐẠT (`api/rpc.js`, `api/config.js`, `public/app.js`).
- `npm test`: **185/185 đạt**, không có bài lỗi hoặc bỏ qua. Bộ nền `v1.2.20-RC` có 180 test, nâng lên 185 sau thay các tiêu chí nghiệp vụ cũ và bổ sung test phân quyền.
- Kiểm thử Chromium thành công:
  1. `tests/browser_yc027_rbac_mock.py` — ADMIN có 6 menu; NHAN_VIEN có 3 menu và cập nhật tình trạng C/D; CO_SO_DAO_TAO chỉ thấy trường mình.
  2. `tests/browser_yc022_mock.py` — ADMIN cập nhật cục bộ sau sửa; B/C không thấy nút sửa nội dung.
  3. `tests/browser_yc024_mock.py` — báo cáo ngày, in, xuất 4 mẫu theo quyền cũ.
  4. `tests/browser_yc021_mock.py` — icon/thao tác, tìm kiếm, cache phân quyền.
  5. `tests/browser_yc023_mock.py` — lọc ngày kết thúc dự kiến, scope, export.
  6. `tests/browser_yc019_mock.py` — lọc ngày hai đầu mút.
  7. `tests/browser_yc020_export.py` — 25 cột, 2.433 dòng, Unicode, mã số 0 đầu.
  8. `tests/browser_yc021_v5_2_excel.py` — căn lề, wrap, chiều cao Excel.
- Kiểm thử backend mới: nhân viên không có quyền ghi ngoài `record_status` kể cả metadata `QUYEN='*'`; nhân viên thấy/truy vấn/sửa tình trạng hai trường; C không đọc/sửa trường khác; xung đột PHIEN_BAN; audit ghi đúng người; thu hồi quyền khi khóa hoặc chuyển vai trò; không làm thay đổi dữ liệu 7 tab/94 cột.
- Tính toàn vẹn Excel: SHA-256 `public/xlsx-export.js` vẫn bằng bản nguồn v1.2.20-RC: `aefaf1c17e6c6ff6f5ea2ab530d41b87b04112ebb4ad0f06349c15ef7cf6947f`.

**Giới hạn:** Các bài Chromium dùng mock, không chứng minh website production đang vận hành đúng; chưa đo thời gian lưu trên Google Sheets thật.

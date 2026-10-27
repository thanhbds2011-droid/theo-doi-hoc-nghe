# KẾT QUẢ KIỂM THỬ — YC-HN-026 V2 / v1.2.20-RC

**Ngày kiểm thử:** 26/10/2026. **Phạm vi:** mã nguồn và backend giả lập tại container; không kết nối production.

- `npm run check`: **PASS**.
- `npm test`: **180/180 PASS, 0 FAIL** (179 bài nền sau cập nhật kỳ vọng phiên bản/nhãn, 1 bài backend mới YC-HN-026 V2).
- `python tests/browser_yc024_mock.py`: **PASS** — ba vai trò; báo cáo, in, bốn mẫu xuất và chế độ lọc kết thúc dự kiến.
- `python tests/browser_yc023_mock.py`: **PASS** — ba vai trò; Hồ sơ, bộ lọc và phạm vi quyền.
- `python tests/browser_yc022_mock.py`: **PASS** — cập nhật cục bộ, kiểm phiên bản, giữ bộ lọc.
- `python tests/browser_yc021_v5_2_excel.py`: **PASS** — 25 cột, căn B/J/O/V/W trái; R giữa; Wrap Text, chiều cao, ngày và số 0 đầu.
- `tests/yc026-excel.test.js`: kiểm tra tiêu đề ma trận **Đã tham gia**, số kiểu numeric trong XML XLSX, tiêu đề Wrap Text, viền và dòng Tổng cộng màu vàng với 9/16/32 cột.
- `tests/backend.test.js` bài V2: dữ liệu 10 quyết định, 6 đã tham gia gồm 2 bỏ học và 4 đang học; hai ma trận phải `participated = 6`, `dropout = 2`, `learning = 4` và tổng phải bằng `overview`; kiểm BO_HOC, REPORT_PARTICIPATED_ALL, theo từng trường, theo từng nghề và tài khoản trường không lấy được trường ngoài quyền.
- SHA-256 `public/xlsx-export.js` giữ nguyên: `aefaf1c17e6c6ff6f5ea2ab530d41b87b04112ebb4ad0f06349c15ef7cf6947f`.

**Không khẳng định:** Đã chạy trên Google Sheets/Vercel production, đã mở/lưu trên Microsoft Excel hoặc WPS của người dùng, hoặc đã xác nhận số 1.343 thực tế sau deploy. Cần đối chiếu lần nữa trên staging trước khi chạy thật.

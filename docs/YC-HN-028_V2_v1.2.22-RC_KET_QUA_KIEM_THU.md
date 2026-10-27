# KẾT QUẢ KIỂM THỬ — YC-HN-028 V2 / v1.2.22-RC

**Môi trường:** Local Node.js 22 + Chromium headless (Playwright), backend Google Apps Script giả lập bằng VM/Mock. Không truy cập production.

- Kiểm tra cú pháp (`npm run check`): **đạt**.
- `node --test --test-concurrency=1 tests/*.test.js`: **191/191 pass**, 0 fail. Tệp log: `tests/logs/YC-HN-028_V2_NODE_TEST.txt`.
- `browser_yc022_mock.py`: đạt (cập nhật cục bộ, không dựng lại trang).
- `browser_yc023_mock.py`: đạt (lọc ngày kết thúc dự kiến, dữ liệu theo quyền).
- `browser_yc024_mock.py`: đạt (3 vai trò, Xuất Excel Báo cáo cho Nhân viên, 4 mẫu).
- `browser_yc027_rbac_mock.py`: đạt (Nhân viên chỉ 3 menu/cập nhật tình trạng mọi trường, cơ sở chỉ trường mình).
- `browser_yc028_mock.py`: đạt (Quản trị thêm/sửa chức danh; đổi nhãn khi phiên đang mở không logout; nhân viên xuất 4 dạng và In; cơ sở giữ chức năng).
- Cấu trúc `TAI_KHOAN`: **12 cột không đổi**; tab `CAU_HINH` lưu metadata mới theo mã tài khoản.
- `public/xlsx-export.js`: SHA256 trùng phiên bản v1.2.21-RC, **giữ nguyên từng byte**.

**Không kiểm chứng:** Không xác nhận deployment production, không có benchmark tốc độ với Google Sheets thực, không xác nhận hiển thị trên máy WPS của người dùng.

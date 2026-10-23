# YC-HN-024 V2 — Changelog v1.2.15-RC

Ngày 23/10/2026. **CHỐT**: Thêm hàng thống kê “Ngày hoàn thành khóa học”, bỏ banner xanh trong Báo cáo. Nền `v1.2.14-RC`.

## Thay đổi kỹ thuật

| Tệp | Nội dung |
|---|---|
| `apps-script/Code.gs` | Trả `kpi.courseEndScheduled` đếm ngày kết thúc dự kiến ISO hợp lệ trong đúng tập hồ sơ đã lọc; đổi thế hệ cache `OVERVIEW` |
| `public/app.js` | Dòng KPI mới dùng chung bảng Báo cáo và xuất Excel tổng hợp; thay banner xanh bằng metadata chỉ khi in |
| `public/styles.css` | Bỏ CSS khung `.report-course-end-note`, định dạng chỉ in cho `.report-print-date-scope` |
| `public/index.html`, `package.json`, `README.md` | Đồng bộ phiên bản `v1.2.15-RC` |
| `tests/backend.test.js` | Kiểm tra tập lọc, ngày hợp lệ/không hợp lệ, tháng 7, quyền trường, không cộng trùng KPI |
| `tests/yc024-report.test.js` | Kiểm tra bỏ banner, KPI + Excel tổng hợp, metadata in |
| `tests/browser_yc024_mock.py` | Kiểm thử Chromium mock 3 vai trò, bộ lọc, các dạng Excel và bản in |
| `tests/ui-yc006.test.js`, `tests/yc021-v5_2-hotfix-wps.test.js`, `tests/yc023-ui.test.js` | Cập nhật nhãn phiên bản được kiểm tra |
| `tests/browser_yc021_mock.py` | Sửa harness để đọc URL JS có query `?v=`; không đổi ứng dụng |

## Không thay đổi

- `public/xlsx-export.js` nguyên byte, SHA-256 `244d494d2cc9535dc631a1544409816f0502ba0f8ee17e7052c5d6c9e7f180dc`.
- Không thêm tab/cột Google Sheets, không thay đổi hồ sơ, phân quyền, trạng thái thực tế, quy tắc tháng bỏ học, biểu mẫu nhập Excel, báo cáo ma trận và thao tác cập nhật cục bộ.
- Tổng số QĐ không cộng thêm dòng lịch kết thúc; đây là chỉ tiêu chồng lấp các tình trạng thực tế.

## Kiểm thử

- `npm test`: **165/165 đạt**.
- `npm run check`: đạt.
- `python tests/browser_yc024_mock.py`: đạt 3 vai trò.
- `python tests/browser_yc023_mock.py`: đạt.
- `python tests/browser_yc022_mock.py`: đạt.
- `python tests/browser_yc021_mock.py`: đạt.
- Test đang dựa trên **mock backend và bộ dữ liệu giả lập**; chưa xác nhận thời gian và dữ liệu production.

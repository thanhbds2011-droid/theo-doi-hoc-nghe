# KẾT QUẢ KIỂM THỬ — YC-HN-026 V1 / v1.2.19-RC

**Ngày kiểm thử:** 26/10/2026. **Phạm vi:** bộ mã nguồn cục bộ nâng cấp từ v1.2.18-RC. **Không kết nối production.**

## Kết quả thực chạy

- `npm run check`: **PASS** — kiểm tra cú pháp mã nguồn của API và frontend.
- `npm test`: **179/179 PASS, 0 FAIL**, bao gồm 6 bài bổ sung YC-HN-026 về quyền xuất, chống rò dữ liệu, ma trận hai căn cứ ngày, custom status, XLSX nhiều cột.
- `python tests/browser_yc024_mock.py`: **PASS** — 3 vai trò, 4 dạng Xuất Excel ở Admin và Cơ sở đào tạo, In báo cáo; hiển thị tên cơ sở trong bản in của trường.
- `python tests/browser_yc023_mock.py`: **PASS** — giao diện Hồ sơ và xuất danh sách khi lọc theo ngày kết thúc cho Admin/Nhân viên/Cơ sở đào tạo.
- `python tests/browser_yc022_mock.py`: **PASS** — cập nhật cục bộ sau lưu, giữ bộ lọc, kiểm xung đột phiên bản và quyền trường không được sửa hồ sơ.
- `python tests/browser_yc021_v5_2_excel.py`: **PASS** — XLSX danh sách đủ 25 cột, căn B/J/O/V/W trái, R giữa, ngày và số 0 đầu; chiều cao hàng thích ứng.
- ZIP mã nguồn: kiểm tra cấu trúc thành công, không có lỗi ZIP.

## Ca nghiệm thu quan trọng

1. Gmail Cơ sở A có `REPORT_EXPORT` nhưng không được `accounts_list`, `record_bulk_import`, `record_delete`, `catalog_save`, `record_save`; xuất Excel danh sách và ma trận chỉ chứa A ngay cả khi truyền `truong=B`.
2. Ma trận theo trường và theo nghề lấy một snapshot đã được phân quyền; số Tổng QĐ theo ngày quyết định, số Hoàn thành theo ngày kết thúc dự kiến, bao gồm nhóm chỉ có Hoàn thành trong kỳ.
3. Cột Hoàn thành của hai ma trận có tổng bằng `overview.kpi.courseEndParticipated` với cùng phạm vi trong dữ liệu thử.
4. Tình trạng tùy chỉnh được xuất thành cột riêng, không cộng trùng vào phần còn lại của Tình trạng khác.
5. XLSX ma trận gồm 9, 16 và 32 cột vẫn có tiêu đề dài, Wrap Text, số Excel và dòng Tổng cộng nền vàng.
6. Đầu phần xử lý 25 cột trong `public/xlsx-export.js` giữ nguyên so với bản v1.2.18-RC theo SHA-256, chỉ sửa `buildReportXlsx` cho ma trận.

## Những điểm chưa kiểm chứng

- Chưa kiểm tra trực tiếp Google Apps Script và Google Sheets production, tốc độ tải thật, quota hay cache thật trên Vercel.
- Chưa mở/lưu ma trận xuất mới bằng Microsoft Excel/WPS trên chính máy người dùng. Định dạng được kiểm bằng cấu trúc XLSX và trình duyệt giả lập.
- Chưa kiểm tra kịch bản ngoài thực tế có trên 64 cột trạng thái (giới hạn rõ ràng, không âm thầm cắt cột).

**Khuyến nghị:** triển khai staging, dùng tài khoản trường kiểm tra quyền xuất thật và đối chiếu số liệu trước khi cập nhật hệ thống chính thức.

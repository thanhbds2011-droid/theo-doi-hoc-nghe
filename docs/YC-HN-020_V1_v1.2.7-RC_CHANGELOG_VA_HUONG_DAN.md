# YC-HN-020 V1 — Hướng dẫn triển khai v1.2.7-RC

## Phạm vi đã CHỐT

- **Lịch chọn ngày:** Tại **Hồ sơ học nghề** và **Báo cáo học nghề**, hai ô Từ ngày/Đến ngày được chọn qua cửa sổ lịch (năm → tháng → ngày). Ô ngày chỉ đọc, không cho gõ tự do. Có chọn nhanh năm, chuyển tháng, Hôm nay, Xóa ngày, Escape, Tab, các phím mũi tên. Hiển thị `dd/mm/yyyy`, API vẫn nhận `yyyy-mm-dd`. Không tự thêm hai ô ngày vào Tổng quan.
- **Excel danh sách:** Nút Xuất Excel trong Hồ sơ và lựa chọn Danh sách tại trang Báo cáo dùng chung `buildXlsx/downloadXlsx` của `public/xlsx-export.js`. Giữ **25 cột A:Y**, 2 hàng tiêu đề, gộp `M1:N1`, worksheet **Danh sách**; không thay mẫu Excel báo cáo 2 cột hoặc theo cơ sở/nghề.
- **8 cột ngày:** C, G, I, M, N, P, Q, U xuất ngày hợp lệ dưới dạng **Excel numeric serial date**, format `dd/mm/yyyy`. Ngày trống giữ trống, ngày sai giữ nguyên chuỗi và cảnh báo **số lượng** trong console (không ghi dữ liệu cá nhân vào log).
- **Giới tính:** `NAM` → `Nam`, `NU` → `Nữ`, `KHAC` → `Khác` chỉ trong Excel xuất. Dữ liệu Google Sheets/API gốc không đổi.
- **Căn lề:** B (Họ và tên) và O (Cơ sở đào tạo nghề) căn **phải, giữa theo chiều dọc**, có thụt vào 1. 23 cột còn lại căn giữa ngang và dọc. Hai hàng tiêu đề căn giữa, đậm, nền xanh nhạt và viền.
- **Dòng/cột:** Đặt chiều rộng theo nhóm dữ liệu; tối thiểu 31pt/hàng, tăng theo độ dài để tránh cắt tên trường; giới hạn chiều cao tối đa 122pt. Cố định hai hàng tiêu đề. Mã có số 0 đầu luôn là **văn bản**. Excel danh sách xuất tối đa 5.000 hồ sơ.

## Các file đã sửa

| File | Phạm vi |
|---|---|
| `public/app.js` | Lịch popup, event delegation, menu/cache ngày, gọi chung exporter danh sách; phiên bản |
| `public/styles.css` | Định dạng lịch trên desktop và mobile, trạng thái chọn/focus |
| `public/xlsx-export.js` | Bộ xuất Excel 25 cột có `styles.xml`, ngày Excel, giới tính, căn lề, hàng/cột |
| `public/index.html` | Nhãn phiên bản v1.2.7-RC |
| `package.json` | Phiên bản v1.2.7-rc.0 |
| `apps-script/Code.gs` | Chỉ đồng bộ **chuỗi phiên bản**, không thay đổi logic nghiệp vụ/API |
| `tests/...` | Kiểm thử ngày và XLSX mới; điều chỉnh test lịch cũ sang thao tác chọn lịch |

## Kết quả kiểm thử tại môi trường mã nguồn

- `npm run check`: đạt.
- `npm test`: **135/135 đạt** (132 bài nền, 3 bài bổ sung YC-HN-020).
- Chromium: `browser_yc019_mock.py`, `browser_yc014_mock.py`, `browser_yc015_mock.py`, `browser_yc017_mock.py`, `browser_yc018_mock.py`, `browser_yc016_real_excel.py`, `browser_yc011_export.py` và `browser_yc020_export.py`: đạt.
- XLSX giả lập **2.433 hồ sơ, 25 cột**: ZIP/XML hợp lệ, đủ 2.435 hàng, ô ngày số với định dạng, `NU` thành `Nữ`, mã `001234567890` không mất số đầu, B/O căn phải, dòng dài tăng chiều cao. Kiểm thử 5.000 hồ sơ cũng đạt ở Node.js.

**Giới hạn:** Không có thử nghiệm mở giao diện tệp bằng ứng dụng Microsoft Excel hoặc WPS thực tế; đã kiểm tra ZIP/XML OOXML và Chromium. Chưa đo thời gian xuất toàn bộ dữ liệu production, chưa truy cập Google Sheets thật. Không thực hiện deploy hoặc thay đổi dữ liệu thật.

## Quy trình thử nghiệm an toàn

1. Sao lưu mã nguồn/phiên bản đang vận hành v1.2.6-RC và tạo bản sao môi trường Vercel/Apps Script/Google Sheets để kiểm thử.
2. Đưa toàn bộ frontend/API lên nhánh staging từ ZIP. **Apps Script Code.gs không có thay đổi logic**, có thể giữ URL/backend tương thích hiện tại trên staging; nếu muốn đồng nhất số phiên bản, cập nhật `Code.gs` trên **Apps Script staging** và tạo bản triển khai phù hợp trước khi thử giao diện. Không thay production khi chưa nghiệm thu.
3. Đăng nhập ADMIN và nhân viên trường trên staging. Tại Hồ sơ/Báo cáo: chọn từ 01/07/2026 đến 31/07/2026 bằng lịch, Lọc; kiểm tra đúng dữ liệu. Thử Xóa ngày, chỉ một đầu ngày, một ngày duy nhất, năm nhuận, từ sau đến; quay menu sau 4 phút kiểm tra bộ lọc giữ nguyên.
4. Xuất **Danh sách** từ hai vị trí, mở trong Excel/WPS, kiểm tra 25 cột, gộp M1:N1, ngày 17/09/1997 và 13/10/2026, Nam/Nữ, B/O căn phải, các cột khác giữa ngang/dọc, địa chỉ dài, số 0 đầu, in và phân trang.
5. Kiểm tra mẫu **Báo cáo học nghề**, theo trường, theo nghề vẫn có chỉ tiêu và dòng Tổng cộng hiện hành; không thay quyền xuất.
6. Sau khi nghiệm thu staging và sao lưu đầy đủ mới triển khai production theo quy trình quản lý phiên bản của đơn vị.

## Hoàn tác

Phục hồi mã nguồn frontend v1.2.6-RC tại Vercel/GitHub. Vì không đổi dữ liệu, tab/cột, quyền hoặc API nghiệp vụ, **không cần migration Google Sheets**. Nếu đã cập nhật Code.gs, có thể kích hoạt lại bản triển khai Apps Script trước đó. Đối chiếu lại thông số môi trường để frontend và backend cùng endpoint.

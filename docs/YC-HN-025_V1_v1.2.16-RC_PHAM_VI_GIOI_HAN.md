# HƯỚNG DẪN TRIỂN KHAI / PHẠM VI — YC-HN-025 V1 — v1.2.16-RC

**Trạng thái:** CHỐT yêu cầu giao diện; đã hoàn thiện mã nguồn và kiểm thử mô phỏng. **CHƯA CHỐT công thức số học viên hoàn thành khóa học thực tế. Chưa triển khai production.**

## 1. Những nội dung được thực hiện

- `public/app.js`: đổi nhãn `Ngày hoàn thành khóa học` → `Hoàn thành khóa học` tại dropdown hai màn và hàng báo cáo; thêm mã ảo `FILTER_ALL_DECISIONS` nhãn `Tổng số Quyết định đã ban hành` trong hai dropdown; bỏ tùy chọn `Đang học` khỏi dropdown Báo cáo (không xóa trạng thái nghiệp vụ/backend).
- Đổi nhãn hàng `Tổng số Quyết định` thành `Tổng số Quyết định đã ban hành` chỉ ở bảng Tổng hợp kết quả/Báo cáo tổng hợp, theo phạm vi yêu cầu.
- `reportKpiRows()`: nếu Tất cả tình trạng, hiển thị toàn bộ chỉ tiêu; nếu chọn cụ thể, chỉ hiển thị đúng một chỉ tiêu theo bộ lọc đã ÁP DỤNG; trường hợp trạng thái tùy chỉnh dùng tên trạng thái và số bản ghi thực đã lọc. Xuất báo cáo tổng hợp cùng hàng chỉ tiêu; bản in dùng chính bảng trên web.
- `apps-script/Code.gs`: backend hiểu mã `FILTER_ALL_DECISIONS` như không giới hạn tình trạng nhưng vẫn giới hạn quyền, năm/trường/nghề/ngày; áp dụng trên records_list/overview/report_export/report_matrix, và nguồn Xuất Excel trang Hồ sơ. Tăng cache revision cho kết quả báo cáo mới.
- Giữ nguyên hoàn toàn `public/xlsx-export.js`, cấu trúc 7 tab/94 cột, kiểm tra trùng số QĐ, phân quyền, ghi nhật ký, cập nhật cục bộ sau lưu, bộ lọc lịch kết thúc dự kiến của YC-HN-023/024.

## 2. Giới hạn chưa thể tự quyết định

Trong nguồn 40 cột HO_SO_HOC_NGHE không có xác nhận hoàn thành/tốt nghiệp thực tế. `NGAY_KET_THUC_DU_KIEN` **chỉ là ngày kết thúc theo kế hoạch**. Các lựa chọn A và B của Master Prompt YC-HN-025 chưa được người dùng chọn riêng. Do đó:

- Dòng `Hoàn thành khóa học` trong Tổng hợp kết quả và Excel Báo cáo tổng hợp **KHÔNG lấy k.courseEndScheduled làm số người tốt nghiệp**.
- Tạm hiển thị văn bản **`Chưa có dữ liệu xác nhận hoàn thành`**, kể cả khi chọn chế độ lọc này. Đây là cảnh báo nghiệp vụ, không phải số liệu 0.
- Bộ lọc `Hoàn thành khóa học` hiện vẫn tra ngày kết thúc DỰ KIẾN, như chức năng đã nghiệm thu; chú thích dưới lịch nêu rõ điều đó. Không suy ra tất cả hồ sơ lọc được đều hoàn thành thật.
- Để có số đếm, cần chốt A (định nghĩa đối tượng DỰ KIẾN hoàn thành; và liệu có giới hạn tại ngày hiện tại hay không) hoặc B (nguồn xác nhận THỰC TẾ và cách lưu/tích hợp). Điều kiện `hoàn thành ≤ đã tham gia` chỉ được đảm bảo bằng quy tắc tập con, không chỉnh số nhân tạo để nhỏ hơn nghiêm ngặt.

**Không nên đưa nhãn/đếm Hoàn thành vào báo cáo nghiệp vụ chính thức trước khi chốt nghĩa thống kê.**

## 3. Tệp sửa

- `public/app.js` — dropdown, bảng chỉ tiêu, Excel tổng hợp, phiên bản.
- `apps-script/Code.gs` — xác thực hai loại bộ lọc ảo và cache scope.
- `public/index.html`, `package.json`, `README.md` — phiên bản/hướng dẫn.
- `tests/backend.test.js`, `tests/yc025-ui.test.js`, một số bài kiểm thử đời trước và hai bài Chromium mock được đồng bộ với nhãn đã đổi.
- `public/xlsx-export.js` **không thay đổi**, SHA-256 `244d494d2cc9535dc631a1544409816f0502ba0f8ee17e7052c5d6c9e7f180dc`.

## 4. Triển khai thử nghiệm, không phải production

1. Sao lưu riêng GitHub/Vercel và toàn bộ bản Apps Script phiên bản `v1.2.15-RC`; giữ lại deployment ID trước đó.
2. Trên **Apps Script thử nghiệm**, chép toàn bộ `apps-script/Code.gs`, lưu và tạo **New version** trong `Deploy → Manage deployments → Edit → New version → Deploy`; bảo đảm gateway môi trường thử nghiệm đang trỏ về deployment mới. Không cần thêm bảng/cột hay chạy `setupDatabase` trên dữ liệu production.
3. Đưa toàn bộ nội dung ZIP (bên trong thư mục mã nguồn) lên GitHub nhánh thử nghiệm; tạo deployment Preview Vercel trỏ tới backend thử nghiệm. Không upload `.env` chứa bí mật.
4. Dùng Ctrl+Shift+R; chân trang `v1.2.16-RC`. Thử từng màn: Bộ lọc `Tổng số Quyết định đã ban hành` → đúng kết quả theo khoảng ngày/quyền; `Tất cả tình trạng` → đủ hàng; `Bỏ học` → một hàng; `Hoàn thành khóa học` → lịch ngày dự kiến và thông báo chưa có dữ liệu hoàn thành thực tế.
5. Thử 3 vai trò; tài khoản trường không thấy hồ sơ trường khác, không được xuất Excel nếu không có quyền. Xuất `Báo cáo tổng hợp` và in phải khớp bảng hiện hành. Kiểm thử lại xuất Excel danh sách 25 cột.
6. Nếu có lỗi, đổi Vercel về commit `v1.2.15-RC` **và** Apps Script về deployment version cũ, xóa cache phiên/đăng nhập lại để tránh frontend/backend không tương thích.

## 5. Kết quả kiểm thử môi trường làm việc

- Node.js: **171/171 đạt** (gồm 6 bài mới: UI, backend tổng quyết định và quyền theo trường), `npm run check` đạt.
- Chromium giả lập: `tests/browser_yc023_mock.py` và `tests/browser_yc024_mock.py` chạy đạt cho ADMIN, NHAN_VIEN, CO_SO_DAO_TAO (mock API). Hai phép thử không đo network hoặc Apps Script production.
- Không tuyên bố đã kiểm thử thực tế Google Sheets, Vercel production hay tốc độ đọc/ghi; không có dữ liệu cá nhân được thay đổi trong lượt phát hành này.

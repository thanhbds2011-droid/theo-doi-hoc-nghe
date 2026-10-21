# YC-HN-021 V5.2 — ĐÃ CHỐT MẪU EXCEL (21/10/2026)

**Phiên bản bàn giao:** `v1.2.10-RC` (nâng từ `v1.2.9-RC`).

## Nguồn mẫu đã được người sử dụng xác nhận

`danh_sach_hoc_nghe_2026-10-21_chieu_cao_can_doi.xlsx` — file sau khi tinh chỉnh trực tiếp, **được người dùng kiểm tra và CHỐT**.

- Cột B, J, O, V, W: Left / Middle / Wrap Text.
- Cột R và toàn bộ cột khác: Center / Middle / Wrap Text khi dài.
- Hai hàng tiêu đề giữ nguyên định dạng, gộp M1:N1; 25 cột A:Y.
- Chiều cao dữ liệu theo nội dung: hàng thường khoảng 47pt; dài hơn 61, 75, 89, ...pt; hàng cực ngắn được thu nhỏ hơn. Không ép tất cả hàng thành 61–76pt.
- Bảo toàn kiểu ngày Excel `dd/mm/yyyy`, giới tính Nam/Nữ và các mã định danh có số 0 đầu.
- **Mẫu Excel là chuẩn về trình bày, không được copy dữ liệu mẫu vào Google Sheets/ứng dụng.**

## Thay đổi trong code

1. `public/xlsx-export.js`: hàm `buildXlsx` đổi tập cột căn trái từ `[1,9,14,17]` sang `[1,9,14,21,22]` (chỉ số 0); vẫn dùng exporter chung của cả nút **Hồ sơ → Xuất Excel** và **Báo cáo → Danh sách**.
2. `recordRowHeight` áp dụng tính dòng theo độ rộng và Wrap Text, chiều cao cơ sở 33pt, tăng 14pt cho mỗi dòng ước lượng tiếp theo (tối đa 350pt); tránh chiều cao mặc định quá lớn từ công thức cũ. Đây là **thuật toán ước lượng**, có thể phụ thuộc phông chữ/render của Excel/WPS; file đã duyệt vẫn là đối chứng nghiệm thu.
3. `public/index.html`, `public/app.js`, `package.json`: chỉ tăng nhãn phiên bản.
4. `apps-script/Code.gs`: chỉ tăng nhãn phiên bản `APP.version`, không thay đổi xử lý API, không bắt buộc phát hành lại Apps Script.
5. `tests/yc021-v4.test.js`, `tests/yc021-v5_1.test.js`: cập nhật kỳ vọng căn lề **vì người dùng đã thay thế quy định V5.1**, không cắt bớt bài test. Thêm `tests/yc021-v5_2.test.js` kiểm tra hàng ngắn/dài, Wrap Text và dữ liệu.

## Giới hạn phạm vi

- Không đổi lưu/xóa/sửa hồ sơ, trạng thái, phân quyền, cache, nhập Excel hàng loạt, thống kê hoặc mẫu Excel **báo cáo ma trận**.
- Không đổi schema 7 tab/94 cột Google Sheets, không migration.
- Không tự sửa phần tháng bỏ học YC-HN-021 còn hai điểm nghiệp vụ chưa thống nhất.

## Triển khai thử nghiệm / rollback

1. Giữ bản sao bộ GitHub `v1.2.9-RC` và cấu hình Vercel hiện tại.
2. Cập nhật nguyên bộ GitHub `v1.2.10-RC` lên nhánh staging; Apps Script đang chạy **có thể giữ nguyên** vì không thay đổi API.
3. Xuất danh sách với ít hồ sơ và 2.000+ hồ sơ từ hai đường xuất; mở bằng Microsoft Excel hoặc WPS, kiểm tra B/J/O/V/W, R, Wrap Text và chiều cao hàng có địa chỉ/tên trường dài.
4. Nếu cần rollback, khôi phục bản frontend `v1.2.9-RC`; không thay đổi Google Sheets.

**Tình trạng:** sửa mã nguồn và kiểm thử tự động; chưa triển khai production hoặc xác nhận hiển thị thực tế trên Excel/WPS ở máy người dùng.

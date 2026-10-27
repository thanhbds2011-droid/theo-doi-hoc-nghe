# HƯỚNG DẪN TRIỂN KHAI — YC-HN-026 V2 · v1.2.20-RC

## 1. Mục tiêu

Khắc phục cột **Đã tham gia** trong Excel theo cơ sở/nghề đang loại người bỏ học: cột mới lấy `report_matrix.items[].participated` và phải khớp chỉ tiêu **Đã tham gia** trên website. Giữ riêng cột **Bỏ học** và không cộng hai cột này vào Tổng số Quyết định.

## 2. Sao lưu và triển khai thử nghiệm

1. Sao lưu toàn bộ GitHub/Vercel deployment và phiên bản **Apps Script v1.2.19-RC**; không sửa tab/cột hay dữ liệu Google Sheets.
2. Trong Apps Script staging: thay toàn bộ `Code.gs` từ tệp bàn giao `CODE_APPS_SCRIPT_YC-HN-026_V2_v1.2.20-RC_Code.gs`. Lưu và chọn **Deploy → Manage deployments → Edit → New version → Deploy**; giữ nguyên URL deployment và cấu hình bí mật/ủy quyền hiện có.
3. Triển khai ZIP GitHub `THEO_DOI_HOC_NGHE_YC-HN-026_V2_v1.2.20-RC.zip` lên staging/Vercel. Trong thư mục ZIP, thư mục gốc `theo-doi-hoc-nghe-v1.2.20-RC/` chứa `public/`, `api/`, `apps-script/`, `tests/`, `package.json`…; chỉ đưa **nội dung thư mục gốc** vào root repository hiện tại.
4. Trong website staging, nhấn `Ctrl + Shift + R`; xác nhận chân trang **v1.2.20-RC**. Kiểm tra Apps Script deployment đã ở phiên bản mới, vì frontend sẽ báo lỗi nếu backend chưa trả trường `participated`.
5. Kiểm thử cùng năm/cơ sở/nghề/ngày: Báo cáo → Tất cả tình trạng → Đã tham gia; sau đó Xuất Excel → Theo cơ sở, Theo nghề; đối chiếu dòng Tổng cộng **Đã tham gia** bằng số báo cáo web. Với ảnh ví dụ: **1.343** khi dữ liệu vẫn giữ nguyên, cột Bỏ học **44**, Tổng số QĐ **2.433**.
6. Dùng tài khoản **Cơ sở đào tạo** thử Xuất Excel cả hai ma trận, xác nhận chỉ có dữ liệu trường được gán. Thử `Bỏ học` và `Hoàn thành khóa học` để bảo đảm các bộ lọc/định nghĩa cũ vẫn đúng.
7. Kiểm tra danh sách Excel 25 cột, căn lề, Wrap Text và chiều cao dòng. Sau nghiệm thu staging mới áp dụng lên production theo quy trình quản lý triển khai của đơn vị.

## 3. Triển khai thứ tự và tương thích

**Ưu tiên backend trước, frontend sau**: Backend mới trả thêm trường `participated` mà không bỏ `learning`; frontend cũ vẫn có thể gọi API, nhưng sẽ xuất số Đã tham gia theo logic cũ cho tới khi cập nhật. Frontend mới gặp backend cũ thì **từ chối xuất kèm thông báo cập nhật Code.gs**, không tạo tệp thiếu/sai số liệu.

## 4. Hoàn tác

Nếu có sự cố, khôi phục **cả hai phiên bản** về `v1.2.19-RC` (redeploy Apps Script phiên bản cũ, redeploy GitHub/Vercel commit cũ), hard-refresh trình duyệt và kiểm tra lại luồng hồ sơ/quyền. Không phải rollback dữ liệu Sheet vì phiên bản này không sửa dữ liệu hoặc schema.

## 5. Giới hạn xác minh

Đã chạy 180/180 Node.js, Chromium mock cho ba vai trò, kiểm tra cấu trúc XLSX cục bộ. Chưa kết nối Google Sheets/Vercel production hoặc xác nhận kết quả từ Microsoft Excel/WPS trên máy người dùng.

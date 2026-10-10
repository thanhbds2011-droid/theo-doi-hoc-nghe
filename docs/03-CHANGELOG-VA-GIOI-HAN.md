# CHANGELOG v1.0.1-RC — Việt hóa Google Sheets

- Tên 7 tab và tiêu đề 79 cột chuyển sang tiếng Việt dễ đọc; giữ thứ tự/giá trị dữ liệu.
- Giữ nguyên khóa kỹ thuật bên trong, API, phân quyền, báo cáo, số quyết định theo năm và giao diện Vercel.
- Thêm `chuyenSangTiengViet()` / cập nhật `setupDatabase()`: tiền kiểm tra, khóa chuyển đổi, sao lưu Drive, hỗ trợ schema tiếng Anh lẫn tiếng Việt.
- Chặn khi hai tên tab cũ/mới tồn tại đồng thời hoặc tiêu đề sai; không tự xóa tab cũ.
- Tự giãn chiều rộng cột và ngắt dòng tiêu đề tại lần đầu chuyển đổi.
- Giữ các mã kỹ thuật lưu trong ô: `ACTIVE`, `ADMIN`, `APP_NAME`, `DA_THAM_GIA` v.v. Không tự dịch dữ liệu đã lưu.
- Bộ kiểm thử bổ sung cho migration và hồi quy nghiệp vụ.
- Giới hạn: chưa kiểm thử trực tiếp trên tài khoản Google Sheets/Apps Script thật; có thể xảy ra lỗi giữa quá trình chuyển đổi, bản sao lưu dùng để khôi phục có kiểm soát. Không có tính nguyên tử đa-tab trong Google Sheets.

---

# CHANGELOG V1.0.0-RC — 10/10/2026

## Mới
- Độc lập hoàn toàn Work/KPI, Apps Script standalone và Google Sheets 7 tab.
- Đăng nhập Google qua Google Identity Services; Vercel Function xác minh token, Apps Script kiểm tra HMAC, audience và quyền.
- Dashboard 6 chỉ tiêu, danh sách hồ sơ, nhập/sửa, phân trang, tìm kiếm, lựa chọn người học đã có.
- Chống trùng quyết định theo năm, khóa số do người dùng nhập và LockService.
- Quy trình cập nhật bỏ học, danh mục trường/nghề/lý do, tài khoản/permissions, nhật ký thay đổi.
- Xuất CSV có chống CSV formula injection, In báo cáo, tệp đính kèm riêng.
- Bộ test 22 tình huống (16 Apps Script nghiệp vụ, 6 lớp proxy).

## Giả định nghiệp vụ khi CHỐT
- **Chỉ nhập số quyết định đã ban hành; phần mềm KHÔNG tự cấp số.**
- Ngày quyết định quyết định năm. Một quyết định = một hồ sơ = một người.
- Đang học = đã tham gia, không đánh dấu bỏ học. Chưa có trạng thái hoàn thành khóa học riêng.
- Hồ sơ không có chức năng xóa hoặc hủy trong phiên bản này; vì vậy quyết định cũ không bị tái sử dụng qua ứng dụng.

## Giới hạn cần xác minh trên sản xuất
1. Chưa chạy thử đăng nhập Google/Vercel/GAS/Sheets thật, chưa thể xác nhận bộ giao diện trên mọi trình duyệt.
2. Google Sheets không có index vật lý; đọc theo lô và caching chưa đủ khi dữ liệu hoặc traffic lớn.
3. Tệp qua Apps Script tối đa 1,2MB; PDF/JPG/PNG. Ảnh/PDF lớn cần kiến trúc upload khác.
4. Nhật ký là best effort sau khi ghi dữ liệu: một lỗi ghi nhật ký có thể được ghi trong Apps Script Executions nhưng không đảo ngược giao dịch thành công. Cần quy trình đối soát và sao lưu định kỳ nếu vận hành trên dữ liệu nhạy cảm.
5. Cache tài khoản tối đa khoảng 15 giây; sau khóa quyền bằng giao diện, cache theo revision tự hết hiệu lực; thay đổi trực tiếp trên Sheet có thể trễ cập nhật ngắn hạn.
6. Chưa có tự động gia hạn Google ID token; sau khi token hết hạn người dùng đăng nhập lại.
7. Chưa có phân hệ cấp số quyết định hành chính, không tự tạo số quyết định của năm mới.
8. Chính sách Vercel Hobby và Google quota cần kiểm tra theo mục đích sử dụng thực tế, không mặc định miễn phí cho mọi loại hoạt động.

## Không có trong ứng dụng
- Firebase Authentication, Firestore hoặc Firestore Rules.
- Chức năng của Theo dõi công việc & Báo cáo hoặc phần mềm đánh giá KPI.
- Phân hệ cấp số văn bản, sổ quyết định chính thức, tự phát hành văn bản điện tử.

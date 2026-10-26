# HƯỚNG DẪN TRIỂN KHAI — YC-HN-026 V1 / v1.2.19-RC

## I. Trước khi cập nhật

1. Sao lưu bản GitHub/Vercel và `Code.gs` **v1.2.18-RC** đang hoạt động. Lưu ID deployment Apps Script cũ để hoàn tác.
2. Triển khai thử nghiệm (staging) trước khi thay phiên bản chính thức. Không thực hiện thao tác thử nghiệm vào dữ liệu thật.
3. Không cần thay cấu trúc hay phân quyền thủ công trong Google Sheets; các quyền `REPORT_EXPORT` của Gmail trường được xác định theo vai trò đã được xác minh ở máy chủ.

## II. Cập nhật Google Apps Script

1. Mở dự án Apps Script tương ứng với backend đang dùng.
2. Thay toàn bộ **`Code.gs`** bằng tệp `CODE_APPS_SCRIPT_YC-HN-026_V1_v1.2.19-RC_Code.gs` đính kèm.
3. Vào **Deploy → Manage deployments → Edit → New version → Deploy** để tạo phiên bản mới, giữ cấu hình triển khai/endpoint phù hợp. Kiểm tra URL Apps Script ở Vercel vẫn trỏ đúng deployment hoạt động.
4. Nếu dự án sử dụng URL deployment khác, cập nhật biến môi trường Vercel theo cấu hình hiện hữu; không công khai `API_SHARED_SECRET`, Google ID token hay dữ liệu hồ sơ.

## III. Cập nhật GitHub/Vercel

1. Dùng ZIP mã nguồn đầy đủ `THEO_DOI_HOC_NGHE_YC-HN-026_V1_v1.2.19-RC.zip`, giữ đúng cấu trúc từ thư mục root dự án.
2. Cập nhật GitHub và kiểm tra Vercel triển khai thành công, phiên bản góc trái dưới là **v1.2.19-RC**. Nhấn `Ctrl + Shift + R` để tải lại script mới.
3. Trên website thử nghiệm đăng nhập Gmail trường. Mở **Hồ sơ học nghề → Xuất Excel**, rồi **Báo cáo → Xuất Excel** (4 lựa chọn) và **In báo cáo**.
4. Kiểm tra xuất ra **chỉ dữ liệu của trường được gán**; thử tìm quyết định của trường khác và thử lựa chọn năm/nghề/ngày để bảo đảm không rò dữ liệu. Không thử bằng cách đổi tài khoản thật của người khác.
5. Xuất **Báo cáo theo cơ sở** và **theo nghề** với cùng bộ lọc, kiểm tra cột `Tổng số Quyết định đã ban hành`, `Hoàn thành khóa học`, cột trạng thái tùy chỉnh (nếu có), và dòng Tổng cộng; mở bằng Excel/WPS trên máy sử dụng.
6. Đối chiếu bảng **Báo cáo → Hoàn thành khóa học** với tổng cột Hoàn thành của ma trận cho cùng kỳ/trường/nghề/quyền. Đối chiếu các cột QĐ với chỉ tiêu Ngày quyết định.

## IV. Hoàn tác

- Nếu phát hiện lỗi quyền hoặc thống kê, dừng dùng báo cáo thử nghiệm, phục hồi deployment Apps Script **v1.2.18-RC** và quay Vercel về commit tương ứng; tải lại trang và kiểm tra quyền trường.
- Không khôi phục dữ liệu Google Sheets vì nâng cấp này không thay đổi schema và không tự sửa dữ liệu.

## V. Giới hạn kiểm thử

Đã kiểm thử **môi trường mô phỏng Node.js/Chromium**, chưa chạy production và chưa kiểm nghiệm trên đúng Excel/WPS cài ở máy người dùng. Những số liệu thời gian phản hồi phụ thuộc Apps Script/Vercel thật chưa được đo.

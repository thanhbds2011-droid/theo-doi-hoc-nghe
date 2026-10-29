# HƯỚNG DẪN TRIỂN KHAI – THEO DÕI HỌC NGHỀ v1.2.27-RC

## 1. Xác nhận điều kiện
- Phiên bản nền phải là `v1.2.26-RC` (YC-HN-032 V2). Nếu bản website/backend đang là phiên bản cũ hơn, không dán đè rời rạc.
- Sao lưu toàn bộ nội dung Apps Script `Code.gs`, tải snapshot repository GitHub ở phiên bản hiện tại, ghi lại ID phiên bản triển khai Apps Script.
- Nên thử trên môi trường staging với bản sao Google Sheets trước. Không cần chạy hàm chuyển đổi schema.

## 2. Cập nhật Apps Script
1. Mở Google Apps Script đúng dự án THEO DÕI HỌC NGHỀ.
2. Mở `Code.gs`, sao lưu rồi thay toàn bộ bằng nội dung `GOOGLE_APPS_SCRIPT/Code.gs` trong ZIP gọn (hoặc file `Code_HocNghe_YC-HN-033_V4.gs`).
3. Lưu; vào **Triển khai → Quản lý các lượt triển khai → Chỉnh sửa** lượt Web App đang dùng → chọn **Phiên bản mới → Triển khai**.
4. Đảm bảo URL Web App vẫn là URL đang khai báo trong Vercel. Không công khai `API_SHARED_SECRET`, `SPREADSHEET_ID` hoặc `GOOGLE_CLIENT_ID`.

## 3. Cập nhật GitHub/Vercel
Chỉ cần thay ba tệp cùng đường dẫn: `public/app.js`, `public/index.html`, `package.json`. ZIP gọn có sẵn đường dẫn thư mục như GitHub. Không dán tệp `Code.gs` vào thư mục public trên GitHub.

Nếu GitHub được kết nối Vercel, commit trên nhánh production có thể tự deploy. Hãy thử staging trước, rồi thực hiện có kiểm soát.

## 4. Nghiệm thu
- Đăng nhập ADMIN / NHAN_VIEN / CO_SO_DAO_TAO; số menu và quyền giữ nguyên.
- Tìm Quyết định 761 hỗ trợ 3,5; chọn Bỏ học, kiểm tra tháng 1–6 chọn được; lưu 1 tháng thử trên staging; kiểm tra nhật ký và số liệu.
- Kiểm tra trường có số tháng trống, 1 hoặc 12 vẫn chọn 1–6.
- Bộ lọc Cơ sở trên cả ba menu A–Z; Nghề vẫn lọc theo trường A/B và A–Z.
- Xuất Báo cáo theo cơ sở và theo nghề: số quyết định giảm dần, STT 1..N, tổng cuối; thử trường hợp hai nhóm bằng nhau.
- Cập nhật tình trạng từ Excel bằng 2 hồ sơ Chưa xác nhận trên staging: nút Xác nhận, kết quả đã cập nhật hiển thị; đóng hộp và kiểm tra bảng mới; không còn lỗi `.catch`, không ghi trùng.
- Kiểm tra Excel danh sách 25 cột và Báo cáo tổng hợp 3 cột không đổi định dạng.
- Kiểm tra xung đột hai người cập nhật một hồ sơ, không ghi đè sai.

## 5. Hoàn tác
Nếu có lỗi trước khi áp dụng dữ liệu mới: triển khai lại bản frontend và Apps Script đã sao lưu `v1.2.26-RC`. **Nếu đã ghi tháng 4–6 cho hồ sơ có số tháng hỗ trợ dưới 4, hoặc số hỗ trợ thập phân**, backend cũ có thể từ chối lần cập nhật tiếp theo. Khi đó không hoàn tác ngay mà cần đánh giá dữ liệu và lập kế hoạch tương thích; không tự sửa dữ liệu đang dùng.

## 6. Vận hành nhiều người
Bộ kiểm thử offline không thay thế kết quả đo trên Google Sheets thật. Trước khi kết luận phục vụ 10–20 người cập nhật đồng thời, hãy kiểm thử staging ở 1/4/10/20 phiên và đo `lockWaitMs`, `totalMs`, tỷ lệ lỗi, dữ liệu đúng sau mỗi lượt.

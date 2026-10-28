# HƯỚNG DẪN TRIỂN KHAI VÀ HOÀN TÁC – YC-HN-029 V5

## A. Chuẩn bị bắt buộc

1. **Không triển khai trực tiếp lên production khi chưa thử staging.** Sao lưu ZIP đang chạy (V4) và toàn bộ Google Sheets/Drive liên quan; lưu bản Code.gs đang deploy và deployment ID/phiên bản.
2. Không công khai `API_SHARED_SECRET`, `SPREADSHEET_ID`, `GAS_WEB_APP_URL`, Client ID riêng, tệp credentials hoặc dữ liệu cá nhân trong GitHub. Chỉ dùng môi trường cấu hình sẵn và quyền hạn phù hợp.
3. Không chạy `setupDatabase()` hoặc hàm thêm cột; V5 **không yêu cầu chuyển đổi dữ liệu**.

## B. Triển khai staging đúng thứ tự

1. Tạo bản sao dữ liệu kiểm thử và môi trường Apps Script riêng, điền Script Properties theo hướng dẫn dự án. Không dùng hồ sơ cá nhân thật nếu không cần thiết.
2. Thay **toàn bộ `apps-script/Code.gs`** bằng bản V5; kiểm tra cú pháp và triển khai **phiên bản Web App mới**; xác nhận Vercel staging trỏ đúng `/exec` của bản mới. Giữ nguyên cách chạy/xác minh Google ID Token của bản cũ.
3. Sau khi backend mới đã hoạt động, cập nhật **toàn bộ ZIP GitHub V5** lên nhánh staging, gồm `public/app.js`, `public/styles.css`, `public/index.html`; giữ cấu hình secrets trong Vercel, không commit file .env.
4. Kiểm tra góc trái dưới ghi `v1.2.23-RC`, đăng nhập cả ba vai trò; chức danh nhãn V4 vẫn hiển thị, không xuất hiện thêm menu.
5. Tại staging, kiểm tra hai trình duyệt/2 người dùng cập nhật cùng một hồ sơ; người đến sau phải được cảnh báo, không bị ghi đè. Kiểm tra đóng form vẫn giữ bộ lọc và cảnh báo không tự lưu.
6. Kiểm tra tab ẩn/hiện, chuyển menu Tổng quan ↔ Hồ sơ ↔ Báo cáo, bộ lọc ngày, từ khóa, Excel bốn mẫu và tệp 10 MB. Kiểm tra tệp upload thất bại không thay đổi hồ sơ.
7. Đo riêng cache lạnh/nóng và thao tác đồng thời 1,4,10,20 người (mỗi mức thử hồ sơ khác nhau và cùng một hồ sơ); theo dõi thời gian chờ khóa, lỗi `BUSY`/`VERSION_CONFLICT`, thời gian lưu và quota Vercel/Google. Không dùng dữ liệu production để chạy load test.
8. Chỉ sau nghiệm thu mới quyết định triển khai production; cập nhật **backend trước frontend**. Nếu commit vào nhánh production đang nối Vercel, hệ thống có thể tự deploy.

## C. Tần suất đồng bộ và quota

Tab đang hiển thị: kiểm tra revision mỗi **90 giây**; khi quay lại tab, kiểm tra nếu lần gần nhất đã quá **30 giây**. Tab ẩn không kiểm tra định kỳ. 20 người cùng mở tab liên tục tương đương khoảng **800 lượt kiểm tra/giờ** chỉ riêng polling (20 × 3600/90), chưa tính thao tác người dùng; đây là phép tính lưu lượng, không phải quota thực đo.

Chỉ bật `HN_PERF_TEST=1` trong Script Properties/Vercel staging để đo khi có người phụ trách; tắt sau khi đo. Log không nên chứa dữ liệu cá nhân.

## D. Quản lý phiên tệp

Hàm `cleanupExpiredUploads_()` tự được gọi có giới hạn khi bắt đầu phiên upload mới; nếu cần dọn thủ công, chạy `donDepPhienTaiTepHocNghe()` trực tiếp trong Apps Script Editor bằng tài khoản quản trị. Hàm chỉ dọn các Script Properties bắt đầu bằng `UPLOAD_` đã hết hạn; không xóa cấu hình hay tệp Drive còn liên kết.

## E. Hoàn tác

1. Ngừng phát hành thay đổi mới; giữ bản sao nhật ký, không xóa dữ liệu thật.
2. Đưa **frontend V4** về nhánh triển khai trước và đưa **Apps Script Code.gs V4** trở lại deployment tương ứng. Cả hai phải trở về cùng bản, tránh frontend V5 gọi `record_fresh` trên backend cũ.
3. Xác nhận đăng nhập, ba vai trò, lưu hồ sơ, Excel và tệp. Dữ liệu đã ghi thành công trong lúc V5 chạy vẫn giữ nguyên trên Sheets; không tự động quay lui dữ liệu bằng cách thay mã nguồn.
4. Nếu cần khôi phục dữ liệu, chỉ thực hiện từ bản sao lưu sau khi đối soát nhật ký và có người chịu trách nhiệm phê duyệt.

**Lưu ý:** Kiểm thử Node/Chromium chỉ xác nhận trên mock; không thay cho nghiệm thu staging/production.

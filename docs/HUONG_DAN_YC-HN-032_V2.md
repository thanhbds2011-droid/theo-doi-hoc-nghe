# HƯỚNG DẪN TRIỂN KHAI VÀ HOÀN TÁC – YC-HN-032 V2

**Nền:** v1.2.25-RC → **Bản thử:** v1.2.26-RC.  
**Dành cho:** Người quản trị triển khai, không gửi cho tài khoản cơ sở đào tạo.

## 1. Trước khi cập nhật

1. Sao lưu repository/ZIP của phiên bản đang chạy, lưu lại **mã commit GitHub** hiện hành. Nếu website đang dùng bản khác v1.2.25-RC, cần đối chiếu các khác biệt trước khi ghi đè.
2. Sao lưu đầy đủ `Code.gs` đang triển khai và ghi lại **Apps Script deployment ID/URL phiên bản** đang phục vụ website. Đảm bảo cấu hình `SPREADSHEET_ID`, `GOOGLE_CLIENT_ID`, `API_SHARED_SECRET`, `APP_ORIGIN` hiện tại được bảo toàn.
3. Không chạy `setupDatabase`, `chuyenSangTiengViet`, hoặc bất kỳ hàm nâng cấp Sheet nào: YC-HN-032 **không đổi schema**.
4. Chuẩn bị môi trường staging với tối thiểu: Trường A hai nghề, Trường B ba nghề, một nghề dùng chung, một nghề ngừng sử dụng nhưng còn quyết định, một nghề chưa có quyết định; tài khoản thử ADMIN/NHAN_VIEN/CO_SO_DAO_TAO.

## 2. Triển khai staging

1. Cập nhật **toàn bộ** `apps-script/Code.gs` bằng tệp đi kèm trong ZIP hoặc bản `.gs` độc lập. Không chỉ dán một hàm nhỏ; tránh sai khác phiên bản giữa frontend/backend.
2. Tạo **phiên bản Apps Script Web App mới** và xác nhận Vercel staging đang trỏ đúng deployment URL. Không tự thay Script Properties hoặc dữ liệu thật.
3. Cập nhật frontend `public/app.js` và `public/index.html` (cùng `package.json` nếu triển khai từ toàn repository). Giữ nguyên cấu hình môi trường Vercel của staging.
4. Mở lại staging, nhấn Ctrl+F5, xác nhận chân trang hiển thị **v1.2.26-RC** và kiểm tra đăng nhập cả ba vai trò.
5. Trong từng menu Tổng quan, Hồ sơ, Báo cáo: ADMIN/NHAN_VIEN chọn A thấy đúng nghề A; chọn B thấy nghề B; chọn Tất cả thấy hợp các nghề có quyết định. Kiểm tra A–Z, mục Tất cả nghề đứng đầu.
6. Chọn một nghề chung giữa A và B rồi đổi trường: nghề được giữ. Chọn nghề chỉ có A rồi đổi B: về Tất cả nghề. Năm, khoảng ngày, từ khóa, tình trạng giữ nguyên. Chỉ đổi cơ sở không tải lại bảng/biểu đồ.
7. Đăng nhập tài khoản A/B: không xem được nghề hoặc hồ sơ trường khác; ADMIN và NHAN_VIEN giữ các quyền đã CHỐT. Thử trực tiếp gọi API sai trường (chỉ trên staging) để xác minh backend vẫn chặn.
8. Thêm quyết định nghề mới, sửa/chuyển trường/nghề, xóa hồ sơ cuối cùng của một nghề; chờ chu kỳ đồng bộ hoặc kiểm tra lại để xác nhận bộ lọc cập nhật mà không đổi dữ liệu báo cáo ngoài dự kiến.
9. Đối chiếu Tổng quan, Báo cáo, in và bốn mẫu Excel; thử các bộ lọc, xung đột ghi và các tình trạng học nghề.
10. Theo dõi log đọc Sheet/quota và độ trễ thực; chỉ kết luận chịu tải 10–20 người sau khi chạy thử trên môi trường đại diện, không suy từ các bài mock.

## 3. Triển khai production khi đã nghiệm thu

1. Xác nhận bản backup và cửa sổ triển khai; thông báo người dùng về việc tải lại trang.
2. Triển khai **Apps Script mới trước**, frontend mới sau; việc trộn frontend mới với backend cũ có thể khiến dropdown nghề ADMIN/NHAN_VIEN không có dữ liệu.
3. Nếu GitHub tự triển khai Vercel khi commit, kiểm tra đúng nhánh/đích và chỉ commit sau khi chuẩn bị backend; không xuất hoặc đăng dữ liệu mẫu của staging.
4. Kiểm tra lại ba vai trò và cả ba menu ngay sau phát hành.

## 4. Hoàn tác

1. Tạm dừng các thay đổi hồ sơ trong khi chuyển phiên bản.
2. Hoàn tác **cả frontend và Apps Script** về bản v1.2.25-RC đã sao lưu; xác nhận gateway đúng deployment URL và tải mới trang.
3. Kiểm tra đăng nhập, quyền, danh sách nghề, số liệu báo cáo và xuất Excel sau hoàn tác.
4. Không xóa dữ liệu Sheets hay các khóa revision chỉ vì hoàn tác mã. Các quyết định mới được nhập trong thời gian chạy bản mới vẫn ở nguyên bảng dữ liệu.

## 5. Lưu ý kỹ thuật

- Không có tệp `api/rpc.js`, CSS hoặc module xuất Excel cần sửa.
- ADMIN/NHAN_VIEN chỉ nhận bản đồ mã nghề theo trường, không nhận bản ghi hồ sơ trong bản đồ này. CO_SO_DAO_TAO không nhận map toàn Trung tâm.
- Thay đổi trực tiếp trong Google Sheets ngoài ứng dụng có thể không phát tín hiệu revision; danh mục không bắt buộc tự làm mới ngay.
- Đồng bộ hiện có tính chất **gần thời gian thực**, không phải thông báo tức thì.

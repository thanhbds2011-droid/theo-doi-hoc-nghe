# Hướng dẫn nâng cấp Theo dõi học nghề – v1.1.6-RC

**Phạm vi:** YC-HN-010 (xóa hồ sơ không tải lại toàn trang) và YC-HN-011 (đủ 25 cột hồ sơ theo Excel chuẩn). **Chưa tự triển khai production**; hướng dẫn này dành cho chủ hệ thống.

## Điều quan trọng trước khi cập nhật

- Sao lưu ZIP GitHub đang chạy, Apps Script `Code.gs`, và toàn bộ Google Sheets `CSDL_THEO_DOI_HOC_NGHE` bằng **Tệp → Tạo bản sao**. Giữ bản sao trong thư mục chỉ quản trị có quyền.
- Không chia sẻ danh sách người học hoặc số sổ BHXH/CMND qua đường dẫn công khai; **không** đưa file Excel dữ liệu thực tế vào repository GitHub.
- Nâng cấp Apps Script **và Google Sheets trước khi** đưa frontend mới vào vận hành. Backend cũ chưa biết 15 trường mới; frontend mới không tương thích khi chưa nâng cấp đủ.
- Không đổi hoặc xóa bất kỳ cột nào trong 25 cột cũ. Không chạy thủ công `setupDatabase()` hoặc `chuyenSangTiengViet()` để thay cho bước mở rộng dưới đây.

## Bước 1: Cập nhật Apps Script

1. Trong Google Apps Script `THEO_DOI_HOC_NGHE_API`, sao lưu Code.gs đang sử dụng.
2. Dán **nguyên file** `THEO_DOI_HOC_NGHE_Code_YC-HN-010_011_v1.1.6-RC.gs` (hoặc `apps-script/Code.gs` trong ZIP) vào dự án; lưu nhưng **chưa tạo deployment Web App mới**.
3. Từ danh sách hàm Apps Script, chạy `kiemTraNangCapHoSoYC011`. Phải thấy hiện có **25 cột**, dự kiến **40 cột**. Nếu nhận lỗi khác cấu trúc, dừng và kiểm tra lại với bản sao lưu.
4. Chạy `nangCapHoSoYC011` **một lần** bằng quyền chủ Spreadsheet. Hàm sẽ tạo **bản sao Google Sheets trên Drive** trước khi mở rộng thêm 15 cột từ **Z đến AN**. Xem đường dẫn sao lưu trong Nhật ký thực thi.
5. Chạy lại `kiemTraNangCapHoSoYC011`: kết quả `daNangCap=true`, `soCotSauNangCap=40`. Xác minh 25 cột A:Y và tất cả các dòng dữ liệu cũ giữ nguyên.
6. Vào **Triển khai → Quản lý phiên triển khai → Chỉnh sửa → Phiên bản mới → Triển khai**. Giữ nguyên URL Web App đã đặt trong `GAS_WEB_APP_URL` nếu chỉnh deployment hiện tại.

**Lưu ý:** Hàm nâng cấp có thể chạy lại mà không tạo cột trùng; nếu đã đủ 40 cột thì sẽ không sửa dữ liệu. Nếu chương trình dừng vì thiếu quyền sao lưu, không tiếp tục triển khai frontend.

## Bước 2: Cập nhật GitHub và Vercel

1. Tải ZIP và giải nén, thay thế mã nguồn theo đúng cấu trúc repository. **Không** đẩy ZIP thành một tệp vào GitHub.
2. Tải lên GitHub và chờ Vercel triển khai. Kiểm tra môi trường Vercel vẫn có `GOOGLE_CLIENT_ID`, `GAS_WEB_APP_URL`, `API_SHARED_SECRET`, và các cấu hình liên quan; tuyệt đối không đưa giá trị bí mật vào GitHub.
3. Khi mở website, chân menu phải hiển thị **v1.1.6-RC**. Nếu vẫn phiên bản cũ, xóa cache trình duyệt của website và kiểm tra deployment tương ứng.

## Bước 3: Kiểm tra nghiệp vụ

1. Dùng tài khoản Admin tạo một hồ sơ **thử nghiệm** với đủ các trường mới. Kiểm tra trong Sheets các cột Z:AN lưu đúng thông tin.
2. Mở lại hồ sơ thử nghiệm → Sửa một trường → Lưu → Mở lại: các trường khác không được mất; kiểm tra Chi tiết.
3. Mở Hồ sơ học nghề → **Nhập Excel → Tải mẫu Excel**. Mẫu có **25 cột A:Y** và hai hàng tiêu đề (M–N là thời gian đào tạo).
4. Thử nhập tệp nhỏ 2–5 hồ sơ giả và chạy **Kiểm tra dữ liệu**. Nếu đủ điều kiện mới chọn **Xác nhận nhập**. Các hồ sơ nhập Excel mặc định Chưa xác nhận.
5. Thử file dữ liệu thật trên **môi trường thử nghiệm riêng**, không đưa hàng nghìn hồ sơ vào production trước khi kiểm tra trùng/danh mục và phê duyệt nhập. Bộ đọc đã kiểm tra file Excel người dùng cung cấp, nhận diện **2.326 dòng hồ sơ** và bỏ qua các hàng lẻ cuối; **điều đó không đồng nghĩa 2.326 hồ sơ đủ điều kiện ghi**.
6. Thử Xóa một hồ sơ giả: chỉ bản ghi đó biến mất sau xác nhận của máy chủ, bảng không nháy “Đang tải hồ sơ”; sau đó mở lại trang xác nhận không còn hồ sơ đã xóa. Số quyết định xóa vẫn bị giữ để kiểm tra trùng.
7. Bấm **Xuất Excel** tại trang Hồ sơ: tệp phải mở được, có đúng 25 cột và 2 hàng tiêu đề. Định dạng ngày `dd/mm/yyyy`, số BHXH/CMND/điện thoại được ghi dạng chuỗi.
8. Thử quyền Nhân viên: chỉ xem/xuất hồ sơ thuộc phạm vi của mình. Admin nhìn toàn bộ.

## Kế hoạch nhập 2.326 dòng an toàn

- Có thể tải **một** file 2.326 dòng lên website; frontend tự chia thành **59 đợt** (58 đợt x 40, một đợt cuối x 6). Mỗi đợt được xác nhận riêng.
- Bộ kiểm tra dữ liệu sẽ phát hiện dòng trùng quyết định, sai ngày tháng, thiếu nghề/cơ sở hoặc danh mục chưa được khai báo. **Không** tự tạo mới danh mục, không ghi đè hồ sơ hiện có.
- Tải **báo cáo lỗi** nếu có dòng chưa hợp lệ; chỉnh file và nhập bổ sung sau. Hệ thống kiểm tra lại trùng trên server dưới LockService.
- Admin nhập thì hồ sơ do Admin tạo; chưa có cơ chế giao phân công cho nhân viên trong phiên bản này.

## Khôi phục (rollback)

- Trước khi có bản ghi sử dụng 15 cột mới: có thể khôi phục code Apps Script/Vercel cũ và dùng bản sao Google Sheets trước nâng cấp.
- **Nếu đã nhập/sửa hồ sơ có dữ liệu ở 15 cột mới, KHÔNG được khôi phục bản Sheets cũ hoặc chạy backend 25 cột trên dữ liệu đó mà không xuất/sao lưu và đối soát dữ liệu phát sinh sau nâng cấp.** Ưu tiên giữ bản v1.1.6 và sửa lỗi tại phiên bản mới.
- Khôi phục Vercel deployment trước từ giao diện Vercel và Apps Script trước nếu cần, nhưng chỉ sau khi đã xác định backend/database tương thích.

## Giới hạn đã biết

- Kiểm thử mã nguồn và trình duyệt offline không chứng minh được tốc độ Apps Script/GSheets production. Xóa không tải lại toàn trang **sau khi server xác nhận**, nhưng thời gian ghi trên mạng/Sheets vẫn phụ thuộc thực tế.
- Khi xóa một dòng trong trang phân trang, có thể tạm hiển thị 19/20 dòng; danh sách sẽ được đối soát khi mở lại hoặc chuyển trang.
- File Excel có công thức trong **cột STT** được đọc bằng giá trị đã tính sẵn. Công thức trong cột nghiệp vụ sẽ bị từ chối; không thực thi macro.
- Export XLSX dùng kiểu văn bản cho dữ liệu, để giữ số 0 đầu ở quyết định và giấy tờ. Các trường chưa có dữ liệu có thể để trống.

# HƯỚNG DẪN CẬP NHẬT THEO DÕI HỌC NGHỀ v1.1.6-RC

## 1. Phạm vi
- YC-HN-010: Xóa mềm một hồ sơ chỉ cập nhật một dòng ở bảng sau khi server xác nhận; không dựng lại toàn trang, trừ trường hợp trang đang xem trở thành không hợp lệ.
- YC-HN-011: Đầy đủ 25 cột nghiệp vụ theo danh sách học nghề gốc; 15 trường bổ sung ở cuối tab `Hồ sơ học nghề`, nâng từ 25 lên 40 cột; giữ nguyên 6 tab khác, tổng 94 cột. Biểu mẫu Thêm/Sửa, Chi tiết và xuất Excel có đủ trường. Nhập một file tối đa 3.000 dòng qua các đợt kiểm tra/ghi nhỏ.
- Không thay đổi quyền: Admin xem hồ sơ toàn hệ thống, nhân viên xem hồ sơ của mình; xóa mềm giữ lịch sử/số quyết định.

## 2. Trước khi cập nhật – bắt buộc
1. Lưu bản sao code Apps Script đang chạy, bộ mã GitHub/Vercel và toàn bộ Google Sheets hiện tại. Ghi lại deployment/version đang phục vụ website.
2. Chỉ thao tác khi có quyền quản trị tương ứng; không gửi URL, khóa bí mật hoặc dữ liệu cá nhân cho người khác.
3. Dùng một bản Google Sheets THỬ NGHIỆM trước. Không thử nhập 2.326 hồ sơ trên dữ liệu production.

## 3. Thứ tự cập nhật an toàn
1. Thay **toàn bộ** file `Code.gs` trong dự án Apps Script bằng `apps-script/Code.gs` v1.1.6-RC; **chưa** bấm Deploy phiên bản mới.
2. Chọn hàm **`nangCapDuLieuHocNgheYC011`** trong Apps Script editor, bấm **Run/Chạy**, cấp quyền Drive/Sheets nếu hợp lệ. Hàm kiểm tra chính xác 25 tiêu đề cũ; tạo bản sao lưu Spreadsheet trên Drive **trước khi** thêm 15 tiêu đề. Nếu tiêu đề cũ không khớp, hàm từ chối sửa.
3. Mở tab **Hồ sơ học nghề** và kiểm tra: 25 cột cũ A:Y giữ nguyên, 15 cột mới Z:AO; tổng **40 cột**. Chạy lại hàm không được thêm cột lần nữa.
4. Kiểm tra bản sao lưu được ghi trong **Execution log** của Apps Script.
5. Apps Script **Deploy → Manage deployments → Edit → New version → Deploy**, giữ nguyên Web App URL (và thông số phân quyền), chỉ sau khi Sheet đúng cấu trúc.
6. Giải nén ZIP mới rồi cập nhật chính xác cấu trúc source GitHub; Vercel deploy như quy trình hiện tại. Không đưa file ZIP thành một file đơn trên GitHub.
7. Đăng nhập website thử nghiệm bằng tài khoản Admin, thêm 1 hồ sơ giả, bổ sung BHXH/quyết định TCTN/địa chỉ, lưu → sửa → mở Chi tiết → Xuất Excel → xóa. Đối chiếu giá trị trên Sheets và KPI.
8. Tại Hồ sơ học nghề chọn **Nhập Excel**, thử với file 1–2 dòng không trùng trước; sau đó thử 100 và 2.326 dòng ở môi trường thử nghiệm. **Đừng chọn xác nhận nhập file gốc vào production trước khi đã đối soát danh mục và số quyết định.**

## 4. Lưu ý về file Excel
- File mẫu nằm ở `public/templates/MAU_NHAP_HO_SO_HOC_NGHE.xlsx`. Hai dòng đầu là tiêu đề, nhóm M:N là `Thời gian đào tạo`.
- Đọc file gốc đã xác nhận được 2.326 hồ sơ/25 cột qua trình duyệt mô phỏng. Những dòng ghi chú rời không phải hồ sơ không được tạo bản ghi.
- Các ô công thức chỉ được **đọc giá trị đã lưu trong file**, không thực thi công thức. Nếu chưa có giá trị, cần lưu lại workbook trong Excel rồi nhập lại.
- Các số BHXH, CMND, điện thoại, số quyết định phải là chuỗi văn bản để giữ số 0 đầu; nếu file gốc đã mất số 0 thì không thể tự suy đoán khôi phục.
- File có các cột chưa nhận diện: khóa xác nhận nhập để tránh bỏ dữ liệu không chủ ý.
- Các mục nghề/cơ sở phải khớp danh mục đang sử dụng; hồ sơ trùng quyết định/năm được bỏ qua theo quy tắc hiện hành.
- File có 2.326 dòng: hệ thống gửi các phần nhỏ; quá trình kiểm tra và ghi thực tế có thể kéo dài theo giới hạn Apps Script/Google Sheets và mạng.

## 5. Khôi phục / rollback
Nếu lỗi xảy ra **trước** khi Deploy: dừng, không triển khai GitHub; khôi phục Code.gs cũ. Nếu đã thêm 15 cột, chỉ phục hồi từ bản sao lưu đầy đủ được tạo bởi hàm di trú sau khi đối chiếu không có ghi mới hợp lệ. Không xóa các cột thủ công trên bảng đang có dữ liệu mới.
Nếu lỗi sau khi cập nhật website: chuyển Vercel/GitHub về bản trước đồng bộ với Apps Script cũ **và** bản Sheets tương ứng; lưu ý tránh mất các bản ghi tạo sau nâng cấp. Tránh chỉ rollback một phần hệ thống.

## 6. Phạm vi kiểm thử
- Offline: cú pháp JS/Apps Script, 75/75 bài kiểm thử tự động, Chromium đọc file gốc 2.326 hồ sơ và tạo XLSX hợp lệ. Đây **không** phải kiểm thử Google Sheets/Drive/Vercel production.
- Production: phải thực hiện thử giao dịch ghi thật, dữ liệu phân quyền và tệp thực tế trước khi bàn giao cho nhân viên.

# HƯỚNG DẪN CẬP NHẬT VÀ SỬ DỤNG – YC-HN-009 (v1.1.5-RC)

## 1. Giới hạn và quyết định nghiệp vụ

- Đây là **dự án Theo dõi học nghề**, không dùng Firebase/Firestore.
- Giữ nguyên 7 tab / 79 cột của Google Sheets hiện có; **không phải chạy lại thiết lập cơ sở dữ liệu** khi 7 tab đã hợp lệ.
- Chức năng **Nhập Excel** xuất hiện tại **Hồ sơ học nghề**, **chỉ Quản trị viên** được sử dụng.
- Mỗi file: **1–1.200 dòng**, định dạng `.xlsx`, tối đa **6 MB**; server xử lý tối đa **40 hồ sơ/lượt**.
- Hệ thống **không tự sinh số quyết định**; số quyết định HTHN phải có sẵn trong file.
- Dữ liệu **chưa xác minh tình trạng học** mặc định `Chưa xác nhận`. Các hồ sơ tạo thủ công giữ mặc định `Đã tham gia` như hiện hành.
- Hồ sơ do **Admin nhập Excel** được ghi đúng `TAO_BOI` là **email Admin**. **Chưa có chức năng phân công hồ sơ cho nhân viên** trong phiên bản này, vì cơ chế giao quyền và thay đổi cấu trúc dữ liệu chưa được duyệt. Nhân viên vẫn chỉ thấy hồ sơ do mình tạo. Không sửa trường người tạo để giả lập giao việc.
- **Các cột ngoài phạm vi 25 cột hiện có không được nhập/lưu**. Hệ thống hiển thị tên những cột này trước khi bấm xác nhận; bạn phải giữ file gốc làm tài liệu đối chiếu. Đặc biệt không tự ý đưa số BHXH, quyết định trợ cấp thất nghiệp, số tiền trợ cấp vào Ghi chú. Muốn bổ sung dữ liệu trên cần phê duyệt phương án mở rộng riêng.

## 2. Các cột được nhập

| Trong file Excel | Dữ liệu trên website |
|---|---|
| Họ và tên | Họ tên người học |
| Ngày sinh / Năm sinh (nếu có ngày đủ) | Ngày sinh |
| Giới tính | Giới tính |
| Số QĐ HTHN | Số quyết định |
| Ngày ban hành QĐ HTHN | Ngày quyết định |
| Cơ sở đào tạo nghề | Cơ sở đào tạo |
| Nghề đăng ký | Nghề đào tạo |
| Thời gian đào tạo – Từ ngày | Ngày bắt đầu |
| Thời gian đào tạo – Đến ngày | Ngày kết thúc dự kiến |

Tên cơ sở và nghề trong Excel phải trùng với danh mục **Đang sử dụng** trên website sau chuẩn hóa chữ hoa/thường, dấu tiếng Việt và khoảng trắng. Nếu một dòng có tên khác, hãy tạo/chỉnh danh mục trước hoặc sửa file, không tự ghép hai cơ sở khác nhau.

**Lưu ý:** Nếu “Năm sinh” chỉ là con số `1985`, chưa có ngày/tháng đầy đủ thì sẽ báo lỗi; không tự bịa `01/01/1985`.

## 3. Cách nhập cho người quản trị (không cần mở Google Sheets)

1. Đăng nhập tài khoản **Quản trị viên**, mở **Hồ sơ học nghề → Nhập Excel**.
2. Bạn có thể **tải file mẫu** để nhập mới, hoặc sử dụng Excel đang có nếu tên cột được nhận diện. File có **hai hàng tiêu đề**, ví dụ “Thời gian đào tạo / Từ ngày – Đến ngày”, cũng được hỗ trợ.
3. Chọn file `.xlsx`. Hệ thống đọc file trên trình duyệt, **không tải nguyên file chứa thông tin cá nhân lên dịch vụ ngoài**.
4. Bấm **Kiểm tra dữ liệu**. Xem số dòng hợp lệ, trùng, lỗi; xem trước 10 dòng; đọc danh sách các cột **không được lưu**.
5. Nếu có dòng trùng/lỗi, bấm **Tải danh sách lỗi/trùng** để biết số dòng cần xử lý. Chỉ các dòng hợp lệ được nhập; các dòng khác bị bỏ qua.
6. Đánh dấu đã xem các giới hạn, sau đó bấm **Xác nhận nhập**. Ứng dụng nhập từng đợt 40 dòng và hiển thị tiến độ.
7. Sau khi nhập, tìm hồ sơ theo số quyết định và mở **Tình trạng** để cập nhật Đang học, Không tham gia hoặc Bỏ học theo thực tế.

**Không bấm nhập một lần nữa khi chưa chắc lượt nhập trước đã kết thúc.** Nếu kết nối gián đoạn, quay lại danh sách hồ sơ rồi kiểm tra; nhập lại cùng file sẽ bỏ qua số quyết định đã tồn tại, kể cả hồ sơ đã xóa mềm.

## 4. Cập nhật hệ thống – dành cho chủ hệ thống

**Không cập nhật trực tiếp production nếu chưa sao lưu và sắp xếp thời gian kiểm thử.**

1. Sao lưu bản hiện tại của GitHub/Vercel, lưu lại toàn bộ Code.gs. Sao lưu Google Sheets trước khi chạy thử nhập dữ liệu.
2. Mở Apps Script **THEO_DOI_HOC_NGHE_API**. Thay **toàn bộ** nội dung Code.gs bằng file phiên bản YC-HN-009. Không chỉnh Script Properties hiện có như `API_SHARED_SECRET`, `GOOGLE_CLIENT_ID`, `SPREADSHEET_ID`, `APP_ORIGIN`.
3. **Deploy → Manage deployments → Edit → New version → Deploy**, giữ nguyên URL Web App trong Vercel.
4. Giải nén bộ source ZIP, cập nhật repository **thanhbds2011-droid/theo-doi-hoc-nghe** (không tải nguyên ZIP như một file website). Vercel sẽ xây dựng phiên bản frontend mới theo thiết lập của bạn.
5. Mở website ở chế độ thử nghiệm, đăng nhập Admin và kiểm tra **Nhập Excel**. Nên thử file 3–5 dòng dữ liệu **giả**, không dùng thông tin cá nhân thật, trước khi dùng file 1.000 dòng.
6. Kiểm tra trùng quyết định, tình trạng, KPI, quyền nhân viên, danh mục và quay lại các phân hệ trước khi bàn giao.

## 5. Khôi phục nếu gặp lỗi

- Dừng thao tác nhập, lưu thông báo lỗi, số dòng đã thực sự được tạo và mã thời điểm triển khai.
- Khôi phục Code.gs/Web App deployment trước đó cùng frontend phiên bản cũ.
- Không xóa thủ công các hồ sơ nhập một phần khi chưa đối soát số quyết định và nhật ký. Nếu cần khôi phục Google Sheets từ bản sao lưu, phải cân nhắc dữ liệu được tạo sau thời điểm sao lưu.
- Nếu việc nhập thất bại ở một đợt, kiểm tra danh sách trước khi bấm lại. Nhập lại cùng file không được tạo trùng số quyết định.

## 6. Điều chưa được nghiệm thu production

- Kiểm thử tự động: **73/73 đạt** trong bộ mô phỏng; trong đó có test nhập 1.000 dòng theo 25 đợt.
- Kiểm tra Chromium: đọc header hai hàng và giao diện file Excel ở môi trường mock đạt.
- **Chưa thực hiện** ghi 1.000 hồ sơ, xử lý Excel gốc hay kiểm thử hạn mức/time quota trên Google Sheets/Vercel/App Script production thật. Số lượng 1.200 là giới hạn kiểm soát đầu vào đã thiết kế, không phải cam kết tốc độ trên mọi tài khoản.
- File người dùng gửi là **ảnh chụp Excel**, không phải workbook gốc; có thể cần bổ sung bí danh cột nếu file thật khác ảnh.

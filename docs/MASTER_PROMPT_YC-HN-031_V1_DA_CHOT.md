# MASTER PROMPT – YC-HN-031 V1 – ĐÃ CHỐT VÀ ĐÃ TRIỂN KHAI MÃ NGUỒN

**Dự án:** THEO DÕI HỌC NGHỀ  
**Bản nền:** v1.2.24-RC – YC-HN-030 V1  
**Bản giao:** v1.2.25-RC  
**Trạng thái:** ĐÃ CHỐT – ĐÃ LẬP TRÌNH – ĐÃ KIỂM THỬ CỤC BỘ; CHƯA TRIỂN KHAI PRODUCTION.

## 1. Mục tiêu

Tài khoản `CO_SO_DAO_TAO` chỉ nhận danh mục *Nghề đào tạo* có ít nhất một quyết định/hồ sơ chưa bị xóa thuộc `TRUONG_ID` được cấp. Danh mục nghề được suy ra từ bảng Hồ sơ học nghề, không phân công nghề thủ công, không thêm tab hoặc cột.

Nguồn kiểm tra: `TRUONG_ID`, `NGHE_ID`, `TRANG_THAI_HO_SO` từ bảng Hồ sơ học nghề; tên/ trạng thái nghề được đối chiếu trong Danh mục nghề. Không dùng năm quyết định hoặc tình trạng tham gia để lập danh sách nghề cơ sở. Nghề đã *Ngừng sử dụng* nhưng còn quyết định hợp lệ tiếp tục hiện trong bộ lọc; nghề danh mục đã xóa không hiện.

## 2. Quyền truy cập

- `ADMIN`, `NHAN_VIEN`: danh mục nghề chung như cũ, không thay đổi quyền.
- `CO_SO_DAO_TAO`: chỉ nhận nghề có quyết định của cơ sở trong phản hồi đăng nhập `bootstrap`. Không tiết lộ danh mục nghề các trường khác trong phản hồi này. Backend vẫn kiểm tra `TRUONG_ID`, `VAI_TRO` và quyền khi đọc hồ sơ/báo cáo.
- Ba menu Tổng quan – Hồ sơ học nghề – Báo cáo sử dụng đồng nhất danh sách nghề đã được backend cho phép.

## 3. Tự cập nhật khi hồ sơ thay đổi

Tự làm mới khi Quản trị viên tạo quyết định, nhập Excel, thay đổi trường/nghề của hồ sơ hoặc xóa hồ sơ. Khi hồ sơ cuối của một nghề bị xóa hoặc chuyển đi, nghề đó bị loại khỏi danh sách trường cũ. Nghề chung giữa nhiều cơ sở tiếp tục hiện với những cơ sở còn quyết định.

Cơ chế sử dụng mã phiên bản quan hệ `SCHOOL_TRADES` cho cache index nội bộ và mã riêng `SCHOOL_TRADES_<TRUONG_ID>` dành cho từng cơ sở. Việc thay đổi tình trạng học nghề không làm đổi mã phiên bản danh sách nghề. Không gửi mã nghề của trường khác đến frontend cơ sở.

Tài khoản cơ sở kiểm tra phiên bản theo chu kỳ có sẵn khoảng 90 giây khi tab đang mở, hoặc khi quay lại tab theo quy trình hiện tại. Đây là đồng bộ **gần thời gian thực**, không phải đẩy tức thì. Mặc định không quét lại bảng hồ sơ khi chỉ mở dropdown nghề; index lưu cache và được dựng lại sau thay đổi cấu trúc hồ sơ.

## 4. Giao diện và trạng thái lọc

Không thiết kế lại các menu. Giữ nguyên các bộ lọc khác và bộ lọc nghề đang hợp lệ. Nếu nghề đang chọn không còn thuộc cơ sở: xóa riêng giá trị nghề đã chọn, hiển thị lựa chọn Tất cả nghề, thông báo bằng tiếng Việt và cập nhật vùng dữ liệu liên quan. Không tự làm mới toàn bộ ứng dụng hay thay đổi vai trò.

## 5. Những phần bắt buộc giữ nguyên

- Toàn bộ quyền `ADMIN`, `NHAN_VIEN`, `CO_SO_DAO_TAO`, cơ chế Google đăng nhập, `PHIEN_BAN`, khóa ghi, chống trùng quyết định, nhật ký.
- Bảng Google Sheets và 7 tab vật lý, bố cục Tổng quan, Hồ sơ, Báo cáo.
- Các chỉ tiêu Đã tham gia, Bỏ học, Hoàn thành khóa học và lọc ngày.
- Toàn bộ bốn mẫu Excel và công thức tính; giữ nguyên `public/xlsx-export.js`.
- Bộ giao diện chức danh V4, giới hạn tháng bỏ học 1–6, các cải tiến YC-HN-029/030.

## 6. Các tệp triển khai

`apps-script/Code.gs`, `public/app.js`, `public/index.html` (chỉ mã phiên bản/tải lại script), `package.json` (phiên bản), các bài kiểm thử và tài liệu. `api/rpc.js`, `api/config.js`, `public/styles.css`, `public/xlsx-export.js`, Google Sheets không thay đổi.

## 7. Điều kiện nghiệm thu

- Trường A có 2 nghề chỉ thấy 2 nghề; Trường B có 3 nghề chỉ thấy 3 nghề.
- Thêm quyết định nghề thứ ba cho A → A thấy nghề mới sau đồng bộ, B không phải tải lại danh mục nghề.
- Sửa trường/nghề, xóa hồ sơ cuối cùng → các danh sách nghề được cập nhật tương ứng.
- Nghề dùng chung hiển thị tại mọi cơ sở đang có quyết định, không trùng nghề trong danh sách.
- Ba menu đồng nhất; lọc hiện hành hợp lệ được giữ, giá trị lỗi thời được đặt lại an toàn.
- ADMIN/NHAN_VIEN giữ nguyên danh mục toàn Trung tâm. Không rò rỉ dữ liệu từ trường khác.
- Toàn bộ bài kiểm thử cũ và mới đạt. Kiểm thử production/staging với dữ liệu thực là bước riêng trước triển khai.

## 8. Giới hạn xác minh

Đã kiểm thử Node.js, JavaScript và Chromium giả lập với dữ liệu mẫu; **chưa xác minh Apps Script/Google Sheets production** và chưa đo đầy đủ chi phí quota trên môi trường thật. Nếu dữ liệu được sửa trực tiếp trong Google Sheets bên ngoài ứng dụng, mã phiên bản nội bộ có thể không tự thay đổi; phải dùng quy trình quản trị để đồng bộ.

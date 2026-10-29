# MASTER PROMPT – YC-HN-033 V4 – ĐÃ CHỐT

**Dự án:** THEO DÕI HỌC NGHỀ  
**Phiên bản nền:** v1.2.26-RC (YC-HN-032 V2)  
**Phiên bản mã nguồn sau chỉnh sửa:** v1.2.27-RC  
**Trạng thái:** ĐÃ CHỐT – ĐÃ SỬA MÃ NGUỒN – CHỜ NGHIỆM THU STAGING.

## I. Kế thừa
Giữ toàn bộ nghiệp vụ YC-HN-001 đến YC-HN-032 và các quy định phân quyền, xác thực, nhật ký, kiểm tra trùng quyết định, PHIEN_BAN và khóa ghi. Không thay đổi kiến trúc GitHub + Vercel + Apps Script + Google Sheets + Google Drive; không thêm tab hoặc cột.

## II. Tháng bỏ học 1–6
- Khi chọn **Bỏ học**, sáu tháng 1, 2, 3, 4, 5, 6 luôn được phép chọn; tháng 7+ không có trong lựa chọn mới.
- Không lấy `SO_THANG_HO_TRO`, `NGAY_BAT_DAU` hoặc `NGAY_KET_THUC_DU_KIEN` để khóa tháng. Quyết định có hỗ trợ `3,5` vẫn chọn tháng 1–6.
- Lưu giá trị `KY:1` tới `KY:6`; tiếp tục bắt buộc lý do hợp lệ và quyền cập nhật.
- Dữ liệu lịch sử `KY:7+` hoặc ngày ISO được bảo toàn khi người dùng không thay đổi kỳ cũ; không cho tạo mới giá trị đó.
- Áp dụng thống nhất tại thêm/sửa hồ sơ, cập nhật tình trạng và nhập cập nhật từ Excel. Không sửa số tháng hỗ trợ và thời gian đào tạo gốc.

## III. Bộ lọc Cơ sở đào tạo
- Trong ba menu Tổng quan, Hồ sơ học nghề, Báo cáo, lựa chọn Cơ sở đào tạo có “Tất cả cơ sở” ở đầu, các tên còn lại A–Z theo tiếng Việt; tên trùng có mã làm tiêu chí phụ.
- Không thay đổi danh mục vật lý, danh sách trong biểu mẫu quản trị hoặc phân quyền cơ sở.
- Bộ lọc Nghề đào tạo vẫn căn cứ quyết định theo cơ sở và A–Z như YC-HN-032.

## IV. Xuất Excel ma trận theo cơ sở / nghề
- Chỉ hai mẫu “Báo cáo theo cơ sở đào tạo” và “Báo cáo theo nghề đào tạo”: sắp giảm dần theo cột “Tổng số Quyết định đã ban hành” trong báo cáo được lọc.
- Bằng nhau: so tên tiếng Việt A–Z, nếu vẫn bằng: mã định danh.
- Tính lại STT từ 1, giữ dòng Tổng cộng ở cuối, giữ cả nhóm có số quyết định bằng 0 nhưng có hoàn thành dự kiến trong kỳ.
- Giữ số liệu, nguyên tắc Đã tham gia bao gồm Bỏ học và quy tắc Hoàn thành dự kiến. Không thay mẫu danh sách Excel 25 cột, mẫu Tổng hợp chỉ tiêu/số lượng, hoặc module `xlsx-export.js`.
- Chỉ sắp trong bản sao tại bước xuất Excel, không đổi thứ tự báo cáo website.

## V. Lỗi sau khi cập nhật tình trạng từ Excel
- Sửa chỗ gọi `.catch()` trên `navigate()` vốn không trả về Promise.
- Sau khi backend xác nhận, tiếp tục hiện kết quả dòng đã cập nhật/chưa cập nhật, không tự gửi lại thao tác ghi.
- Đánh dấu dữ liệu đã cũ; khi người dùng đóng hộp kết quả thì làm mới khu vực danh sách đã xem, giữ bộ lọc.
- Thông báo lỗi JavaScript không hiển thị nguyên văn tiếng Anh; không tuyên bố lưu thành công nếu máy chủ chưa xác nhận.
- Giữ quy tắc nhập hàng loạt chỉ cập nhật hồ sơ `CHO_XAC_NHAN` (Chưa xác nhận).

## VI. Kiểm thử và triển khai
- Kiểm thử Node.js, Chromium (lựa chọn tháng, lọc nghề, phiên bản, phân quyền, xung đột).
- Kiểm tra định dạng và các mẫu Excel bằng mã nguồn, không sửa `xlsx-export.js`.
- Trước khi đưa vào sử dụng đại trà, kiểm thử Apps Script + Google Sheets trên staging bằng dữ liệu đại diện và thử đồng thời nhiều tài khoản; chưa có kết quả đo production hay chứng nhận 10–20 người dùng liên tục.
- Không tự deploy, không sửa dữ liệu thật. Giữ bản sao nền v1.2.26-RC để hoàn tác.

# CHANGELOG – YC-HN-029 V5 – v1.2.23-RC

## Đã thực hiện

- Sửa lỗi dữ liệu cũ trong snapshot khi nhận revision mới; giữ bộ lọc và chỉ làm mới vùng cần thiết.
- Kiểm tra thay đổi tại tab hiển thị mỗi 90 giây và khi tab trở lại sau khoảng 30 giây; không polling trong tab ẩn.
- Tránh đua lệnh giữa verifyPermission và chuyển menu; giữ dữ liệu đang nhập trong biểu mẫu.
- `VERSION_CONFLICT`: trả mã lỗi nội bộ cho nhánh giao diện, hiển thị so sánh giá trị mới/draft, không tự ghi đè, buộc xác nhận thử lưu lại. Backend thêm thao tác `record_fresh` xác thực và lọc theo quyền.
- Tối ưu đọc từng hồ sơ: từ quét đủ 40 cột của toàn bảng thành quét cột mã ID và đọc một hàng; vẫn kiểm tra lại ID sau khi đọc.
- Tối ưu sửa một hồ sơ: kiểm số QĐ trùng qua một cột khóa, đọc dòng gốc riêng; giữ xác thực người học khi nhập mã người học đã có.
- Giảm tác động upload Drive lên giao dịch khác: phần chuyển 256 KiB và khởi tạo phiên API Drive ngoài khóa chung; xác nhận cuối trong khóa. Một lượt upload không thể chuyển hai chunk đồng thời.
- Dọn Script Properties UPLOAD_ hết hạn; kết quả hoàn tất giữ tối đa năm phút để hỗ trợ retry.
- Việt hóa mô tả một số mã nhập tình trạng và nhật ký, sửa câu lỗi báo cáo.
- Kế thừa toàn bộ thiết kế nhãn chức danh YC-HN-029 V4, không thêm menu hoặc quyền.

## Không thay đổi

Bảy tab và cấu trúc Google Sheets; `api/rpc.js`, `api/config.js`, `public/xlsx-export.js`; công thức KPI; ngày dự kiến hoàn thành; quyền và bốn mẫu Excel.

## Giới hạn

Đồng bộ gần thời gian thực, không phải thời gian thực tức thì. Chưa đo staging/production 4/10/20 người, không có số liệu chính thức về độ trễ và quota. Phần ghi tình trạng vẫn phải qua khóa chung; xuất báo cáo vẫn cần snapshot khi revision thay đổi.

# Changelog và kiểm thử – v1.1.6-RC

## Thay đổi

- YC-HN-010: `record_delete` được xác nhận ở Apps Script trước khi loại đúng dòng `HO_SO_ID` khỏi bảng frontend. Không làm trống trang, không tự gọi `afterMutation('records')` sau xóa; invalidation có chọn lọc cho danh sách đã cache, Dashboard/Báo cáo.
- YC-HN-011: giữ 25 cột cũ của tab Hồ sơ; bổ sung 15 trường nghiệp vụ vào cuối tab (40 cột), tổng bảy tab 94 cột. Hàm kiểm tra/sao lưu/nâng cấp có thể chạy lại an toàn.
- Thêm/Sửa/Chi tiết hồ sơ: hiển thị đầy đủ các trường nghiệp vụ Excel gốc. Giữ nguyên chức năng trạng thái học, bỏ học, tệp đính kèm.
- Nhập Excel gốc: nhận 25 cột A:Y và hai hàng tiêu đề; cho phép công thức STT với giá trị cache (không thực thi); đọc ngày Excel và chữ; nâng lên tối đa 3.000 dòng. Đợt ghi 40 hồ sơ vẫn được kiểm tra trùng dưới khóa server.
- Xuất Excel XLSX: 25 cột và tiêu đề hai hàng, hỗ trợ Unicode tiếng Việt; không gửi dữ liệu đến bên thứ ba. Báo cáo vẫn có lệnh Xuất CSV.
- Cập nhật version hiển thị thành v1.1.6-RC.

## Kiểm thử (offline, không ghi production)

- `npm test`: bộ kiểm thử Node.js gồm nghiệp vụ cũ + kiểm tra schema 40 cột, dữ liệu mở rộng, nhập >2.000 hồ sơ, xóa không reload ở source.
- `npm run check`: cú pháp `public/app.js`, Vercel API.
- Chromium: `tests/browser_yc009_mock.py` và `tests/browser_yc011_mock.py`, xác minh thao tác giao diện với dữ liệu mô phỏng.
- Chromium trên file Excel thật **chỉ đọc tại máy thử nghiệm**, không lưu người học vào source/ZIP: nhận 2.326 hồ sơ với 25 cột, 44 hàng dữ liệu cuối không thành hồ sơ. Điều này mới kiểm tra đọc/ánh xạ, không xác nhận đủ điều kiện nhập trên Sheets thật.
- Mẫu XLSX và tệp XLSX xuất thử: mở được bằng bộ phân tích XLSX; kiểm tra cấu trúc ZIP và tiêu đề gộp.

## Chưa kiểm thử ở production

- Thực tế Web App Apps Script/Google Sheets/Google Drive, phân quyền nhiều người dùng trong hệ thống thật.
- Tốc độ giao dịch xóa trên mạng, việc đối soát hàng nghìn dòng sau khi nhập thật và các trường chưa đủ danh mục.
- Không có thay đổi production/GitHub thực tế nào trong lần bàn giao này.

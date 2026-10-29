# CHANGELOG – YC-HN-033 V4 / v1.2.27-RC

## Các tệp sản phẩm thay đổi
1. `public/app.js`: tháng bỏ học luôn 1–6; bộ lọc Cơ sở đào tạo A–Z tiếng Việt; sắp bản sao của hai mẫu báo cáo Excel theo số quyết định giảm dần; sửa lỗi `.catch` khi cập nhật tình trạng bằng Excel; đánh dấu trang cần làm mới sau khi đóng hộp kết quả; thông báo an toàn khi phát hiện lỗi JavaScript.
2. `apps-script/Code.gs`: chỉ kiểm tra tháng bỏ học mới thuộc `KY:1`–`KY:6`, không phụ thuộc số tháng hỗ trợ; vẫn cho giữ dữ liệu lịch sử, quyền ghi, PHIEN_BAN, khóa và nhật ký.
3. `public/index.html`: đồng bộ nhãn/đường dẫn tải phiên bản mới.
4. `package.json`: đồng bộ phiên bản.

## Các tệp KHÔNG thay đổi
- `api/rpc.js`, `api/config.js`, `public/styles.css`, `public/xlsx-export.js`, sơ đồ bảy tab Google Sheets và quy trình xác thực.

## Kiểm thử cập nhật
- Cập nhật bài kiểm thử cũ từng yêu cầu khóa tháng theo Số tháng hỗ trợ.
- Thêm `tests/yc033-regression.test.js` và tình huống backend mới trong `tests/backend.test.js`.
- Tổng cộng **215/215 bài Node.js đạt**.
- Chromium đạt trên các tình huống tháng 1–6, lọc nghề YC-HN-031/032 và xung đột hai máy YC-HN-029.

## Giới hạn xác minh
Chưa triển khai hoặc đo trực tiếp trên production. Không khẳng định mọi dữ liệu thực tế và 10–20 phiên ghi đồng thời không phát sinh lỗi nếu chưa có kiểm thử staging.

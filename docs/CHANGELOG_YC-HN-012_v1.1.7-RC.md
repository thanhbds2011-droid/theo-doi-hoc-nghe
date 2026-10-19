# CHANGELOG VÀ KIỂM THỬ — YC-HN-012 (v1.1.7-RC)

Ngày bàn giao: 19/10/2026. Baseline: v1.1.6-RC.

## Những thay đổi

1. **Số tháng hỗ trợ:** tách quy tắc kiểm tra. Các giá trị như `2`, `2,5`, `3,5` được chấp nhận và lưu thành chuỗi thập phân chuẩn, không làm tròn; hiển thị số tháng theo cách Việt Nam.
2. **Mức hỗ trợ/tháng:** `1.500.000`, `1,500,000`, `1500000`, `666.666`, `1.500.000,50` được nhận diện đúng; giá trị chuẩn lưu trong Sheets; không tự đặt trần hoặc thay mức hưởng theo quyết định.
3. **Nhập hồ sơ Excel:** không coi tên cơ sở/nghề mới là lỗi mặc định. Bước Kiểm tra hiển thị danh mục cần tạo (tên và số lượng). Sau xác nhận, Apps Script kiểm tra lại, sinh ID/mã theo từng loại và liên kết hồ sơ.
4. **Lý do bỏ học:** giữ nguyên mẫu Excel chuẩn **25 cột** (không có trường này); nếu người nhập chủ động bổ sung các cột tùy chọn `Tình trạng học nghề`, `Ngày bỏ học`, `Lý do bỏ học` và khai báo **Bỏ học** hợp lệ, hệ thống tạo lý do chưa tồn tại và liên kết hồ sơ. Không tự tạo lý do nếu file không chứa dữ liệu.
5. **Danh mục trùng:** tái sử dụng ID của danh mục ACTIVE; không tạo trùng giữa nhiều dòng hoặc giữa các lượt ghi; không tự kích hoạt danh mục INACTIVE/DELETED hoặc gộp hai tên gần giống khác dấu. Hồ sơ lỗi/trùng không làm phát sinh danh mục mới.
6. **Báo cáo:** số tháng và số tiền được trình bày theo kiểu Việt Nam khi xuất Excel. Giao diện Thêm/Sửa/Chi tiết hiển thị nhất quán.
7. **Không thay đổi schema:** vẫn 7 tab và 94 cột sau nâng cấp YC-HN-011. Không thay đổi API proxy, kiến trúc, phân quyền, KPI, xóa mềm, 25 cột file mẫu hoặc giao diện YC-HN-006.

## Kiểm thử

- `npm run check`: đạt kiểm tra cú pháp JS.
- `npm test`: **87/87** bài kiểm thử tự động đạt. Gồm kiểm tra dữ liệu tháng/tiền, thêm/sửa, phát hiện danh mục mới, tạo một danh mục cho nhiều hồ sơ, chống trùng giữa các đợt, danh mục INACTIVE, phân biệt tên khác dấu, lý do bỏ học tùy chọn và kiểm thử hồi quy.
- Chromium (bộ đọc Excel gốc): nhận đủ **2.326** dòng hồ sơ và toàn bộ cột có thể ánh xạ, không bỏ sót cột; **không ghi vào database thật**.
- Chưa nghiệm thu giao dịch thật qua Google Apps Script/Sheets/Drive production, chưa đo hiệu năng với dữ liệu thật hoặc kiểm thử tình huống mạng gián đoạn của môi trường production.

## Rủi ro cần nghiệm thu

- Google Sheets không cung cấp giao dịch đa tab: nếu tạo danh mục thành công nhưng ghi hồ sơ bị gián đoạn, danh mục mới có thể vẫn tồn tại. Trước khi thử nhập lại, kiểm tra kết quả từng đợt; hệ thống có kiểm tra trùng và tái sử dụng danh mục đã tồn tại. Không được tự xóa các bản ghi để 'quay lui'.
- Nếu cùng tên nhưng một mục ACTIVE và mục cũ INACTIVE/DELETED, hệ thống chặn để quản trị viên đối chiếu thay vì tự gộp.
- Một tệp có 2.326 dòng chia thành nhiều đợt. Khi kết nối thất bại, cần đối soát số dòng đã nhập và nhập lại chỉ phần chưa xác nhận; chống trùng quyết định luôn ở backend.

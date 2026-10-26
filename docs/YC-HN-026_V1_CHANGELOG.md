# CHANGELOG — YC-HN-026 V1 · v1.2.19-RC

**Nguồn nâng cấp:** `v1.2.18-RC`. **Phạm vi:** Cho phép Gmail cơ sở đào tạo xuất hồ sơ/báo cáo đúng trường; bổ sung cột Hoàn thành khóa học và sửa tên Tổng số Quyết định trong hai ma trận Excel.

## Mã nguồn thay đổi

1. `apps-script/Code.gs`: thêm `REPORT_EXPORT` vào quyền vai trò `CO_SO_DAO_TAO` và giá trị `safeUser_`. Không cấp quyền tạo/sửa/xóa, import, quản lý người dùng. `reportMatrix_` bỏ kiểm tra role chỉ-ADMIN nhưng bắt buộc `user._has('REPORT_EXPORT')`. Tính ma trận từ `visibleRecords_(user)` đã giới hạn trường được cấp và tái sử dụng snapshot để lọc hai trục ngày độc lập. Bổ sung `courseEndParticipated` và `customStatusCounts` theo từng trường/nghề; giữ hàng chỉ có hoàn thành trong kỳ dù không có quyết định trong kỳ.
2. `public/app.js`: tài khoản trường có nút Xuất Excel ở Hồ sơ và Báo cáo; nút In báo cáo cũ được giữ. Hai mẫu ma trận xuất thêm Hoàn thành khóa học, đổi thành Tổng số Quyết định đã ban hành; tạo cột riêng cho tình trạng tùy chỉnh có số liệu, không cộng trùng vào Tình trạng khác; dòng Tổng cộng tính cả cột mới. Thêm tên cơ sở được gán trên bản in báo cáo của trường; cập nhật URL import module XLSX theo phiên bản để tránh cache JS cũ.
3. `public/xlsx-export.js`: **chỉ đổi hàm `buildReportXlsx` cho báo cáo ma trận**: ngưỡng cột tối đa 64 (trước 12), điều chỉnh chiều cao tiêu đề theo độ dài nội dung. Bộ xuất **Danh sách học nghề 25 cột** từ đầu file đến trước khối `YC-HN-013` nguyên từng byte (kiểm bằng SHA-256).
4. `public/styles.css`: chỉ thêm định dạng print-only của tên trường trên báo cáo in.
5. `public/index.html`, `package.json`: nâng nhãn frontend lên `v1.2.19-RC`.
6. `tests/`: cập nhật test quyền xuất trước đây cố định chỉ ADMIN và thêm kiểm thử quyền theo trường, trạng thái tùy chỉnh, hai căn cứ ngày, file XLSX 9/16/32 cột, UI Chromium và in báo cáo.

## Nguyên tắc thống kê

- **Tổng số Quyết định đã ban hành** và các cột tình trạng gốc tính trên **Ngày ban hành quyết định** thuộc bộ lọc.
- **Hoàn thành khóa học** tính trên **Thời gian đào tạo – Đến ngày**, chỉ `DA_THAM_GIA`, không `DA_BO_HOC`, có ngày kết thúc dự kiến hợp lệ, đồng thời đáp ứng bộ lọc năm QĐ/trường/nghề/quyền. Đây **không phải** xác nhận tốt nghiệp thực tế.
- Hàng chỉ có Hoàn thành trong kỳ có thể có Tổng QĐ = 0 và Hoàn thành > 0. Không cộng Hoàn thành vào Tổng QĐ, cũng không ép Hoàn thành = Đã tham gia − Bỏ học trong kỳ.
- Thứ tự ma trận: STT | Tên cơ sở/nghề | Tổng số Quyết định đã ban hành | Đã tham gia học | Bỏ học | Không tham gia | Không nhận Quyết định | Chưa xác nhận | Hoàn thành khóa học | [Các tình trạng tùy chỉnh có hồ sơ] | [Tình trạng khác chưa phân loại, nếu có].

## Giới hạn / lưu ý

- Không sửa Google Sheets, không thêm cột hoặc tab; không sửa quyền cập nhật tình trạng cơ sở.
- Không triển khai lên hệ thống production; chưa đo thử Apps Script trực tiếp với dữ liệu thật.
- File ma trận có tối đa 64 cột. Nếu có trên 55 cột tình trạng tùy chỉnh, bộ xuất báo lỗi rõ thay vì âm thầm bỏ cột; cần thống nhất biểu mẫu phân trang cột khi phát sinh mức hiếm gặp này.
- Tài khoản Nhân viên giữ giao diện xuất báo cáo như phiên bản trước, không tự mở rộng quyền ở trang Báo cáo.

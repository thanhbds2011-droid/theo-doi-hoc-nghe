# CHANGELOG – YC-HN-030 V1

**Nền:** YC-HN-029 V5 (`v1.2.23-RC`) → **`v1.2.24-RC`**  
**Phạm vi:** Tháng bỏ học 1–6, tên cơ sở hiển thị đầy đủ, Excel Báo cáo tổng hợp gọn 3 cột.

## Mã nguồn đã thay đổi

- `public/app.js`: danh sách kỳ bỏ học chỉ 1–6; giới hạn chọn theo số tháng hỗ trợ hợp lệ; bỏ câu hướng dẫn cũ; chọn tháng 1 hợp lệ; lựa chọn tháng cũ 7+ vẫn có thể hiển thị riêng ở hồ sơ lịch sử để giữ nguyên dữ liệu, không cho tạo mới. Danh sách cập nhật hàng loạt dùng 1–6. Báo cáo tổng hợp thêm STT (đánh từ 1) và bật kiểu xuất gọn.
- `apps-script/Code.gs`: xác thực tháng bỏ học 1–6, không vượt số tháng hỗ trợ; giữ nguyên kiểm tra quyền, khóa ghi, PHIEN_BAN, nhật ký. Dữ liệu lịch sử đã lưu KY:7+ hoặc ngày cũ có thể giữ nguyên nếu không chỉnh sửa; không cho tạo mới kỳ ngoài 1–6.
- `public/styles.css`: ở tài khoản Cơ sở đào tạo, họ tên và nhãn tên cơ sở được tự xuống dòng, không cắt bằng dấu ba chấm; nút Đăng xuất giữ nguyên.
- `public/xlsx-export.js`: thêm nhánh riêng `summaryCompact` cho mẫu Báo cáo tổng hợp, cột STT / Chỉ tiêu / Số lượng; chiều rộng lần lượt 5.3 / 21.2 / 15.9; tiêu đề gộp B1:C1, căn giữa STT và số, wrap nội dung chỉ tiêu, chiều cao dòng tự giãn. **Không thay đổi** thuật toán xuất danh sách 25 cột hoặc mẫu ma trận theo cơ sở/nghề.
- `public/index.html`, `package.json`: cập nhật version và phiên bản tải JS để tránh dùng lại mã xuất Excel cũ.
- `tests/`: sửa test cũ có điều kiện tháng 2–12/version cũ, thêm ba bài xác nhận mẫu tổng hợp 3 cột và mã nguồn, thêm kiểm thử Chromium 1–6.

## Không thay đổi

Vai trò và phân quyền; các cấu trúc Google Sheets; điều kiện thống kê Hoàn thành khóa học, Đã tham gia và Bỏ học; dữ liệu có sẵn; 25 cột danh sách; ba mẫu Excel khác; cách đăng nhập, cache và đồng bộ giữa các máy của V5.

## Cần nghiệm thu

Bản sửa chỉ được thử tại môi trường cục bộ/giả lập; chưa kết nối Google Sheets hoặc Vercel production. Nên kiểm tra hồ sơ có kỳ cũ 7–12, hồ sơ có hỗ trợ 1–6, mẫu in Excel/WPS, vai trò Cơ sở đào tạo với tên rất dài trước khi deploy chính thức.

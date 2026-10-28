# KẾT QUẢ KIỂM THỬ – YC-HN-030 V1

- `npm test`: **198/198 PASS**.
- Cú pháp `public/app.js`, `public/xlsx-export.js`, `api/rpc.js`: PASS.
- Chromium kiểm tra tháng 1–6 / hỗ trợ tháng lẻ / chọn lại khi thay đổi số tháng hỗ trợ: PASS.
- Chromium kiểm tra tên trường dài và nút Đăng xuất: PASS tại 650, 768, 1024, 1440, 1780 px. Không có overflow/tên bị cắt hoặc chồng nút.
- Chromium kiểm tra 7 chức danh V4 và phân quyền hiện hành: PASS.
- Chromium giả lập hai khách dùng xung đột V5: PASS.
- Mẫu Excel do `buildReportXlsx()` thực xuất: mở/đọc được qua `artifact_tool`; A1:C9 có STT, Chỉ tiêu và Số lượng; title ở B1, gộp B1:C1, width 5.3/21.2/15.9, dòng dài ht 44pt; số lượng lưu dưới dạng số.
- Không kiểm tra staging/production, không kiểm thử tải 10–20 người thật, không chứng nhận kết quả in của mọi bản Excel/WPS.

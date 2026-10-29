# CHANGELOG – YC-HN-032 V2 (v1.2.26-RC)

**Nguồn:** v1.2.25-RC → **Đích:** v1.2.26-RC.  
**Phạm vi:** YC-HN-032 V1 + V2 (CHỐT), không sửa dữ liệu Google Sheets.

## Mã nguồn

1. **Apps Script `Code.gs`**: Giữ `visibleSchoolTrades_()` để hạn chế nghề cho tài khoản CO_SO_DAO_TAO; thêm `schoolTradeScopeForUser_()` chỉ gửi bản đồ trường–nghề cho ADMIN/NHAN_VIEN. `schoolTradeRevision_()` trả revision toàn Trung tâm cho ADMIN/NHAN_VIEN và revision riêng từng trường cho CO_SO_DAO_TAO. `bootstrap_()` bổ sung thuộc tính `tradeScopeMap`. `permission_check` chỉ trả revision, không trả map chi tiết.
2. **Frontend `public/app.js`**: Thêm `filterTradeRows()`, `sortedFilterTrades()`, xử lý `change` cho select cơ sở ở ba form bộ lọc, đồng bộ chỉ mục khi `bootstrap` thay đổi; danh mục nghề ở biểu mẫu Thêm/Sửa vẫn lấy từ danh mục gốc.
3. **Cache**: Đổi cơ sở chỉ tính lựa chọn ở trình duyệt; không gửi request. Danh mục và chỉ mục chỉ làm mới khi revision tương ứng đổi; cập nhật tình trạng học thông thường không tăng revision quan hệ trường–nghề.
4. **Phiên bản**: `v1.2.26-RC`, `package.json` `1.2.26-rc.0`; cập nhật URL phiên bản của app và module xuất Excel (không đổi nội dung module Excel).
5. **Kiểm thử/tài liệu**: cập nhật các điều kiện kiểm thử cũ vốn ghi cứng số phiên bản hoặc giả định ADMIN luôn nhìn thấy toàn danh mục nghề chưa có quyết định; bổ sung bài test hành vi YC032 và kiểm thử Chromium nhiều vai trò.

## Không thay đổi

- Quyền và vai trò người dùng; hồ sơ, danh mục, nhật ký, Google Sheets và API gateway.
- Công thức Tổng quan, Báo cáo; in và 4 mẫu xuất Excel.
- CSS, bố cục, các ô bộ lọc khác, quyền Thêm/Sửa hồ sơ.
- Điều kiện giới hạn tháng bỏ học và các yêu cầu trước đây.

## Kiểm chứng

- `npm test`: 209/209 PASS.
- `npm run check`: PASS.
- Chromium giả lập: 6 kịch bản hồi quy, 1 kịch bản YC032 mới và 1 kịch bản YC031 đã cập nhật: PASS.
- Chưa chạy trực tiếp trên Apps Script/Sheets/Vercel production hoặc staging, chưa kiểm thử tải 10–20 người thật.

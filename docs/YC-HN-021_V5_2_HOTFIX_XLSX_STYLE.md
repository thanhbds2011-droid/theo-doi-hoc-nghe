# YC-HN-021 V5.2 — HOTFIX lỗi định dạng XLSX sau khi tải và lưu bằng phần mềm văn phòng

**Phiên bản frontend:** `v1.2.11-RC` (sửa lỗi từ v1.2.10-RC). **Không thay đổi API Apps Script, Google Sheets, dữ liệu hoặc các chức năng nghiệp vụ.**

## Kết quả đối chiếu chứng cứ

- File người dùng gửi `danh-sach-hoc-nghe-2026-10-21(1).xlsx` có vùng `A1:Y4`: 2 dòng tiêu đề và **2 dòng hồ sơ** (chỉ kết luận số dòng trong file, không kết luận do lọc hay thất thoát).
- `xl/styles.xml` trong file đã qua phần mềm văn phòng có 4 `cellXfs`; **style 0 bị rút xuống thành căn giữa dọc nhưng không khai báo center ngang, Wrap Text, viền**. Các ô thường A/D/E/F/H/... sử dụng style 0, gây mất căn giữa/Wrap Text.
- Metadata có `KSOProductBuildVer` (WPS Office) cùng mốc created/modified, và file dùng `sharedStrings.xml`. Đây **không phải bản XLSX thô đầu ra của `buildXlsx()`**, vì JS tạo `inlineStr`, không có metadata WPS. Chưa thể xác định việc thay style xảy ra khi tải xuống hay do lần mở và lưu trong WPS; hai khả năng được phân biệt, không suy đoán.
- Trong JS v1.2.10, **style 0 lại là style định dạng dữ liệu** (center/middle/wrap/border), dễ bị Excel/WPS xem là mặc định và chuẩn hóa lúc lưu.

## Sửa chữa

1. `public/xlsx-export.js`: đặt style 0 trung tính, chuyển tất cả ô dữ liệu sang các **style ID khác 0**, có căn lề/Wrap Text/viền riêng. Cột B/J/O/V/W = Left/Middle/Wrap. Mọi cột khác = Center/Middle/Wrap, ngoại trừ ô ngày dạng số thực dùng style date với Center/Middle. Cả hai hàng tiêu đề vẫn Center/Middle/Wrap.
2. `public/index.html` tải `/app.js?v=1.2.11-RC`, còn `public/app.js` tải `xlsx-export.js?v=1.2.11-RC`. Tránh sử dụng JS cache cũ tại cùng URL sau khi deploy.
3. Giữ nguyên thuật toán chiều cao dòng v1.2.10: tự tăng theo nội dung, gọn với dòng ít chữ; giữ 25 cột, ngày `dd/mm/yyyy`, Nam/Nữ, mã có số 0 ở đầu, mẫu báo cáo, chức năng khác.
4. `tests/yc021-v5_2-hotfix-wps.test.js`: kiểm thử riêng phong cách không đặt ở ID0, center/left/Wrap và URL versioned. Các bài hồi quy giữ nguyên nghiệp vụ, cập nhật chỉ style IDs tương ứng.

## Kiểm thử

- Node.js `npm test`: 148/148 đạt, bao gồm ba bài hotfix mới; `node --check` pass.
- Kiểm tra tệp XLSX mẫu mới theo Open XML: style 0 trung tính; mọi ô dữ liệu chỉ dùng style > 0; B/J/O/V/W Left/Middle/Wrap, các cột khác Center/Middle/Wrap; ngày kiểu Excel date, cột ngày `dd/mm/yyyy`.
- **Chưa kiểm thử ghi/lưu bằng WPS Office phiên bản trên máy người dùng**; không được gọi là lỗi sản phẩm WPS đã được chứng minh toàn diện. Cần nghiệm thu lần cuối bằng bản tải trực tiếp trên máy.

## Cách triển khai

1. Sao lưu hoặc giữ Vercel Production deployment hiện tại v1.2.10-RC để rollback.
2. Chỉ cập nhật **GitHub/Vercel frontend** bằng toàn bộ ZIP v1.2.11-RC, chọn đúng dự án/nhánh Production; chờ trạng thái Ready.
3. Website phải hiển thị `v1.2.11-RC` ở góc dưới trái; nhấn Ctrl+Shift+R. Nếu có DevTools, kiểm tra Network cho `/app.js?v=1.2.11-RC` và `/xlsx-export.js?v=1.2.11-RC` đều HTTP 200. Không cần thay Apps Script.
4. Lọc thử 2 hồ sơ, xuất Excel; từ thư mục Downloads **giữ bản XLSX nguyên gốc trước khi mở, chỉnh sửa hoặc Save trong WPS/Excel**. Kiểm tra căn lề trong Microsoft Excel/WPS; sau đó kiểm tra cả tình huống mở–lưu lại WPS.
5. Nếu còn sai, gửi cả bản tải nguyên gốc và bản đã lưu lại từ WPS để đối chiếu; hai file có thể khác nhau. Nếu deploy lỗi, rollback deployment frontend v1.2.10-RC mà không đụng Sheets.

**Giới hạn:** Không truy cập được Vercel Production từ môi trường phân tích, chưa xác minh bản website đang chạy hay cách WPS thực tế lưu trên máy. Không thay đổi Apps Script API.

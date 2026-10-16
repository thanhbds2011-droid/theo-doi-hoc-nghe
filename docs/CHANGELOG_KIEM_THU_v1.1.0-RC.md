# CHANGELOG & BÁO CÁO KIỂM THỬ – v1.1.0-RC (16/10/2026)

## Nội dung bàn giao

- **YC-HN-001 + 003:** giữ nguyên chức năng nhập danh mục hàng loạt qua Sheets (dành cho quản trị kỹ thuật), bổ sung nút nhập hàng loạt trên website; hai bước kiểm tra/xác nhận, tự sinh ID/mã trên server, không ghi trùng. Thêm/sửa danh mục không cần nhân viên tự điền mã.
- **YC-HN-002:** hệ thống thiết kế xanh navy/xanh dương nhạt, sáu KPI điểm nhấn khác nhau, banner chào mừng, biểu đồ sáu KPI dùng dữ liệu đã tải; đồng bộ căn lề, khung, biểu mẫu, phân quyền, nút, checkbox và modal trên các phân hệ.
- **YC-HN-003:** người dùng cuối thao tác website; **không hiển thị Google Sheets** trên bất cứ phân hệ hoặc chân menu. Chỉ hiển thị dòng “Phần mềm nội bộ”.
- **YC-HN-004:** nâng giới hạn lên 10 MiB (10.485.760 byte) cho tệp PDF, JPEG, PNG; truyền 256 KiB/phần qua Google Drive resumable upload và Range download; không gửi toàn bộ file một lượt qua proxy. Thêm quyền `RECORD_DELETE` + xóa mềm theo Phương án A (nhân viên chỉ xóa hồ sơ do mình tạo; Admin có thể xóa mọi hồ sơ); lọc hồ sơ đã xóa khỏi KPI/danh sách/báo cáo; giữ khóa số quyết định, nhật ký, kiểm soát phiên bản. Chuẩn hóa thông báo lỗi tiếng Việt.

## File cập nhật

- `public/index.html`: footer, phiên bản.
- `public/app.js`: biểu mẫu, nhập hàng loạt, xóa mềm, upload/download theo phần, thông báo lỗi, dashboard.
- `public/styles.css`: UI responsive, lưới thẻ, modal, checkbox, biểu đồ, căn chỉnh.
- `apps-script/Code.gs`: mới các action `catalog_bulk_check`, `catalog_bulk_import`, `record_delete`, `file_upload_begin`, `file_upload_chunk`, `file_upload_cancel`, `file_info`, `file_chunk`. Giữ các action hiện có, riêng `file_upload` cũ yêu cầu client mới để tránh vượt giới hạn payload.
- `apps-script/appsscript.json`: manifest tham chiếu khi cấp quyền Drive API.
- `api/config.js`: nhãn phiên bản.
- `package.json`, `README.md`: cập nhật phiên bản/hướng dẫn.
- `tests/backend.test.js`: bổ sung kiểm thử sinh mã, nhập hàng loạt, xóa A, upload/download phân phần và giới hạn kích thước.
- `docs/HUONG_DAN_CAP_NHAT_v1.1.0-RC.md`: triển khai, thử nghiệm và rollback.

## Kiểm thử đã thực hiện offline

- `npm test`: **32/32 bài đạt** (bộ hồi quy cũ 27 + 5 bài mới).
- `node --check public/app.js`, `node --check api/rpc.js`: đạt.
- Trình duyệt Chromium headless, mock xác thực và RPC: kiểm tra mở sáu phân hệ; sáu thẻ KPI 3 cột có cùng chiều rộng trên 1440×900; luồng kiểm tra/lưu danh mục hàng loạt; mở cửa sổ xác nhận xóa; xóa hồ sơ và cập nhật danh sách; không có chữ Google Sheets trong giao diện; không có exception JS.
- Đối với luồng 10 MiB: mô phỏng các phần tải và Range, so sánh dữ liệu gốc/tải về bằng buffer; kiểm tra từ chối 10 MiB + 1 byte.

## Chưa được xác minh

- Chưa có kiểm thử live Google OAuth, Apps Script Drive API và HTTP 308/206 trên Google Drive/Vercel thật.
- Chưa có kiểm thử end-to-end upload/down­load 10 MiB trên production; trình duyệt mới mock RPC, không dùng backend production.
- Chưa xác minh quyền và phản hồi lỗi khi có quota/throttling thực tế.
- Kiểm tra responsive ở nhiều kích cỡ khác nhau cần tiếp tục nghiệm thu trên thiết bị thật sau khi triển khai thử nghiệm.

**Không tuyên bố production đã nâng cấp hoặc chức năng 10 MB đã chạy thành công trên máy chủ thật.**

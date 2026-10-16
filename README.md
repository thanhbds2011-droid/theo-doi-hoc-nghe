# THEO DÕI HỌC NGHỀ — v1.1.0-RC

Phần mềm quản lý hồ sơ học nghề độc lập. **Người dùng cuối thao tác trên website**, không cần truy cập Google Sheets, GitHub, Apps Script hoặc Vercel Dashboard.

## Kiến trúc (không thay đổi)

HTML/CSS/JavaScript (giao diện) → Vercel API proxy (Google ID Token → HMAC) → Google Apps Script (nghiệp vụ/phân quyền) → Google Sheets (7 tab, 79 cột) và Google Drive (tệp đính kèm). Không có Firebase/Firestore.

## Đã bổ sung trong bản v1.1.0-RC

- Giao diện thống nhất: thanh menu, tiêu đề, sáu thẻ KPI có điểm nhấn màu, bố cục biểu mẫu, nút, checkbox, modal và điều chỉnh responsive.
- **Không xuất hiện chữ “Google Sheets” trên giao diện người dùng** (kể cả chân menu). Sheets chỉ là phần lưu trữ phía sau.
- Quản lý danh mục tại website; tự tạo mã khi thêm mới; không yêu cầu nhập mã kỹ thuật; nhập nhiều tên từ danh sách văn bản hoặc CSV/TXT một cột.
- Xóa mềm hồ sơ, theo phương án A: Admin xóa mọi hồ sơ; nhân viên chỉ được xóa hồ sơ do chính mình tạo **nếu được cấp quyền `RECORD_DELETE`**. Bảo toàn quyết định và lịch sử; hồ sơ xóa không còn trong KPI/báo cáo hoạt động.
- Tệp PDF/JPG/PNG tối đa 10 MiB (10.485.760 byte), qua Google Drive resumable upload, mỗi phần 256 KiB; tải xuống theo các phần. Không gửi toàn bộ tệp qua một yêu cầu Vercel.
- Thông báo lỗi người dùng cuối bằng tiếng Việt; mã lỗi kỹ thuật không hiển thị trực tiếp.
- Backend kiểm soát quyền; giữ cơ chế xác minh token Google/HMAC và kiểm soát phiên bản khi ghi.

## File chính

- `public/index.html`, `public/styles.css`, `public/app.js`: giao diện và thao tác trên website.
- `api/config.js`, `api/rpc.js`: Vercel API.
- `apps-script/Code.gs`: toàn bộ backend Apps Script.
- `apps-script/appsscript.json`: manifest tham chiếu khi cần cấp quyền Apps Script dùng Google Drive resumable upload.
- `tests/*.test.js`: kiểm thử mô phỏng backend/proxy.
- `docs/HUONG_DAN_CAP_NHAT_v1.1.0-RC.md`: hướng dẫn triển khai, kiểm thử và quay về bản cũ.
- `docs/CHANGELOG_KIEM_THU_v1.1.0-RC.md`: các thay đổi và phạm vi xác minh.

**Lưu ý:** Bản RC đã vượt qua kiểm thử offline và kiểm thử giao diện bằng dữ liệu mô phỏng. Chưa kết nối và xác minh triển khai production. Phải sao lưu và kiểm thử tệp 10 MB, quyền xóa thực tế trên môi trường thử nghiệm trước khi bàn giao cho người dùng cuối.

## Kiểm thử offline

```bash
npm install
npm test
```

Không đưa secret hoặc token vào GitHub. Biến `API_SHARED_SECRET` chỉ ở Vercel Environment Variables và Apps Script Script Properties.

> **MỚI NHẤT — v1.2.10-RC / YC-HN-021 V5.2**: Xuất Excel danh sách 25 cột đúng theo file mẫu đã nghiệm thu: B/J/O/V/W căn trái, các cột khác căn giữa; chiều cao hàng gọn và tự tăng khi Wrap Text. Hướng dẫn tại `docs/YC-HN-021_V5_2_HUONG_DAN_VA_KIEM_THU.md`. Không thay đổi nghiệp vụ hoặc dữ liệu trên Google Sheets.

# THEO DÕI HỌC NGHỀ — v1.2.9-RC (YC-HN-021 V5.1)

Bản nâng cấp frontend hiển thị bảng hồ sơ và định dạng Excel danh sách 25 cột; không thay đổi nghiệp vụ backend. Xem `docs/YC-HN-021_V5_1_v1.2.9-RC_CHANGELOG_VA_HUONG_DAN.md` để biết file sửa và cách triển khai. **Chưa triển khai production.**

---

# THEO DÕI HỌC NGHỀ — v1.2.6-RC (YC-HN-018 V3)

Bản nâng cấp sau v1.2.4-RC. Xem `docs/YC-HN-018_V3_v1.2.6-RC_CHANGELOG_VA_HUONG_DAN.md` để biết thay đổi, giới hạn kiểm thử và quy trình staging/rollback. **Chưa tự triển khai production**.

---

# THEO DÕI HỌC NGHỀ — v1.2.2-RC (YC-HN-015 V1)

Bản mã nguồn đã điều chỉnh theo YC-HN-013 V8.1; **chưa triển khai production**. Đọc `docs/YC-HN-013_V8_1_CHANGELOG_VA_HUONG_DAN.md` trước khi thay thế. 7 tab/94 cột dữ liệu và 25 cột danh sách Excel được giữ nguyên.

---

# THEO DÕI HỌC NGHỀ — v1.1.7-RC (YC-HN-012)

Cập nhật kiểm tra số tháng/mức hỗ trợ và bổ sung danh mục khi nhập Excel; giữ nguyên 7 tab/94 cột và mẫu 25 cột.

Xem `docs/HUONG_DAN_YC-HN-012_v1.1.7-RC.md` và `docs/CHANGELOG_YC-HN-012_v1.1.7-RC.md`. Không tự triển khai production.

---

# THEO DÕI HỌC NGHỀ – v1.1.4-RC (YC-HN-008)

Ứng dụng độc lập: GitHub/Vercel frontend + Google Identity Services + Vercel API + Apps Script + Google Sheets + Google Drive. Không Firebase/Firestore.

**Điểm mới:** dữ liệu Nhân viên theo người tạo; Xóa mềm tài khoản/danh mục; chỉ 3 menu cho Nhân viên; Danh mục không tải lại vô ích; XLSX nhiều cột; logo SVG thay HN; cookie phiên an toàn giữ đăng nhập qua F5 (tối đa 8 giờ).

Tài liệu triển khai: `docs/HUONG_DAN_CAP_NHAT_YC-HN-008_v1.1.4-RC.md`.

Changelog/kiểm thử: `docs/YC-HN-008_CHANGELOG_VA_KIEM_THU_v1.1.4-RC.md`.

File mẫu cho website: `public/templates/MAU_DANH_MUC_TRUONG.xlsx`, `MAU_DANH_MUC_NGHE.xlsx`, `MAU_DANH_MUC_LYDO.xlsx`.

Kiểm thử offline: `npm run check`, `npm test`, `python tests/browser_yc008_mock.py` (cần Chromium/Playwright được cài đặt để chạy bài test trình duyệt).

**Trạng thái:** chưa tự triển khai hoặc kiểm thử trên Google Sheets/Drive/Vercel production.

---

## Thông tin phiên bản cũ (lưu để đối chiếu)

# THEO DÕI HỌC NGHỀ — v1.1.3-RC (YC-HN-007)

Bản nâng cấp từ v1.1.2-RC, giữ giao diện YC-HN-006 và kiến trúc Google Sheets/Apps Script/Vercel.

Xem `docs/HUONG_DAN_CAP_NHAT_YC-HN-007_v1.1.3-RC.md` và `docs/YC-HN-007_CHANGELOG_VA_KIEM_THU_v1.1.3-RC.md` trước khi triển khai.

**Giao diện đã duyệt YC-HN-006 — v1.1.2-RC:** 6 KPI gọn trong một hàng trên desktop phù hợp, 6 icon SVG nhất quán, header tối giản, biểu đồ cơ sở/nghề từ phản hồi `overview` sẵn có. Backend v1.1.0-RC giữ nguyên.

# THEO DÕI HỌC NGHỀ — v1.1.1-RC (Giao diện YC-HN-005)

Phần mềm quản lý hồ sơ học nghề độc lập. **Người dùng cuối thao tác trên website**, không cần truy cập Google Sheets, GitHub, Apps Script hoặc Vercel Dashboard.

## Kiến trúc (không thay đổi)

HTML/CSS/JavaScript (giao diện) → Vercel API proxy (Google ID Token → HMAC) → Google Apps Script (nghiệp vụ/phân quyền) → Google Sheets (7 tab, 79 cột) và Google Drive (tệp đính kèm). Không có Firebase/Firestore.

## Giao diện YC-HN-005 (v1.1.1-RC)

- Trang Tổng quan: banner gọn, bộ lọc, sáu KPI bố trí 3 cột × 2 hàng, hai bảng theo cơ sở/nghề, **không có biểu đồ tổng hợp lặp lại**.
- Báo cáo: bảng rộng, số liệu căn phải; sửa nguyên nhân căn giữa do lớp chờ.
- Danh mục: tab và tìm kiếm trên cùng hàng; tìm kiếm trên danh sách hoạt động.
- Tài khoản và Nhật ký: bảng chiếm toàn bộ vùng nội dung, không giữ lớp chờ.
- Trường nhập, modal, font chữ, menu và nút thống nhất trên các trang.
- Phần giao diện không hiển thị Google Sheets.
- Chỉ đổi frontend; **Apps Script và Vercel API giữ nguyên từ v1.1.0-RC**, không cần thay dữ liệu Google Sheets.

## Những tính năng đã có trong backend v1.1.0-RC

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


## YC-HN-014 V4

Xem `docs/YC-HN-014_V4_CHANGELOG_KIEM_THU_TRIEN_KHAI.md` để biết các hạng mục nâng cấp, kiểm thử và triển khai/rollback.

### YC-HN-015 V1 (v1.2.2-RC)

Đã sửa việc ô tìm kiếm tạm biến mất khi lọc, áp dụng cache tương đương khi xóa từ khóa và lọc toàn bộ, thêm trạng thái cập nhật ngay cho nút tình trạng, tối ưu đọc duy nhất hàng hồ sơ khi cập nhật. Xem `docs/YC-HN-015_V1_v1.2.2-RC_CHANGELOG_VA_HUONG_DAN.md` trước khi triển khai. Chưa tự động migration hoặc cập nhật dữ liệu production.

### YC-HN-016 — Cập nhật tình trạng học nghề từ Excel (v1.2.3-RC)

Chỉ Quản trị viên sử dụng nút **Cập nhật tình trạng từ Excel** trong **Hồ sơ học nghề**. Chỉ các hồ sơ `CHO_XAC_NHAN` mới có thể thay đổi; trạng thái khác được bảo toàn. Dùng file Excel mẫu trong `public/templates/MAU_CAP_NHAT_TINH_TRANG.xlsx`, hoặc file 26 cột có X tại cột Tham gia học khi muốn chuyển sang Đã tham gia học. Chức năng này không tạo thêm hồ sơ mới. Xem `docs/YC-HN-016_V2_v1.2.3-RC_CHANGELOG_VA_HUONG_DAN.md` trước khi triển khai.

### YC-HN-017 V3 — tối ưu cache, menu, Sheets (v1.2.4-RC)

Giữ màn hình đã mở trong RAM khi chuyển menu 3–4 phút, nhưng kiểm tra lại quyền nếu hết thời hạn; bổ sung `permission_check` nhẹ của Apps Script. Snapshot Sheet được truy xuất theo lô qua CacheService `getAll`/`putAll`; tìm số quyết định dùng chỉ mục cache có kiểm chứng; đọc Nhật ký phân trang, và có tùy chọn `HN_PERF_TEST=1` để benchmark trên staging.

**Bắt buộc cập nhật Apps Script trước khi triển khai frontend mới**, không triển khai trực tiếp lên dữ liệu thật khi chưa test. Xem `docs/YC-HN-017_V3_v1.2.4-RC_CHANGELOG_VA_HUONG_DAN.md`.

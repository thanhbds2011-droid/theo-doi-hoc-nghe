# YC-HN-017 V3 — v1.2.4-RC — Hướng dẫn và bàn giao

## 1. Nguồn và giới hạn

Nâng cấp trên mã nguồn v1.2.3-RC (YC-HN-016 V2). Không sử dụng dữ liệu thật, không deploy; giữ nguyên 7 tab, 94 cột, Google Sheets/Apps Script/Vercel và mọi luồng nghiệp vụ ngoài phạm vi YC-HN-017.

**Chưa thể xác nhận tốc độ thực tế của 3.000–5.000 hồ sơ** khi chạy Google Sheets thật vì không kết nối tài khoản Apps Script/Sheet của đơn vị; kết quả mô phỏng hoặc đơn vị đếm cache **không đồng nghĩa** số giây xử lý thực tế.

## 2. Các tệp chỉnh sửa

- `public/app.js`: thời hạn dữ liệu trang điều hướng 300 giây; giữ DOM/filter/trang trong RAM; xác minh quyền chia sẻ một yêu cầu đang chạy; `permission_check` nhẹ; khi rev dữ liệu thay đổi làm mới khu vực có liên quan; giữ nguyên chức năng YC-HN-015 và import trạng thái YC-HN-016.
- `apps-script/Code.gs`: endpoint mới `permission_check` chỉ trả user đã xác minh, phiên bản phân quyền/dữ liệu/danh mục/trạng thái; cache snapshot Google bằng `getAll`/`putAll`; auth cache ngắn gắn USERS/CAT revision; index số quyết định ngắn hạn (60s), xác minh nội dung hàng khi sử dụng; `listAudit_` đọc 30 dòng đúng trang thay vì cả tab; đo perf tùy chọn trong Apps Script.
- `public/index.html`, `package.json`: phiên bản v1.2.4-RC.
- `tests/backend.test.js`: thêm API mô phỏng chính xác `getAll`/`putAll`/`remove` và các kiểm thử mới.
- `tests/ui-yc006.test.js`: đồng bộ kiểm tra phiên bản mới, không xóa bài kiểm thử.
- `tests/browser_yc017_mock.py`: Chromium kiểm thử 240 giây, thay đổi DATA revision và thu hồi quyền trường.

Không đổi `api/rpc.js`, `api/config.js`, templates, các tệp CSS, quyền các vai trò hoặc cột/hàng dữ liệu.

## 3. Thiết kế cache và bảo mật

- Khác nhau giữa **cache quyền** (tối đa 120 giây ở frontend; sau đó bắt buộc kiểm tra) và **cache dữ liệu trang** (giữ 300 giây trong RAM của tab còn mở). Quyền hết hạn **không hiển thị lại thông tin nhạy cảm** trước khi xác minh; chỉ hiện vùng "Đang kiểm tra quyền truy cập...".
- `permission_check` vẫn gọi `authorize_` của Apps Script trên mỗi request và kiểm tra scope trường. Chỉ tái dùng snapshot nếu cùng người/tài khoản/trường/permissionRevision/dataRevision và đủ điều kiện; khi quyền đổi sẽ logout, không lộ nội dung của trường cũ.
- Backend cache tài khoản tối đa 25 giây theo Google subject/email + `REV_USERS`, `REV_CAT`. **Đổi quyền bằng giao diện của ứng dụng** cập nhật `REV_USERS` và vô hiệu hóa cache cũ. Nếu người quản trị **sửa trực tiếp Google Sheets bên ngoài ứng dụng**, phải cập nhật `REV_USERS` qua quy trình kỹ thuật/đợi cache hết hạn; thay đổi trực tiếp không bảo đảm thu hồi tức thì trong cửa sổ 25 giây. Để thu hồi nhanh, sử dụng màn Quản lý tài khoản.
- Các cập nhật từ tài khoản khác được phát hiện lúc xác minh lại quyền/revision hoặc khi có refresh; **không cam kết đồng bộ tức thời** khi hai trình duyệt đang mở. Không đặt PII, access token hoặc kết quả hồ sơ vào localStorage/IndexedDB.
- Không sử dụng snapshot dòng/metadata như cơ sở dữ liệu bền vững. Chỉ mục quyết định là cache 60 giây; kiểm tra số quyết định trên hàng thật, nếu sai phải quét cột và khôi phục chỉ mục. Tất cả quyền vẫn được xác thực ở backend.

## 4. Kiểm thử thực hiện trong môi trường mô phỏng

- `npm run check`: syntax frontend/API đạt.
- `node --check` với bản sao `.js` của `Code.gs`: đạt.
- `npm test`: **116/116 đạt** — gồm 109 bài nền và 7 bài mới, kiểm thử mock Google Sheets, rev quyền, index sau thay đổi thứ tự hàng, nhật ký, CacheService.
- `python tests/browser_yc017_mock.py`: **đạt** cho ADMIN/NHAN_VIEN/CO_SO_DAO_TAO; chuyển lại menu sau mốc 240 giây chỉ 1 lần `permission_check`, không gọi `overview` dư khi DATA revision giữ nguyên; thay đổi revision làm refresh, thay đổi TRUONG_ID gây đăng xuất.
- Kiểm thử hồi quy `browser_yc014_mock.py`, `browser_yc015_mock.py`, `browser_yc016_real_excel.py`: đạt; mẫu cập nhật trạng thái Excel 1.324 dòng được kiểm thử trong trình duyệt với mock API, **không cập nhật dữ liệu thật**.

**Chưa kiểm thử trực tiếp:** thời gian GAS cold-start, số lượt dịch vụ Google, quota thực, xung đột khóa với người dùng đồng thời và hiệu năng 5.000 dòng trên bản sao Sheet thật. Phải thử trên staging.

## 5. Đo hiệu năng trên bản sao dữ liệu (không lộ thông tin hồ sơ)

1. Trên bản sao Script/Sheets dành cho staging, thêm Script Property `HN_PERF_TEST` = `1` (sau đo xóa hoặc đặt `0`).
2. Chạy theo từng vai trò: mở Tổng quan, Hồ sơ trang 1, trang 2; tìm số QĐ cụ thể; tìm tên có/không dấu; xóa từ khóa, lọc tất cả; cập nhật tình trạng **chỉ trên hồ sơ thử nghiệm**; xem nhật ký. Thực hiện ít nhất 3 lần cache lạnh và 3 lần cache nóng với dữ liệu khoảng 100, 1.000, 3.000, 5.000 hồ sơ nếu môi trường đáp ứng.
3. Google Apps Script **Executions** sẽ có log JSON `{name:"YC017",action,ok,totalMs,authMs,lockWaitMs,sheetReads,cells}`. `cells` là số ô ước tính từ các hàm đã instrument, **không phải toàn bộ request Google Sheets** (không đếm mọi nhánh và lần ghi). Không log email, BHXH, nội dung hồ sơ/token.
4. Chrome DevTools → Network → `/api/rpc`: đo thời gian request/cold-warm; `Performance` kiểm tra tốc độ phản hồi ngay sau click. Không gửi HAR có token hoặc nội dung cá nhân vào các hệ thống công khai.
5. Nếu thay quyền người dùng qua UI hoặc số liệu từ trường khác đang bị stale sau revalidation, **không phát hành** cho đến khi khắc phục.

## 6. Triển khai **staging trước**, thứ tự bắt buộc

1. Sao lưu GitHub production, Apps Script version/deployment hiện tại và Google Sheets hiện tại. Sao chép Sheet cho staging; không để bản thử trỏ tới Sheet thật.
2. Tạo hoặc cập nhật Apps Script staging với **toàn bộ `apps-script/Code.gs`** của ZIP, Script Properties gồm `SPREADSHEET_ID` staging, `GOOGLE_CLIENT_ID`, `API_SHARED_SECRET`, `APP_ORIGIN` phù hợp. Triển khai **New version** và lấy URL `/exec` chính xác. Không đưa khóa bí mật vào GitHub.
3. Tạo Vercel Preview/staging trỏ `GAS_WEB_APP_URL` tới URL `/exec` staging, cấu hình các biến phù hợp. Deploy frontend V1.2.4-RC sau khi backend staging đã hỗ trợ `permission_check`.
4. Kiểm thử: 3 loại tài khoản, quay menu sau 240 giây, đổi Gmail trường ABC → XYZ, lọc số 67/067/6267, phân trang, cập nhật tình trạng, bảng báo cáo, Excel, nhập trạng thái hàng loạt trên **bản sao**. Quan sát `permission_check` và `overview/records_list` trong Network.
5. Chỉ sau nghiệm thu đầy đủ mới triển khai production: **Apps Script New version trước, Vercel sau**. Không thay `SPREADSHEET_ID` hay cấu trúc Sheet production. Kiểm tra lại 2 vai trò ngay sau deploy.

**Không được** dán lại nhầm vào một Apps Script trùng tên chưa đối chiếu Deployment ID; kiểm tra URL Vercel `GAS_WEB_APP_URL` với deployment đang hoạt động trước khi thay.

## 7. Rollback

- Nếu lỗi phân quyền, query hoặc schema: ngừng dùng bản mới, rollback Vercel sang v1.2.3-RC, sau đó phục hồi deployment Apps Script sang phiên bản cũ (thứ tự ngược; trong thời gian rollback tránh thao tác ghi).
- Giữ bí mật các biến môi trường; không xóa Apps Script deployment cũ khi chưa xác nhận rollback an toàn.
- Mã mới không migration dữ liệu, không thêm cột/tab nên rollback mã nguồn không yêu cầu migration Sheets. Các bản ghi chỉnh sửa trong thời gian thử nghiệm phải được đối soát riêng nếu thử trên dữ liệu thật (không khuyến nghị).

## 8. Giới hạn còn giữ ngoài phạm vi

- Chưa xử lý yêu cầu độc lập “Tháng bỏ học 1–12” vì quy tắc nghiệp vụ chưa được chốt.
- Không tự mở quyền xuất Excel cho trường; không sửa lại danh mục/trạng thái mới, quy tắc mã QĐ, 7 tab/94 cột.
- Không chuyển Firebase/Supabase/PostgreSQL; không bảo đảm việc điều hướng *rời hẳn website trong cùng tab rồi tải lại* còn giữ RAM cũ.

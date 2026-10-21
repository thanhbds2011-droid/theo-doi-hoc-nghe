# YC-HN-022 V2 — ĐÃ CHỐT / mã nguồn v1.2.12-RC

**Cơ sở:** v1.2.11-RC đã được nghiệm thu phần xuất Excel. **Phạm vi:** cập nhật cục bộ hồ sơ sau lưu, giữ nguyên bộ lọc và đo riêng thời gian lưu thực tế. **Trạng thái:** đã triển khai mã nguồn & kiểm thử cục bộ; chưa deploy Vercel/Apps Script production, chưa benchmark trên Sheets thật.

## 1. Các thay đổi chính

| File | Phạm vi thay đổi |
| --- | --- |
| `public/app.js` | Tách `renderRecordRow()` để cả bảng và cập nhật một dòng dùng chung HTML, escaping, các icon/phân quyền. Trong `record-form`, gọi `record_save` với `preserveRecordList` rồi cập nhật chỉ đúng hàng từ `d.record` (gồm `PHIEN_BAN`). Không còn `afterMutation('records')` mặc định cho đường sửa hồ sơ. Trường hợp thay đổi sort/filter, tạo mới, thay đổi ngữ cảnh thì chỉ làm mới vùng kết quả. Vô hiệu hóa cache danh sách, báo cáo, tổng quan, nhật ký và chống response cũ ghi đè. Khóa nút khi lưu; toast chỉ sau ACK. Đo click→ACK và ACK→UI khi bật `window.HN_PERF_TEST=true` trong DevTools. |
| `public/index.html` | Hiển thị nhãn `v1.2.12-RC` và URL JS có version mới, tránh dùng bundle app cũ. |
| `api/rpc.js` | Thêm log độ trễ xác minh phiên, upstream GAS và tổng thời gian chỉ khi biến môi trường `HN_PERF_TEST=1`, chỉ cho `record_save`, không log payload/token/PII. Không đổi xác thực/cookie/HMAC hay cấu hình cache an toàn. |
| `apps-script/Code.gs` | Thêm mốc `fullSheetReadMs`, `validationMs`, `rowLookupMs`, `writeMs`, `revisionMs`, `auditMs` tại `saveRecord_` (chỉ dùng khi Script Property `HN_PERF_TEST=1`); cập nhật nhãn phiên bản. **Giữ nguyên thuật toán đọc toàn bảng, bảo vệ phiên bản, khóa ghi, trùng quyết định, audit.** |
| `package.json`, `tests/` | Bump version, cập nhật assertion phiên bản, 4 unit tests mới và Chromium mock integration. |

**Không thay đổi:** `public/xlsx-export.js` (SHA-256 **244d494d2cc9535dc631a1544409816f0502ba0f8ee17e7052c5d6c9e7f180dc** trùng bản v1.2.11-RC), CSS, dữ liệu Google Sheets, 7 tab/94 cột, logic tháng bỏ học, phân quyền, nhập Excel, hỗ trợ báo cáo.

## 2. Trước và sau

- **Trước:** Lưu một hồ sơ → server trả về `d.record` → xóa snapshot/cache và `navigate('records',true)` → giao diện chờ đồng bộ quyền, tải danh sách mới, dựng lại cả bộ lọc.
- **Sau (không đổi sort/filter):** Lưu một hồ sơ → server ACK → render duy nhất hàng trùng `HO_SO_ID` bằng `d.record`, giữ trang/bộ lọc/cuộn và 19 hàng khác. **Không phát sinh `records_list` vì thao tác cập nhật đơn giản**.
- **Sau (đổi ngày QĐ, cơ sở, bộ lọc/từ khóa):** Lưu → server ACK → `refreshRecordResults()` tải lại vùng kết quả và phân trang, không dựng lại toàn bộ shell/menu/bộ lọc.
- **Sau (thêm hồ sơ):** vẫn làm mới vùng kết quả để sắp xếp và đếm đúng.
- **Lỗi server / `VERSION_CONFLICT`:** giữ nguyên modal và các giá trị đang nhập, không cập nhật bảng hoặc thông báo thành công trước khi server xác nhận.

## 3. Hiệu năng: đo trước khi tối ưu thuật toán ghi backend

User ghi nhận khoảng **6 giây** từ khi bấm Lưu đến khi giao diện hoàn tất, chưa có waterfall production. Không được diễn giải 6 giây là thời gian `Google Sheets.setValues()`.

### 3.1. Trình duyệt (staging)

Mở DevTools → Console, nhập `window.HN_PERF_TEST=true` (chỉ phiên tab đó), bấm sửa hồ sơ thử nghiệm và Lưu. Dòng `[HN_PERF] record_save` gồm:

- `clickToAckMs`: click→server xác nhận `record_save` thành công.
- `ackToUiMs`: server ACK→DOM dòng/bộ lọc cập nhật hoặc bắt đầu làm mới vùng kết quả.
- `clickToUiMs`: tổng thời gian đến giao diện phản hồi (trường hợp `outcome='list'` **chưa bao gồm** thời gian yêu cầu làm mới kết quả; đo thêm `records_list` trên Network khi cần).
- `mode`: `edit` hoặc `create`; `outcome`: `row`, `list`, `deferred`.

Không bật/thu thập trên máy có thông tin nhạy cảm khi chưa được phép. Không chia sẻ ảnh Network chứa payload cá nhân, Authorization/Cookie/ID Token.

### 3.2. Vercel staging

Nếu cần phân rã thời gian, đặt **environment variable cho Preview/staging** `HN_PERF_TEST=1` và redeploy Preview. Log `YC022` từ `api/rpc.js` ghi `identityMs`, `upstreamMs`, `totalMs`, `ok` cho action record_save; không chứa dữ liệu cá nhân.

### 3.3. Apps Script staging

Deploy bản `apps-script/Code.gs` mới **trên deployment staging** đã được kiểm tra; đặt Script Property `HN_PERF_TEST=1` tại môi trường staging. Execution log `YC022` có `authMs`, `lockWaitMs`, `fullSheetReadMs`, `validationMs`, `rowLookupMs`, `writeMs`, `revisionMs`, `auditMs`, `sheetReads`, `cells`, `totalMs`.

**Cảnh báo:** Không tự mở rộng quyền log hoặc thay environment production. Nếu không cần benchmark Apps Script, **không cần deploy lại Code.gs** để hưởng lợi từ cập nhật dòng frontend; Code.gs cũ vẫn dùng được do hợp đồng `record_save` không đổi.

**Quy trình đo:** 3 lần cache lạnh + 3 lần cache nóng trên dữ liệu thử nghiệm phi định danh; sửa một trường không ảnh hưởng filter, sửa ảnh hưởng sort/filter, thêm hồ sơ, đồng thời 2 tài khoản. Ghi median/p95 nếu có đủ mẫu; không suy ra cải thiện máy chủ khi chưa đo.

## 4. Triển khai an toàn

1. Sao lưu GitHub commit và bản Code.gs triển khai hiện tại; ghi lại URL deployment GAS, tên project Vercel và cấu hình cần thiết **trong nơi bí mật, không gửi vào chat**.
2. Tạo nhánh Preview/staging từ bản `v1.2.11-RC`; cập nhật **toàn bộ code GitHub ZIP** `v1.2.12-RC`, không copy mỗi `app.js` nếu mất đồng bộ version. **Không** ghi đè `.env`/secrets thật.
3. Triển khai Preview, hard refresh Ctrl+Shift+R, kiểm tra chân trang `v1.2.12-RC`.
4. Kiểm thử tài khoản ADMIN/NHAN_VIEN: lọc trạng thái, trang 5, sửa tên một hồ sơ; giữ nguyên DOM bộ lọc, chỉ một hàng thay đổi; Network không có `records_list` mới. Sửa ngày quyết định hoặc đổi trường: đúng danh sách mới nhưng form vẫn nguyên.
5. Thử Cơ sở đào tạo: chỉ đúng chức năng được quyền; không xuất hiện Sửa hoặc Xóa trái quyền. Thử xung đột phiên bản, bộ lọc, đổi menu, xuất Excel như mẫu đã CHỐT.
6. Chỉ sau khi đạt staging mới triển khai Production. Để benchmark backend, dùng **Apps Script staging** riêng; khi thực sự cần đưa instrumentation GAS vào production phải xin phép vì không phải điều kiện bắt buộc của sửa frontend.

## 5. Kiểm thử và giới hạn

- `npm run check`: đạt.
- `npm test`: **152/152 bài đạt** (bao gồm 4 unit tests YC022 mới; không có bài thất bại).
- `python tests/browser_yc022_mock.py`: đạt; Chromium giả lập ADMIN/NHAN_VIEN chỉ cập nhật hàng mà không gọi `records_list`, refresh vùng kết quả khi đổi ngày, modal vẫn mở khi version conflict; CO_SO_DAO_TAO không có quyền Sửa. **Không kết nối Google Sheets thật**.
- `xlsx-export.js`: byte-for-byte tương đương bản v1.2.11-RC.

**Chưa thực hiện:** benchmark thực tế Google Sheets/Vercel production, chốt cải tiến tốc độ backend, kiểm thử thủ công trên thiết bị của người dùng. Thuật toán `saveRecord_` vẫn có full-sheet scan nhằm bảo toàn kiểm trùng/an toàn dữ liệu. Sau khi có log và được phê duyệt riêng mới xem xét tối ưu đọc Sheets, giữ lock và audit.

## 6. Hoàn tác

Nếu phát sinh lỗi sau triển khai, redeploy lại commit Vercel từ `v1.2.11-RC`. Không cần hồi phục dữ liệu Sheets chỉ vì đổi giao diện (không chạy migration). Nếu từng triển khai Code.gs staging và muốn hoàn tác, đổi deployment staging trở lại version trước; không đổi production khi không cần.

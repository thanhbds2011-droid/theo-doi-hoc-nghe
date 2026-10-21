# YC-HN-018 V3 — Hướng dẫn nâng cấp v1.2.5-RC

## 1. Nguồn và phạm vi

Nâng cấp từ **v1.2.4-RC / YC-HN-017 V3**, thực hiện theo Master Prompt YC-HN-018 V3 đã CHỐT. Giữ nguyên Google Sheets 7 tab/94 cột, quyền ADMIN/NHAN_VIEN/CO_SO_DAO_TAO, xóa mềm, lock, PHIEN_BAN, nhật ký, file Excel 25 cột và bộ nhập trạng thái hàng loạt YC-HN-016. **Không có migration dữ liệu.**

**Cách hiểu quy tắc tháng thứ 1 đã chốt:** Dropdown luôn hiển thị Tháng 1–12, nhưng Tháng 1 chỉ để giải thích và không chọn được khi cập nhật Bỏ học. Chưa học ngày nào thì chọn Không tham gia; đã học dù một ngày trong tháng đầu thì tháng đầu được tính đã học, tháng bắt đầu bỏ học từ tháng 2 trở đi nếu còn kỳ hỗ trợ. Khóa chỉ hỗ trợ một tháng nhưng học rồi ngừng chưa có đủ nghiệp vụ để lưu Bỏ học theo kỳ.

## 2. Tệp chỉnh sửa

- `public/app.js`: xóa hàng **Đang học** khỏi hàm chung `reportKpiRows` (nên cả bảng, bản in và Excel tổng hợp đều không có); giữ `learning` trong thống kê backend và khả năng lọc Đang học (chưa được yêu cầu xóa). Dropdown Bỏ học hiển thị 12 lựa chọn, vô hiệu hóa kỳ 1 / kỳ vượt N; có dòng giải thích khi N=1, N không nguyên hoặc trên 12. Thay số tháng hỗ trợ trong form làm kiểm tra lại các lựa chọn chưa lưu.
- `apps-script/Code.gs`: giới hạn lưu kỳ mới `2 ≤ n ≤ min(12,N)` với N nguyên hợp lệ. Không nhận `KY:1`, `KY:13+` khi tạo mới; giữ giá trị kỳ 13+ hoặc ngày bỏ học lịch sử khi đã tồn tại và người dùng không thay đổi. Reuse cùng đối tượng Sheet trong luồng cập nhật tình trạng, không bỏ xác minh quyền/khóa ghi/phiên bản/nhật ký. Bổ sung số đo theo giai đoạn trong log staging `HN_PERF_TEST`.
- `public/index.html`, `package.json`: phiên bản v1.2.5-RC.
- `tests/backend.test.js`, `tests/ui-yc006.test.js`, `tests/yc018-ui.test.js`, `tests/browser_yc018_mock.py`: cập nhật kiểm tra phiên bản và kiểm thử các quy tắc mới.

**Không đổi:** bảng báo cáo ma trận theo nghề/trường (không có cột Đang học), logic KPI của Dashboard, cách tính Đã tham gia/Bỏ học, dropdown lọc Đang học, các hàm lưu trạng thái được cấp quyền và mẫu Excel khác.

## 3. Kiểm thử đã thực hiện

- `npm test`: **124/124 đạt** (116 bài nền và 8 bài mới).
- `npm run check`: kiểm tra JavaScript frontend/API đạt.
- Bản sao Code.gs dưới phần mở rộng `.js`: kiểm tra cú pháp Node đạt.
- `python tests/browser_yc018_mock.py`: đạt — 12 lựa chọn, thay N thì kiểm tra lại, N lẻ từ chối.
- `python tests/browser_yc017_mock.py`: đạt — chuyển menu sau 240 giây và kiểm tra quyền các vai trò.
- `python tests/browser_yc015_mock.py`: đạt — tìm số QĐ, xóa từ khóa và tránh response cũ ghi đè.

**Giới hạn thực tế:** Tất cả bài trên là mock/offline. Chưa kết nối Google Sheets production và chưa đo `record_status` thực tế với dữ liệu 3.000 dòng; không đưa ra khẳng định giảm từ 10 giây xuống X giây. Reuse Sheet object có thể giảm một chút overhead; log theo từng chặng là cơ sở chọn tối ưu tiếp nếu dữ liệu thực tế còn chậm. Không suy ra thời gian GAS từ mock.

## 4. Hướng dẫn kiểm tra tốc độ ở staging

1. Tạo **bản sao Google Sheets và Apps Script**; môi trường thử phải trỏ tới SPREADSHEET_ID bản sao. Giữ nguyên các Script Properties cần thiết nhưng không công khai bí mật.
2. Bật **Script Property** `HN_PERF_TEST=1` trên Apps Script staging; trên frontend staging mở Chrome Developer Tools/Network.
3. Cập nhật trạng thái **chỉ của hồ sơ thử**: Đã tham gia, Không tham gia, Bỏ học. Đo từ lúc bấm tới kết quả, lập lại ít nhất 3 lần cache lạnh/nóng, lúc ít/đông người truy cập nếu có thể.
4. Trong Apps Script → **Executions**, tìm log JSON an toàn của yêu cầu `record_status`: `totalMs`, `authMs`, `lockWaitMs`, `rowLookupMs`, `rowReadMs`, `validationMs`, `writeMs`, `revisionMs`, `auditMs`, `sheetReads`, `cells`. Đây là đo một phần thời gian backend, không bao gồm toàn bộ độ trễ Vercel/trình duyệt. Không ghi tên học viên/số BHXH.
5. Nếu Vercel/Network có độ trễ lớn hơn backend, cần khảo sát proxy/mạng; nếu `rowLookupMs`/`writeMs`/`lockWaitMs` lớn, tối ưu theo số đo, không xóa kiểm tra quyền/khóa ghi.
6. Tắt `HN_PERF_TEST` sau khi đo.

## 5. Triển khai thử và nghiệm thu

1. Sao lưu GitHub, Apps Script deployment và **sao chép Google Sheets** trước khi cập nhật. Đối chiếu Deployment ID của Vercel `GAS_WEB_APP_URL` với đúng Apps Script đang chạy; không chọn theo tên trùng.
2. Cập nhật **toàn bộ `apps-script/Code.gs`** vào Apps Script **staging**, Deploy → Manage deployments → New version; dùng đúng URL `/exec` staging.
3. Cập nhật toàn bộ GitHub/frontend v1.2.5-RC trên Vercel Preview trỏ API sang Apps Script staging mới.
4. Kiểm thử trên staging cả ADMIN và trường: Báo cáo không có dòng Đang học; in và Excel tổng hợp không có dòng này; hồ sơ N=3 thấy tháng 1–12 với chỉ 2/3 được chọn; N=12 chọn 12; N=1/lẻ báo cần kiểm tra; `KY:1`, `KY:4` của N=3 và `KY:13` bị từ chối qua API; ngày bỏ học lịch sử vẫn hiển thị và lưu lại an toàn. Thử lỗi xung đột, cập nhật hàng loạt và xuất Excel.
5. Chỉ sau nghiệm thu mới nâng cấp bản thật: **Apps Script New version trước, Vercel sau**. Không sửa trực tiếp Sheet thật, không làm mới 3.000 hồ sơ hoặc thay đổi tab/cột.

## 6. Hoàn tác

- Nếu lỗi, tạm ngừng thao tác ghi, rollback Vercel từ v1.2.5-RC về v1.2.4-RC, phục hồi deployment Apps Script v1.2.4-RC. Kiểm tra lại phân quyền, Báo cáo và các hồ sơ đã cập nhật trong khoảng thời gian chuyển tiếp.
- Không xóa Apps Script deployment cũ hoặc tệp backup trước khi kiểm tra rollback.
- Không yêu cầu migrate/hoàn nguyên cấu trúc Sheets vì không có cột/tab mới.

## 7. Các trường hợp chưa tự suy diễn

- Tháng hỗ trợ lẻ (2,5; 3,5) và khóa chỉ hỗ trợ 1 tháng chưa được tự gán Bỏ học theo kỳ; giao diện cảnh báo, backend từ chối lưu kỳ không đủ căn cứ.
- Người đã học và nghỉ rồi quay lại, thời điểm hỗ trợ bắt đầu giữa tháng hoặc điều kiện quyết toán cần quy tắc riêng; không tự tính chi trả.
- Giá trị kỳ lịch sử ngoài 12 chỉ được bảo toàn nếu **đúng giá trị đang lưu**, không cho nhập mới kỳ 13 trở lên.

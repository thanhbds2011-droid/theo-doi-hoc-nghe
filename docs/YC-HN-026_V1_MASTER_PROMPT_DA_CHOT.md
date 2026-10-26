# MASTER PROMPT — YC-HN-026 / V1 — MỞ QUYỀN XUẤT EXCEL CHO CƠ SỞ ĐÀO TẠO, ĐỒNG BỘ CHỈ TIÊU BÁO CÁO THEO CƠ SỞ/NGHỀ

**Dự án:** THEO DÕI HỌC NGHỀ (GitHub/Vercel + Google Apps Script + Google Sheets).  
**Mã nguồn nền đã kiểm tra trực tiếp:** `THEO_DOI_HOC_NGHE_YC-HN-025_V3_v1.2.18-RC.zip`, bao gồm `public/app.js`, `public/styles.css`, `public/xlsx-export.js`, `apps-script/Code.gs`, và các bài kiểm thử.  
**Đầu vào người dùng:** Năm ảnh giao diện ngày 26/10/2026: tài khoản Gmail cơ sở đào tạo, trang Hồ sơ, trang Báo cáo, bảng Excel theo cơ sở và dropdown Tình trạng.  
**Trạng thái:** **ĐÃ CHỐT — đã chỉnh sửa mã nguồn v1.2.19-RC, kiểm thử cục bộ đạt; chưa triển khai production.**

## I. Yêu cầu nghiệp vụ đã xác định

1. **Gmail Cơ sở đào tạo** cần được **Xuất Excel Hồ sơ học nghề** và **Xuất Excel Báo cáo** để in, họp, thống kê, nhưng **chỉ được xuất các hồ sơ thuộc cơ sở đào tạo đã gán vào tài khoản**. Không cấp quyền xem hồ sơ trường khác, thêm/sửa/xóa hồ sơ, quản trị tài khoản, import Excel hoặc các quyền khác chỉ vì được xuất báo cáo.
2. Giữ chức năng **In báo cáo** và bảo đảm bản in của tài khoản trường có đúng số liệu, tên cơ sở và các điều kiện lọc đã áp dụng. Đã xác định nút In báo cáo vốn có trên trang Báo cáo của tài khoản cơ sở; yêu cầu là kiểm thử và bảo toàn nó, **không cần tạo lại**. Trang **Hồ sơ học nghề** hiện không có nút In độc lập ngay cả với ADMIN: không tự thêm tính năng in danh sách trực tiếp trong lần này, trừ khi người dùng yêu cầu bổ sung riêng; tài khoản trường có thể in file Excel sau khi xuất.
3. Các mẫu Excel **Báo cáo theo cơ sở đào tạo** và **Báo cáo theo nghề đào tạo** phải có thêm **cột `Hoàn thành khóa học`**, tính theo quy tắc đã CHỐT ở YC-HN-025 V2/V3: tình trạng `DA_THAM_GIA`, không `DA_BO_HOC`, ngày tại `NGAY_KET_THUC_DU_KIEN` hợp lệ và trong khoảng ngày kết thúc đào tạo đã lọc. Không coi đây là xác nhận đã tốt nghiệp thực tế.
4. Đổi tiêu đề cột **`Tổng số Quyết định` → `Tổng số Quyết định đã ban hành`** ở cả hai mẫu ma trận; bảo đảm tiêu đề dài tự Wrap Text, không cắt chữ.
5. Các cột tình trạng hiện hữu **Đã tham gia học / Bỏ học / Không tham gia / Không nhận Quyết định / Chưa xác nhận** vẫn có; nếu có `Tình trạng khác` thì giữ đúng cách tính và tính nhất quán. Khi có trạng thái tùy chỉnh, kiểm tra yêu cầu "có bao nhiêu tình trạng thì xuất có đủ" và xuất cột riêng theo trạng thái hợp lệ nếu xác định được tính toán và giới hạn số cột; tránh lặng lẽ xóa dữ liệu nhóm `Khác`.
6. Bốn mẫu xuất từ màn Báo cáo vẫn phải hoạt động: (a) danh sách 25 cột, (b) báo cáo tổng hợp, (c) theo cơ sở, (d) theo nghề. Không thay đổi mẫu **Danh sách 25 cột** đã nghiệm thu về căn lề, Wrap Text, chiều cao, mã có số 0 đầu và kiểu ngày.

## II. Phát hiện có chứng cứ trong mã nguồn v1.2.18-RC

| Mức | Đường mã nguồn | Kết luận kiểm toán |
|---|---|---|
| P0 | `public/app.js`: `renderRecords()` gần dòng 462 | Nút `data-export-list` chỉ được dựng khi role `ADMIN` hoặc `NHAN_VIEN`; `CO_SO_DAO_TAO` không thấy. |
| P0 | `public/app.js`: `renderReports()` gần dòng 570 | Nút `#report-export` chỉ cho `ADMIN`; nút `#print-report` đang dựng **cho cả tài khoản trường**. |
| P0 | `apps-script/Code.gs`: `authorize_()` gần dòng 379–395 | `report_export` và `report_matrix` yêu cầu `REPORT_EXPORT`; mảng `schoolRights` hiện chỉ có `RECORD_VIEW`, `RECORD_STATUS`, `REPORT_VIEW`, `FILE_VIEW`, nên trường bị chặn server. `staffRights` ở backend đã có `REPORT_EXPORT`. |
| P0 | `apps-script/Code.gs`: `reportMatrix_()` gần dòng 976 | Còn `must_(user.VAI_TRO==='ADMIN')`: **chỉ mở nút và schoolRights vẫn chưa đủ**, phải thay kiểm tra cứng này bằng quyền tương ứng. |
| P0 | `apps-script/Code.gs`: `visibleRecords_()` gần dòng 539 và `ownsRecord_()` gần dòng 502 | Tập hồ sơ nhìn thấy của trường bị chặn theo `r.TRUONG_ID===user.TRUONG_ID`; `reportRecords_()`, `exportRecords_()` và ma trận cần tiếp tục lấy từ tập này. Không bỏ hoặc thay bằng lọc frontend. |
| P1 | `public/app.js`: `exportSummaryOrMatrix()` gần dòng 1065 | Hai loại ma trận đang xuất cột `Tổng số Quyết định`, **chưa có cột Hoàn thành khóa học**; số tương ứng cũng không có trong dữ liệu `d.items`. |
| P1 | `apps-script/Code.gs`: `reportMatrix_()` | Nhóm theo `TRUONG_ID`/`NGHE_ID` từ `reportRecords_(...)` rồi tính `total`, `learning`, `dropout`, ... `pending`; không tính `courseEndParticipated`. |
| P1 | `apps-script/Code.gs`: `overview_()` gần dòng 952–975, `courseEndEligible_()` gần dòng 553 | Đã sửa YC-HN-025 V3 để chỉ tiêu hoàn thành **độc lập ngày QĐ**, tính theo `NGAY_KET_THUC_DU_KIEN`. Ma trận mới phải áp cùng điều kiện, không dùng `g.learning` làm số hoàn thành. |
| P1 | `public/xlsx-export.js`: `buildReportXlsx()` gần dòng 96 | Thư viện hỗ trợ số cột linh hoạt tối đa **12**; tiêu đề dòng 2 hiện cao cố định **38pt**, cột số mặc định width **22**. Cột dài mới hoặc trạng thái tùy chỉnh cần kiểm thử tràn chữ và giới hạn cột. |
| P2 | `apps-script/Code.gs`: `safeUser_()` gần dòng 400; frontend `allowed()` gần dòng 46 | Tài khoản trường cần khai báo quyền `REPORT_EXPORT` nhất quán sau nâng cấp. Phần giao diện không được là lớp bảo vệ duy nhất. |

**Lưu ý:** "In báo cáo" đã có ở giao diện trường trong code; nếu bản in thực tế không hoạt động, cần kiểm thử với Chrome/Edge và CSS `@media print` trước khi tuyên bố đã sửa. Không quy toàn bộ sự cố cho việc thiếu quyền in.

## III. Yêu cầu triển khai sau khi CHỐT

### YC-026.01 — Xuất Excel Hồ sơ học nghề cho Cơ sở đào tạo (P0)

- Hiển thị nút `Xuất Excel` trong `Hồ sơ học nghề` cho trường; giữ các nút khác như cũ.
- Xuất **toàn bộ** hồ sơ phù hợp bộ lọc của tài khoản trường trong giới hạn xuất hiện hành (không chỉ 20 hàng/trang). Không cho tải hồ sơ của trường khác, kể cả khi cố tình sửa payload `truong`, `year`, `status`, `query` hoặc `source`.
- Cập nhật `REPORT_EXPORT` chỉ cho hành vi xuất đọc dữ liệu, không tự cho phép các API ghi hoặc xem tệp đính kèm ngoài quyền.
- Tiếp tục dùng mẫu **25 cột**, không đổi thư viện/style đã CHỐT của danh sách.

### YC-026.02 — Xuất Excel Báo cáo cho Cơ sở đào tạo; giữ In báo cáo (P0)

- Trang Báo cáo tài khoản trường hiển thị nút `Xuất Excel` cạnh `In báo cáo`, theo bố cục trang Admin; gọi đúng `exportModal` với bốn định dạng như hiện hành.
- Cấp quyền **`REPORT_EXPORT`** trong backend `authorize_` cho `CO_SO_DAO_TAO` cùng với quyền đang có; cập nhật `safeUser_`, kiểm tra scope từ `user.TRUONG_ID` được xác nhận bằng session và binding, không tin trực tiếp giá trị trường gửi lên.
- Gỡ rào chắn `user.VAI_TRO==='ADMIN'` trong `reportMatrix_` và thay bằng kiểm tra quyền `REPORT_EXPORT` + scoping `visibleRecords_`. Không cấp phép gọi `accounts_list`, `catalog_save`, `record_bulk_import`, `record_delete`, v.v.
- ADMIN giữ xuất toàn bộ theo quyền; NHAN_VIEN giữ hành vi hiện có trừ khi có chỉ đạo mở rộng riêng. Không can thiệp logic quyền ngoài phạm vi.
- Nút `In báo cáo` tiếp tục gọi `window.print()` và in kết quả theo bộ lọc **đã áp dụng**, không theo giá trị đang nhập chưa bấm Lọc; giữ bố cục gọn và kiểm tra bản in trường. Nếu cần, thể hiện tên cơ sở đã gán để tránh hiểu nhầm là báo cáo toàn Trung tâm.

### YC-026.03 — Cột Hoàn thành khóa học trong ma trận theo trường và nghề (P0)

- Hai mẫu ma trận đều có thứ tự: `STT`, `Tên cơ sở đào tạo`/`Tên nghề`, `Tổng số Quyết định đã ban hành`, `Đã tham gia học`, `Bỏ học`, `Không tham gia`, `Không nhận Quyết định`, `Chưa xác nhận`, `Hoàn thành khóa học`, `Tình trạng khác` (nếu tồn tại; theo quy tắc cũ). Giữ cột tổng cộng màu vàng và công thức hiện hành, mở rộng tổng cho cột mới.
- Ma trận ở chế độ `Tất cả tình trạng`: các cột Tổng QĐ/Đã tham gia/Bỏ học/… giữ phép lọc theo **Ngày ban hành QĐ**; **riêng cột Hoàn thành khóa học** phải tính theo **Ngày kết thúc đào tạo dự kiến** cùng `Từ ngày`/`Đến ngày` + bộ lọc năm/trường/nghề/quyền. Đúng YC-HN-025 V3; hai cột dùng hai căn cứ ngày độc lập, không cộng Hoàn thành vào Tổng QĐ hoặc tổng các tình trạng.
- Khi chọn riêng `Hoàn thành khóa học`, số hồ sơ và cột Hoàn thành phải bằng tổng của danh sách kết thúc dự kiến đủ điều kiện; các cột khác không tạo chỉ tiêu tốt nghiệp thực tế. Khi chọn trạng thái khác, ma trận cần thống nhất quy tắc với báo cáo tổng hợp và tập đang chọn; không dùng số hoàn thành toàn hệ thống để trộn vào dữ liệu chỉ thuộc bộ lọc trường hoặc nghề.
- **Không** suy ra Hoàn thành = `Đã tham gia học - Bỏ học` (còn yêu cầu ngày kết thúc hợp lệ và khoảng ngày); **không** cắt theo Ngày QĐ khi tính Hoàn thành ở chế độ Tất cả.
- Trên `apps-script/Code.gs`: tái sử dụng `courseEndEligible_()`, `reportRecords_()` và snapshot chỉ có dữ liệu đã xác thực của `user` để tính `completed` theo từng `TRUONG_ID`/`NGHE_ID`, thay vì gọi thêm API frontend hoặc tạo tab mới; tính `courseEndParticipated` cho từng hàng ma trận.
- Nếu trong kỳ có những hồ sơ **chỉ hoàn thành dự kiến nhưng ngày quyết định ngoài kỳ**, vẫn phải thể hiện hàng trường/nghề tương ứng để không làm thiếu tổng cột Hoàn thành. Trường/nghề chỉ có hoàn thành mà không có QĐ ban hành trong kỳ sẽ có thể có `Tổng số Quyết định đã ban hành = 0` và `Hoàn thành khóa học > 0`; đây là kết quả **đúng do hai căn cứ ngày khác nhau**, không làm sai số bằng cách ép bằng nhau.
- Tổng cộng cột Hoàn thành trên ma trận theo cơ sở/nghề phải khớp `overview.kpi.courseEndParticipated` với cùng quyền, năm/trường/nghề/khoảng ngày, đối chiếu như YC-HN-025 V3. Các cột QĐ và trạng thái hiện có vẫn khớp tổng từ tập lọc quyết định.

### YC-026.04 — Cột tiêu đề, định dạng Excel và trạng thái tùy chỉnh (P1)

- Thay chính xác chuỗi tiêu đề ở **hai báo cáo ma trận** bằng `Tổng số Quyết định đã ban hành`, không chỉ đổi hiển thị trên website.
- Tiêu đề dài được Wrap Text, căn giữa ngang/dọc; điều chỉnh chiều rộng, chiều cao hàng tiêu đề thích hợp để nhìn rõ đủ chữ trong Microsoft Excel/WPS; cột Hoàn thành giữ số dạng số Excel thực, căn giữa, viền bảng.
- Bảo toàn màu tiêu đề, đường viền, dòng tổng cộng, ô gộp A:B của tổng, số liệu không bị làm tròn; phần file danh sách 25 cột không sửa.
- Nếu hệ thống có tình trạng tùy chỉnh đang sử dụng, rà việc bổ sung cột riêng để đúng yêu cầu "tình trạng có bao nhiêu thì Excel phải có đủ". Phân biệt `Tất cả` và `Tổng số Quyết định đã ban hành` là **bộ lọc/tổng**, không phải tình trạng thực tế. Không cộng đôi `Đã tham gia`/`Bỏ học`/`Hoàn thành`; không đồng thời đếm những tình trạng tùy chỉnh đã tách cột vào `Tình trạng khác`. Hiện `buildReportXlsx` giới hạn tối đa 12 cột: nếu tổng cột cần nhiều hơn 12, phải nâng giới hạn **riêng báo cáo ma trận** với kiểm thử an toàn thay vì bỏ cột âm thầm.
- Giữ tiêu chí 25 cột danh sách, các báo cáo tổng hợp 2 cột và dữ liệu gốc không thay đổi.

### YC-026.05 — Kiểm thử bắt buộc (P0)

1. Với `CO_SO_DAO_TAO` có `TRUONG_ID=A`: Trang Hồ sơ có Xuất Excel; trang Báo cáo có Xuất Excel + In báo cáo; cả bốn mẫu tải được; mọi tệp chỉ có hồ sơ hoặc số liệu của A. Chọn `truong=B`, giả mạo `report_export`, `report_matrix`, hoán đổi `groupBy`, đổi số QĐ, sửa quyền frontend: vẫn không được xuất dữ liệu B.
2. Với ADMIN: dữ liệu toàn Trung tâm giữ nguyên. NHAN_VIEN và tất cả quyền ghi khác không thay đổi; kiểm trường bị khóa/đổi trường lúc tab đang mở, cache và phiên đổi gán trường, không lộ dữ liệu cũ.
3. So sánh xuất Hồ sơ 25 cột với lọc theo QĐ, từ/đến ngày, nghề, tình trạng; xuất **toàn bộ kết quả**, không chỉ trang 20 hồ sơ; giới hạn max 5000 và thông báo lỗi giữ nguyên.
4. Hai file ma trận trường/nghề đều có `Tổng số Quyết định đã ban hành` và `Hoàn thành khóa học`; có hàng Tổng cộng và tính tổng cột hoàn thành chính xác; kiểm nội dung Wrap Text ở tiêu đề.
5. Dữ liệu giả lập: quyết định ban hành trong tháng 1–4 nhưng kết thúc tháng 5, và quyết định ban hành tháng trước nhưng kết thúc tháng 1–4. Cột Tổng QĐ lọc theo Ngày QĐ; cột Hoàn thành lọc theo Ngày kết thúc dự kiến, chỉ đã tham gia và không bỏ học. Không dùng 2 ngày chung một cách sai lệch.
6. Kiểm trường/nghề chỉ có hoàn thành trong kỳ nhưng không có QĐ ban hành trong kỳ: **không bị mất hàng**. Kiểm tổng ma trận theo trường/nghề bằng `overview.kpi.courseEndParticipated` cho cùng điều kiện/quyền.
7. Kiểm `Bỏ học`, `Chưa xác nhận`, `Không tham gia`, trường không có ngày kết thúc, ngày trống/ngày không hợp lệ, một đầu mút, hai đầu mút (gồm ngày đầu/cuối), các trường hợp date filter xung đột.
8. Nếu có tình trạng tùy chỉnh: kiểm từng tình trạng được tính độc lập, không bị gộp/cộng trùng khi xuất. Kiểm số cột vượt 12 với dữ liệu thử nếu mở rộng exporter.
9. Kiểm Chromium cho ADMIN/NHAN_VIEN/CO_SO_DAO_TAO, tình huống in báo cáo; kiểm thực tế Excel/WPS nếu có môi trường, không tuyên bố đã kiểm trên máy người dùng nếu chỉ dùng mock.
10. Chạy hồi quy bộ kiểm thử v1.2.18-RC, đặc biệt `yc025-ui`, `yc024-report`, `yc021-v5_2-hotfix-wps`, `browser_yc022_mock.py`; đảm bảo cập nhật cục bộ, phân quyền, Excel danh sách đã nghiệm thu không bị phá.

## IV. Bàn giao sau CHỐT

- **Chỉ sau khi người dùng nói CHỐT:** chỉnh tối thiểu các file thực sự cần, dự kiến `public/app.js`, `apps-script/Code.gs`, một phần exporter **ma trận** của `public/xlsx-export.js` (nếu cần để tránh cắt tiêu đề, hỗ trợ số cột linh hoạt) và các test tương ứng; tuyệt đối không thay đổi quy tắc xuất danh sách 25 cột.
- Bàn giao toàn bộ ZIP GitHub chạy được, `Code.gs` đầy đủ, mô tả thay đổi, kết quả kiểm thử thực tế, hướng dẫn triển khai **cả GitHub/Vercel và Apps Script**, backup/staging/rollback. Không tự sửa Google Sheets production hoặc bảng phân quyền thực tế.
- Không thêm cột/tab Sheet, không chuyển database, không bỏ bước xác thực Vercel/HMAC/cookie hoặc scope `TRUONG_ID`; không tự thay đổi nghiệp vụ tháng bỏ học.

**TRẠNG THÁI: YC-HN-026 V1 — ĐÃ CHỐT, HOÀN THÀNH MÃ NGUỒN VÀ KIỂM THỬ CỤC BỘ, CHƯA TRIỂN KHAI PRODUCTION.**


## X. Kết quả triển khai theo CHỐT

Bản `v1.2.19-RC` đã được chỉnh mã nguồn, kiểm thử cục bộ, bàn giao ZIP và Code.gs đầy đủ; chưa triển khai production. Các kiểm thử và danh sách file thực tế nằm tại `docs/YC-HN-026_V1_CHANGELOG.md`, và tài liệu kiểm thử đi kèm.

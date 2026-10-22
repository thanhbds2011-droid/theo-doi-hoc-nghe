# MASTER PROMPT — YC-HN-024 / V1 — BỔ SUNG LỌC NGÀY HOÀN THÀNH KHÓA HỌC TẠI BÁO CÁO

**Dự án:** THEO DÕI HỌC NGHỀ — frontend GitHub/Vercel, Google Apps Script, Google Sheets.

**Nguồn đối chiếu:** Ảnh chụp `Hồ sơ học nghề` và `Báo cáo học nghề` người dùng cung cấp ngày 22/10/2026; tệp ZIP `THEO_DOI_HOC_NGHE_YC-HN-023_V1_v1.2.13-RC.zip`, trực tiếp kiểm tra `public/app.js`, `apps-script/Code.gs`.

**Mã nguồn nền:** **v1.2.13-RC**. Giữ nguyên toàn bộ các yêu cầu YC-HN-013–023 đã nghiệm thu, đặc biệt lọc theo ngày ở trang Hồ sơ, cập nhật cục bộ sau khi lưu hồ sơ, xuất Excel 25 cột và quy tắc bảo mật.

**Trạng thái: ĐÃ CHỐT YC-HN-024 V1 — mã nguồn đã chỉnh sửa thành v1.2.14-RC; chưa triển khai hệ thống đang vận hành.**

## I. Yêu cầu người dùng — không tự mở rộng nghiệp vụ

Người dùng phản ánh: **Trang Hồ sơ học nghề đã có lựa chọn `Ngày hoàn thành khóa học` trong ô `Tình trạng`; trang `Báo cáo học nghề` chưa có.** Bổ sung cùng lựa chọn đó ở trang Báo cáo, sử dụng đúng logic tra cứu đã chốt ở YC-HN-023.

1. Thêm **`Ngày hoàn thành khóa học`** vào `<select name="status">` trong form `#reports-filters`, phía cuối danh sách tình trạng báo cáo hiện có; giữ nguyên các mục và ý nghĩa của các lựa chọn cũ (`Tất cả tình trạng`, `Đã tham gia`, `Đang học`, `Bỏ học`, `Không tham gia`, `Không nhận Quyết định`, `Chưa xác nhận`, trạng thái tùy chỉnh).
2. Khi chọn mục mới và đặt `Từ ngày`/`Đến ngày`, lọc theo cột **`NGAY_KET_THUC_DU_KIEN`** (trong Chi tiết: `Thời gian đào tạo – Đến ngày`), **không** lọc những ngày này trên `NGAY_QUYET_DINH`.
3. Với mọi trạng thái cũ, lọc ngày **tiếp tục dựa trên ngày ban hành quyết định** như hiện hành.
4. Bao gồm **ngày đầu và ngày cuối**; chỉ có Từ ngày hoặc chỉ có Đến ngày cũng hợp lệ; ngày không hợp lệ/Từ ngày > Đến ngày phải được báo lỗi như hiện tại.
5. Các điều kiện `Năm quyết định`, `Cơ sở đào tạo`, `Nghề đào tạo` và phạm vi quyền **tiếp tục đồng thời áp dụng**. `Năm quyết định` là `NAM_QUYET_DINH`, không phải năm kết thúc đào tạo.
6. Mục mới là **chế độ tra cứu ảo**, mã nội bộ giữ nguyên `FILTER_COURSE_END_DATE`. **Không** ghi trạng thái này vào dữ liệu `TRANG_THAI_THAM_GIA`, không tự kết luận người học đã hoàn thành, không thay đổi học phí/hỗ trợ, tháng bỏ học, KPI nền hay nhật ký.

## II. Những vị trí đã kiểm tra chính xác trên v1.2.13-RC

### Frontend — `public/app.js`

- Hằng số `COURSE_END_FILTER='FILTER_COURSE_END_DATE'` đã tồn tại; không phát sinh mã mới.
- `filterFields(filters,mode)` tại nhánh `mode==='records'` **đã có** `['FILTER_COURSE_END_DATE','Ngày hoàn thành khóa học']`.
- Cũng trong `filterFields`, nhánh `mode==='reports'` dựng danh sách khác và **chưa có** lựa chọn trên.
- `dateFilterControls(filters,mode)` hiện chỉ đặt `byEnd = mode==='records' && filters.status===COURSE_END_FILTER`; cần mở rộng cho **cả** reports, đồng bộ dòng chú thích và nhãn hỗ trợ hai lịch.
- `updateRecordDateFilterHelp(form)` hiện có logic đổi chú thích khi trạng thái đổi; cần đảm bảo sự kiện đổi ở `#reports-filters` cũng cập nhật chú thích/nội dung `aria-label` mà không áp dụng lọc trước khi bấm nút `Lọc dữ liệu` (trừ khi hành vi hiện tại đã chốt khác).
- `renderReports` gọi `rpc('overview',state.reportFilters,{ttl:90000})`, dựng `Tổng hợp kết quả` bằng `reportKpiRows`; form `#reports-filters` giữ giá trị `state.reportFilters` sau submit.
- `exportModal` có 4 định dạng xuất: `Danh sách hồ sơ (25 cột)`, `Báo cáo tổng hợp`, `Báo cáo theo cơ sở đào tạo`, `Báo cáo theo nghề đào tạo`; các nhánh dùng `report_export`, `overview`, `report_matrix` với cùng `state.reportFilters`.
- `In báo cáo` dùng `window.print()`, phải có thông tin phạm vi ngày trong bản in ở chế độ ngày kết thúc dự kiến.

### Backend — `apps-script/Code.gs`

- `COURSE_END_FILTER_='FILTER_COURSE_END_DATE'` đã tồn tại.
- `recordMatches_(r,p)` xử lý đúng chế độ mới: trường được so sánh là `r.NGAY_KET_THUC_DU_KIEN` nếu `p.status===COURSE_END_FILTER_`, trái lại là `r.NGAY_QUYET_DINH`. Thiếu ngày kết thúc hợp lệ không được tính trong chế độ mới.
- `reportStatusValid_(status)` hiện **chưa** chấp nhận `COURSE_END_FILTER_`.
- `reportFilters_(p)` hiện gọi `decisionRange_(p)` mà chưa truyền tùy chọn `courseEnd`; và nhận trường `status/from/to`.
- `reportRecords_(p,user,sorted)` đang tạo `basic={year,truong,nghe,from,to}` không có chế độ đặc biệt rồi lọc sớm bằng `recordMatches_(r,basic)`; **nếu chỉ thêm dropdown thì bước lọc sớm này loại nhầm những hồ sơ có ngày QĐ nằm ngoài khoảng nhưng ngày kết thúc nằm trong khoảng**.
- `overview_`, `reportMatrix_`, `exportRecords_` đều phụ thuộc `reportRecords_`, nên sửa đúng chuỗi này để **danh sách, tổng hợp, ma trận cơ sở/nghề và Excel thống nhất**.
- Cache `OVERVIEW` có `filters.status/from/to` trong khóa; phải duy trì phân biệt 2 chế độ ngày, đúng scope vai trò và phiên bản dữ liệu, không trả dữ liệu khác quyền.

## III. Quy tắc nghiệm thu trên Báo cáo học nghề

### YC-024.01 — Chế độ ngày kết thúc đào tạo dự kiến

- Thêm mục **`Ngày hoàn thành khóa học`** sau các trạng thái cũ, giá trị chính xác `FILTER_COURSE_END_DATE`, và giữ mục khi đổi menu rồi trở lại.
- Khi chọn mục mới, cập nhật dòng hướng dẫn gần hai ô ngày thành: **`Lọc theo Thời gian đào tạo – Đến ngày (ngày kết thúc dự kiến); không xác nhận người học đã hoàn thành thực tế.`**
- Các chế độ cũ tiếp tục chú thích `Lọc theo ngày ban hành quyết định học nghề...`.
- Khi không điền hai ngày ở chế độ mới: chỉ tính hồ sơ có `NGAY_KET_THUC_DU_KIEN` hợp lệ, không tự giới hạn tháng hiện tại; thiết kế nhất quán với YC-HN-023 bên trang Hồ sơ.

### YC-024.02 — Số liệu tổng hợp phải theo đúng tập hồ sơ sau lọc

- Với chế độ mới, `Tổng số Quyết định`, `Đã tham gia`, `Bỏ học`, `Không tham gia`, `Không nhận Quyết định`, `Chưa xác nhận` là thống kê **các tình trạng thực tế trong tập hồ sơ có ngày kết thúc dự kiến thỏa điều kiện**. Không biến kết quả thành số người đã tốt nghiệp.
- Để tránh nhầm lẫn, thêm một nhãn/tiêu đề phụ mang ý nghĩa **`Thống kê các hồ sơ có ngày kết thúc đào tạo dự kiến trong khoảng đã chọn`** và thể hiện khoảng ngày đang **được áp dụng** (không lấy giá trị đang nhập nháp chưa bấm Lọc).
- Không đổi công thức phân loại `Đã tham gia/Đang học/Bỏ học` đã chốt; không thêm mục `Ngày hoàn thành khóa học` như một hàng trạng thái thực tế trong bảng KPI.

### YC-024.03 — Xuất Excel và in báo cáo phải đồng bộ

- Bốn tùy chọn trong `Báo cáo → Xuất Excel` phải lấy đúng tập hồ sơ sau khi áp dụng chế độ ngày kết thúc dự kiến (đếm và ma trận). Danh sách 25 cột vẫn giữ đúng mẫu Excel đã nghiệm thu, không sửa `public/xlsx-export.js` nếu không cần.
- **Không đổi** thứ tự, kiểu ngày, căn lề, Wrap Text và chiều cao dòng Excel đã được xác nhận.
- Báo cáo tổng hợp/ma trận chỉ thay **dữ liệu đầu vào được lọc**, không tự thêm các cột `đã hoàn thành khóa học` hay thay ý nghĩa trạng thái thực tế.
- Khi in, thể hiện người sử dụng đang lọc theo `Ngày kết thúc đào tạo dự kiến` và khoảng ngày đã áp dụng; không đánh đồng ngày dự kiến với chứng nhận tốt nghiệp.

### YC-024.04 — Đồng nhất giao diện, quyền và hiệu năng

- Giữ nguyên giao diện trang Báo cáo, hai lịch chọn ngày và nút `Lọc dữ liệu`, không thêm tab/cột Google Sheets.
- Tiếp tục lọc theo quyền trước khi tổng hợp, không rò dữ liệu cơ sở đào tạo khác; cache được tách theo user/role/school/revision/status/from/to.
- Giữ phân quyền: ADMIN, NHAN_VIEN, CO_SO_DAO_TAO theo cấu hình hiện hành; nút xuất Excel không tự xuất hiện cho vai trò chưa có quyền.
- Không thay đổi `Hồ sơ học nghề` đã nghiệm thu ở YC-HN-023, `record_save`, phân quyền, nhật ký hoặc nghiệp vụ tháng bỏ học chưa thống nhất.

## IV. Ca kiểm thử bắt buộc sau khi CHỐT

1. QĐ 13/10/2026, kết thúc dự kiến 14/07/2027: chọn `Báo cáo → Ngày hoàn thành khóa học → 01–31/07/2027` thì **có**; chọn `Tất cả tình trạng` cùng khoảng ngày tháng 7/2027 thì **không có**.
2. QĐ 13/10/2026, kết thúc dự kiến 14/01/2027: lọc tháng 7/2027 ở chế độ đặc biệt thì **không có**.
3. Ngày kết thúc 01/07/2027 và 31/07/2027 đều được tính; 30/06 hoặc 01/08 không được tính; ngày kết thúc trống hoặc sai thì không được tính.
4. `Năm quyết định = 2026`, ngày kết thúc tháng 7/2027 có thể xuất hiện; `Năm quyết định = 2027` không lẫn hồ sơ QĐ năm 2026.
5. Hai ngày đều trống/ chỉ Từ ngày/ chỉ Đến ngày; `Từ ngày > Đến ngày`, ngày không hợp lệ; mọi lỗi không làm mất số liệu đang xem.
6. Với bộ lọc đặc biệt, `overview.kpi.total`, bản Excel danh sách, số tổng của ma trận trường/nghề và số tổng trong bản in phải bằng nhau cho cùng phạm vi quyền/bộ lọc; giữ đúng nội dung chỉ tiêu.
7. Trả về tình trạng `Đã tham gia`, `Đang học`, `Bỏ học`, `Không tham gia`, `Không nhận Quyết định`, `Chưa xác nhận`: vẫn lọc theo `NGAY_QUYET_DINH`, không lẫn logic ngày kết thúc.
8. Quay menu, F5, chọn lịch, đổi bộ lọc nhanh; cache không trả chéo hai chế độ. Khi hồ sơ được cập nhật ngày kết thúc, báo cáo đã cache phải hết hạn hoặc invalidation chính xác, không đọc số liệu cũ như mới.
9. Kiểm thử ADMIN/NHAN_VIEN/CO_SO_DAO_TAO, xuất Excel đúng quyền; chạy kiểm thử hồi quy v1.2.13-RC, đặc biệt `tests/browser_yc023_mock.py`, `tests/yc023-ui.test.js`, các bài xlsx.
10. Chỉ báo số bài kiểm thử thực sự đạt sau khi chạy; không tuyên bố kiểm tra production nếu không có quyền truy cập.

## V. Bàn giao khi người dùng CHỐT

- Sửa đúng các file cần thiết: dự kiến `public/app.js`, `apps-script/Code.gs`, test mới; giữ `public/xlsx-export.js` và style Excel đã nghiệm thu.
- Giao **ZIP GitHub hoàn chỉnh**, **Code.gs đầy đủ**, hướng dẫn triển khai cả GitHub/Vercel + phiên bản mới Apps Script, báo cáo kiểm thử và quy trình hoàn tác.
- Chỉ cập nhật source sau khi **CHỐT YC-HN-024 V1**, không tự deploy trên môi trường đang vận hành.

**TRẠNG THÁI: YC-HN-024 V1 — ĐÃ CHỐT VÀ HOÀN THÀNH MÃ NGUỒN v1.2.14-RC, CHƯA TRIỂN KHAI PRODUCTION.**


## VI. Kết quả triển khai sau CHỐT (22/10/2026)

- Bổ sung lựa chọn ảo `FILTER_COURSE_END_DATE` vào form Báo cáo, trợ giúp lịch đồng bộ, ghi rõ phạm vi đã áp dụng trên bảng và bản in.
- Đồng bộ Apps Script `reportStatusValid_`, `reportFilters_`, `reportRecords_` để loại bỏ tiền lọc sai theo Ngày QĐ khi đang chọn ngày kết thúc dự kiến.
- Các chỉ tiêu thống kê trạng thái là thống kê tình trạng thực tế *trên tập hồ sơ sau lọc*, không phải chứng nhận tốt nghiệp.
- Giữ nguyên `public/xlsx-export.js` (SHA-256 244d494d2cc9535dc631a1544409816f0502ba0f8ee17e7052c5d6c9e7f180dc).
- `npm test`: 163/163 đạt; Chromium mock đạt cho YC-HN-019, 020, 021 V5.2, 022, 023, 024; chưa kiểm tra production.
- Cần cập nhật **cả GitHub/Vercel và bản triển khai Apps Script**; lưu dự phòng/rollback v1.2.13-RC.

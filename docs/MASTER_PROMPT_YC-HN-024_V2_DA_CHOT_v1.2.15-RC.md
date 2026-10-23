# MASTER PROMPT — YC-HN-024 / V2 (TÍCH LŨY V1 + YÊU CẦU MỚI)

**Dự án:** THEO DÕI HỌC NGHỀ.  **Nguồn nền để sửa tiếp:** bản `v1.2.14-RC` được bàn giao ngày 22/10/2026 và hai ảnh người dùng gửi ngày 23/10/2026.

**Trạng thái:** **V1 ĐÃ CHỐT VÀ BÀN GIAO v1.2.14-RC. V2 ĐÃ CHỐT VÀ HOÀN THÀNH MÃ NGUỒN v1.2.15-RC; CHƯA TRIỂN KHAI PRODUCTION.**

**Ưu tiên áp dụng khi có xung đột:** yêu cầu V2 dưới đây ghi đè yêu cầu V1 về khung hướng dẫn màu xanh trong `Tổng hợp kết quả` và bổ sung chỉ tiêu mới; các cơ chế lọc và nghĩa chuyên môn V1 giữ nguyên.

---

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

---

# VI. YÊU CẦU BỔ SUNG V2 — THÊM HÀNG THỐNG KÊ “NGÀY HOÀN THÀNH KHÓA HỌC”, BỎ KHUNG HƯỚNG DẪN MÀU XANH

**Ngày ghi nhận:** 23/10/2026. **Nguồn:** hai ảnh từ bản v1.2.14-RC đang hiển thị tại `Báo cáo → Tổng hợp kết quả`. Người dùng yêu cầu hiển thị số liệu ở một hàng mới **“Ngày hoàn thành khóa học”** dưới bảng và **bỏ khung hướng dẫn màu xanh** bắt đầu bằng “Thống kê các hồ sơ có ngày kết thúc đào tạo dự kiến trong khoảng đã chọn…”.

## VI.1. Đối chiếu source v1.2.14-RC đã kiểm tra trực tiếp

- `public/app.js`, `reportKpiRows(k,extra)` (khoảng dòng 541): đang tạo các hàng `Tổng số Quyết định`, `Đã tham gia`, `Bỏ học`, `Không tham gia`, `Không nhận Quyết định`, `Chưa xác nhận`, `Tình trạng khác` (nếu có). **Chưa có chỉ tiêu Ngày hoàn thành khóa học.** Hàm này được dùng cho **cả** bảng thống kê trên web và lựa chọn **Báo cáo tổng hợp** khi xuất Excel.
- `public/app.js`, `reportCourseEndScope(filters)` (khoảng dòng 542–546) sinh thẻ `<p class="report-course-end-note">` màu xanh. `renderReports()` chèn thẻ này trước `<div class="table-wrap">`. `public/styles.css` có `.report-course-end-note` và luật in riêng cho nó. **Đây chính là khung cần bỏ.**
- `apps-script/Code.gs`, `overview_(user,p)` (khoảng dòng 944–962) lọc dữ liệu đúng theo quyền, thời gian, tình trạng và trả `kpi`/`statusCounts`. `kpi` chưa có trường đếm hồ sơ có ngày kết thúc dự kiến hợp lệ. Backend hiện đã hiểu `FILTER_COURSE_END_DATE` trong `recordMatches_`, `reportFilters_`, `reportRecords_`; không được phá luồng này.
- Lưu ý: trong ảnh, khi chọn chế độ mới mà **chưa đặt ngày**, số `Tổng số Quyết định` đang là `2.433`. **Không** được mặc nhiên gán `2.433` cho “đã tốt nghiệp thực tế”. Giá trị phải được tính từ trường `NGAY_KET_THUC_DU_KIEN` của dữ liệu đã qua bộ lọc.

## YC-024.05 — Thêm hàng thống kê mới dưới danh sách chỉ tiêu (P0)

1. Trong **Báo cáo học nghề → Tổng hợp kết quả**, luôn có một hàng mang nhãn chính xác **`Ngày hoàn thành khóa học`** sau các chỉ tiêu hiện hành (có thể xếp sau `Tình trạng khác` nếu dòng này xuất hiện). Cột số lượng hiển thị như các hàng cũ, cùng font/căn lề/viền; không thêm một card lớn hay dòng diễn giải thay thế.
2. Đây là **chỉ tiêu bổ sung về lịch kết thúc đào tạo dự kiến**, **KHÔNG** là trạng thái học viên thật, **KHÔNG** chứng minh học viên đã tốt nghiệp. Không cộng chỉ tiêu này vào `Tổng số Quyết định` hoặc tổng các tình trạng; một hồ sơ có thể xuất hiện ở dòng `Đã tham gia`/`Bỏ học` và ở chỉ tiêu lịch kết thúc.
3. **Quy tắc đếm nhất quán theo tập hồ sơ đã lọc:**
   - Khi người dùng chọn `Tình trạng = Ngày hoàn thành khóa học` và nhấn `Lọc dữ liệu`, số lượng hàng này là số **hồ sơ có `NGAY_KET_THUC_DU_KIEN` hợp lệ nằm trong `Từ ngày`–`Đến ngày` đã áp dụng** (bao gồm hai đầu mút), đồng thời thỏa năm QĐ/cơ sở/nghề/quyền. Trong chế độ này, **số đếm bằng `overview.kpi.total`**, vì cả tập đã lọc chính là tập có ngày kết thúc hợp lệ trong phạm vi.
   - Khi ở tình trạng khác hoặc `Tất cả tình trạng`, hàng mới vẫn hiển thị; số đếm bằng **số hồ sơ thuộc chính tập kết quả đang thống kê có `NGAY_KET_THUC_DU_KIEN` hợp lệ**. Trong các chế độ đó, `Từ ngày`–`Đến ngày` vẫn lọc **Ngày ban hành QĐ** theo V1, **không** tự đổi sang lọc ngày kết thúc. Không mô tả số đếm này như số hoàn thành khóa trong khoảng nếu chế độ chưa được chọn.
   - Khi ở chế độ mới nhưng để trống cả hai lịch, đếm tất cả hồ sơ có ngày kết thúc dự kiến hợp lệ sau các bộ lọc còn lại; không tự suy luận tháng hiện tại, không tạo ngày khi hồ sơ thiếu dữ liệu.
4. Dùng cùng một kết quả backend đã xác minh theo quyền để tính; không gọi thêm API riêng chỉ để làm dòng thống kê. Không dựa vào số dòng của trang Hồ sơ 20 bản ghi để suy ra kết quả toàn hệ thống.
5. Với nhãn `Ngày hoàn thành khóa học`, sử dụng `title`/`aria-label` ngắn nếu cần để làm rõ ý nghĩa là **ngày kết thúc dự kiến**, nhưng **không thêm trở lại khung hướng dẫn màu xanh hay hàng diễn giải dài**.

## YC-024.06 — Xóa đúng khung hướng dẫn dưới “Tổng hợp kết quả” (P0)

1. Bỏ việc chèn `reportCourseEndScope(state.reportFilters)` vào phần bảng thống kê `renderReports()`; không hiển thị câu `Thống kê các hồ sơ có ngày kết thúc đào tạo dự kiến trong khoảng đã chọn. Phạm vi ngày ... Đây không phải số người đã tốt nghiệp.` ở vị trí hiện có.
2. Dọn hàm/CSS `.report-course-end-note` nếu hết nơi sử dụng. **Không xóa** bộ chọn `Ngày hoàn thành khóa học`, không xóa lời chú thích ngắn nằm ngay dưới lịch chọn ngày của bộ lọc trừ khi có yêu cầu riêng; hai vùng này khác nhau.
3. Theo yêu cầu in báo cáo đã chốt V1: không đưa lại **khung màu xanh** vào bản in. Nếu cần ghi nhận khoảng ngày đã áp dụng trong bản in, dùng **một dòng metadata ngắn, trung tính ở phần tiêu đề in**, không xuất hiện như khung giải thích trên màn hình, không lấy giá trị ngày đang nhập chưa bấm Lọc. Không bắt buộc tăng thêm thành phần hiển thị trên trang web.

## YC-024.07 — Đồng bộ backend `overview_` và xuất Excel Báo cáo tổng hợp (P0)

1. Trong `apps-script/Code.gs`, `overview_` bổ sung một trường chỉ tiêu rõ nghĩa, ví dụ `k.courseEndScheduled` / `courseEndDateCount`; đếm trên `all` đã được `reportRecords_` lọc quyền và bộ lọc. Kiểm tra định dạng ngày hợp lệ bằng hàm chuẩn hiện có, không dựa vào `Boolean()` của chuỗi ngày tùy ý.
2. Không thay đổi `k.total`, `participated`, `learning`, `dropout`, `notParticipating`, `pending` hoặc `statusCounts`; không thêm trạng thái mới vào Google Sheets, không đổi công thức KPI, không sửa `PHIEN_BAN`, `NHAT_KY`, cấp quyền, lưu hồ sơ.
3. Cập nhật `reportKpiRows()` dùng trường mới trong cả bảng **Tổng hợp kết quả** và file **Báo cáo tổng hợp (Chỉ tiêu / Số lượng)**. Kiểm tra lại việc hiển thị giá trị `0`; không tự hiện `—` khi giá trị thực là 0.
4. Các mẫu `Danh sách 25 cột`, `Báo cáo theo cơ sở`, `Báo cáo theo nghề` giữ nguyên cột/sơ đồ tính; tiếp tục nhận đúng tập lọc đã chốt V1. **Không chỉnh `public/xlsx-export.js`** đã nghiệm thu, trừ khi có lỗi trực tiếp liên quan và phải báo rõ.
5. Duy trì khoá cache theo data revision, quyền, status, from, to; cache dữ liệu cũ phải không gây thiếu trường chỉ tiêu mới sau cập nhật deployment. Không lưu PII trên public cache/CDN.

## YC-024.08 — Kiểm thử nghiệm thu V2

1. Trạng thái `Ngày hoàn thành khóa học`, 01–31/07/2027, với dữ liệu giả lập: hồ sơ kết thúc 01/07, 14/07, 31/07 có; 30/06, 01/08, thiếu/sai ngày không có. Hàng mới phải bằng **Tổng số Quyết định trong tập lọc**; các hàng tình trạng cũ vẫn phản ánh đúng tập hồ sơ đó.
2. Đổi sang `Tất cả tình trạng` với cùng khoảng ngày: quyết định được lọc theo ngày QĐ; hàng mới đếm số hồ sơ **trong tập đang xem** có ngày kết thúc dự kiến hợp lệ, không nhầm số hoàn thành trong tháng. Không thay nghĩa các bộ lọc cũ.
3. Không chọn hai ngày ở chế độ đặc biệt: hàng mới đếm mọi hồ sơ có ngày kết thúc dự kiến hợp lệ theo quyền và filter năm/trường/nghề; không tự ghi nhận tốt nghiệp.
4. Đảm bảo bảng thống kê luôn có đúng hàng mới, không có `.report-course-end-note` / khung xanh; xuất `Báo cáo tổng hợp` có cùng hàng và số; bản in trình bày gọn và không có banner.
5. Bộ lọc ngày áp dụng bao gồm hai đầu mút, chỉ Từ hoặc chỉ Đến, khoảng sai báo lỗi; đổi nhanh bộ lọc và refresh trang không trả kết quả/cache của chế độ cũ.
6. Tài khoản ADMIN/NHAN_VIEN/CO_SO_DAO_TAO đúng quyền; 4 mẫu Excel không mất định dạng/khác tổng; Xuất Excel danh sách 25 cột vẫn đúng chuẩn đã CHỐT; tổng hợp, ma trận cơ sở/nghề không bị cộng trùng hàng mới.
7. Chạy lại bộ 163 bài kiểm thử nền (nếu môi trường đủ) và kiểm thử Chromium với 3 vai trò; ghi số liệu kiểm thử **thực chạy** và giới hạn đo hiệu năng, không tuyên bố pass khi chưa làm.

## VI.2. Bảo toàn và trạng thái

- **Bảo toàn:** `v1.2.14-RC` đã bàn giao, lọc theo ngày kết thúc tại cả Hồ sơ và Báo cáo, phân quyền, chốt Excel 25 cột, cập nhật cục bộ sau lưu, báo cáo ma trận/in, không thêm tab/cột Google Sheets, không thay công thức tháng bỏ học chưa chốt.
- **Chờ CHỐT riêng V2:** chưa sửa `public/app.js`, `public/styles.css`, `apps-script/Code.gs`, chưa chạy test V2, chưa triển khai GitHub/Vercel hoặc Apps Script.
- Sau khi người dùng **CHỐT V2**, bàn giao ZIP GitHub đầy đủ, `Code.gs` toàn bộ, changelog, kiểm thử mới/hồi quy và hướng dẫn triển khai staging → rollback.

**TRẠNG THÁI TỔNG: YC-HN-024 V2 — ĐÃ CHỐT, ĐÃ BÀN GIAO MÃ NGUỒN v1.2.15-RC, CHƯA DEPLOY PRODUCTION.**

---

## VII. KẾT QUẢ THỰC HIỆN SAU CHỐT — 23/10/2026

**Bản mới:** `v1.2.15-RC`; nền nguyên bản `v1.2.14-RC`.

1. `apps-script/Code.gs`: trong `overview_()` thêm số đếm `kpi.courseEndScheduled`, xét ngày ISO hợp lệ từ `NGAY_KET_THUC_DU_KIEN` trên **tập `reportRecords_` đã lọc quyền, ngày, tình trạng, năm, cơ sở, nghề**. Khi lọc `FILTER_COURSE_END_DATE`, số mới bằng `kpi.total`. Không phát sinh truy vấn riêng, không thêm trạng thái thật, không sửa thống kê trạng thái cũ.
2. Cache `OVERVIEW` được phân biệt thế hệ bằng ký hiệu `COURSE_END_KPI_V2` bên cạnh các chiều phân quyền/revision/filter đang có, tránh trả về bản cache 90 giây của chương trình cũ thiếu trường.
3. `public/app.js`: hàm `reportKpiRows()` luôn thêm hàng cuối `Ngày hoàn thành khóa học` (sau `Tình trạng khác` nếu có); hàm này được dùng chung trong **Tổng hợp kết quả trên web** và **Báo cáo tổng hợp dạng Excel**. Dòng số `0` vẫn hiển thị là `0`.
4. Xóa khung giải thích màu xanh `.report-course-end-note` khỏi phần thống kê; chỉ giữ metadata ngắn, ẩn trên màn hình và hiện khi in trong chế độ ngày kết thúc dự kiến. Dòng trợ giúp nhỏ dưới hai lịch vẫn giữ.
5. Giữ nguyên `public/xlsx-export.js` — SHA-256: `244d494d2cc9535dc631a1544409816f0502ba0f8ee17e7052c5d6c9e7f180dc`.
6. Cập nhật nhãn phiên bản `v1.2.15-RC`, điều chỉnh bài kiểm thử cũ có kỳ vọng cố định sáu KPI và thêm kiểm tra ngày không hợp lệ, quyền và Excel tổng hợp.

**Đã kiểm thử:** `npm test` 165/165 đạt; `npm run check` đạt; Chromium mock các nhóm ADMIN/NHAN_VIEN/CO_SO_DAO_TAO đạt cho YC-HN-021, 022, 023, 024. **Giới hạn:** Chưa đo trên Google Sheets/Vercel production, chưa thao tác triển khai ngoài hệ thống, chưa dùng người dùng thật để kiểm thử phân quyền.

**Triển khai:** Sao lưu `v1.2.14-RC`; cập nhật `Code.gs` tại Apps Script và **Deploy phiên bản mới**; sau đó triển khai toàn bộ frontend lên GitHub/Vercel `v1.2.15-RC`, tải lại website và kiểm tra. Nếu rollback phải rollback cả backend và frontend tương ứng.

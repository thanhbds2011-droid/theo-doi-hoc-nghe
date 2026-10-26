# MASTER PROMPT — YC-HN-025 / V1 — ĐIỀU CHỈNH TÊN TÌNH TRẠNG, CƠ CHẾ LỌC CHỈ TIÊU VÀ CÁCH ĐẾM HOÀN THÀNH KHÓA HỌC

**Dự án:** THEO DÕI HỌC NGHỀ (GitHub/Vercel + Google Apps Script + Google Sheets).  
**Mã nguồn nền đã kiểm tra trực tiếp:** `THEO_DOI_HOC_NGHE_YC-HN-024_V2_v1.2.15-RC.zip` — `public/app.js`, `apps-script/Code.gs`.  
**Bằng chứng:** 4 ảnh giao diện v1.2.15-RC do người dùng gửi ngày 26/10/2026.  
**Trạng thái:** TẬP HỢP YÊU CẦU V1 — **CHỜ CHỐT; CHƯA SỬA MÃ NGUỒN/CHƯA DEPLOY**. Câu cuối trong yêu cầu gốc *“Tiếp theo tại phần chỉ tiêu. nếu chọn”* còn dang dở, không suy đoán thành chức năng khác.

## I. Thay đổi hiển thị đã được nêu rõ

### YC-025.01 — Đồng bộ nhãn ảo “Hoàn thành khóa học”
- Trang **Hồ sơ học nghề → Tình trạng**: đổi chữ hiển thị `Ngày hoàn thành khóa học` thành **`Hoàn thành khóa học`**.
- Trang **Báo cáo → Tình trạng**: đổi chữ tương ứng thành **`Hoàn thành khóa học`**.
- Bảng **Báo cáo → Tổng hợp kết quả → Chỉ tiêu**: đổi tên dòng `Ngày hoàn thành khóa học` thành **`Hoàn thành khóa học`**.
- Giữ mã lọc nội bộ `FILTER_COURSE_END_DATE` tạm thời để không phá dữ liệu và chức năng lọc đã triển khai; không tự biến mã lọc ảo thành `TRANG_THAI_THAM_GIA` trong Sheet. Cần phân định rõ việc đổi tên có kéo theo *đổi bản chất tập đối tượng được lọc* hay không (xem mục III).

### YC-025.02 — Thêm “Tổng số Quyết định đã ban hành” vào hai dropdown
- Bổ sung mục **`Tổng số Quyết định đã ban hành`** ở ô Tình trạng của **Hồ sơ học nghề** và **Báo cáo**.
- Trong bảng **Báo cáo → Tổng hợp kết quả**, đổi nhãn dòng `Tổng số Quyết định` thành **`Tổng số Quyết định đã ban hành`**.
- Đây là **lựa chọn lọc ảo** chứ không phải một tình trạng tham gia học viên: có thể sử dụng một sentinel riêng, ví dụ `FILTER_ALL_DECISIONS`, được server kiểm tra/chuẩn hóa thành *không giới hạn tình trạng*, tiếp tục áp dụng năm QĐ/trường/nghề/ngày/từ khóa và phạm vi quyền. Không ghi vào Sheet hoặc danh mục trạng thái thực tế.
- Khi chọn tại **Hồ sơ học nghề**, hiển thị tất cả hồ sơ/quyết định đang có quyền xem theo **những bộ lọc khác**; về mặt tập dữ liệu tương đương `Tất cả` nhưng làm rõ mục đích thống kê. Không tự mở rộng sang hồ sơ đã xóa mềm hoặc ngoài quyền.
- Khi chọn tại **Báo cáo**, chỉ hiển thị dòng chỉ tiêu `Tổng số Quyết định đã ban hành`, có tổng đếm theo đúng tập dữ liệu; không hiển thị các chỉ tiêu tình trạng còn lại.

### YC-025.03 — Bỏ “Đang học” tại bộ lọc trang Báo cáo
- Xóa **chỉ lựa chọn** `Đang học` khỏi dropdown Báo cáo; không xóa dữ liệu, không xóa `DA_THAM_GIA`, `learning` trong backend, không sửa mô hình trạng thái/nhật ký và không ảnh hưởng menu Hồ sơ nếu đang có tình trạng thực tế riêng.
- Các lựa chọn còn lại giữ nguyên thứ tự tương đối, label và quy tắc phân quyền, trừ thay đổi tên đã nêu.
- Xem xét chuyển trạng thái lọc đã lưu từ `DA_THAM_GIA` (nếu từng chọn `Đang học`) sang giá trị mặc định hoặc quy tắc tương thích rõ ràng, **không** âm thầm biến thành `Đã tham gia` vì hai tập này hiện có nghĩa khác nhau (`REPORT_PARTICIPATED_ALL` bao gồm bỏ học).

### YC-025.04 — Bảng chỉ tiêu thay đổi theo tình trạng áp dụng
- Nếu `Tình trạng = Tất cả tình trạng`: **hiển thị đầy đủ tất cả chỉ tiêu hiện có**, gồm Tổng số Quyết định đã ban hành, Đã tham gia, Bỏ học, Không tham gia, Không nhận Quyết định, Chưa xác nhận, Tình trạng khác (nếu có), Hoàn thành khóa học.
- Nếu chọn **một mục cụ thể**: **chỉ hiện một hàng chỉ tiêu trùng mục đã chọn**. Không hiển thị các hàng không được chọn; không đổi cấu trúc bảng hoặc tạo card riêng.
- Lưu ý giá trị `Đã tham gia` đang được báo cáo là `REPORT_PARTICIPATED_ALL`: gồm những hồ sơ `TRANG_THAI_THAM_GIA='DA_THAM_GIA'`, có thể bao gồm `DA_BO_HOC=true`. Giữ nghĩa cũ trừ khi được CHỐT quy tắc mới.
- Trường hợp chọn trạng thái tùy chỉnh, phải trả được số đếm đúng **trạng thái tùy chỉnh được chọn**, không dùng tổng `other` nếu tập có nhiều trạng thái tùy chỉnh khác nhau; xác minh cả backend/Excel.
- Dùng bộ lọc **đã áp dụng** sau khi nhấn Lọc dữ liệu, không dùng dropdown đang thay đổi nhưng chưa submit; bảo toàn ngày/năm/trường/nghề/quyền/caching.
- Nút Xuất Excel → `Báo cáo tổng hợp` và nút In phải phản ánh bảng chỉ tiêu **đang được hiển thị**, trừ khi có chỉ đạo khác ở phần yêu cầu dang dở. Hai ma trận theo trường/nghề và Excel 25 cột giữ nguyên mẫu và cách xuất dữ liệu.

## II. Phát hiện có chứng cứ trong v1.2.15-RC

- `public/app.js` khoảng dòng 349–355: `filterFields()` tạo hai dropdown riêng cho Hồ sơ và Báo cáo; Báo cáo hiện có `['REPORT_PARTICIPATED_ALL','Đã tham gia']`, `['DA_THAM_GIA','Đang học']`, và `COURSE_END_FILTER` với nhãn `Ngày hoàn thành khóa học`.
- `public/app.js` dòng ~541: `reportKpiRows(k,extra)` tạo **toàn bộ** hàng chỉ tiêu không xét tình trạng đang được chọn, bao gồm `['Tổng số Quyết định',k.total]` và `['Ngày hoàn thành khóa học',k.courseEndScheduled??0]`.
- `public/app.js` dòng ~548–555: `renderReports()` dùng `reportKpiRows()`; `exportModal` chế độ `summary` cũng dùng **cùng hàm**. Có thể điều chỉnh tập hàng **theo applied `state.reportFilters.status`** để website và Excel đồng bộ.
- `apps-script/Code.gs` dòng ~944–959: `overview_()` tính `k.total=all.length`, `k.participated` khi `TRANG_THAI_THAM_GIA==='DA_THAM_GIA'`, `k.dropout` khi đồng thời `DA_BO_HOC=true`; `k.courseEndScheduled++` chỉ khi **`NGAY_KET_THUC_DU_KIEN` là ngày hợp lệ**. Không kiểm người có tham gia hay bỏ học, cũng không xác định đã tốt nghiệp, nên số kết thúc dự kiến có thể bằng tổng 2.433 như ảnh.
- `recordMatches_`, `reportMatches_`, `reportRecords_` thực hiện kết hợp các bộ lọc tại backend. `FILTER_COURSE_END_DATE` hiện là chế độ tra cứu ngày kết thúc dự kiến và có thể lọc các **ngày trong tương lai**.
- Không có trường riêng trong danh sách 40 cột `HO_SO_HOC_NGHE` thể hiện **xác nhận đã hoàn thành/tốt nghiệp thực tế** hoặc ngày tốt nghiệp thực tế. `NGAY_KET_THUC_DU_KIEN` chỉ là ngày theo kế hoạch; trạng thái `DA_THAM_GIA` chưa đủ để chứng minh tốt nghiệp.

## III. Điểm NGHIỆP VỤ bắt buộc xác định trước khi sửa công thức “Hoàn thành khóa học”

**Không áp công thức “có ngày kết thúc dự kiến là đã hoàn thành” như phiên bản cũ** nếu người dùng yêu cầu số hoàn thành là **một phần của số đã tham gia**.

Có hai cách hiểu không tương đương:

**A. DỰ KIẾN HOÀN THÀNH trong kỳ (lọc kế hoạch):** Chỉ đếm hồ sơ `TRANG_THAI_THAM_GIA==='DA_THAM_GIA'`, `DA_BO_HOC` không phải true, `NGAY_KET_THUC_DU_KIEN` hợp lệ và trong khoảng chọn (hoặc tính toàn bộ khi không giới hạn ngày). Cho phép xem cả lịch các tháng tương lai như chức năng hiện hành. Đây **không phải số người đã tốt nghiệp thật**, cần chú giải ngắn trong title/tooltip hoặc tài liệu báo cáo. Nếu muốn thật chính xác về thuật ngữ, nên gọi `Dự kiến hoàn thành khóa học`; người dùng đang chọn nhãn `Hoàn thành khóa học`, cần xác nhận khả năng hiển thị nhãn ngắn mà vẫn định nghĩa là *dự kiến*.

**B. ĐÃ HOÀN THÀNH thực tế:** Phải có dữ liệu xác nhận hoàn tất/giấy chứng nhận hoặc **trường nghiệp vụ do cơ sở đào tạo xác nhận**; hệ thống **chưa có trường đó**. Không đủ căn cứ suy ra chỉ từ ngày dự kiến, trạng thái đã tham gia hay ngày hiện tại. Thực hiện B sẽ cần quyết định nghiệp vụ và có thể cần mở rộng dữ liệu (không tự ý thêm cột, tab, trường nhập trong YC-HN-025 V1).

**Bất đẳng thức:** Nếu định nghĩa số hoàn thành là tập con của số đã tham gia, luôn có `0 ≤ hoàn_thành ≤ đã_tham_gia`. Không thể đảm bảo **luôn nhỏ hơn nghiêm ngặt** (`<`) vì có thể tất cả người tham gia đều hoàn thành. **Tuyệt đối không trừ đi một người hoặc sửa số cho “nhỏ hơn” một cách nhân tạo**. Ngoài ra, `Không tham gia` không thể đồng thời thuộc tập `Đã tham gia`; `Bỏ học` trong code lại đang là nhóm con của `Đã tham gia` theo nghĩa hiện hành. Không tự thay các thống kê phân loại này nếu người dùng chưa xác định.

**Quan trọng cho filter:** Nếu chọn phương án A, chế độ `FILTER_COURSE_END_DATE` trên **cả Hồ sơ và Báo cáo** có thể phải thu hẹp tập kết quả thành *đã tham gia, không bỏ học, có ngày kết thúc dự kiến trong kỳ* để danh sách/đếm/Excel đồng nhất. Điều này là thay đổi nghiệp vụ so với YC-HN-023/024 và **chỉ được triển khai khi CHỐT rõ**. Nếu giữ bộ lọc cũ để tra tất cả lịch kết thúc còn hàng chỉ tiêu mới chỉ đếm tham gia không bỏ học, cần quy định hiển thị tổng và `Hoàn thành` khác nhau một cách nhất quán.

## IV. Nguyên tắc bảo toàn và nghiệm thu đề xuất

- Phân quyền `ADMIN`, `NHAN_VIEN`, `CO_SO_DAO_TAO` và dữ liệu của trường được thực hiện ở backend trước khi trả kết quả. Không tạo tình trạng vật lý `FILTER_*` trong Sheet; không sửa `PHIEN_BAN`, khóa ghi, nhật ký.
- Giữ Excel danh sách 25 cột (căn lề, wrap text, chiều cao dòng, ngày/giới tính), cập nhật cục bộ sau lưu, hiệu năng, cache và date picker đã nghiệm thu từ `v1.2.15-RC`.
- Không sửa nghiệp vụ tháng bỏ học 1...N chưa chốt quy tắc; không tự thêm tab/cột Google Sheets.
- Kiểm thử: `Tất cả` → tất cả chỉ tiêu; `Bỏ học` → chỉ một hàng đếm đúng; `Tổng số Quyết định đã ban hành` → chỉ dòng tổng; `Hoàn thành khóa học` → đúng định nghĩa sau CHỐT; bộ lọc ngày 1/7–31/7; năm/trường/nghề; trạng thái tùy chỉnh; tình trạng `Đang học` không còn trong dropdown **Báo cáo**; xuất Báo cáo tổng hợp và In khớp UI; 3 vai trò; quay menu/đổi lọc nhanh; Excel 25 cột không đổi; không thay dữ liệu thật.
- Sau khi CHỐT: chỉnh file cần thiết `public/app.js`, `apps-script/Code.gs` (nếu thay cách lọc/đếm); test mới; ZIP GitHub hoàn chỉnh + `Code.gs` đầy đủ + báo cáo kiểm thử thực chạy + hướng dẫn staging/rollback. Không tự deploy.

## V. Phần lời nhắn đang dang dở

Người dùng kết thúc thông điệp bằng: **“Tiếp theo tại phần chỉ tiêu. nếu chọn”**. Chưa có nội dung phía sau, nên **không suy luận thêm quy tắc nào**. Mọi bổ sung V2 từ người dùng sẽ được tích lũy vào prompt trước khi thay code.

**TRẠNG THÁI YC-HN-025 V1: CHỜ CHỐT TOÀN BỘ QUY TẮC NGHIỆP VỤ, CHƯA CHỈNH MÃ NGUỒN.**


---

## PHỤ LỤC KẾT QUẢ CHỐT 26/10/2026 — v1.2.16-RC

Người dùng nói CHỐT toàn Master Prompt nhưng tài liệu gốc có hai công thức A/B chưa được chọn và đoạn lời nhắn trước đó chưa hoàn tất. Triển khai phần giao diện/bộ lọc/chỉ tiêu đã xác định rõ, **KHÔNG tự xác nhận tốt nghiệp bằng lịch dự kiến**. Vì chưa có dữ liệu xác nhận, số lượng hàng `Hoàn thành khóa học` tạm là `Chưa có dữ liệu xác nhận hoàn thành`, không cộng vào tổng. Mã lọc ảo vẫn lọc ngày dự kiến theo YC-HN-023/024. Để hoàn tất nghiệp vụ còn thiếu phải chốt A/B.

Node.js 171/171 đạt, Chromium mock 3 vai trò đạt; chưa deploy. Xem Hướng dẫn YC-HN-025 V1.


---

# PHỤ LỤC V2 — QUY TẮC “HOÀN THÀNH KHÓA HỌC” ĐÃ ĐƯỢC NGƯỜI DÙNG LÀM RÕ

**Phiên bản triển khai:** `v1.2.17-RC`. **Nguồn nền:** v1.2.16-RC, bảo toàn những nội dung giao diện, lọc và phân quyền đã nghiệm thu.

## Quy tắc đã được xác định

Khi lọc `Hoàn thành khóa học` tại Hồ sơ học nghề hoặc Báo cáo, một hồ sơ chỉ được chọn khi **đồng thời**:

1. `TRANG_THAI_THAM_GIA === 'DA_THAM_GIA'` — đã tham gia học.
2. `DA_BO_HOC` là **false** — không thuộc nhóm bỏ học, kể cả trường hợp cơ sở đã đánh dấu tham gia trước khi bỏ học.
3. `NGAY_KET_THUC_DU_KIEN` (`Thời gian đào tạo – Đến ngày`) có giá trị ngày ISO hợp lệ.
4. Nếu có `Từ ngày`/`Đến ngày`, ngày kết thúc phải nằm trong khoảng tương ứng, **bao gồm cả hai ngày đầu mút**. Để trống cả hai ngày thì lấy tất cả hồ sơ đủ điều kiện, không tự mặc định tháng hiện tại.
5. Vẫn áp các bộ lọc năm QĐ/cơ sở/nghề/từ khóa (tại Hồ sơ) và **quyền tài khoản** như hiện hành.

Ví dụ 10 quyết định cùng có ngày dự kiến kết thúc 10/06/2026 nhưng chỉ một hồ sơ `Đã tham gia` và `Không bỏ học`: Báo cáo `Hoàn thành khóa học` tháng 6/2026 phải trả **1**, danh sách và các mẫu Excel cùng tập dữ liệu. Trạng thái Bỏ học, Chưa xác nhận, Không tham gia, Không nhận QĐ hoặc trạng thái tùy chỉnh không được tính dù có ngày kết thúc hợp lệ.

## Cách đếm và phạm vi thay đổi

- `reportRecords_` và `records_list` dùng cùng `courseEndEligible_(r)` để lọc; không được chỉ thay một hàng KPI.
- Trong `overview_` có trường `courseEndParticipated` tính **Đã tham gia + không Bỏ học + ngày kết thúc dự kiến hợp lệ** trong tập hồ sơ đã qua lọc. Khi áp `FILTER_COURSE_END_DATE`, `courseEndParticipated === kpi.total`.
- Trường `courseEndScheduled` cũ tiếp tục tồn tại nhằm tương thích đọc dữ liệu cũ; **không dùng số này để hiển thị Hoàn thành khóa học**.
- Bảng Tổng hợp kết quả (`reportKpiRows`) và `Báo cáo tổng hợp` xuất Excel đều hiển thị `courseEndParticipated` là **số**, không còn thông báo “Chưa có dữ liệu xác nhận hoàn thành”.
- Nếu vừa sửa ngày kết thúc, tình trạng hoặc cờ Bỏ học ở chế độ Hoàn thành khóa học thì chỉ **làm mới vùng danh sách** và phân trang, không dựng lại toàn trang.
- Giữ nguyên các bộ lọc tình trạng khác, phân loại tham gia cũ (bao gồm bỏ học trong tổng đã tham gia), kết quả Tổng số Quyết định đã ban hành, định dạng XLSX 25 cột, phân quyền và dữ liệu Google Sheets.

**Ranh giới nghiệp vụ:** Chỉ tiêu này là cách phân nhóm dựa trên tình trạng tham gia và *ngày kết thúc đào tạo dự kiến*. Chưa đủ căn cứ xác nhận học viên thực tế đã tốt nghiệp/nhận chứng chỉ. Không đổi `TRANG_THAI_THAM_GIA` thành một mã trạng thái mới và không tự điền dữ liệu.

**Đã thực hiện trên mã nguồn thử nghiệm:** Sửa `public/app.js`, `apps-script/Code.gs`; điều chỉnh kiểm thử cũ cho phù hợp quy tắc mới, bổ sung ca 10 quyết định → 1 hoàn thành. Định dạng `public/xlsx-export.js` không thay đổi. **Chưa triển khai production**.

# MASTER PROMPT — YC-HN-025 / V3 — ĐỒNG BỘ ĐẾM “HOÀN THÀNH KHÓA HỌC” GIỮA TẤT CẢ TÌNH TRẠNG VÀ LỌC RIÊNG

**Dự án:** THEO DÕI HỌC NGHỀ (GitHub/Vercel + Apps Script + Google Sheets).  
**Mã nguồn nền:** `THEO_DOI_HOC_NGHE_YC-HN-025_V2_v1.2.17-RC.zip`; kiểm tra trực tiếp `public/app.js`, `apps-script/Code.gs`.  
**Nguồn yêu cầu:** Hai ảnh giao diện người dùng cung cấp ngày 26/10/2026; **trạng thái: ĐÃ CHỐT V3, ĐÃ SỬA MÃ NGUỒN v1.2.18-RC, CHƯA DEPLOY**.

## I. Hiện tượng đã đối chiếu

Cùng chọn **Từ 01/01/2026 đến 30/04/2026**, với các bộ lọc năm, trường, nghề ở mức Tất cả:

| Tình trạng áp dụng | Ngày dùng lọc hiện tại | Dòng “Hoàn thành khóa học” |
| --- | --- | ---: |
| Tất cả tình trạng | `NGAY_QUYET_DINH` | **516** |
| Hoàn thành khóa học | `NGAY_KET_THUC_DU_KIEN` | **45** |

Khi Tất cả tình trạng, báo cáo còn cho `Tổng số Quyết định đã ban hành = 692`, `Đã tham gia = 529`, `Bỏ học = 13`, `Chưa xác nhận = 163`. Số 516 tình cờ bằng 529 − 13 trong nhóm quyết định ban hành trong kỳ; **không** phản ánh ngày kết thúc đào tạo thuộc kỳ.

**Nguyên nhân xác định từ source:**
- `apps-script/Code.gs`, `recordMatches_`: khi `status===COURSE_END_FILTER_`, lọc `NGAY_KET_THUC_DU_KIEN`; khi không, lọc `NGAY_QUYET_DINH`.
- `overview_` thực hiện `var all=reportRecords_(filters,user,false)` rồi tăng `k.courseEndParticipated` bằng `courseEndEligible_(r)` cho từng `r` thuộc `all`. Trong chế độ Tất cả, `all` đã được giới hạn bằng **Ngày QĐ**, chứ không phải bằng ngày kết thúc đào tạo.
- `courseEndEligible_(r)` kiểm `TRANG_THAI_THAM_GIA==='DA_THAM_GIA'`, `!DA_BO_HOC`, và ngày kết thúc dự kiến hợp lệ. Logic đối tượng **đúng**, nhưng trường ngày dùng để chọn tập thống kê không đúng khi ở Tất cả.
- `public/app.js`, `reportKpiRows(k,extra,appliedStatus)` luôn lấy giá trị hàng này từ `k.courseEndParticipated`. Giao diện không tự tính giá trị, lỗi nằm ở tập nguồn của chỉ tiêu trong backend.

## II. Yêu cầu khắc phục (đề nghị người dùng CHỐT)

### YC-025.V3.01 — Đồng nhất nghĩa và kết quả của “Hoàn thành khóa học”

1. **Trong mọi chế độ có hiển thị hàng chỉ tiêu “Hoàn thành khóa học”**, con số luôn đếm những hồ sơ đồng thời:
   - `TRANG_THAI_THAM_GIA==='DA_THAM_GIA'`;
   - `DA_BO_HOC` **không** true;
   - `NGAY_KET_THUC_DU_KIEN` hợp lệ và thuộc **Từ ngày – Đến ngày** đã áp dụng, bao gồm cả hai đầu mút;
   - đáp ứng năm quyết định (`NAM_QUYET_DINH`), cơ sở, nghề và phạm vi được cấp quyền.
2. **Không** yêu cầu `NGAY_QUYET_DINH` thuộc khoảng ngày này chỉ để tính hàng “Hoàn thành khóa học”. Năm quyết định khi người dùng chọn riêng vẫn áp dụng bình thường.
3. Nếu hai lịch trống, đếm toàn bộ hồ sơ đủ điều kiện có ngày kết thúc hợp lệ sau các bộ lọc phụ; nếu chỉ nhập một đầu mút, lọc một phía; giá trị ngày không hợp lệ bị từ chối như phiên bản hiện hành.
4. `Tất cả tình trạng` và `Hoàn thành khóa học` với **cùng khoảng ngày, cùng năm/trường/nghề/quyền** phải trả về **đúng cùng một số tại chỉ tiêu “Hoàn thành khóa học”**. Với dữ liệu trên ảnh của người dùng, số cần đối chiếu dự kiến là **45 ở cả hai màn**, miễn không có thay đổi dữ liệu và bộ lọc khác giữa hai lần xem.
5. Đây là **hoàn thành dự kiến theo dữ liệu lịch đào tạo**, không phải có chứng nhận tốt nghiệp; không đưa trạng thái ảo vào Sheet.

### YC-025.V3.02 — Không đổi ý nghĩa các chỉ tiêu còn lại

1. Trong `Tất cả tình trạng`, **Tổng số Quyết định đã ban hành, Đã tham gia, Bỏ học, Không tham gia, Không nhận Quyết định, Chưa xác nhận** vẫn tính trong tập có **Ngày ban hành QĐ** thuộc khoảng lọc (và các bộ lọc khác).
2. Khi chọn riêng `Hoàn thành khóa học`, vẫn chỉ một hàng chỉ tiêu hiện ra, thống kê ngày kết thúc dự kiến; không khôi phục các hàng đã được ẩn theo YC-HN-025 V1.
3. Lưu ý **bảng Tất cả sử dụng hai quy tắc ngày khác nhau theo từng chỉ tiêu**. Thêm `title` ngắn trên hàng hoàn thành, ví dụ `Đếm theo Thời gian đào tạo – Đến ngày; chỉ Đã tham gia, không Bỏ học`, tránh khung hướng dẫn dài/khung xanh đã yêu cầu bỏ. Không cộng “Hoàn thành khóa học” vào tổng trạng thái hoặc ngầm coi nó là một phần số quyết định ban hành trong kỳ.
4. Vì mẫu số khác kỳ ngày, **không yêu cầu** số Hoàn thành khóa học trong kỳ nhỏ hơn hoặc bằng Đã tham gia của **các quyết định ban hành cùng kỳ**; giới hạn tập con chỉ đúng khi hai chỉ tiêu tính trên cùng tập hồ sơ. Không sửa giả số để giữ bất đẳng thức giả.

### YC-025.V3.03 — Sửa ở backend, giữ các luồng khác

1. Ưu tiên sửa `apps-script/Code.gs` trong `overview_`: tính riêng `courseEndParticipated` theo **cùng user và cùng bộ lọc năm/trường/nghề/ngày nhưng chế độ `COURSE_END_FILTER_`**, bất kể `filters.status` hiện đang là Tất cả. Nếu chế độ đang là `COURSE_END_FILTER_`, có thể sử dụng ngay `all.length` vì `recordMatches_` đã áp đúng điều kiện.
2. Hạn chế hai lần đọc Google Sheets: có thể thu tập hồ sơ có quyền một lần rồi chạy hai phép lọc trong RAM hoặc tái sử dụng snapshot/cache đã có; chỉ làm nếu giữ nguyên tính chính xác, quyền và hiệu năng. Không thêm request frontend riêng, tab Sheet, cột hay cơ sở dữ liệu mới.
3. Cập nhật salt/version cache `OVERVIEW` để kết quả cũ (516) không bị trả về sau triển khai. Vẫn phải kiểm quyền và phiên bản dữ liệu.
4. `public/app.js` hiện đã dùng `k.courseEndParticipated` cho bảng và Excel Báo cáo tổng hợp; chỉ chỉnh frontend nếu cần tooltip/chú giải ngắn, không thay phần `public/xlsx-export.js` đã nghiệm thu.
5. Khi xuất **Báo cáo tổng hợp** và **In báo cáo**, dòng Hoàn thành phải đồng nhất với màn hình trong chế độ Tất cả; các danh sách/ma trận xuất theo phạm vi đã chốt trước đó, không tự đổi cấu trúc và các điều kiện lọc. Màn **Hồ sơ học nghề** khi chọn riêng Hoàn thành tiếp tục lọc theo ngày kết thúc và đối tượng đủ điều kiện như v1.2.17-RC.

## III. Kiểm thử nghiệm thu

1. Dữ liệu thử gồm 10 hồ sơ: có đủ trường hợp ngày QĐ trong kỳ nhưng kết thúc ngoài kỳ, ngày QĐ ngoài kỳ nhưng kết thúc trong kỳ, Đã tham gia/Đã bỏ học/Chưa xác nhận/Không tham gia và ngày kết thúc không hợp lệ.
2. `Tất cả tình trạng`, từ 01/01/2026 đến 30/04/2026: hàng Tổng số/Đã tham gia/… tính theo Ngày QĐ, **hàng Hoàn thành** tính theo ngày kết thúc.
3. `Hoàn thành khóa học`, cùng hai ngày/các filter phụ: chỉ hiển thị đúng hàng Hoàn thành; **giá trị bằng hàng Hoàn thành trong chế độ Tất cả**.
4. Thử ranh giới 01/01 và 30/04, một đầu mút, hai ngày trống, năm quyết định khác năm kết thúc, giới hạn cơ sở/nhóm nghề, role ADMIN/NHAN_VIEN/CO_SO_DAO_TAO, cache revision.
5. Sau cập nhật hồ sơ làm thay đổi tình trạng, cờ Bỏ học hoặc ngày kết thúc, cache thống kê hết hạn đúng; số liệu không lấy nhầm phạm vi hồ sơ khác trường.
6. Xuất Excel Báo cáo tổng hợp và in: số chỉ tiêu Hoàn thành trùng màn hình; Excel danh sách 25 cột giữ căn lề, Wrap Text và chiều cao đúng mẫu đã CHỐT; không thay đổi dữ liệu thực.
7. Chạy lại bộ kiểm thử nền v1.2.17-RC, thêm test V3; báo số thực đạt, phân biệt mock và production.

## IV. Quy trình thực hiện khi CHỐT

Sửa có kiểm soát `apps-script/Code.gs`, ít nhất test backend tương ứng, có thể chỉnh `public/app.js` cho tooltip ngắn nếu cần. Giao ZIP GitHub đầy đủ, Code.gs toàn bộ, changelog, kiểm thử và hướng dẫn Apps Script deployment/staging/rollback. Không tự deploy. **YC-HN-025 V3 ĐÃ CHỐT — đã hoàn thiện v1.2.18-RC, chưa deploy.**


## V. Kết quả triển khai V3 (26/10/2026)

- Đã cập nhật `overview_()` tính độc lập `courseEndParticipated` theo ngày kết thúc; giữ các chỉ tiêu khác theo ngày QĐ.
- Dùng một tập snapshot đã xác minh quyền cho hai nhánh thống kê; salt cache mới.
- `npm test`: 173/173 bài đạt; bốn kiểm thử Chromium liên quan đạt; giữ nguyên `xlsx-export.js`.
- Bàn giao `v1.2.18-RC` và hướng dẫn triển khai staging/rollback; chưa deploy production.

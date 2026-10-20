# THEO DÕI HỌC NGHỀ — YC-HN-013 V8.1 — v1.2.0-RC

**Tình trạng:** Đã chỉnh sửa mã nguồn trong bản giao để chạy **kiểm thử trên bản sao**, **chưa triển khai website/Vercel/Apps Script**, **chưa sửa Google Sheets hoặc Google Drive thật**. Nền đối chiếu: v1.1.7-RC / YC-HN-012, được triển khai theo bản đặc tả tích lũy V8.1.

## A. Phạm vi đã thực hiện trong mã nguồn

1. **Phân quyền một Gmail–một trường:** vai trò `CO_SO_DAO_TAO`; một Gmail có một `TRUONG_ID`, một trường có thể có nhiều Gmail; quản trị viên gán trường tại trang Quản lý tài khoản. Trường chỉ xem hồ sơ, chi tiết, xem tệp sẵn có và cập nhật tình trạng của trường; không nhập Excel, sửa/xóa hồ sơ gốc, quản lý tài khoản/danh mục hoặc xuất Excel. Backend kiểm tra quyền riêng ở mỗi yêu cầu và theo từng hồ sơ; `TAO_BOI` giữ lịch sử người tạo. Tài khoản `NHAN_VIEN` trước đây được giữ nguyên, **không tự chuyển vai trò hoặc cấp trường**.
2. **Tìm số quyết định:** `67`, `067`, `0067` khớp số quyết định 67 sau chuẩn hóa; không trả các số 167/6267/670. Truy vấn có chữ vẫn tìm theo từ khóa. Bộ lọc theo năm và quyền của người dùng luôn áp dụng.
3. **Tình trạng:** đổi nhãn hiển thị `Đã tham gia học`, thêm `Không nhận quyết định`, ô `Khác` cho nhập tên và lưu cấu hình dùng chung, chống trùng tên. Giữ `KHONG_THAM_GIA` với nhãn duy nhất **Không tham gia**. Không âm thầm cộng trạng thái mới vào Chưa xác nhận.
4. **Bỏ học theo kỳ tháng:** tình trạng Bỏ học chọn `Tháng thứ n` và lý do. Giá trị mới lưu dạng `KY:n` ở trường kỹ thuật cũ `NGAY_BO_HOC` (không thêm cột). Hồ sơ cũ còn giá trị ngày ISO vẫn được giữ và nhận biết riêng, không di trú tự động. Dữ liệu mới nhập trực tiếp phải theo kỳ hợp lệ. **Riêng file Excel lịch sử có ngày bỏ học vẫn có đường đọc tương thích**. Khóa có tháng lẻ hoặc thiếu số tháng hỗ trợ không bị tự suy luận.
5. **Nhập Excel:** phản hồi tức thời ở nút Kiểm tra dữ liệu, tiến độ qua từng đợt; các dòng có dữ liệu nhưng thiếu trường không bị bỏ qua; kiểm soát trùng theo từng dòng; nhập theo lô có đánh dấu phần đã hoàn tất trong phiên modal. Chỉ admin được nhập.
6. **Hiệu năng/cảm giác phản hồi:** tái sử dụng dữ liệu/trang đã xem trong phiên khi còn hợp lệ; cache snapshot Google Sheets theo revision và phân mảnh trong CacheService với fallback đọc Sheets nếu thiếu chunk; cập nhật badge sau máy chủ xác nhận, hạn chế xóa cache toàn cục. Tài khoản trường ưu tiên kiểm tra lại quyền, không dùng page cache dài. Chưa có số liệu benchmark thực trên dữ liệu thật.
7. **Báo cáo:** nhãn **Tổng số Quyết định**, loại bớt câu diễn giải, in A4 chỉ tiêu đề và bảng số liệu. Nút Xuất Excel trên trang Báo cáo có **danh sách 25 cột**, **bảng Chỉ tiêu/Số lượng**, **bảng theo Cơ sở đào tạo**, **bảng theo Nghề đào tạo**. Các bảng ma trận có STT, nhóm, tổng số quyết định và số lượng tình trạng; bộ lọc năm/trường/nghề; ô số XLSX là kiểu số Excel, không chứa thông tin cá nhân. Có thể thêm cột `Tình trạng khác` khi dữ liệu cần để tránh bỏ sót. Nút Xuất Excel ở Hồ sơ vẫn xuất danh sách như trước.
8. **Ngày:** bảng chi tiết chuyển ngày ISO sang `dd/mm/yyyy`, giới tính hiển thị tiếng Việt; ngày nội bộ API/Sheet tiếp tục ISO. Các ô `<input type="date">` ở form Thêm/Sửa vẫn dùng điều khiển ngày native, **cách vẽ có thể phụ thuộc locale trình duyệt**; xem mục C.

**Các file trọng tâm đã sửa:** `apps-script/Code.gs`, `public/app.js`, `public/styles.css`, `public/index.html`, `public/xlsx-export.js`, `package.json`, các bài kiểm thử `tests/backend.test.js`, `tests/ui-yc005.test.js`, `tests/ui-yc006.test.js` và `tests/yc013-excel.test.js`. Những file hệ thống khác trong ZIP được giữ làm thành phần đầy đủ, không thay kiến trúc proxy hay yêu cầu bí mật.

## B. Kết quả kiểm thử có thể xác nhận

- `npm run check` — **đạt** (kiểm tra cú pháp JavaScript ở proxy và frontend).
- `npm test` — **92/92 đạt**: giữ phạm vi **87 bài nền** (các bài có kỳ vọng cũ về nhãn/phiên bản/ngày bỏ học được cập nhật theo nghiệp vụ V8.1) và thêm 5 bài cho yêu cầu mới.
- Mẫu XLSX ma trận được tạo bằng hàm xuất trong `public/xlsx-export.js`; kiểm tra container ZIP/XML và định dạng ô số; không có bằng chứng rằng đã được thử trực tiếp trên Microsoft Excel/WPS thực trên máy người dùng.
- Kiểm thử backend dùng **mô phỏng Apps Script + Sheet/Cache/Drive**. Chưa kiểm thử đồng thời nhiều tài khoản trên hạ tầng Google thật; kết quả **không tương đương nghiệm thu production**.

## C. Giới hạn/điều kiện chưa thể nghiệm thu toàn phần

1. **Tốc độ và quota trên 3.000–5.000 hồ sơ thật:** chưa đo GAS/Vercel/Drive, thời gian 5–6 giây và cache hit/miss trước–sau; snapshot CacheService có thể không đáng lợi trong mọi bộ dữ liệu. Phải đánh giá staging trước khi coi tối ưu thành công.
2. **Ngày nhập Thêm/Sửa:** trường ngày ở cửa sổ chi tiết và bảng được định dạng `dd/mm/yyyy`; điều khiển ngày native có thể vẫn hiển thị khác theo locale máy. Chưa có cơ chế datepicker tùy chỉnh để cưỡng bức định dạng trong mọi trình duyệt.
3. **Tệp 10 MB:** vẫn giữ chunk 256 KiB để không tăng rủi ro hạn mức payload và timeout nếu chưa đo. Chưa chứng minh tải tệp 10 MB nhanh hơn.
4. **Khóa học bắt đầu giữa tháng, số tháng 2,5/3,5, nghỉ rồi quay lại, thiếu lịch:** không tự tính các trường hợp nghiệp vụ chưa có công thức duyệt. Ngày bỏ học của hồ sơ cũ **không tự suy ra** kỳ bắt đầu bỏ học.
5. **Quyền xuất Excel cho trường:** tiếp tục không cấp, như yêu cầu bảo mật hiện hành. Chưa tự chuyển tài khoản NHAN_VIEN cũ thành CO_SO_DAO_TAO.
6. **Tạo tên tình trạng mới:** quyền tạo qua `Khác` được cho tài khoản có quyền cập nhật trạng thái thuộc hồ sơ của mình. Cần giám sát tránh tên thiếu thống nhất do nhập tự do. Các cấu hình mới lưu dưới dạng dòng trong tab `Cấu hình hệ thống` hiện hữu.
7. **An toàn khi lỗi giữa nhiều lần ghi Sheets:** Google Sheets không có giao dịch đa bảng. Khi cấp tài khoản kèm ánh xạ trường hoặc nhập hàng loạt, cần lưu nhật ký, xác minh trạng thái thực sau sự cố. Không cam kết tính nguyên tử tuyệt đối giữa các tab.

## D. Các bước triển khai an toàn sau khi người dùng cho phép

**Bước 1 — Sao lưu và tạo môi trường thử:** Sao lưu nguyên trạng GitHub/v1.1.7-RC, phiên bản Apps Script đang xuất bản, Google Spreadsheet và thư mục Drive. Tạo bản sao dữ liệu đã ẩn danh để thử; không chạy trực tiếp trên gần 3.000 hồ sơ production.

**Bước 2 — Kiểm tra dữ liệu nguồn:** Xác minh 7 tab tiếng Việt, tổng 94 cột, tab `Hồ sơ học nghề` đúng 40 cột và tab `Cấu hình hệ thống` đủ 7 cột; kiểm tra `TRUONG_ID` các hồ sơ khớp mã cơ sở; xác định các dòng `NGAY_BO_HOC` đang chứa ngày cũ. **KHÔNG chạy** `setupDatabase()`, `chuyenSangTiengViet()` hoặc `nangCapDuLieuHocNgheYC011()` chỉ vì nâng cấp YC-HN-013.

**Bước 3 — Đưa code lên môi trường thử:** Thay toàn bộ nội dung file Apps Script `Code.gs` bằng tệp đầy đủ kèm bản giao; giữ các Script Properties hiện tại như `SPREADSHEET_ID`, `GOOGLE_CLIENT_ID`, `API_SHARED_SECRET`, `APP_ORIGIN` và thiết lập Drive. Lưu và tạo **New version** qua **Deploy → Manage deployments → Edit**; không tạo tên API URL khác nếu Vercel đang gắn với URL cũ, trừ khi cố ý cập nhật cấu hình. Triển khai gói GitHub/Vercel đồng phiên bản `v1.2.0-RC` trên môi trường staging; tránh thời điểm backend/frontend khác phiên bản khi đang có người sử dụng.

**Bước 4 — Thử nghiệp vụ từ đầu đến cuối:** Đăng nhập ADMIN, tạo 2 Gmail thử thuộc ABC, Gmail thứ ba thuộc XYZ, kiểm tra cách ly quyền; thêm/đổi trạng thái theo kỳ, dữ liệu cũ và tình trạng Khác; tìm số quyết định 67, thử lọc các năm; xem/in/xuất báo cáo theo cơ sở và nghề; nhập file Excel có dòng trùng/lỗi; chuyển Gmail ABC sang XYZ và đăng nhập lại bằng phiên mới; thử tăng số hồ sơ và ghi cùng lúc.

**Bước 5 — So sánh hiệu năng và quota:** Đo số yêu cầu, thời gian tải Trang 1→2→1, tìm số quyết định, bấm cập nhật trạng thái, xem Tổng quan, làm mới sau cập nhật, nhập Excel nhiều dòng, tải tệp 10 MB. Kiểm tra khi 2–10 tài khoản dùng đồng thời, cache nóng/lạnh, chậm mạng, hết quyền giữa phiên. Không suy diễn thời gian thực thi từ bài test giả lập.

**Bước 6 — Triển khai production:** Chỉ sau khi duyệt staging, sao lưu lại dữ liệu production sát thời điểm chuyển phiên, chọn thời gian ít người thao tác, cập nhật Apps Script + Vercel thống nhất, test smoke bằng ADMIN và từng cơ sở. **Không cấp hàng loạt Gmail theo tên trường**: ADMIN phải chọn đúng một mã `TRUONG_ID` cho từng Gmail.

## E. Rollback khi sự cố

1. Dừng nhập/sửa trong quá trình khắc phục; thông báo người dùng không bấm lại giao dịch chưa xác định.
2. Khôi phục deployment Apps Script **phiên bản trước** qua Manage deployments và rollback Vercel về commit/deployment v1.1.7-RC.
3. Không xóa tự động các dòng cấu hình `HN_SCHOOL_...`, `HN_STATUS_...` hoặc xóa dữ liệu hồ sơ mới; ghi nhận những giao dịch đã thành công để đối soát thủ công, vì bản cũ không nhận mã tình trạng mới và giá trị kỳ `KY:n`.
4. Nếu cần khôi phục Spreadsheet từ bản sao, phải đối soát các thay đổi hợp lệ giữa hai thời điểm trước khi ghi đè; khôi phục dữ liệu cũ vô điều kiện có thể làm mất kết quả cập nhật của trường.
5. Chụp nhật ký Apps Script/Vercel (ẩn thông tin cá nhân) và lập danh sách hồ sơ/tài khoản bị tác động.

**Nguyên tắc cuối:** Các tệp đi kèm là **mã nguồn đã chỉnh sửa và được kiểm thử mô phỏng**, không phải bản đã được chứng minh ổn định trên production. Chỉ triển khai khi có xác nhận riêng của chủ hệ thống sau thử nghiệm.

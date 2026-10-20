# THEO DÕI HỌC NGHỀ — YC-HN-014 V4 — v1.2.1-RC

**Trạng thái:** Mã nguồn thử nghiệm/RC đã hoàn thiện; **CHƯA triển khai** lên Apps Script/Vercel hay sửa dữ liệu thực tế.

**Nền:** v1.2.0-RC YC-HN-013 V8.1. **Phạm vi:** YC-HN-014.01–26 (V1–V4). Không thay đổi Google Sheet (giữ 7 tab, 94 cột), kiến trúc Google Sign-In/Vercel/Apps Script/Sheets/Drive và quyền xuất Excel của cơ sở đào tạo.

## 1. Các nhóm thay đổi

### V1 — Chuyển trang nhanh và bảo mật cache cho mọi vai trò

- `public/app.js`: Bỏ nhánh vô hiệu hóa cache khi `VAI_TRO=CO_SO_DAO_TAO`. ADMIN, NHAN_VIEN và CO_SO_DAO_TAO cùng sử dụng cache RAM có thời hạn và đồng gộp request đang xử lý.
- Khóa RAM cache gồm chủ thể tài khoản, email, vai trò, `TRUONG_ID`, phiên bản quyền, action, bộ lọc và số trang. Tối đa 110 entry; không lưu token hoặc hồ sơ vào localStorage/IndexedDB. Cache xóa khi logout.
- `navigate()` khôi phục snapshot khi còn hạn, cùng phiên/quyền. Khi hết hạn nhưng phiên quyền còn xác nhận gần đây, giữ giao diện cũ với thông báo *Đang làm mới dữ liệu...* thay vì trang trống. Kiểm tra quyền định kỳ tại điểm điều hướng sau 120 giây, **không polling liên tục**. Khi vai trò hoặc trường được gán đổi: đăng xuất để xác nhận tài khoản lại. Khi revision USERS toàn cục đổi nhưng quyền tài khoản giữ nguyên: hủy cache cũ, không tự đăng xuất hàng loạt.
- `apps-script/Code.gs`: `overview_()` thêm `TRUONG_ID` và `REV_USERS` vào khóa cache, kết hợp `REV_DATA` và bộ lọc; `bootstrap_()` trả `permissionRevision`.
- Sau cập nhật tình trạng, làm mới badge dòng hiện hành từ phản hồi đã commit. Các bảng có lọc tình trạng làm thay đổi tập kết quả được truy vấn lại; không cưỡng bức reload toàn trang cho trường hợp chỉ thay badge.

### V2 — Hai báo cáo ma trận Excel có hàng Tổng cộng

- `public/app.js`: Sau tất cả dòng trường hoặc nghề, xuất **một** hàng Tổng cộng. Tổng mỗi cột tính từ chính danh sách nhóm trả về, so đối chiếu `report_matrix.total`.
- `public/xlsx-export.js`: XLSX gộp hai ô A:B của hàng Tổng cộng, nền vàng (`FFFFFF00`), chữ đậm, căn giữa, đường viền; dữ liệu số được ghi `numeric` (không thành chuỗi). Hỗ trợ file không có nhóm và một nhóm. Không thay đổi danh sách chi tiết 25 cột.
- Chỉ ADMIN được xuất ma trận theo phân quyền hiện hành. Khi lọc trường/năm/nghề/tình trạng, Tổng cộng chỉ trên phần giao các bộ lọc.

### V3 — Dashboard và lọc tình trạng Báo cáo

- Dashboard thay **thẻ thứ ba** từ *Đang học* thành *Không nhận Quyết định*; giữ đủ 6 thẻ và phép đếm `Đã tham gia` bao gồm người đã bỏ học.
- Trang Báo cáo bổ sung bộ lọc thứ tư **Tình trạng** (mặc định Tất cả), gồm: Đã tham gia (kể cả bỏ học), Đang học (chưa bỏ học), Bỏ học, Không tham gia, Không nhận Quyết định, Chưa xác nhận và tình trạng tùy chỉnh.
- Phân biệt `dashboardFilters` và `reportFilters`; lọc báo cáo không ảnh hưởng ngầm Tổng quan. Apps Script `reportRecords_()` lọc theo trạng thái ở backend; mã `REPORT_PARTICIPATED_ALL` chỉ là bộ lọc thống kê, tuyệt đối không ghi vào cột trạng thái hồ sơ.
- Bản in và 4 mẫu xuất Excel tại trang Báo cáo dùng đúng bộ lọc đang áp dụng. Các lựa chọn không hợp lệ bị từ chối; không mặc định trở về xem toàn bộ.

### V4 — Tra cứu số quyết định chính xác với chi phí đọc thấp hơn

- `exactDecisionRecords_()` dùng đường riêng cho từ khóa toàn chữ số: đọc **một cột số quyết định**, tìm các dòng khớp `67=067=0067`, sau đó chỉ đọc 40 cột ở **những hàng trùng số** và kiểm tra quyền + năm + trường + nghề + trạng thái cho từng hồ sơ. Nếu có hơn 40 hàng trùng, quay về đường tổng hợp ban đầu. Không tạo chỉ mục bền vững hay thêm cột/tab.
- Giữ tìm tên tiếng Việt như cũ và phân trang 20 dòng. Không biến `67` trở lại thành tìm ký tự con của `167`/`670`/`6267`.
- `records_list` vẫn cache theo revision và quyền. Quay lại Tổng quan còn cache không bắt buộc gọi lại overview.

## 2. Kết quả kiểm thử

- `npm run check` — đạt kiểm tra cú pháp JavaScript.
- `npm test` — **98/98 đạt** (92 bài nền + 6 bài bổ sung). Có kiểm thử lọc trạng thái chồng lấn, quyền trường và revision, tìm số quyết định nhiều năm, 3.000 dòng mock và không đọc toàn bộ 40 cột khi truy vấn số chính xác.
- `python tests/browser_yc014_mock.py` — đạt kiểm thử Chrome mô phỏng ba vai trò, điều hướng cache nóng và lọc Báo cáo theo tình trạng.
- XLSX được xác thực bằng XML/ZIP: ô số thực, merge A:B, 6 kiểu định dạng, màu vàng, UTF-8.
- Các kiểm thử trên **không phải phép đo 21 giây trên Apps Script thật**; không thể khẳng định giảm xuống một số giây cụ thể khi chưa chạy bản sao dữ liệu 3.000–5.000 hồ sơ trên hạ tầng Google.

## 3. Hướng dẫn triển khai staging (không thay production ngay)

1. **Sao lưu** toàn bộ GitHub commit hiện hành, toàn bộ `Code.gs`, bản triển khai Apps Script đang chạy, Google Sheets và cấu hình Vercel trước khi sửa.
2. Tạo **staging** với bản sao Google Sheets, Apps Script thử nghiệm, URL deployment riêng và dự án/biến Vercel staging; **không trỏ nhầm vào Google Sheets thật**. Giữ các Script Properties hiện hành của môi trường thử (`SPREADSHEET_ID`, `API_SHARED_SECRET`, `GOOGLE_CLIENT_ID`, `DRIVE_FOLDER_ID` và các thuộc tính khác đang sử dụng). Không sao chép secret vào mã nguồn hoặc tài liệu công khai.
3. Thay toàn bộ `apps-script/Code.gs` bằng file cùng bản trong ZIP, lưu, tạo **New version** rồi triển khai Web App ở môi trường thử; cập nhật đúng URL trong biến môi trường Vercel của staging nếu cần.
4. Đưa toàn bộ frontend cùng API lên Vercel thử nghiệm, bảo đảm phiên bản `v1.2.1-RC` đồng bộ. Không thay một phía rồi cho người dùng sử dụng kéo dài.
5. Nghiệm thu tài khoản ADMIN, NHAN_VIEN, hai Gmail cùng Trường ABC, một Gmail thuộc Trường XYZ. Kiểm thử quyền khi chuyển ABC → XYZ, khi khóa tài khoản, mở tab khác, rớt mạng và phiên hết hạn.
6. Từ dữ liệu test tương đương 3.000–5.000 dòng, đo 3 lượt cache lạnh + 3 lượt cache nóng theo ba vai trò: tìm `67`, tìm họ tên trùng, Trang 1→2→1, Tổng quan→Hồ sơ→Tổng quan, lọc báo cáo; ghi *click→nội dung*, số request Vercel/GAS, số ô Sheets đọc, tải CPU/tổng thời gian GAS. Đối chiếu với bản nền `v1.2.0-RC` theo cùng dữ liệu để quyết định có đưa production hay không.
7. Xuất thử 2 ma trận trường/nghề, mỗi mẫu tất cả nhóm và một nhóm, có bộ lọc năm/tình trạng; mở bằng Microsoft Excel/WPS, so số và hàng Tổng cộng với Google Sheets. Thử tình trạng tùy chỉnh.
8. Chỉ sau nghiệm thu staging mới cân nhắc cập nhật production trong thời điểm ít người truy cập. Chưa có lệnh tự triển khai production từ cuộc trò chuyện này.

## 4. Hoàn tác

Nếu phát hiện sai quyền, dữ liệu, thời gian chờ bất thường hoặc export lỗi: đưa Vercel frontend/API về deployment cũ, đồng thời khôi phục **bản triển khai Apps Script cũ** phù hợp `v1.2.0-RC` (không chỉ sửa một phía). Các thay đổi trong gói này không yêu cầu migration Google Sheets; không xóa dữ liệu mới phát sinh khi rollback. Sau rollback, kiểm tra lại Tổng quan, hồ sơ và quyền mỗi trường.

## 5. Giới hạn và việc chưa chốt

- **Tháng bỏ học 1–12 không nằm trong đợt YC-HN-014 V4** vì chưa thống nhất tính hợp lệ của Tháng thứ 1 và tháng vượt thời gian hỗ trợ; giữ nguyên quy tắc kỳ học hiện hành và dữ liệu lịch sử.
- Không cam kết thời gian tìm kiếm cụ thể trước benchmark Google Sheets thật. Những truy vấn theo tên vẫn có thể phải xử lý toàn bộ tập hồ sơ được phép; phương án chỉ mục nâng cao cần được đánh giá theo số liệu và không tự đổi cấu trúc 7 tab / 94 cột.
- Thu hồi quyền khi thiết bị offline không thể xóa tức thời nội dung đã tải trong RAM; frontend tái xác minh quyền tại lần điều hướng sau chu kỳ kiểm tra, backend kiểm tra quyền trên mỗi request.
- Không thay quy tắc đọc/ghi các tệp Drive 10 MB, không cấp quyền xuất Excel cho cơ sở, không thêm Firebase hoặc cơ sở dữ liệu khác.

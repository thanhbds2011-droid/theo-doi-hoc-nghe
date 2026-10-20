# YC-HN-016 V2 — Hướng dẫn và Changelog v1.2.3-RC

## Phạm vi đã thực hiện

- Mã nguồn nền: **v1.2.2-RC (YC-HN-015)**, tiếp tục giữ nguyên luồng đã chốt trước đây. Bản mới: **v1.2.3-RC**.
- Tại **Hồ sơ học nghề**, Quản trị viên có thêm nút **Cập nhật tình trạng từ Excel**. Nút **Nhập Excel** cũ vẫn chỉ để tạo hồ sơ mới.
- Trong cửa sổ cập nhật hàng loạt: (1) chọn trạng thái đích; (2) chọn Excel; (3) **Kiểm tra dữ liệu**; (4) xem tổng hợp các trường hợp; (5) xác nhận cập nhật theo từng lô.
- Nhận file `.xlsx` 26 cột với hai hàng tiêu đề, cột Z **Tham gia học (đánh dấu X)**, như workbook đã cung cấp; cho phép file riêng theo mẫu 8 cột mới. Chỉ xử lý các dòng đánh dấu X, không suy luận ô trống thành `Không tham gia`.
- Excel có nhiều trang tính: ưu tiên đúng sheet **Danh sách**. Không coi các sheet Báo cáo/Trường/Nghề là dữ liệu học viên. Công thức ở cột STT chỉ đọc giá trị đã lưu trong file; không tính/thực thi công thức.
- Đối chiếu quyết định chính xác theo **Số QĐ HTHN + năm của Ngày ban hành QĐHN**; thêm điều kiện họ tên, cơ sở đào tạo, BHXH khi hai bên có. Dòng không duy nhất, thiếu hoặc sai được báo và bỏ qua.
- **Phương án A đã chốt:** Chỉ cập nhật hồ sơ đang `CHO_XAC_NHAN`. Hồ sơ đã Đã tham gia, Bỏ học, Không tham gia, Không nhận quyết định hay trạng thái Khác **không thể ghi đè** bằng nhập hàng loạt. Kiểm tra lại điều kiện **bên trong khóa ghi tại backend**, không chỉ xem trước.
- Với **Bỏ học**, yêu cầu kỳ tháng hợp lệ với số tháng hỗ trợ và lý do có trong danh mục. **Không tự đưa tháng 1–12** đang chờ làm rõ vào bản này. Dữ liệu bỏ học cũ giữ nguyên.
- Chia đợt kiểm tra tối đa **120 dòng/API**, ghi tối đa **10 hồ sơ/API**, có tiến độ, mã `batchId`/`requestId`, kiểm tra phiên bản từng hồ sơ trước khi ghi. Ghi audit `CAP_NHAT_TINH_TRANG_HANG_LOAT` theo từng hồ sơ thực sự cập nhật.
- Cho phép tải danh sách dòng không cập nhật dưới dạng CSV để kiểm tra.
- Không mở quyền cho NHAN_VIEN / CO_SO_DAO_TAO; API kiểm tra `ADMIN` cả ở gateway quyền lẫn hàm nghiệp vụ Apps Script.
- Không bổ sung tab/cột nào: vẫn **7 tab/94 cột**.

## Các file thay đổi

- `apps-script/Code.gs`: thêm API `record_status_bulk_check` và `record_status_bulk_apply`, kiểm tra đối chiếu và ghi hàng loạt an toàn.
- `public/app.js`: nút mới, biểu mẫu, đọc file, xem trước, tiến độ ghi, xuất danh sách lỗi; mở rộng `readXlsxRows` chọn worksheet theo tên.
- `public/styles.css`: điều khiển ẩn/hiện ô dành riêng tình trạng Bỏ học.
- `public/index.html`, `package.json`: nâng nhãn phiên bản v1.2.3-RC.
- `public/templates/MAU_CAP_NHAT_TINH_TRANG.xlsx`: mẫu điền danh sách theo từng trạng thái.
- `tests/backend.test.js`, `tests/yc016-parser.test.js`, `tests/browser_yc016_real_excel.py`: kiểm thử mới.
- Các file khác giữ từ bản nền, không đổi nghiệp vụ báo cáo, phân quyền theo trường, cấu trúc dữ liệu hoặc tệp đính kèm.

## Hướng dẫn sử dụng cho Quản trị viên

1. Mở **Hồ sơ học nghề → Cập nhật tình trạng từ Excel** (không phải Nhập Excel).
2. Chọn **Đã tham gia học**, tải trực tiếp file `Danh sách NLĐ học nghề năm 2026 (08.10).xlsx`. Hệ thống chỉ lấy các dòng có dấu X tại cột Tham gia học.
3. Với trạng thái khác, nhấn **Tải Excel mẫu cập nhật tình trạng**, lập **danh sách riêng** và điền `X` tại cột `Áp dụng (X)` cho những người cần thay đổi. Không dùng file tổng hợp với cột Tham gia học để cập nhật trạng thái khác.
4. Nhấn **Kiểm tra dữ liệu** và xem số đủ điều kiện, đã đúng, có trạng thái khác, không khớp, trùng và lỗi. Có thể xuất danh sách cần kiểm tra.
5. Chỉ sau khi đối chiếu, tích xác nhận và nhấn **Xác nhận cập nhật**. Chờ các lô ghi xong, xem tổng số thực sự được cập nhật. **Không đóng ứng dụng hoặc tắt máy giữa lượt nhập.**
6. Nếu gián đoạn mạng, giữ nguyên cửa sổ và nhấn xác nhận lại để tiếp tục từ lô chưa hoàn thành. Nếu đã đóng cửa sổ, chọn lại file và kiểm tra mới; các hồ sơ đã cập nhật sẽ tự động được bỏ qua, không ghi đè.
7. Khi hoàn thành, đối chiếu Tổng quan / Báo cáo và xuất danh sách các trường hợp chưa cập nhật để xử lý riêng.

## Nghiệm thu được xác nhận trong môi trường mô phỏng

- Kiểm tra cú pháp JavaScript frontend, gateway và mã Code.gs: **đạt**.
- Tự động `npm test`: **109/109 đạt** tại thời điểm đóng gói (99 kiểm thử nền + 10 kiểm thử YC-HN-016 gồm backend và parser).
- Chromium đọc **file Excel thực của người dùng**: **1.324 dòng X**, **42 dòng bỏ qua**. Bước check/apply với API mô phỏng: **12 lần kiểm tra**, **133 lần ghi / mỗi lần tối đa 10** — không ghi Google Sheets thực.
- Trường hợp hồ sơ đã Bỏ học, import trùng file, thay đổi sau preview, trùng QĐ/năm, sai tên/trường, không đúng quyền: đều có kiểm thử backend.

**Giới hạn bắt buộc:** Chưa chạy 1.324 lệnh ghi trên Google Sheets thật, chưa đo thời gian, giới hạn quota, timeout, khóa/đồng bộ thực tế. Không được coi lượt mô phỏng đã kiểm tra là 1.324 hồ sơ đã được cập nhật ngoài đời.

## Triển khai an toàn và rollback

1. Sao lưu ZIP v1.2.2-RC, mã Code.gs đang chạy, Script Properties và **sao chép Spreadsheet hiện hành** trước khi thử.
2. Tạo môi trường staging với bản sao Sheets và một bản triển khai Apps Script staging. Cấu hình Vercel staging `GAS_WEB_APP_URL` tới đúng deployment staging; giữ bảo mật secret và Google client ID riêng theo quy tắc dự án. **Không thay cài đặt production trong lúc thử.**
3. Thay nguyên nội dung `apps-script/Code.gs`, triển khai **New version** trên Web App staging; xác minh đúng URL bản triển khai. Sau đó cập nhật bộ GitHub frontend/gateway đồng phiên bản v1.2.3-RC lên môi trường staging.
4. Test từ mẫu 2–5 hồ sơ, rồi 100, sau đó 1.324 dòng; thử lọc các loại trạng thái, báo cáo, quyền ADMIN và nhân viên/trường; đối chiếu nhật ký và hàng còn Chưa xác nhận. Đặc biệt thử mạng mất sau commit, thao tác một tài khoản khác cập nhật trước, và kiểm tra không tăng phiên bản với dòng bỏ qua.
5. Nếu staging đạt, cập nhật production theo cửa sổ bảo trì được phê duyệt; **không chạy hàm migration** vì mã này không thay cấu trúc Sheets.
6. Khi phát hiện lỗi, đưa frontend về ZIP v1.2.2-RC, Apps Script về deployment version trước. Những hồ sơ đã cập nhật thật **không tự rollback dữ liệu** khi thay code; phải đối chiếu audit/bản sao lưu và chỉ khôi phục nếu được phê duyệt, tránh mất cập nhật hợp lệ của cơ sở đào tạo.

## Điểm cần tiếp tục theo dõi

- Các lô ghi được cố ý giới hạn 10 hồ sơ để giữ khóa giao dịch ngắn. File 1.324 dòng X, nếu tất cả đều chưa xác nhận, có thể cần đến **133 lượt gọi ghi**; thời gian thực tế phụ thuộc quota, Apps Script/Sheets, mạng. **Không cam kết xong trong vài giây.**
- Không thay đổi nghiệp vụ **tháng bỏ học 1–12** đang để mở; chưa tự động tính lại tháng bỏ học lịch sử.
- Nếu nhật ký Sheets tạm lỗi sau khi hồ sơ đã ghi, Apps Script ghi lỗi vào execution log để kiểm tra; cần đối chiếu trong quá trình nghiệm thu staging.

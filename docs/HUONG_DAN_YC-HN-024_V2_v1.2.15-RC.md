# HƯỚNG DẪN YC-HN-024 V2 — v1.2.15-RC

## 1. Phạm vi nghiệm thu

Bản mới dựa trên `v1.2.14-RC` đã chạy ổn định và **không làm thay đổi nghiệp vụ**. Khi vào `Báo cáo → Tổng hợp kết quả`, luôn có hàng cuối `Ngày hoàn thành khóa học` và **không còn khung xanh lớn**. Hàng mới là **số hồ sơ có ngày kết thúc đào tạo dự kiến hợp lệ**, không phải số học viên đã tốt nghiệp.

Nếu chọn `Tình trạng: Ngày hoàn thành khóa học`, khoảng từ `01/07/2027` đến `31/07/2027`, nhấn `Lọc dữ liệu`: số của hàng mới **bằng** `Tổng số Quyết định` trong tập đang lọc. Với các lựa chọn trạng thái cũ, ngày lọc vẫn là **Ngày ban hành QĐ**; dòng mới đếm hồ sơ có ngày kết thúc dự kiến hợp lệ **trong chính tập đó**, không mặc nhiên là số kết thúc trong khoảng ngày theo QĐ.

Với `Báo cáo → Xuất Excel → Báo cáo tổng hợp`, dòng mới cũng xuất hiện đúng số. Các mẫu 25 cột và hai ma trận giữ nguyên định dạng/cấu trúc. Khi in báo cáo, **không in banner xanh**, chỉ có metadata phạm vi ngày ngắn khi dùng chế độ đặc biệt.

## 2. Sao lưu và cập nhật an toàn

1. Sao lưu source GitHub, Apps Script và thông tin deployment **v1.2.14-RC**. Không nhập dữ liệu kiểm thử vào Google Sheets thật.
2. Trên Apps Script thử nghiệm, thay **toàn bộ** `Code.gs` bằng `CODE_APPS_SCRIPT_YC-HN-024_V2_v1.2.15-RC_Code.gs` hoặc tệp `apps-script/Code.gs` trong ZIP. Không đổi Script Properties/Spreadsheet ID.
3. Chọn **Deploy → Manage deployments → Edit → New version → Deploy** cho deployment đang sử dụng. Nếu có URL thay đổi, xác nhận cấu hình tích hợp còn trỏ đúng Web App. Kiểm tra quyền thực thi như trước.
4. Cập nhật toàn bộ source GitHub/Vercel **v1.2.15-RC** trong nhánh thử nghiệm; đảm bảo Vercel deploy đúng nhánh và thành công. Sau đó kiểm tra bản Production khi đã được phép.
5. Mở website nhấn **Ctrl + Shift + R**; góc dưới trái hiển thị `v1.2.15-RC`. Thử 3 nhóm kiểm tra sau trước khi nghiệm thu.

## 3. Kiểm tra kết quả

- **Trường hợp A:** Chọn `Báo cáo → Ngày hoàn thành khóa học`, từ `01/07/2027` đến `31/07/2027`, nhấn Lọc. So sánh `Tổng số Quyết định` và `Ngày hoàn thành khóa học` — hai số phải bằng nhau, trong phạm vi quyền đang đăng nhập.
- **Trường hợp B:** Chọn `Tất cả tình trạng` hoặc `Đã tham gia`, lọc theo khoảng **Ngày QĐ**. Hai chỉ tiêu có thể khác nhau do dòng lịch kết thúc chỉ đếm hồ sơ có trường ngày kết thúc dự kiến hợp lệ trong tập lọc.
- **Trường hợp C:** Xuất `Báo cáo tổng hợp` kiểm tra có hàng mới; xem/in báo cáo kiểm tra không có khung xanh lớn; thử Xuất Excel danh sách giữ 25 cột, Wrap Text và chiều cao đã nghiệm thu. Đăng nhập bằng tài khoản cơ sở để kiểm tra kết quả chỉ thuộc trường được phân quyền.

**Nếu thấy dòng mới luôn bằng 0 khi đang lọc ngày kết thúc dù Tổng QĐ lớn hơn 0:** kiểm tra Apps Script deployment thực tế trước. Chỉ thay code trong trình biên tập mà không tạo phiên bản deployment mới có thể khiến API vẫn sử dụng phiên bản cũ; backend cũ không có trường `courseEndScheduled`.

## 4. Hoàn tác

Nếu phát sinh lỗi, đưa GitHub/Vercel về `v1.2.14-RC` **và** khôi phục phiên bản Apps Script tương ứng qua Manage deployments. Kiểm tra lại quyền, báo cáo, Excel và log. Không chỉnh sửa dữ liệu Sheet để khắc phục lỗi UI.

## 5. Giới hạn xác nhận

Kiểm thử tự động và Chromium dùng backend giả lập, chưa chạy nghiệm thu trực tiếp trên Vercel/Google Sheets production. Mục tiêu là thay đổi báo cáo và cách hiển thị, **không có cam kết tăng tốc lưu hồ sơ** trong phiên bản này.

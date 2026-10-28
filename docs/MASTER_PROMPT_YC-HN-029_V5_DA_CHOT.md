# MASTER PROMPT – YC-HN-029 V5 – ĐÃ CHỐT MÃ NGUỒN

**Dự án:** THEO DÕI HỌC NGHỀ  
**Bản nền:** v1.2.22-RC đã có giao diện chức danh YC-HN-029 V4.  
**Phiên bản bàn giao mới:** v1.2.23-RC.  
**Phạm vi CHỐT:** Toàn bộ YC-HN-029 V1–V3 và bảo toàn V4.  
**Trạng thái:** Đã triển khai và kiểm thử mã nguồn cục bộ; **chưa triển khai, chưa đo production**.

## I. Nguyên tắc không được phá vỡ

- GitHub + Vercel + Google Apps Script + Google Sheets + Google Drive; không bổ sung Firebase hay nền tảng khác.
- Bảy tab Google Sheets, tiêu đề/cột, quyết định đã nghiệm thu và các mẫu xuất Excel giữ nguyên.
- `ADMIN`: sáu menu và quyền quản trị cũ. `NHAN_VIEN`: ba menu, xem toàn Trung tâm, sửa **tình trạng** toàn Trung tâm, không thêm/sửa thông tin gốc/xóa/import/quản trị/tệp. `CO_SO_DAO_TAO`: ba menu, dữ liệu chỉ trường được gán.
- Chức danh/phòng ban chỉ là nhãn hiển thị, không bao giờ là quyền truy cập.
- Luôn kiểm quyền tại Apps Script, ký yêu cầu Vercel, khóa ghi, phiên bản hồ sơ, chống trùng QĐ, nhật ký. Không ghi đè trạng thái của người khác.
- `Đã tham gia` trong thống kê bao gồm `Bỏ học`; `Hoàn thành khóa học` là người đã tham gia, không bỏ học và kết thúc **dự kiến** trong kỳ; không suy luận bằng tốt nghiệp thực tế. Không tự thêm trạng thái Đang học.

## II. Phạm vi sửa đã thực hiện

1. **Frontend**: sửa vòng đời cache giao diện khi `REV_DATA` thay đổi; không gắn revision mới cho HTML cũ; làm mới đúng vùng Tổng quan/Báo cáo/Hồ sơ; giữ bộ lọc và trang. Tách thao tác chuyển menu và làm mới sau polling để tránh đua lệnh.
2. **Đồng bộ nhiều máy**: kiểm tra thay đổi trên tab đang hiển thị mỗi 90 giây và kiểm tra khi quay lại tab nếu đã quá 30 giây; ngừng polling khi tab ẩn; không bắt đăng nhập lại nếu chỉ đổi chức danh. Đây là **gần thời gian thực**, không phải push ngay lập tức.
3. **Xung đột**: khi cập nhật tình trạng từ phiên bản cũ, máy chủ từ chối lưu. Giao diện lấy hồ sơ mới có kiểm quyền (`record_fresh`), hiển thị hai tình trạng; giữ nguyên draft; người dùng phải bấm xác nhận kiểm tra mới được gửi lại. Không tải lại website.
4. **Đọc Sheets**: đường xem một hồ sơ/tệp chỉ đọc cột mã hồ sơ + dòng đúng 40 cột, kiểm lại ID sau khi đọc; sửa hồ sơ thường chỉ đọc cột ID, cột khóa trùng QĐ và dòng cần sửa. Nếu tạo hồ sơ gắn người học đã có, vẫn quét dữ liệu cần thiết để xác minh người học.
5. **Upload**: chuyển gửi dữ liệu đến Drive ra **ngoài khóa ghi chung**; một khóa ngắn để đánh dấu phiên tải đang thực hiện và một khóa ngắn để kiểm tra phiên bản/ghi bản ghi cuối. Không bỏ `PHIEN_BAN`, quyền hoặc log. Dọn các khóa `UPLOAD_` hết hạn khi khởi tạo upload mới, có hàm dọn thủ công `donDepPhienTaiTepHocNghe()`; phiên hoàn tất giữ 5 phút để thử lại.
6. **Tiếng Việt**: khi có xung đột hiển thị câu dễ hiểu, chuyển nhãn phân loại nhập tình trạng Excel sang tiếng Việt, dịch mã hành động Nhật ký ra tên dễ hiểu, thay câu lỗi xuất báo cáo yêu cầu sửa tệp code. Mã lỗi kỹ thuật chỉ dùng bên trong, không đưa trực tiếp lên toast.
7. **Phiên bản**: nâng đồng bộ `APP.version`, footer, URL script và package thành v1.2.23-RC để phân biệt bản nâng cấp; **không thay đổi** tệp kết xuất Excel.

## III. Các thành phần đã thay đổi

- `public/app.js`: kiểm tra revision, cache, modal xung đột, tiếng Việt, cập nhật trạng thái và phiên bản.
- `public/styles.css`: chỉ bổ sung CSS nội dung cảnh báo xung đột; giữ nguyên nhãn chức danh V4.
- `public/index.html`: chỉ đổi nhãn phiên bản và query version của app.js.
- `apps-script/Code.gs`: API đọc hồ sơ mới có kiểm quyền, truy xuất cục bộ, tách khóa upload, dọn phiên upload, phiên bản.
- `package.json`: phiên bản. `tests/`: bổ sung bài backend và hai-client Chromium, cập nhật các bài kiểm tra số phiên bản cũ.
- `docs/`: Master Prompt, changelog, kiểm thử, triển khai và hoàn tác.

**Giữ nguyên nội dung nguồn:** `api/rpc.js`, `api/config.js`, `public/xlsx-export.js`, `apps-script/appsscript.json`.

## IV. Yêu cầu nghiệm thu thực tế chưa xác nhận

- Chưa kiểm thử đồng thời trên backend thật mức **1/4/10/20 tài khoản**; chưa đo độ trễ/khóa ghi, tỉ lệ lỗi, quota Google/Vercel trên staging đại diện production. Không khẳng định đảm bảo 20 lượt ghi đồng thời.
- Chu kỳ phát hiện của máy đang hoạt động khoảng **tối đa 90 giây + thời gian mạng** khi tất cả request thành công. Khi tab ẩn không polling; khi quay lại có kiểm tra với ngưỡng tối thiểu 30 giây. Không có realtime push/WebSocket.
- Các thống kê lớn vẫn cần đọc snapshot Google Sheets sau khi revision đổi; không thể hứa không bao giờ đọc toàn bảng.
- Không chứng nhận đã đo được hiệu năng trên hệ thống đang chạy, không thay đổi dữ liệu thật, chưa deploy.

## V. Quy trình tiếp theo

Mở staging riêng, backup Google Sheets, deploy backend mới rồi frontend mới, kiểm thử 3 vai trò, 2 máy, 4/10/20 người đồng thời, so sánh kết quả 4 mẫu Excel và số thống kê; thu thập log `HN_PERF_TEST` nếu bật có kiểm soát. Chỉ đưa production sau khi nghiệm thu. Nếu lỗi: rollback cả frontend và Apps Script theo tài liệu bàn giao.

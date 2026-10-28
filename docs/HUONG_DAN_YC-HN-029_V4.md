# HƯỚNG DẪN TRIỂN KHAI / HOÀN TÁC – YC-HN-029 V4

**Lưu ý:** Gói bàn giao đã kiểm thử cục bộ nhưng **chưa triển khai lên website**.

## A. Triển khai đúng phạm vi

1. **Sao lưu** hai tệp hiện có trên GitHub: `public/app.js` và `public/styles.css` (hoặc ghi lại commit trước khi cập nhật).
2. Giải nén ZIP bàn giao. Chỉ cần thay nội dung tương ứng của **hai tệp** `public/app.js` và `public/styles.css` trong kho GitHub đang dùng. Có thể dùng ZIP đầy đủ để đối chiếu nhưng **không cần thay các tệp còn lại**.
3. Xem lại phần thay đổi (diff); không thêm cấu hình môi trường, không chạy lệnh nâng cấp Google Sheets và **không triển khai lại Apps Script**.
4. Khi bạn chủ động đưa thay đổi lên nhánh GitHub kết nối Vercel, **Vercel có thể tự triển khai production** theo cấu hình kết nối của dự án. Chỉ commit/push khi sẵn sàng cho việc này.
5. Sau khi website được triển khai thành công, mở lại trang và nhấn **Ctrl+F5** (hoặc Ctrl+Shift+R) nếu trình duyệt còn lưu CSS/JS cũ.
6. Đăng nhập thử bằng tài khoản ADMIN, NHAN_VIEN có/không có chức danh, CO_SO_DAO_TAO. Kiểm tra chức danh, vị trí nút Đăng xuất và số lượng menu.

**Không cần:** sửa `Code.gs`, Script Properties, 7 tab Google Sheets, cấu hình Vercel, trang quản lý tài khoản hoặc mẫu Excel.

## B. Các điểm cần tự kiểm tra sau triển khai

- Tên và nhãn chức danh rõ ràng, nhãn đúng dữ liệu tài khoản.
- Trưởng phòng / Phó phòng có nhãn nổi bật; nút Đăng xuất không thay đổi.
- NHAN_VIEN vẫn chỉ có ba menu; cơ sở vẫn xem đúng phạm vi của mình.
- Header không bị tràn khi cửa sổ hẹp; trên điện thoại giữ nguyên cách ẩn tên/chức danh như trước.

## C. Hoàn tác (rollback)

Nếu giao diện chưa đúng, khôi phục **hai tệp `public/app.js` và `public/styles.css`** từ commit đã sao lưu, rồi để Vercel triển khai lại. Tải lại trang bằng Ctrl+F5.

Không cần phục hồi Google Sheets/Apps Script vì bản vá này không chỉnh sửa backend hoặc dữ liệu.

## D. Lưu ý về phiên bản

Nhãn góc dưới bên trái vẫn là `v1.2.22-RC`. Đây là bản vá chỉ về hình thức V4, không thay đổi định danh phiên bản backend.

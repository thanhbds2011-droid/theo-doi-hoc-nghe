# YC-HN-008 — Changelog và kiểm thử v1.1.4-RC

## Phạm vi nâng cấp
- Danh mục: đổi tab và quay lại trang dùng ngay dữ liệu đã tải trong bootstrap, không gọi `catalog_list` chỉ để đổi tab; tìm kiếm được giữ trong phiên.
- Tài khoản: bổ sung Xóa có xác nhận; xóa mềm bằng `TRANG_THAI=DELETED`, không xóa hồ sơ hoặc lịch sử, không xóa chính mình/không xóa Admin cuối cùng.
- Danh mục: bổ sung Xóa có xác nhận; xóa mềm bằng `TRANG_THAI=DELETED`; **không cho xóa nếu bất kỳ hồ sơ nào, kể cả đã xóa mềm, còn liên kết**. ID/mã được giữ; ngừng sử dụng vẫn là lựa chọn khi danh mục đã có liên kết.
- Phân quyền dữ liệu: `ADMIN` toàn bộ; `NHAN_VIEN` chỉ thấy, tìm, sửa, cập nhật, xóa, tải/gỡ tệp và xuất báo cáo từ hồ sơ có `TAO_BOI` trùng email đã xác thực. Bảo vệ tại Apps Script, không chỉ ẩn nút. Cache danh sách/KPI được phân tách theo tài khoản và vai trò.
- Menu Nhân viên chỉ gồm Tổng quan, Hồ sơ học nghề, Báo cáo. Các danh mục vẫn có thể chọn trong biểu mẫu hồ sơ.
- Mẫu nhập có ba file `.xlsx` thực với từng tiêu đề ở một ô, cố định hàng đầu, mở được trong Excel; website tự đọc file XLSX bằng giải nén ZIP/đọc XML ngay tại trình duyệt, không gửi tệp gốc cho bên thứ ba. Vẫn giữ hỗ trợ CSV cũ để tương thích.
- Thay chữ HN bằng `public/assets/logo.svg` hiện hữu trên sidebar và trang đăng nhập; bỏ dòng “PHẦN MỀM ĐỘC LẬP”.
- Giữ phiên khi F5: lần đăng nhập Google được xác thực tại Vercel, sau khi Apps Script xác nhận tài khoản hợp lệ thì cấp cookie `__Host-hocnghe_session` (HttpOnly, Secure, SameSite=Lax), tối đa 8 giờ; việc tải trang sau dùng phiên để lấy bootstrap. Đăng xuất xóa cookie. Tài khoản bị khóa/xóa tiếp tục bị từ chối bởi Apps Script. Không lưu Google token trong localStorage.
- Không thay đổi thứ tự 79 cột, số quyết định, các KPI, quy tắc trạng thái học, cơ chế đính kèm 10 MB và giao diện YC-HN-006 ngoài yêu cầu logo/nút Xóa.

## File chính thay đổi
`public/app.js`, `public/index.html`, `public/styles.css`, `apps-script/Code.gs`, `api/rpc.js`, `package.json`, `tests/`, `public/templates/*.xlsx`, tài liệu.

## Kiểm thử
- `npm run check`: đạt cú pháp JavaScript.
- `npm test`: **67/67 bài đạt**; có bài thử dữ liệu Admin/A/B, hành vi xóa tài khoản/danh mục, cookie phiên hợp lệ/bị sửa, menu, mẫu XLSX.
- `python tests/browser_yc008_mock.py`: đạt kiểm tra Chromium với dữ liệu giả lập: chuyển menu, thêm hồ sơ, thao tác trạng thái, lưu danh mục/tài khoản, đọc XLSX mẫu và nhập danh mục từ CSV; không tràn ngang ở màn hình di động trong tình huống đã thử.
- File XLSX được kiểm tra cấu trúc ZIP và có từng cột `A1`, `B1`, ... độc lập.
- **Chưa kiểm thử Google Sheets, Google Drive, OAuth, cookie và Vercel thực tế trên production**. Những kiểm thử này bắt buộc khi triển khai môi trường thử nghiệm.

## Giới hạn và lưu ý
- Phiên 8 giờ không phải đăng nhập vĩnh viễn; F5 sau hết hạn hoặc khi tài khoản bị từ chối sẽ yêu cầu đăng nhập lại.
- Khi dữ liệu trong trang Danh mục thay đổi từ tài khoản quản trị khác, phiên hiện tại có thể cần F5 để xem thay đổi đó; thêm/sửa/xóa bằng chính phiên hiện tại sẽ cập nhật ngay.
- Hồ sơ có `TAO_BOI` không rõ hoặc không khớp email nhân viên sẽ **chỉ Admin xem được**; không tự chuyển quyền sở hữu.
- Xóa mềm giữ nguyên các bản ghi lịch sử. Mã danh mục đã dùng và số quyết định không được tái sử dụng.
- Việc đăng xuất vô hiệu hóa cookie trên trình duyệt đang sử dụng; không thay thế cho giải pháp quản trị phiên tập trung trên nhiều thiết bị.
- Không tự xác nhận tải tệp 10 MB hoạt động trên Google Drive nếu chưa có thử nghiệm thực tế.

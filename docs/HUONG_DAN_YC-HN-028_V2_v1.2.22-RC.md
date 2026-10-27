# HƯỚNG DẪN TRIỂN KHAI VÀ HOÀN TÁC — YC-HN-028 V2 / v1.2.22-RC

## Phạm vi

Hai thay đổi: (1) quản trị nhập nhãn chức danh/phòng ban cho tài khoản Nhân viên; (2) nhân viên được nút Xuất Excel ở Báo cáo. **Không** đổi quyền tài khoản hoặc thêm cột tài khoản trong Google Sheets.

## Triển khai thử nghiệm an toàn

1. **Sao lưu** mã nguồn GitHub/Vercel đang chạy `v1.2.21-RC`, sao chép Google Apps Script `Code.gs` cũ và tạo bản sao Spreadsheet hiện hành bằng quyền Quản trị trước khi thay đổi bất cứ hệ thống thật nào.
2. Tạo **môi trường staging** dùng bản sao Spreadsheet, Script Properties và deployment riêng; giữ các secret trong cấu hình bảo mật, không đưa API_SHARED_SECRET hay ID Token vào GitHub.
3. Đưa `apps-script/Code.gs` mới từ gói v1.2.22-RC lên Apps Script; chọn **Deploy → Manage deployments → Edit → New version → Deploy**. Kiểm tra URL web app không vô tình đổi khi cập nhật deployment hiện hữu.
4. Đưa mã nguồn GitHub/Vercel mới lên staging. Xác nhận góc dưới trái hiện `v1.2.22-RC`; nhấn **Ctrl + Shift + R** để tránh cache cũ. Không cần chạy migration thay đổi 7 tab/12 cột.
5. Kiểm tra bằng Quản trị viên: `Quản lý tài khoản` → Thêm/Sửa tài khoản Nhân viên → điền `Nhân viên Phòng A`; danh sách vẫn để cột Vai trò = Nhân viên, cột Chức danh = Nhân viên Phòng A. Sửa thành `Trưởng phòng B`, đăng nhập bằng nhân viên B rồi kiểm tra header. Xóa trắng phải quay về `Nhân viên`.
6. Với tài khoản Nhân viên: chỉ thấy 3 menu Tổng quan – Hồ sơ học nghề – Báo cáo; Báo cáo có **Xuất Excel** bên cạnh **In báo cáo**. Xuất đủ 4 mẫu: Danh sách 25 cột, Tổng hợp, Theo cơ sở, Theo nghề. Đối chiếu số với các chỉ tiêu trên website và kiểm các bộ lọc đã áp dụng.
7. Kiểm tra tài khoản Cơ sở đào tạo chỉ xem và xuất đúng hồ sơ của trường được gán; kiểm tra Quản trị viên không mất chức năng cũ.
8. Chỉ sau khi nghiệm thu staging, thực hiện tuần tự tương tự trên production theo quy trình quản trị của bạn. Nếu hệ thống production chưa được yêu cầu cập nhật, không làm bước này.

## Hoàn tác

- Nếu lỗi frontend: redeploy commit/ZIP nền `v1.2.21-RC` (bản sao lưu) và hard-refresh.
- Nếu lỗi Apps Script: quay lại phiên bản deployment trước đó ở Manage deployments. Với metadata mới đã lưu ở tab CAU_HINH, code cũ sẽ bỏ qua các khóa `HN_STAFF_DISPLAY_*` nên không cần xóa dữ liệu chỉ để rollback.
- Nếu có sai lệch bất ngờ ở Sheet, so sánh bản sao lưu và đối chiếu nhật ký trước khi khôi phục; không ghi đè toàn bộ Sheet một cách tự động.

## Giới hạn xác minh

Đã kiểm tra trên unit tests Node.js và Chromium với dữ liệu giả lập. Chưa xác nhận được tài khoản, Sheets, Vercel hay WPS production thực tế.

# CHANGELOG — YC-HN-028 V2 / v1.2.22-RC

Ngày: 27/10/2026. Nền: v1.2.21-RC.

## Đã sửa

- `public/app.js`: thêm trường **Chức danh/Phòng ban hiển thị** khi tạo/sửa tài khoản `NHAN_VIEN`; ẩn và vô hiệu hóa khi chọn vai trò khác. Thêm cột chức danh trong bảng Quản lý tài khoản; giữ cột Vai trò độc lập. Góc trên bên phải dùng nhãn chức danh đã lưu hoặc Nhân viên khi trống. `verifyPermission()` làm mới nhãn không tự đăng xuất khi chỉ có thay đổi mô tả.
- `public/app.js`: nút **Xuất Excel** trang Báo cáo hiển thị với mọi tài khoản có quyền `REPORT_EXPORT`, bao gồm `NHAN_VIEN`, thay cho hạn chế cứng ADMIN/CO_SO_DAO_TAO. Giữ nguyên nút In và các mẫu Excel đã có.
- `apps-script/Code.gs`: lưu nhãn vào tab cấu hình hiện có với khóa `HN_STAFF_DISPLAY_<TAI_KHOAN_ID>`; validate độ dài tối đa 100 ký tự, reject ký tự điều khiển/công thức, chuẩn hóa khoảng trắng; hiển thị qua `safeUser_`, `accountsList_`, `bootstrap_`, `permissionCheck_`; giữ nhãn khi một frontend cũ không gửi trường mới; xóa nhãn khi trống/đổi vai trò, ghi lịch sử trước/sau và bump REV_USERS.
- `public/styles.css`: tăng độ rộng tối thiểu bảng Quản lý tài khoản, cho phép cuộn ngang màn hình nhỏ.
- `public/index.html`, `package.json`, `Code.gs`: đồng bộ nhãn phiên bản và URL có phiên bản của `app.js`.
- Bổ sung test `tests/yc028-display-export.test.js`, `tests/browser_yc028_mock.py` và cập nhật bài cũ chỉ khi tiêu chí nghiệp vụ đã thay đổi hoặc kiểm nhãn phiên bản mới.

## KHÔNG thay đổi

- Không sửa tệp `public/xlsx-export.js` (SHA256 aefaf1c17e6c6ff6f5ea2ab530d41b87b04112ebb4ad0f06349c15ef7cf6947f).
- Không thêm cột/tab Google Sheets. Tab `TAI_KHOAN` vẫn 12 cột, toàn bộ 7 tab vẫn giữ nguyên.
- Không bổ sung quyền hay vai trò kỹ thuật; không thay đổi API gateway, khoá ghi, báo cáo, phân quyền của ADMIN/NHAN_VIEN/CO_SO_DAO_TAO.
- Không tự deploy hay thao tác trên Sheet production.

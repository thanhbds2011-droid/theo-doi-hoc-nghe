# CHANGELOG – YC-HN-029 V4 (28/10/2026)

**Nền:** v1.2.22-RC  
**Loại cập nhật:** giao diện hiển thị chức danh, không nâng phiên bản backend.

## Mã nguồn ứng dụng thay đổi (duy nhất 2 tệp)

1. **`public/app.js` – `renderCurrentUser()`**
   - Giữ nguyên logic lấy tên và chức danh từ `state.user`.
   - Bổ sung lớp giao diện cho Quản trị viên / Cơ sở / Nhân viên / Phó phòng / Trưởng phòng.
   - Ưu tiên nhận dạng "Phó Trưởng phòng" là Phó phòng; không phân loại thành Trưởng phòng.
   - Escape tên và chức danh ở cả phần hiển thị và thuộc tính gợi ý đầy đủ.
   - Không thay đổi quyền, request, trạng thái, menu hoặc cách cập nhật thông tin tài khoản.
2. **`public/styles.css`**
   - Bổ sung nhãn bo tròn, nền nhạt, chữ đậm, ký hiệu trang trí.
   - Giới hạn chiều rộng nhãn, tránh che nút Đăng xuất; giữ mobile như bản nền.
   - CSS giới hạn ở `.topbar .user-box`, không sửa bảng, sidebar, menu, bộ lọc hay modal.

## Không sửa

`public/index.html`, `api/rpc.js`, `apps-script/Code.gs`, `public/xlsx-export.js`, dữ liệu, cấu trúc 7 tab Sheets, các mẫu báo cáo/Excel, xác thực và phân quyền.

## Kiểm thử

- Node.js: **191/191 đạt**.
- `npm run check`: đạt.
- Chromium `tests/browser_yc027_rbac_mock.py`: đạt (3 vai trò và phạm vi quyền).
- Chromium `tests/browser_yc028_mock.py`: đạt (chức danh thay đổi, báo cáo, xuất Excel).
- Chromium `tests/browser_yc029_v4_mock.py` (mới, chỉ kiểm thử UI): đạt (7 tình huống chức danh, escape HTML, nhãn dài ở 1765/1024/768/650px; giữ hành vi mobile 600/390px).

**Giới hạn:** kiểm thử mô phỏng tại máy cục bộ, không phải kiểm thử trên website production hoặc dữ liệu người dùng thật. Chưa deploy.

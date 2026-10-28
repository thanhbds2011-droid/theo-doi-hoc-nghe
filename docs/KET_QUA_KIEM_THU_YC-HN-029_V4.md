# KẾT QUẢ KIỂM THỬ – YC-HN-029 V4

**Ngày:** 28/10/2026  
**Nền:** v1.2.22-RC  
**Phạm vi:** Mã nguồn cục bộ, Chromium chạy trên dữ liệu giả lập; không kết nối Sheets thật và chưa kiểm thử production.

| Phép kiểm thử | Kết quả |
|---|---|
| `npm run check` (cú pháp các tệp JS chính) | Đạt |
| `npm test` (toàn bộ bộ test Node.js hiện hữu) | 191/191 đạt |
| `python tests/browser_yc027_rbac_mock.py` | Đạt, 3 vai trò và 6/3/3 menu |
| `python tests/browser_yc028_mock.py` | Đạt, chức danh thay đổi mà không logout, bốn mẫu báo cáo và in |
| `python tests/browser_yc029_v4_mock.py` | Đạt, kiểm thử giao diện V4 |

### Chi tiết bài Chromium V4

- ADMIN hiển thị **Quản trị viên** (tím).
- NHAN_VIEN: **Trưởng phòng Đào tạo** (vàng), **Phó Phòng DVVL-HTĐT** (xanh), **Phó Trưởng phòng Đào tạo** (xanh), **Nhân viên Phòng A** (xanh), chức danh rỗng → **Nhân viên**.
- CO_SO_DAO_TAO: **Cơ sở đào tạo: Trường C** (xanh lá).
- Chuỗi thử chứa HTML thô được hiển thị như văn bản, không tạo thẻ HTML trong header.
- Nhãn dài không đè lên nút Đăng xuất; kiểm tra ở độ rộng 1765, 1024, 768, 650px.
- Ở 600 và 390px, giữ nguyên hành vi mobile của bản nền (ẩn user-box, vẫn có nút Đăng xuất).
- Không có lỗi JavaScript trong các tình huống thử.

### Kiểm tra ranh giới thay đổi

Mã chạy thực tế chỉ sửa `public/app.js` và `public/styles.css`; tài liệu và bài kiểm thử mới nằm trong `docs/` và `tests/`. Các tệp backend, Excel, API gateway, trang HTML và dữ liệu nguồn giữ nguyên byte so với ZIP đầu vào.

### Những điều chưa được xác nhận

- Chưa đo mức sử dụng quota hoặc tốc độ production (ngoài phạm vi V4).
- Chưa chạy trên máy của người dùng, tài khoản Google thật hay website Vercel đang hoạt động.
- Chưa triển khai website hoặc thay đổi bất kỳ Google Sheets thật nào.

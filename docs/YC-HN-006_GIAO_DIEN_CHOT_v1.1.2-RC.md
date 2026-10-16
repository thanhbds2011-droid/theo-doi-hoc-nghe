# YC-HN-006 — Bàn giao giao diện chuẩn v1.1.2-RC

Ngày: 16/10/2026. Trạng thái: Đã tạo mã nguồn nâng cấp và kiểm thử **offline**. **Chưa triển khai Google Apps Script, GitHub hoặc Vercel production.**

## 1. Baseline và phạm vi

- Source nền: `THEO_DOI_HOC_NGHE_FULL_SOURCE_YC-HN-005_v1.1.1-RC.zip`.
- Ảnh chuẩn: `bảng_điều_khiển_theo_dõi_học_nghề.png` (1672 × 941), lưu kèm tại `docs/giao-dien-tham-chieu/`.
- YC-HN-006 thay thế giao diện Tổng quan của YC-HN-005: **6 KPI một hàng**, một banner “Tổng quan học nghề”, icon SVG cùng hệ, thanh header không lặp tên, biểu đồ cơ sở/nghề.
- Không tái bổ sung biểu đồ tổng hợp sáu KPI. Giữ sáu phân hệ và tất cả nghiệp vụ sẵn có.
- Backend Apps Script và Vercel API **giữ nguyên**, không thay schema 7 tab / 79 cột Google Sheets, không đổi phân quyền, HMAC, Google Sign-In, xóa mềm Phương án A, tệp 10 MB.

## 2. Chi tiết giao diện và hành vi

- Header phía trên chỉ hiển thị thông tin tài khoản và Đăng xuất khi sidebar đang hiện. Ở thiết bị nhỏ, tiêu đề phần mềm hiện trên header vì sidebar ẩn.
- Menu trái gồm đúng icon SVG: `house`, `file-text`, `chart-column`, `layout-grid`, `user-round`, `clock-3`. Không phụ thuộc phông icon hoặc URL bên ngoài.
- Font dùng xuyên suốt: `Segoe UI`, `Tahoma`, `Arial`, `sans-serif`; không chuyển sang font khác.
- Banner xanh pastel gọn: icon 🎓, một tiêu đề Tổng quan học nghề và mô tả ngắn.
- Bộ lọc năm, cơ sở, nghề và nút Lọc dữ liệu nằm trên một hàng ở desktop. Giữ cách nhập năm tự do của source gốc, không thay nghiệp vụ chọn năm.
- Sáu thẻ KPI có màu xanh, lục, tím, cam, đỏ, xám và bằng chiều rộng trong cùng hàng từ 1251 px trở lên. Khi hẹp, chuyển 3 hoặc 2 cột.
- Biểu đồ cột theo **tối đa 4 cơ sở có số hồ sơ lớn nhất**. Không tạo giả dữ liệu. Số trường còn lại được xem trong Báo cáo.
- Biểu đồ tròn cơ cấu nghề sử dụng tối đa 4 nghề đứng đầu, nhóm còn lại vào “Các nghề khác” nếu có. Các tỷ lệ phần trăm hiển thị áp dụng phân bổ phần dư để cộng đúng 100%.
- Các số lượng, nhãn và biểu đồ đều lấy từ **một** lần gọi `overview` đã tồn tại. Không gọi thêm API cho biểu đồ, giữ TTL/cache hiện hành.
- “Xem chi tiết” chỉ xuất hiện với tài khoản có quyền Báo cáo và điều hướng đến phân hệ Báo cáo đang sử dụng cùng bộ lọc năm/cơ sở/nghề.
- Nếu không có dữ liệu, hai khung hiển thị lời nhắc trạng thái trống, không hiển thị số liệu minh họa.
- Footer dùng `Phần mềm nội bộ`, không hiện chữ Google Sheets cho người dùng cuối.

## 3. File được thay đổi

| File | Phạm vi |
|---|---|
| `public/app.js` | Vector icons, cấu trúc menu, banner, KPI, hai biểu đồ, điều hướng Xem chi tiết |
| `public/styles.css` | Hệ thống màu sắc, tỷ lệ bố cục desktop/mobile, căn lề và khung Tổng quan |
| `public/index.html` | Bỏ tiêu đề phụ trùng trên header, nâng nhãn giao diện v1.1.2-RC |
| `package.json` | Phiên bản package v1.1.2-rc.0 |
| `tests/ui-yc005.test.js` | Cập nhật kiểm thử bố cục đã được YC-HN-006 thay thế |
| `tests/ui-yc006.test.js` | Sáu kiểm thử kiểm tra cấu trúc YC-HN-006 |
| `tests/browser_yc006_mock.py` | Kịch bản trình duyệt mô phỏng để so sánh vị trí và điều hướng |
| `README.md`, `docs/...` | Bổ sung ghi chú, ảnh chuẩn và ảnh kiểm thử |

**Không chỉnh sửa:** `apps-script/Code.gs`, `api/rpc.js`, `api/config.js`, `apps-script/appsscript.json`, cấu trúc dữ liệu Google Sheets.

## 4. Kết quả kiểm thử

- `npm run check`: **Đạt**.
- `npm test`: **44/44 đạt** (32 kiểm thử backend/proxy, 6 hồi quy UI YC005, 6 kiểm thử YC006).
- Chromium thực tế + frontend mã nguồn thật + Google login/API **mô phỏng**: **đạt** ở 1672×941, 1920×1080, 1440×900, 1366×768, 990×900 và 390×844.
- Ở cả 4 độ phân giải desktop >= 1366: sáu KPI cùng một hàng; chiều rộng sáu thẻ bằng nhau; menu đủ sáu SVG; hiển thị hai biểu đồ; không có tràn ngang hoặc lỗi JavaScript trong luồng thử nghiệm.
- Ở 990px: KPI 3 cột × 2 hàng; ở 390px: KPI 2 cột × 3 hàng. Đây là chủ đích responsive để tránh tràn.
- Nút “Xem chi tiết” sang Báo cáo; sáu menu mở được; mở/đóng cửa sổ Thêm hồ sơ; chuyển Danh mục; Tài khoản và Nhật ký đều được kiểm tra ở 1672×941.
- Ảnh chụp trong `docs/anh-kiem-thu/YC006_...png` là ảnh chạy trong Chromium với **dữ liệu thử**, không phải dữ liệu thật trên Google Sheets.

**Chưa kiểm chứng trong vòng YC-HN-006:** đăng nhập Google thật, gọi Apps Script/Sheets/Drive production, tải tệp thực tế 10 MB, quyền thực tế của nhân viên, giao diện sau khi deployment. Những giới hạn này được giữ nguyên từ baseline, không thể xem kiểm thử mô phỏng là xác nhận production.

## 5. So sánh mẫu và khác biệt hợp lý

Ảnh thiết kế YC-HN-006 là ảnh minh họa tĩnh. Màu sắc, tỷ lệ sidebar/header, sáu KPI một hàng, icon menu, hai khung biểu đồ, font nền và các khoảng cách chính đã được điều chỉnh để bám sát mẫu trên 1672×941. Dữ liệu, nhãn ngành học dài, font có sẵn trên hệ điều hành, kích thước/chế độ zoom và độ rộng trình duyệt có thể khiến bố cục chi tiết không trùng chính xác từng pixel. Không tuyên bố pixel-perfect trên mọi thiết bị.

## 6. Rollback

Nếu chưa triển khai bản này, không cần rollback. Nếu đã triển khai và cần quay lại, revert commit frontend v1.1.2-RC hoặc redeploy Vercel bản v1.1.1-RC. Không cần rollback database hoặc Apps Script, vì YC-HN-006 không sửa hai thành phần đó.

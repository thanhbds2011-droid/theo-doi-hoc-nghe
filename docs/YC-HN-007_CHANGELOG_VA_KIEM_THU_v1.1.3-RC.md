# YC-HN-007 — CHANGELOG VÀ BÁO CÁO KIỂM THỬ

Phiên bản bàn giao: **v1.1.3-RC**. Baseline: v1.1.2-RC, giao diện YC-HN-006. Ngày: 17/10/2026.

## Phạm vi đã thực hiện

1. **Phân quyền 2 vai trò cố định:** Quản trị viên sử dụng đầy đủ các phân hệ; Nhân viên có quyền xem/thêm/sửa hồ sơ, cập nhật trạng thái, xem báo cáo và quản lý tệp. Nhân viên được xóa mềm **chỉ hồ sơ do chính mình tạo**. Kiểm tra quyền tại Apps Script, bỏ checkbox ở cửa sổ tài khoản. Dữ liệu `QUYEN` cũ không còn được dùng làm cơ sở cấp quyền; mã nguồn cập nhật giá trị khi tài khoản được lưu mà không thay cấu trúc 7 tab/79 cột.
2. **Tình trạng học:** bốn lựa chọn giao diện Đang học / Không tham gia / Bỏ học / Chưa xác nhận. Mặc định tạo mới Đang học. Ngày/lý do bỏ học chỉ xuất hiện và bắt buộc khi chọn Bỏ học. Backend tiếp tục dùng `TRANG_THAI_THAM_GIA`, `DA_BO_HOC`, `NGAY_BO_HOC`, `LY_DO_BO_HOC_ID`; thống kê 6 KPI giữ nguyên.
3. **Ẩn ID kỹ thuật:** loại bỏ mã người học dưới tên, trong kết quả tìm và thông tin mã hồ sơ tại cửa sổ sửa. ID vẫn giữ trong database.
4. **Loại bỏ hướng dẫn dài** về số quyết định tại biểu mẫu; chống trùng quyết định vẫn thực hiện tại Apps Script.
5. **Khắc phục 2 nút Lưu:** tìm được lỗi xác định biểu mẫu bằng `form.id` bị che bởi trường ẩn `name="id"`. Chuyển sang `form.getAttribute('id')`, đã thử Lưu danh mục và Lưu tài khoản trong Chromium mock.
6. **Nhập danh mục CSV nhiều cột:** mẫu theo từng nhóm, giữ tên/tên viết tắt/địa chỉ/ghi chú/thứ tự; chấp nhận CSV UTF-8 với dấu phẩy hoặc chấm phẩy; kiểm tra trước khi nhập, chống trùng, tự cấp mã phía server, giữ bản ghi cũ.
7. **Tối ưu menu:** tái sử dụng DOM trang đã tải trong bộ nhớ phiên còn hạn, tránh dựng lại spinner/đọc API khi quay lại ngay; xóa cache sau thay đổi, lọc/phân trang làm mới đúng trang; không lưu dữ liệu vào localStorage; giảm gọi bootstrap không cần sau cập nhật hồ sơ.
8. **Giữ YC-HN-006:** 6 KPI một hàng trên desktop, icon SVG thống nhất, hai biểu đồ theo cơ sở/nghề, font hệ thống, không hiện Google Sheets trên giao diện.

## Những file có thay đổi so với baseline

| File | Thay đổi | SHA-256 mới |
|---|---|---|
| `public/app.js` | Có | `7176ce48a3b5c07e946d05cf175d8bba052487e91ce198e1ac4be01358bac8d2` |
| `public/index.html` | Có | `321f0c1d921ecb8f3a120ee4b25df5740bedbbe759a78e63745133de0b810275` |
| `public/styles.css` | Có | `d111adb0876727445dbd5684d87038fc0e5a20e347872926518ec531945fcc00` |
| `apps-script/Code.gs` | Có | `c19a538a7557dc6a3a9d28e7c703dae60bc1cea218a92f690019d85b5b7d3164` |
| `api/rpc.js` | Không | `42708d537b65371f650147697d9c1ec7c78972ead7cb5270dec28a6a1b7fcb5f` |
| `api/config.js` | Không | `53ac569d9e0ffe595b28ef17cc57f7fcf6ab57ae6b682cff55dd10900e8326a0` |

Ngoài các tệp ứng dụng đã thay đổi, bổ sung 3 template CSV, kiểm thử YC007, hướng dẫn và cập nhật phiên bản trong `package.json`.

## Kiểm thử đã thực hiện

- `npm run check`: **Đạt**.
- `npm test`: **57/57 đạt**.
- Chromium giả lập: **Đạt** cho điều hướng quay lại Tổng quan không gửi lại `overview` khi cache còn hạn; tạo biểu mẫu trạng thái và ẩn/hiện trường bỏ học; bấm Lưu danh mục; kiểm tra/nhập CSV; bấm Lưu tài khoản; không còn checkbox cấp quyền.
- Chromium 1440×900 và 390×844: **Không tràn ngang** trên các tình huống đã thử.
- Backend mô phỏng: kiểm tra xóa chỉ hồ sơ mình tạo, phân quyền 2 vai trò, trùng quyết định, KPI, nhập danh mục nhiều cột.

**Giới hạn:** Không có quyền truy cập Web App Apps Script/Google Sheets/Google Drive production trong lần kiểm thử này. Chưa thể xác nhận thực tế tệp 10 MB, trạng thái tài khoản và lưu danh mục trên môi trường production. Các kịch bản này cần được người quản trị thử trong môi trường kiểm thử trước khi thay phiên bản hoạt động.

## Không thay đổi

- `api/rpc.js` và `api/config.js` (chữ ký HMAC, xác minh Google ID Token).
- 7 tab và 79 cột Google Sheets, cấu trúc URL/domain, sơ đồ xác thực và mã ID.
- Luồng Drive upload tệp 10 MB đã có từ baseline.

## Điều kiện trước khi đưa lên production

Làm sao lưu, thử nghiệm trên một Apps Script deployment mới hoặc test, kiểm tra cấu hình Vercel `GAS_WEB_APP_URL`, kiểm thử bằng Admin/Nhân viên và chỉ cập nhật production khi các thử nghiệm đạt. Không chia sẻ secret/token trong chat.

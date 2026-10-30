# MASTER PROMPT – YC-HN-034 V3 – ĐÃ CHỐT

**Dự án:** THEO DÕI HỌC NGHỀ  
**Phiên bản nền:** `v1.2.27-RC`  
**Phiên bản mã nguồn kết quả:** `v1.2.28-RC`  
**Phạm vi:** Toàn bộ YC-HN-034 V1, V2, V3; kế thừa YC-HN-001 đến YC-HN-033 đã CHỐT.  
**Trạng thái mã nguồn:** ĐÃ TRIỂN KHAI CỤC BỘ; CHƯA TRIỂN KHAI PRODUCTION.

## I. Thống nhất nhãn xuất báo cáo

- Nút tại Hồ sơ học nghề và Báo cáo: **Xuất báo cáo**.
- Hộp thoại và nút xác nhận: **Xuất báo cáo học nghề / Xuất báo cáo**.
- Thông báo tải danh sách: **Đã xuất báo cáo gồm N hồ sơ**.
- Giữ nguyên bốn mẫu XLSX, kết quả, định dạng và chức năng Nhập Excel/Cập nhật tình trạng từ Excel.

## II. Không cho nhập tình trạng khác tự do

- Không còn `Khác` và ô nhập tên tình trạng trong biểu mẫu Thêm/Sửa hồ sơ, Cập nhật tình trạng.
- Chỉ các tình trạng chuẩn và các mã tùy chỉnh **đã được ADMIN phê duyệt** mới được chọn hoặc gán mới.
- Bảo vệ cả giao diện và Apps Script: `record_save`, `record_status`, nhập hàng loạt, cập nhật hàng loạt; không tin dữ liệu gửi trực tiếp từ người dùng.
- Không thay đổi lựa chọn Khác ở **Giới tính**.

## III. ADMIN quản lý danh mục tình trạng

Trong **Danh mục → Tình trạng học nghề**:
- Xem mã, tên, trạng thái phê duyệt, số lượng hồ sơ đang sử dụng.
- Thêm tình trạng mới, phê duyệt tình trạng lịch sử, ngừng sử dụng tình trạng.
- Xem danh sách hồ sơ liên quan để đối soát.
- Không được thay đổi mã tình trạng đã cấp; tình trạng có hồ sơ sử dụng không được đổi tên.
- Tình trạng mặc định được bảo vệ, không bị xóa/sửa mã.
- Phân quyền tại backend: chỉ `ADMIN` gọi được `status_manage_list`, `status_manage_save`.
- Ghi nhật ký của thao tác quản trị và tăng phiên bản `STATUS` để đồng bộ.

## IV. Bảo toàn dữ liệu lịch sử

- Mọi khóa `HN_STATUS_CUS_...` đã có tiếp tục giữ nguyên; **không tự xóa hoặc thay đổi tên**.
- Tình trạng cũ chưa có phê duyệt mang trạng thái **Cần rà soát (PENDING)**, không thể dùng để gán mới.
- Phê duyệt ghi khóa metadata `HN_STATUS_RULE_CUS_... = ACTIVE` trong tab **Cấu hình hệ thống** hiện có.
- Ngừng sử dụng ghi `INACTIVE`; hồ sơ lịch sử vẫn giữ mã và tên cũ, vẫn được tính vào báo cáo.
- Không tự gộp mã trùng tên, không chuyển tự động tình trạng hồ sơ.
- Sửa thông tin gốc không liên quan tình trạng của hồ sơ lịch sử vẫn được phép nếu giữ nguyên tình trạng cũ và đủ quyền.
- Bảo toàn `PHIEN_BAN`, khóa ghi, nhật ký, phân quyền trường, công thức thống kê và bốn mẫu Excel.

## V. Dữ liệu & phạm vi mã nguồn

- **Không tạo tab hoặc cột Google Sheets mới.** Sử dụng dòng cấu hình bổ sung trong tab hiện có.
- Sửa `public/app.js`, `apps-script/Code.gs` và cập nhật số phiên bản trong `public/index.html`, `package.json`.
- Không sửa `api/rpc.js`, `public/styles.css`, `public/xlsx-export.js`.
- Không thay đổi nền tảng GitHub → Vercel → Apps Script → Google Sheets.

## VI. Nghiệm thu

- Đúng menu ba vai trò và backend từ chối NHAN_VIEN, CO_SO_DAO_TAO quản trị tình trạng.
- ADMIN tạo/phê duyệt/ngừng sử dụng; thao tác lưu không tự đăng ký tình trạng mới.
- Tình trạng cũ hiển thị tên trong hồ sơ nhưng không vào dropdown chọn mới nếu chưa duyệt.
- Dữ liệu báo cáo, Excel và thống kê không đổi khi chỉ phê duyệt/ngừng sử dụng.
- Xuất báo cáo vẫn tải được XLSX theo quyền.
- Kiểm thử Node.js, giao diện và tích hợp Apps Script/Sheets staging; chỉ đưa vào production khi nghiệm thu thực tế.

## VII. Bàn giao

ZIP đầy đủ, ZIP rút gọn, `Code.gs`, changelog, báo cáo kiểm thử, hướng dẫn triển khai & hoàn tác.

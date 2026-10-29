# MASTER PROMPT – YC-HN-032 V2 – ĐÃ CHỐT VÀ TRIỂN KHAI

**Dự án:** THEO DÕI HỌC NGHỀ  
**Nền:** v1.2.25-RC (YC-HN-031)  
**Phiên bản bàn giao:** v1.2.26-RC  
**Kế thừa:** YC-HN-001 đến YC-HN-031 đã CHỐT.  
**Trạng thái:** ĐÃ CHỐT – MÃ NGUỒN HOÀN THÀNH – CHỜ NGHIỆM THU STAGING.

## 1. Mục tiêu và dữ liệu nguồn

Tại ba menu **Tổng quan, Hồ sơ học nghề, Báo cáo**, bộ lọc **Nghề đào tạo** của ADMIN và NHAN_VIEN phụ thuộc bộ lọc **Cơ sở đào tạo**: chọn một cơ sở chỉ hiển thị nghề có quyết định chưa xóa thuộc cơ sở đó; chọn **Tất cả cơ sở** hiển thị tập nghề có quyết định trên toàn Trung tâm. Mỗi `NGHE_ID` chỉ xuất hiện một lần. Những nghề không còn sử dụng nhưng có quyết định lịch sử vẫn có mặt trong bộ lọc.

Nguồn là bảng Hồ sơ học nghề hiện có: `TRUONG_ID`, `NGHE_ID`, `TRANG_THAI_HO_SO`, đối chiếu tên trong Danh mục nghề. Danh sách nghề gốc không phụ thuộc năm, trạng thái học, từ khóa hoặc khoảng ngày. Không tạo tab/cột Sheets hoặc bảng phân công nghề.

## 2. Phân quyền

- **ADMIN:** có thể lọc tất cả cơ sở, hoặc nghề theo một cơ sở. Vẫn sử dụng danh mục nghề đầy đủ trong phần quản lý danh mục, thêm/sửa hồ sơ.
- **NHAN_VIEN:** có cùng phạm vi chọn bộ lọc cho toàn Trung tâm, nhưng giữ nguyên quyền NHAN_VIEN (không được quản lý danh mục, sửa dữ liệu gốc hoặc xóa hồ sơ).
- **CO_SO_DAO_TAO:** backend chỉ gửi danh mục nghề thuộc trường đã cấp; không gửi chỉ mục quan hệ trường–nghề toàn Trung tâm. Không thay đổi quyền truy cập hồ sơ.

Backend tiếp tục kiểm tra danh tính và quyền ở mọi yêu cầu; giao diện lọc nghề không được xem là hàng rào bảo mật.

## 3. Sắp xếp tiếng Việt A–Z

- Sau khi xác định tập nghề hợp lệ, sắp xếp theo **toàn bộ tên nghề** dựa trên quy tắc so sánh tiếng Việt (`Intl.Collator('vi')`).
- Không phân biệt hoa/thường ở thứ tự chính; dùng tên gốc và mã nghề làm tiêu chí phụ ổn định khi trùng thứ tự.
- **Tất cả nghề** luôn nằm trên cùng; những nghề còn lại theo A–Z.
- Không chuẩn hóa, thay tên/mã nghề hoặc đảo thứ tự vật lý trong Sheets.

## 4. Trải nghiệm ở ba menu

- Khi thay đổi lựa chọn **Cơ sở đào tạo**, danh sách ở ô **Nghề đào tạo** cập nhật ngay từ bộ nhớ trình duyệt. **Không tự gọi API, không tự bấm Lọc dữ liệu và không dựng lại trang.**
- Nghề đang chọn được giữ nếu hợp lệ ở trường mới; nếu không còn hợp lệ, chọn **Tất cả nghề**.
- Các ô năm, tình trạng, từ ngày, đến ngày, tìm kiếm không bị xóa do thay đổi cơ sở.
- Nút **Lọc dữ liệu** tiếp tục quyết định thời điểm tải số liệu/bảng/báo cáo theo bộ lọc người dùng chọn.
- Chức năng thêm/sửa hồ sơ, danh mục quản trị, công thức báo cáo, in và 4 mẫu Excel không thay đổi.

## 5. Đồng bộ và hiệu năng

- Tái sử dụng `schoolTradeIndex_()` của YC-HN-031; backend cung cấp `tradeScopeMap` cho ADMIN/NHAN_VIEN qua `bootstrap`, nhưng gửi `null` cho CO_SO_DAO_TAO.
- `tradeScopeRevision` của ADMIN/NHAN_VIEN phản ánh phiên bản quan hệ trường–nghề toàn Trung tâm; tài khoản cơ sở vẫn sử dụng phiên bản theo trường riêng. Chỉ khi quan hệ trường–nghề/danh mục thay đổi mới tải lại phạm vi danh sách nghề, không tải vì cập nhật tình trạng học thông thường.
- Khi cơ sở/nghề thay đổi do nhập, sửa, xóa hoặc chuyển trường, dùng cơ chế kiểm tra gần thời gian thực đã duyệt. Không có cập nhật push tức thời, không bổ sung Firebase/WebSocket.
- Không phát sinh lệnh đọc Sheets khi chỉ đổi cơ sở trên giao diện.

## 6. Các tệp triển khai

- `public/app.js`: bổ sung lọc theo `tradeScopeMap`, sắp xếp A–Z, cập nhật dropdown sau khi đổi cơ sở và khi nhận revision mới.
- `apps-script/Code.gs`: trả chỉ mục phạm vi phù hợp từng vai trò và revision cho toàn Trung tâm khi ADMIN/NHAN_VIEN đăng nhập.
- `public/index.html`, `package.json`: chỉ đồng bộ số phiên bản / đường dẫn cache-busting.
- `README.md` và `docs/`, `tests/`: cập nhật thông tin và kiểm thử.

**Không thay đổi:** `api/rpc.js`, `api/config.js`, `public/styles.css`, `public/xlsx-export.js`, danh mục, schema Google Sheets và các mẫu Excel.

## 7. Điều kiện nghiệm thu

1. ADMIN/NHAN_VIEN: Trường A thấy nghề A; B thấy nghề B; Tất cả thấy hợp các nghề đã có quyết định, không trùng.
2. CO_SO_DAO_TAO: chỉ thấy nghề theo trường được cấp; không nhận `tradeScopeMap` toàn Trung tâm.
3. Dropdown nghề sắp xếp A–Z theo bảng chữ cái tiếng Việt, **Tất cả nghề** đứng đầu.
4. Đổi trường cập nhật ngay; giữ nghề hợp lệ, bỏ nghề không còn hợp lệ; giữ nguyên những ô lọc khác.
5. Cả ba menu hoạt động giống nhau; không làm mới trang hoặc gọi API chỉ vì đổi trường.
6. Nghề mới/xóa/chuyển trường được phản ánh sau khi đồng bộ; không ảnh hưởng dữ liệu thống kê, báo cáo, in, Excel.
7. Không thay đổi quyền hoặc dữ liệu thật; toàn bộ kiểm thử cũ và mới đạt.
8. Không tuyên bố nghiệm thu tốc độ thực tế/20 người đồng thời nếu chưa kiểm thử staging tương ứng.

## 8. Giới hạn và bảo lưu

Không tự triển khai production; không thay đổi Google Sheets thật. Mọi kết quả tự động cập nhật khi thay đổi hồ sơ **qua ứng dụng**; chỉnh trực tiếp trên Sheets có thể không tăng revision nên không được bảo đảm nhận biết ngay. Phải triển khai Apps Script rồi frontend **đồng bộ** theo hướng dẫn và chuẩn bị hoàn tác.

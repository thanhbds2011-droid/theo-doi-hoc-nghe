# MASTER PROMPT YC-HN-028 / V2 — ĐÃ CHỐT VÀ ĐÃ TRIỂN KHAI TRÊN MÃ NGUỒN

**Trạng thái cập nhật:** 27/10/2026 — ĐÃ CHỐT, mã nguồn bản **v1.2.22-RC** đã chỉnh và kiểm thử cục bộ. **Chưa deploy production.**

**Nguồn đầy đủ yêu cầu V1 + V2 được bảo toàn dưới đây (các nhãn CHỜ CHỐT bên trong là văn bản lịch sử):**

# MASTER PROMPT — YC-HN-028 / V2 — TÍCH LŨY CHỨC DANH HIỂN THỊ VÀ XUẤT EXCEL BÁO CÁO CHO NHÂN VIÊN

**Nền mã nguồn:** `v1.2.21-RC` (`THEO_DOI_HOC_NGHE_YC-HN-027_V2_v1.2.21-RC.zip`).\
**Ngày cập nhật:** 27/10/2026.\
**Trạng thái:** **CHỜ CHỐT YC-HN-028 V2 — CHƯA SỬA MÃ NGUỒN, CHƯA CHẠY TEST V2, CHƯA DEPLOY.**\
**Nguyên tắc tích lũy:** Giữ toàn bộ yêu cầu V1 về chức danh/phòng ban và bổ sung V2 về quyền Xuất Excel ở menu Báo cáo. Các dòng “CHỜ CHỐT V1” ở phần lịch sử bên dưới là trạng thái cũ; trạng thái điều hành của tài liệu này là **CHỜ CHỐT V2**.

---

# PHẦN A — TOÀN VĂN V1 (BẢO TOÀN YÊU CẦU)

# MASTER PROMPT — YC-HN-028 / V1 — BỔ SUNG CHỨC DANH/PHÒNG BAN HIỂN THỊ CHO TÀI KHOẢN NHÂN VIÊN

**Dự án:** THEO DÕI HỌC NGHỀ — GitHub/Vercel + Google Apps Script + Google Sheets.\
**Ngày tiếp nhận:** 27/10/2026.\
**Nguồn nền đã kiểm tra trực tiếp:** `THEO_DOI_HOC_NGHE_YC-HN-027_V2_v1.2.21-RC.zip` (`public/app.js`, `public/styles.css`, `apps-script/Code.gs`); ảnh giao diện phần người dùng đăng nhập.\
**Trạng thái:** **CHỜ CHỐT YC-HN-028 V1 — CHƯA SỬA MÃ NGUỒN, CHƯA CHẠY TEST MỚI, CHƯA DEPLOY**.

## I. Yêu cầu nghiệp vụ cần thực hiện

Quản trị viên, khi **Thêm tài khoản** hoặc **Sửa tài khoản**, cần có một ô tùy nhập **`Chức danh/Phòng ban hiển thị`** dành cho tài khoản có vai trò kỹ thuật `NHAN_VIEN`.

Ví dụ người dùng nhập một trong các giá trị:

- `Nhân viên Phòng A`
- `Nhân viên Phòng B`
- `Trưởng phòng A`
- `Trưởng phòng B`

Tại góc trên bên phải sau khi đăng nhập, dòng hiện đang ghi cố định **`Nhân viên`** được thay bằng chuỗi do Quản trị viên nhập. Ví dụ:

> Nguyễn Văn A\
> **Trưởng phòng A**

Nếu chưa được nhập hoặc xóa trắng, giao diện mặc định hiển thị **`Nhân viên`** như trước.

**Cực kỳ quan trọng:** Đây **CHỈ LÀ CHỨC DANH / THÔNG TIN MÔ TẢ ĐỂ HIỂN THỊ**, không phải một `VAI_TRO` mới, không phải một bộ quyền mới, cũng không phải phân công trường đào tạo. Dù nhãn hiển thị là `Trưởng phòng A`, quyền đăng nhập vẫn tuyệt đối dựa trên `VAI_TRO='NHAN_VIEN'` và chính sách của YC-HN-027 V2. Nhân viên được xem và cập nhật tình trạng **mọi cơ sở**, không được thêm/sửa/xóa hồ sơ, chỉ có 3 menu Tổng quan — Hồ sơ học nghề — Báo cáo. Không đổi quyền `ADMIN`, `CO_SO_DAO_TAO`.

## II. Kết quả kiểm tra thực tế mã nguồn v1.2.21-RC

1. `public/app.js`, `activateSession()` gần **dòng 149**: `#current-user` hiện tên rồi quyết định dòng dưới trực tiếp từ `state.user.VAI_TRO`; khi là `NHAN_VIEN` luôn in chữ **`Nhân viên`**. Không có trường chức danh riêng.
2. `public/app.js`, `accountForm()` gần **dòng 1049**: biểu mẫu gồm Email, Họ tên, Vai trò, Cơ sở được cấp (chỉ tài khoản trường), Trạng thái. Chưa có ô chức danh/phòng ban.
3. `public/app.js`, `renderAccounts()` gần **dòng 592–596**: bảng tài khoản có Họ tên, Email, Vai trò, Cơ sở được cấp, Trạng thái, Thao tác. Chưa có cột chức danh/phòng ban.
4. `apps-script/Code.gs`, `APP.lists.TAI_KHOAN` gần **dòng 18**, và `APP.headersVi.TAI_KHOAN` gần **dòng 49**: bảng tài khoản có **12 cột**, không có cột chức danh.
5. `apps-script/Code.gs`, `safeUser_()` gần **dòng 400**: dữ liệu người dùng gửi về frontend chỉ có ID, Email, Họ tên, Vai trò, Trường ID, Quyền và Trạng thái.
6. `apps-script/Code.gs`, `accountsList_()` gần **dòng 1086** và `accountSave_()` gần **dòng 1087–1109**: đang xử lý tạo/sửa tài khoản; `accountSave_` có `bump_('USERS')` để vô hiệu cache quyền sau thay đổi.
7. `apps-script/Code.gs`, tab `CAU_HINH` **đã tồn tại** và đang lưu ràng buộc một Gmail — một trường bằng khóa dạng `HN_SCHOOL_<TAI_KHOAN_ID>`. Đây là tiền lệ kỹ thuật để lưu thêm **metadata mô tả**, không phải tạo bảng dữ liệu mới.
8. `public/app.js`, `verifyPermission()` gần **dòng 58–82** kiểm tra các trường nhận diện/role, và làm mới cache khi revision USERS đổi. Mục tiêu là thay đổi chức danh không gây đăng xuất hoặc thay quyền.

## III. Đặc tả triển khai sau khi CHỐT

### YC-028.01 — Giao diện quản trị tài khoản

- Trong modal **Thêm/Sửa tài khoản**, thêm một ô văn bản có nhãn **`Chức danh/Phòng ban hiển thị`**. Placeholder gợi ý: `Ví dụ: Nhân viên Phòng A, Trưởng phòng B`.
- Ô này chỉ hiện/chỉnh khi vai trò chọn `NHAN_VIEN`. Với `ADMIN` và `CO_SO_DAO_TAO`, giữ mô tả vai trò đang có; không dùng chức danh này để thay tên trường của C.
- Giá trị **không bắt buộc**; rỗng nghĩa là vẫn hiển thị `Nhân viên`.
- Cho phép Quản trị viên thay đổi hoặc xóa trắng bất cứ lúc nào. Chuẩn hóa khoảng trắng, giới hạn đề xuất **100 ký tự**, từ chối chuỗi chứa ký tự điều khiển; hiển thị qua hàm escape hiện có, không đưa HTML/JS thô vào giao diện.
- Danh sách **Quản lý tài khoản** có thêm cột **`Chức danh/Phòng ban`** để Quản trị viên nhận diện rõ người dùng; **cột Vai trò** vẫn là `Nhân viên` (đúng quyền kỹ thuật), không bị thay bằng nhãn tùy nhập.
- Giữ bố cục bảng có cuộn ngang khi màn hình nhỏ, không làm tràn nút Thao tác.

### YC-028.02 — Chỉ đổi nhãn người dùng tại góc trên bên phải

- Trong header `#current-user`: dòng đầu tiếp tục là `HO_TEN` (hoặc Email nếu thiếu Họ tên), dòng dưới đối với `NHAN_VIEN` là `CHUC_DANH_HIEN_THI` nếu có; nếu trống thì mặc định `Nhân viên`.
- Ví dụ `(Họ tên: Nguyễn Văn A, VAI_TRO=NHAN_VIEN, chức danh='Trưởng phòng A')` hiển thị `Nguyễn Văn A` / `Trưởng phòng A`, **không** chuyển sang quyền ADMIN.
- Role `ADMIN` vẫn hiển thị `Quản trị viên`; role `CO_SO_DAO_TAO` vẫn hiển thị tên cơ sở được cấp. Không thay đổi menu và các nút hiện hành.
- Khi Quản trị viên cập nhật chức danh và tài khoản B đang mở, sau khi phiên kiểm tra lại/cập nhật thông tin người dùng hoặc đăng nhập lại, phải hiển thị nhãn mới. **Không tự logout** B chỉ vì chữ hiển thị thay đổi; không giữ mãi nhãn cũ trong cache.

### YC-028.03 — Lưu dữ liệu không thay đổi cấu trúc nghiệp vụ

**Phương án khuyến nghị:** Tận dụng tab **`CAU_HINH` hiện có** để lưu metadata với một khóa **riêng theo `TAI_KHOAN_ID`**, ví dụ `HN_STAFF_DISPLAY_<TAI_KHOAN_ID>`. Cách này đáp ứng yêu cầu **thêm cột thông tin trên giao diện Quản lý tài khoản** mà **không phải chèn cột vật lý vào Sheet `Tài khoản người dùng`**, không làm đổi thứ tự 12 cột hoặc cấu trúc 7 tab đang vận hành.

- Cần đọc/ghi metadata tại `accountSave_`, đưa vào `accountsList_`, `bootstrap_` và `permissionCheck_` qua thuộc tính riêng, ví dụ `CHUC_DANH_HIEN_THI` trong `safeUser_`, nhưng **không bao giờ dùng metadata này làm điều kiện cấp quyền**.
- Chỉ ADMIN có `ACCOUNT_MANAGE` được cập nhật metadata; mọi payload khác từ tài khoản B/C bị từ chối ở backend.
- Ghi/xóa nhãn đúng tài khoản theo ID, không gắn theo email (email có thể thay đổi), không trùng khóa; nếu xóa trắng thì xóa/ghi rỗng có kiểm soát; chuyển từ NHAN_VIEN sang role khác không để nhãn cũ xuất hiện.
- Giữ nguyên việc bump `REV_USERS` và invalidate cache khi sửa metadata, bao gồm các phiên của người dùng đã đăng nhập, nhưng **không tự thay VAI_TRO / QUYEN / TRUONG_ID**. Không làm backend đọc thêm toàn bộ bảng CAU_HINH cho từng request ghi hồ sơ nếu không cần; ưu tiên chỉ nạp nhãn ở các đường bootstrap, permission_check, accounts_list hoặc cache theo revision USERS.
- Nhật ký sửa tài khoản ghi được giá trị chức danh trước/sau (không bao gồm token), giữ lịch sử truy vết.
- Tài khoản cũ không có metadata vẫn hoạt động bình thường và hiển thị `Nhân viên`; không bắt buộc nhập bổ sung cho tất cả tài khoản.

**Không tự chuyển sang phương án thêm cột vật lý trong Sheet `TAI_KHOAN`** nếu chưa đánh giá migration/backup đầy đủ và được người dùng CHỐT riêng; dữ liệu Sheet hiện ánh xạ theo thứ tự cột.

### YC-028.04 — Bảo toàn phân quyền YC-HN-027 V2

- `NHAN_VIEN` **xem** mọi trường, **cập nhật tình trạng** mọi trường, không thêm/sửa nội dung/xóa hồ sơ, không upload/xóa tệp, chỉ thấy 3 menu Tổng quan — Hồ sơ học nghề — Báo cáo.
- `CO_SO_DAO_TAO` tiếp tục giới hạn dữ liệu `TRUONG_ID` được cấp; giữ quyền xuất Excel và in trong phạm vi trường.
- `ADMIN` giữ toàn quyền hiện hành. Bản ghi chữ `Trưởng phòng A`, `Quản trị`, `Admin` trong trường chức danh **không thể tạo quyền ADMIN**. Từ chối gọi API trái quyền.
- Giữ nguyên lọc ngày, thống kê Hoàn thành khóa học, báo cáo theo trường/nghề, Excel 25 cột, cập nhật cục bộ sau lưu và mọi nghiệp vụ trước.

## IV. Kiểm thử nghiệm thu bắt buộc

1. Quản trị viên tạo nhân viên B, `VAI_TRO=NHAN_VIEN`, `CHUC_DANH_HIEN_THI='Nhân viên Phòng A'`: trên danh sách tài khoản cột Vai trò = `Nhân viên`, cột Chức danh = `Nhân viên Phòng A`; B đăng nhập, header đúng hai dòng.
2. Sửa thành `Trưởng phòng B`: header sau khi đồng bộ hiển thị `Trưởng phòng B`; B vẫn chỉ có 3 menu, xem/cập nhật tình trạng mọi trường, không được thêm/sửa/xóa.
3. Xóa trắng: header quay về mặc định `Nhân viên`. Các tài khoản nhân viên cũ chưa có metadata cũng mặc định đúng.
4. Điền chức danh chứa từ `Quản trị viên`, `ADMIN`, `Trưởng phòng`: API vẫn không tăng quyền. Gọi `record_save`, `record_delete`, `file_upload`, `accounts_list`, `audit_list` từ tài khoản B vẫn bị backend từ chối như trước.
5. Nhân viên C/B đang mở phiên và admin sửa nhãn: không rò dữ liệu, không lặp lại tình trạng kiểm tra quyền vô hạn, không tự logout vì đổi nhãn; cache dữ liệu cá nhân được làm mới đúng.
6. Tài khoản trường vẫn hiện `Cơ sở đào tạo: <Tên trường>` và chỉ nhìn thấy trường mình; role Admin vẫn hiện `Quản trị viên`, không bị ảnh hưởng.
7. Giá trị nhập dài/Unicode tiếng Việt/khoảng trắng dư/HTML injection/chuỗi trống, tương thích điện thoại, dữ liệu tài khoản bị xóa mềm, đổi email, đổi vai trò.
8. Kiểm thử frontend Chromium (cấp/sửa/xóa chức danh, header), Apps Script (quyền, metadata, revision), hồi quy toàn bộ bộ test nền **v1.2.21-RC (185/185 đã báo cáo)**; chỉ công bố số bài thật sự chạy đạt.
9. Không thay đổi dữ liệu thật khi test; không có thay đổi 25 cột Excel, cơ chế báo cáo, PHIEN_BAN hồ sơ hoặc nhật ký thao tác học nghề.

## V. Phạm vi bàn giao sau CHỐT

- Dự kiến sửa `public/app.js`, `apps-script/Code.gs`, có thể `public/styles.css` để bố cục bảng, và test tương ứng; giữ `public/xlsx-export.js` nguyên trạng.
- Bàn giao ZIP GitHub đầy đủ, `Code.gs` đầy đủ, changelog, Master Prompt đã CHỐT, kết quả kiểm thử thực chạy, hướng dẫn staging/backup/rollback. Nếu backend metadata thay đổi, bắt buộc cập nhật cả Apps Script và GitHub/Vercel.
- **Không triển khai trực tiếp production** hoặc thay đổi dữ liệu Google Sheets khi chưa được người dùng yêu cầu triển khai rõ ràng.

**TRẠNG THÁI: YC-HN-028 V1 — CHỜ CHỐT, CHƯA SỬA CODE.**

---

# PHẦN B — YÊU CẦU BỔ SUNG YC-HN-028 / V2 (27/10/2026)

## VI. Yêu cầu mới: Nhân viên được Xuất Excel tại menu Báo cáo

**Hiện trạng:** Người dùng đăng nhập bằng vai trò kỹ thuật `NHAN_VIEN` vào **Báo cáo học nghề** chỉ thấy nút `In báo cáo`, không thấy nút `Xuất Excel` giống Quản trị viên. Người dùng yêu cầu nhân viên được xuất Excel để tổng hợp, họp và lập báo cáo. Ảnh v1.2.21-RC có tên người dùng và dòng `Nhân viên`, tại phần đầu trang chỉ có `In báo cáo`.

**YC-028.05 — Bổ sung nút Xuất Excel cho Nhân viên tại Báo cáo (P0)**

1. Với tài khoản `NHAN_VIEN` hợp lệ đã có `REPORT_EXPORT`, hiển thị **nút `Xuất Excel` bên cạnh `In báo cáo`** trên trang **Báo cáo học nghề**, cùng cấu trúc và vị trí như Quản trị viên. Không thay thế nút In, không thêm nút không cần thiết.
2. Cho Nhân viên sử dụng đủ **bốn mẫu xuất đã có** trong `exportModal()`:
   - Danh sách hồ sơ học nghề 25 cột;
   - Báo cáo tổng hợp (Chỉ tiêu / Số lượng);
   - Báo cáo theo cơ sở đào tạo;
   - Báo cáo theo nghề đào tạo.
3. **Phạm vi xuất của `NHAN_VIEN`: toàn bộ dữ liệu Trung tâm mà vai trò này được phép xem theo YC-HN-027 V2**, kết hợp đúng bộ lọc năm QĐ, cơ sở, nghề, tình trạng và khoảng ngày đã *áp dụng* trên trang Báo cáo. Không giới hạn theo người đã nhập hồ sơ, không giới hạn vào một cơ sở cụ thể, không lấy trường đang nhập nháp chưa bấm `Lọc dữ liệu`.
4. Giữ nguyên các quy tắc nghiệp vụ đã CHỐT: `Đã tham gia` bao gồm người `Bỏ học` (YC-HN-026 V2); `Hoàn thành khóa học` theo `NGAY_KET_THUC_DU_KIEN`, với hồ sơ đã tham gia và không bỏ học (YC-HN-025 V2/V3); các chỉ tiêu QĐ thông thường theo `NGAY_QUYET_DINH`; cột báo cáo ma trận, tình trạng tùy chỉnh, hàng Tổng cộng, phân quyền và số liệu theo bộ lọc không thay đổi.
5. **Không cấp thêm quyền** Thêm/Sửa/Xóa hồ sơ, quản lý danh mục/tài khoản/nhật ký, nhập hàng loạt hoặc quản lý tệp; vai trò Nhân viên tiếp tục chỉ có ba menu: Tổng quan — Hồ sơ học nghề — Báo cáo. `Xuất Excel` là quyền đọc dữ liệu báo cáo, không phải quyền ghi.
6. Tài khoản `CO_SO_DAO_TAO` tiếp tục thấy `Xuất Excel` và `In báo cáo`, nhưng **chỉ xuất dữ liệu của trường được gán**; Quản trị viên tiếp tục quyền hiện hành; giữ chính sách Nhân viên đối với nút Xuất Excel ở trang Hồ sơ học nghề (đã hiện do quyền `REPORT_EXPORT`).

## VII. Nguyên nhân xác minh từ `v1.2.21-RC`

Đã đối chiếu trực tiếp các file trong ZIP `THEO_DOI_HOC_NGHE_YC-HN-027_V2_v1.2.21-RC.zip`:

1. `public/app.js`, dòng **45–46**: `STAFF_RIGHTS` của frontend **đã có** `'REPORT_EXPORT'`; `allowed('REPORT_EXPORT')` với vai trò `NHAN_VIEN` trả về `true` nếu phiên hợp lệ.
2. `public/app.js`, `renderReports()` gần **dòng 571**: điều kiện hiển thị nút hiện tại là `allowed('REPORT_EXPORT') && (VAI_TRO==='ADMIN'||VAI_TRO==='CO_SO_DAO_TAO')`. **Điều kiện vai trò bổ sung này đang loại Nhân viên dù có quyền REPORT_EXPORT**. Đây là nguyên nhân trực tiếp trên UI.
3. `public/app.js`, `renderRecords()` gần **dòng 462** đã dựng nút `Xuất Excel` khi `allowed('REPORT_EXPORT')`, **không phân biệt ADMIN / NHAN_VIEN / CO_SO_DAO_TAO**. Do đó Nhân viên đã có đường xuất ở trang Hồ sơ, không cần tạo thêm đường xuất mới.
4. `public/app.js`, `exportModal()` gần **dòng 1062** đã có bốn mẫu; `exportSummaryOrMatrix()` xử lý các mẫu tổng hợp/ma trận, `exportReport()` xử lý danh sách 25 cột, không có rào chắn riêng `ADMIN` tại những hàm này. Event click `#report-export` gần dòng **1227** mở đúng modal và form `report-export-form` gần **dòng 1312** gọi API.
5. `apps-script/Code.gs`, `authorize_()` gần **dòng 385**: `staffRights=['RECORD_VIEW','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','REPORT_EXPORT']`. Máy chủ **đã cho phép** `NHAN_VIEN` gọi `report_export`, `report_matrix`; không nên can thiệp hoặc mở rộng quyền này chỉ để sửa UI.
6. `apps-script/Code.gs`, `reportMatrix_()` gần **dòng 998–1000** kiểm `user._has('REPORT_EXPORT')`; dữ liệu từ `visibleRecords_(user)` đúng scope người dùng, và Nhân viên theo YC-HN-027 V2 đã xem tất cả cơ sở. `exportRecords_()` cũng sử dụng các bộ lọc và scope tương ứng.
7. `apps-script/Code.gs`, `safeUser_()` gần **dòng 400** vẫn quảng bá quyền `REPORT_EXPORT` cho vai trò Nhân viên.
8. `#print-report` hiện có và gọi `window.print()`; không xóa, không thay đổi chức năng in của Nhân viên.

**Kết luận kỹ thuật:** YC-028 V2 **không cần sửa công thức thống kê hoặc cấp thêm quyền Apps Script**; dự kiến chỉ cần sửa điều kiện dựng nút tại `public/app.js`. Tuy nhiên, do YC-028 V1 cùng triển khai phải bổ sung metadata chức danh ở backend, **gói bàn giao chung sau CHỐT V2 vẫn cần cập nhật cả Apps Script lẫn frontend** cho nội dung V1.

## VIII. Quy tắc an toàn khi triển khai V1 + V2 cùng đợt

- Giữ mã phân quyền thật `VAI_TRO='NHAN_VIEN'`. Nhãn chức danh tùy nhập như `Trưởng phòng A` ở V1 **không** làm mở rộng hoặc thu hẹp quyền Xuất Excel; căn cứ duy nhất là phân quyền được xác minh.
- Thay điều kiện nút tại `renderReports()` theo `allowed('REPORT_EXPORT')` (hoặc chính sách kiểm quyền tương đương). Không hardcode `NHAN_VIEN` được xuất mà bỏ qua điều kiện quyền, để khi quyền bị thu hồi/khóa tài khoản nút không còn và backend luôn từ chối.
- Không biến việc nhân viên có thể xem và xuất dữ liệu toàn Trung tâm thành quyền ghi dữ liệu. Bảo toàn `record_status` được phép trên mọi trường và các API `record_save`, `record_delete`, quản trị tài khoản/tệp bị từ chối theo YC-HN-027 V2.
- Không mở rộng `CO_SO_DAO_TAO`: backend vẫn bắt buộc kiểm `TRUONG_ID` ràng buộc với Gmail; không tin trường do frontend gửi lên.
- Không sửa `public/xlsx-export.js` nếu không có chứng cứ về lỗi thực tế. Bảo toàn chuẩn **25 cột**, căn lề, Wrap Text, chiều cao, dòng tổng cộng và bốn kiểu báo cáo đã nghiệm thu.
- Không thay đổi `CAU_HINH`, `TAI_KHOAN`, hay bất kỳ tab nào để thực hiện quyền Xuất Excel riêng V2. Với V1, nếu lưu metadata ở tab cấu hình hiện hữu, không tạo cột vật lý tài khoản.
- Đảm bảo việc mở menu Báo cáo, chuyển menu, F5, đổi nhãn chức danh và xác minh lại phiên không gây mất nút Xuất Excel đối với tài khoản Nhân viên hợp lệ.

## IX. Kiểm thử nghiệm thu V2 bổ sung vào V1

1. `NHAN_VIEN`: trang Báo cáo hiển thị đồng thời **Xuất Excel** và **In báo cáo**, như trên trang Quản trị viên. Nhấn Xuất Excel mở đủ bốn tùy chọn, thực hiện được từng mẫu.
2. `NHAN_VIEN`: lọc `Tất cả cơ sở`, nhiều năm/nghề/tình trạng khác nhau và kiểm dữ liệu xuất bao gồm hồ sơ nhiều cơ sở; tổng số khớp KPI/ma trận theo đúng phạm vi toàn Trung tâm và bộ lọc đã áp dụng.
3. `NHAN_VIEN`: chọn riêng Cơ sở C, rồi Cơ sở D; dữ liệu từng file đúng bộ lọc nhưng không phải phân quyền gán trường. Kiểm lịch kết thúc dự kiến, trạng thái `Bỏ học`, `Hoàn thành khóa học`, một hoặc hai đầu mút ngày.
4. `NHAN_VIEN`: xuất danh sách 25 cột không chỉ 20 dòng đang hiển thị, giữ giới hạn xuất và thông báo hiện hành; Excel tổng hợp/ma trận khớp `overview` và `report_matrix`, số `Đã tham gia` gồm Bỏ học, số Hoàn thành đúng ngày và điều kiện tham gia.
5. `NHAN_VIEN`: vẫn chỉ có ba menu, vẫn không có nút Thêm/Sửa/Xóa hồ sơ, quản lý tài khoản/danh mục/nhật ký hay tải tệp; trực tiếp gọi API ghi trái phép bị máy chủ từ chối.
6. `CO_SO_DAO_TAO`: tiếp tục có Xuất Excel và In; tất cả bốn mẫu chỉ chứa dữ liệu trường hợp lệ, không lấy hồ sơ Cơ sở D qua giả mạo filter hoặc RPC. `ADMIN` tiếp tục đủ nút và quyền như trước.
7. Kiểm tình trạng tài khoản nhân viên bị khóa/đổi role: frontend không hiển thị nút sai quyền, các API backend không cấp báo cáo ngoài quyền; dữ liệu nhạy cảm cũ không hiển thị lại khi đổi phiên.
8. Kết hợp V1: ADMIN thay chức danh từ `Nhân viên Phòng A` sang `Trưởng phòng B`, Nhân viên vẫn có đủ quyền Xuất Excel và chỉ ba menu; dòng góc phải đổi nhãn không gây logout và không biến thành quyền ADMIN.
9. Kiểm xuất Excel trên Chromium cho ADMIN/NHAN_VIEN/CO_SO_DAO_TAO; chạy toàn bộ suite nền `v1.2.21-RC` (185/185 đã báo cáo ở phiên trước) + bài mới, nêu đúng số thực chạy và giới hạn mock/production; **chưa gọi bất kỳ test nào là đạt trước khi triển khai và chạy thật**.
10. So sánh nguyên byte `public/xlsx-export.js` với nguồn v1.2.21-RC; bảo toàn mẫu Excel 25 cột. Với frontend, kiểm đường dẫn `app.js`/cache-busting theo phiên bản được nâng cấp, tránh website vẫn chạy script cũ ẩn nút.

## X. Bàn giao khi người dùng nói CHỐT V2

- Triển khai **cả YC-HN-028 V1 và V2** trong cùng một phiên bản mới trên nền **v1.2.21-RC**, trừ khi người dùng chốt khác. Thay đổi tối thiểu dự kiến `public/app.js`, `apps-script/Code.gs` cho metadata V1, test; `public/styles.css` nếu cần cho bảng tài khoản. Chỉ riêng V2 không cần thay Apps Script vì quyền báo cáo đã có.
- Bàn giao ZIP GitHub hoàn chỉnh + `Code.gs` đầy đủ + Master Prompt V2 đã CHỐT + changelog + kiểm thử mới và hồi quy thực chạy + hướng dẫn staging, backup/rollback. Không tự thay đổi dữ liệu Sheets hoặc triển khai production.
- **Trạng thái hiện tại:** YC-HN-028 V1+V2 **CHỜ CHỐT**. Tài liệu này là đặc tả, **chưa chỉnh code, chưa chạy kiểm thử V2, chưa deploy**.

---
## Kết quả thực hiện

Xem `CHANGELOG_YC-HN-028_V2_v1.2.22-RC.md`, `YC-HN-028_V2_v1.2.22-RC_KET_QUA_KIEM_THU.md` và `HUONG_DAN_YC-HN-028_V2_v1.2.22-RC.md`.

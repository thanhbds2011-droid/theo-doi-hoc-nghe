# THEO DÕI HỌC NGHỀ — YC-HN-015 V1 / v1.2.2-RC

**Trạng thái:** Đã chỉnh sửa mã nguồn, CHƯA tự triển khai lên Apps Script/Vercel/Google Sheets thực tế.

## 1. Phạm vi và bản nền

- Bản nền: `THEO_DOI_HOC_NGHE_YC-HN-014_V4_v1.2.1-RC.zip`.
- Đặc tả: `MASTER_PROMPT_YC-HN-015_V1` do người dùng CHỐT.
- Không bổ sung tab/cột, không migration. Giữ **7 tab, 94 cột**, kiến trúc GitHub/Vercel/GAS/Google Sheets/Drive, các chính sách quyền và các nghiệp vụ đã duyệt.
- **Không** thực hiện yêu cầu “Tháng bỏ học 1–12”: còn chưa thống nhất quy tắc nghiệp vụ, giữ đúng chức năng v1.2.1-RC.

## 2. Changelog theo file

### `public/app.js`

- Sửa hành vi bấm **Lọc dữ liệu** trong `records-filters`: không gọi lại `navigate('records',true)` để dựng lại toàn bộ trang. Form hiện tại được giữ nguyên; ô số quyết định/họ tên không bị thay bằng snapshot có từ khóa cũ hoặc chuỗi rỗng.
- `normalizeRecordFilters`: chuẩn hóa các trường bộ lọc (`year`, `truong`, `nghe`, `status`, `dropout`, `from`, `to`, `query`) để bộ lọc “Tất cả” sau khi xóa số quyết định dùng đúng khóa cache của bộ lọc tương đương đã tải trước đó.
- `applyRecordFilters` và `refreshRecordResults`: phản hồi ngay tại `#record-count`; chỉ vùng kết quả/phân trang có `aria-busy` và trạng thái chờ. Trong lúc đợi, giữ nội dung cũ ở mức mờ, không cho thao tác trên kết quả cũ; sau lỗi giữ bộ lọc để người dùng thử lại.
- `recordLoadVersion`: chống kết quả trả về theo thứ tự đảo (ví dụ lọc 6273 rồi 6204 trong khi 6273 còn chờ) ghi đè bảng của lần lọc mới. Cache trang không ghi snapshot mang trạng thái chờ.
- Cập nhật `serialized()` có thể hiện nhãn tiến độ ngay và khoá nút gửi. Form `status-form` dùng **“Đang cập nhật…”** cho đến khi API phản hồi; lỗi giữ nguyên dữ liệu người dùng đã chọn.
- Sau cập nhật tình trạng, tiếp tục sửa badge/dòng hồ sơ hiện có khi phù hợp; xóa các cache `records_list` có lọc tình trạng để tránh số lượng/trang sai khi một hồ sơ vừa chuyển nhóm. Các cache khác cập nhật/invalidated theo quy tắc cũ.

### `public/styles.css`

- Chỉ thêm lớp loading cục bộ cho bảng hồ sơ, vùng phân trang và nút tình trạng; không thay đổi sidebar, màu, font, bố cục hoặc nút đã phê duyệt.

### `apps-script/Code.gs`

- `statusRecord_`: khi cập nhật một hồ sơ, tìm vị trí theo cột `HO_SO_ID` rồi **chỉ đọc đầy đủ 1 hàng** 40 cột. Trước đây đã đọc toàn bộ hàng nghìn hồ sơ × 40 cột rồi lại quét cột ID lần nữa.
- Sau đó tiếp tục kiểm tra chủ thể được quyền, tình trạng xóa mềm, `PHIEN_BAN`, trạng thái/lý do/kỳ bỏ học; giữ `LockService`, `dedupeWrite_`, ghi 40 cột trong một lần và nhật ký. Không giảm an toàn hoặc bỏ kiểm tra dữ liệu.
- Không thay đổi định dạng các cột và cách tính báo cáo.

### `public/index.html`, `package.json`, `README.md`

- Đồng bộ nhãn phiên bản lên `v1.2.2-RC` / `1.2.2-rc.0`.

## 3. Kiểm thử đã thực hiện

- `npm run check`: cú pháp JavaScript **đạt**.
- `npm test`: **99/99 kiểm thử Node đạt** (98 kiểm thử nền và 1 bài test backend mới).
- `python tests/browser_yc014_mock.py`: đạt trên 3 vai trò mô phỏng, chuyển menu và lọc báo cáo vẫn đúng.
- `python tests/browser_yc015_mock.py`: đạt trên 3 vai trò mô phỏng, bao gồm:
  - Giữ `6273` trong ô tìm kiếm khi request chờ.
  - Lần lọc `6273` trả sau `6204` không ghi đè kết quả `6204`.
  - Xóa từ khóa → về toàn bộ hồ sơ; dùng cache đã tải khi lọc lại.
  - Nút cập nhật trạng thái hiện **“Đang cập nhật…”** và bị vô hiệu trong khi đang xử lý.
  - Lỗi tìm kiếm giả lập không xóa input; cho phép bấm lại thành công.
- Kiểm thử backend mới xác nhận việc cập nhật tình trạng không còn gọi `getDisplayValues()` trên tất cả 40 cột của nhiều hàng; phiên bản cũ vẫn bị chặn.

**Giới hạn kiểm thử:** Không có phép đo bằng thời gian thật của Vercel/GAS/Google Sheets chứa 3.000 hồ sơ. Không tuyên bố thời gian chờ thực tế đã giảm xuống mức cụ thể hoặc quota thực tế đã giảm bao nhiêu. Kiểm thử Chrome dùng mock server, không phải dữ liệu của đơn vị.

## 4. Hướng dẫn kiểm tra staging trước production

1. **Sao lưu trước:** sao chép mã nguồn GitHub/v1.2.1-RC hiện hành, Apps Script deployment hiện hành và tạo bản sao Spreadsheet, giữ nguyên bản production.
2. Triển khai thử nghiệm **đồng bộ** GitHub/Vercel frontend v1.2.2-RC và `apps-script/Code.gs` v1.2.2-RC (trong `apps-script`), trỏ tới **Spreadsheet bản sao**, không trỏ staging về dữ liệu thật.
3. Dùng đúng cấu hình ký request và Google Sign-In của môi trường thử. Không công khai secret qua frontend và không tự phát tán file có thông tin hồ sơ.
4. Lần lượt thử ADMIN, NHAN_VIEN, CO_SO_DAO_TAO:
   - Lọc `6273` rồi thử `6204`, kiểm tra input giữ từ khóa đã gõ.
   - Xóa từ khóa rồi Lọc, kiểm tra trở về đủ số hồ sơ trong quyền được cấp.
   - Quay sang Tổng quan rồi về Hồ sơ, phân trang và lọc nhiều lần.
   - Cập nhật 1 hồ sơ (và thử 2 tài khoản được phép cập nhật cùng hồ sơ), kiểm tra giao diện, phiên bản và nhật ký; thử quyền sai trường và hồ sơ đã xóa.
   - Dùng mạng chậm / mất mạng thử lại; không gửi lặp khi kết quả ghi chưa xác định.
5. Đo ít nhất 3 lần **cache lạnh** và **cache nóng** cho từng vai trò, trên dữ liệu test cỡ 100/1.000/3.000/5.000 dòng (nếu có); ghi thời gian click → UI, click → response, execution GAS, lock contention, CacheService hit/miss và số ô Sheets thực sự đọc.
6. Chỉ khi số liệu, phân quyền và thời gian thực tế đạt yêu cầu mới cân nhắc thay production. Không triển khai staging bằng nút deploy đang phục vụ người dùng.

## 5. Rollback

- Nếu lỗi, đưa **đồng thời** frontend/Vercel và Apps Script về bản `v1.2.1-RC` từ bản sao lưu.
- Vì không migration hay thay schema, không cần sửa/cắt dữ liệu Google Sheets để rollback mã nguồn.
- Nếu có phát sinh ghi thử trên Spreadsheet test, không mang sang production.
- Xác nhận lại kết nối đúng Apps Script deployment ID và Spreadsheet trước khi mở lại ứng dụng cho người dùng.

## 6. Điều chưa thay đổi

- Đường tải danh sách **không từ khóa** ở trạng thái cache lạnh vẫn có thể phải truy xuất và lọc snapshot lớn trong Apps Script. Đợt này ưu tiên tận dụng cache hợp lệ khi quay lại bộ lọc đã xem; không tự tạo database mới hay chỉ mục bền vững và chưa chứng minh được mọi cold-load sẽ nhanh.
- Thời gian ghi thực tế vẫn phụ thuộc LockService, Apps Script, Google Sheets, mạng và nhật ký; giao diện báo trạng thái ngay, còn kết quả lưu phải chờ server xác nhận.
- Các tùy chọn tháng bỏ học 1–12 đang mở không thuộc mã nguồn này.

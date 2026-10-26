# YC-HN-025 V3 — v1.2.18-RC: Changelog, hướng dẫn triển khai và hoàn tác

## 1. Yêu cầu đã CHỐT
Cùng khoảng `Từ ngày`/`Đến ngày`, **Hoàn thành khóa học phải cho cùng một số ở Báo cáo → Tất cả tình trạng và Báo cáo → Hoàn thành khóa học**, khi năm quyết định, cơ sở, nghề và quyền là như nhau.

**Điều kiện đếm Hoàn thành:** `TRANG_THAI_THAM_GIA='DA_THAM_GIA'`, `DA_BO_HOC` không true, `NGAY_KET_THUC_DU_KIEN` hợp lệ và nằm trong khoảng ngày đã áp dụng (gồm ngày đầu, ngày cuối). Trường `Năm quyết định` (nếu chọn) vẫn giới hạn `NAM_QUYET_DINH`.

Ở `Tất cả tình trạng`, các hàng `Tổng số Quyết định đã ban hành`, `Đã tham gia`, `Bỏ học`, `Không tham gia`, `Không nhận Quyết định`, `Chưa xác nhận` vẫn tính theo **Ngày ban hành QĐ**. **Riêng** Hoàn thành tính theo **Ngày kết thúc đào tạo dự kiến**. Do đó, không cộng trừ cơ học Hoàn thành với nhóm quyết định trong cùng kỳ ngày.

Chỉ tiêu Hoàn thành ở đây phản ánh kế hoạch (người đã tham gia và không bỏ học), **không phải xác nhận đã tốt nghiệp thực tế**.

## 2. Tệp thay đổi và cách xử lý
- `apps-script/Code.gs`: sửa `overview_()` để tính `courseEndParticipated` bằng bộ lọc ngày kết thúc độc lập với trạng thái báo cáo. Tập `visibleRecords_(user)` được lấy **một lần trong lượt tính**, tái sử dụng cho tập KPI thường và tập Hoàn thành; giữ nguyên quy tắc quyền. Hàm `reportRecords_` nhận tham số nội bộ tùy chọn `sourceRecords` để tránh đọc snapshot thứ hai. Không thay đổi đầu vào API công khai. Đổi salt cache `OVERVIEW` để bỏ số cũ đã cache.
- `public/app.js`: sửa tooltip của hàng Hoàn thành, diễn giải rõ căn cứ ngày. Các luồng bộ lọc/nút/Excel không đổi.
- `public/index.html`, `package.json`, `README.md`: nâng lên `v1.2.18-RC`, đổi URL app.js có version chống cache cũ.
- `tests/backend.test.js`: bổ sung ca tích hợp với QĐ ngoài kỳ nhưng kết thúc trong kỳ, bỏ học, chưa xác nhận, giới hạn theo năm/trường/quyền, hai đầu mút, một đầu mút và không chọn ngày. Test nền cũ chỉ được cập nhật mốc version và dấu hiệu cấu trúc hàm đã thay.

**Được bảo toàn:** `public/xlsx-export.js` giống hệt từng byte của `v1.2.17-RC` (SHA-256 trong báo cáo test), 25 cột Excel/căn lề/Wrap Text/chiều cao; 7 tab và 94 cột dữ liệu Google Sheets; quyền, `PHIEN_BAN`, kiểm QĐ trùng, Nhật ký và cập nhật cục bộ sau Lưu.

## 3. Kiểm tra trước và sau triển khai
1. Sao lưu **commit/ZIP và Apps Script deployment đang chạy** `v1.2.17-RC`. Ghi lại Apps Script deployment ID (không đưa khóa bí mật vào ZIP).
2. Tại **Apps Script staging**, cập nhật **toàn bộ** `Code.gs` của v1.2.18-RC, giữ Script Properties. Dùng `Deploy → Manage deployments → Edit → New version → Deploy` để tạo bản mới. Kiểm tra Vercel `APPS_SCRIPT_URL` trỏ đúng deployment đã cập nhật, không tạo endpoint công khai thiếu kiểm tra Google ID token/HMAC.
3. Cập nhật GitHub/Vercel từ ZIP hoàn chỉnh v1.2.18-RC. Kiểm tra chân trang v1.2.18-RC và `app.js?v=1.2.18-RC`; Ctrl+Shift+R sau triển khai.
4. Trên staging với cùng bộ lọc năm/trường/nghề/quyền, chọn `01/01/2026–30/04/2026`: `Tất cả tình trạng` và `Hoàn thành khóa học` phải hiển thị **cùng số tại hàng Hoàn thành**. Kết quả ảnh tham khảo trước sửa lần lượt 516 và 45; mục tiêu 45/45 nếu dữ liệu không đổi. Không gán số 45 cứng trong phần mềm.
5. Kiểm tra các hàng khác của chế độ Tất cả vẫn dùng **Ngày QĐ**; thử một đầu mút ngày, năm QĐ, quyền cơ sở, Xuất Excel Báo cáo tổng hợp, In báo cáo, Hồ sơ học nghề, cập nhật cục bộ khi sửa hồ sơ.
6. Sau khi nghiệm thu staging, mới đưa vào production theo quy trình đơn vị. Không sửa dữ liệu Google Sheets để xử lý sự khác biệt này.

## 4. Hoàn tác
Nếu phát hiện sai số: đưa **cả Apps Script deployment và GitHub/Vercel** về phiên bản đã sao lưu `v1.2.17-RC`, xóa cache trình duyệt bằng Ctrl+Shift+R và kiểm thử lại. **Không** khôi phục/ghi đè dữ liệu gốc trong Google Sheets; không xóa các bản ghi đã được người dùng cập nhật trong thời gian thử nghiệm.

## 5. Giới hạn xác nhận
- Kiểm thử tự động và Chromium trên dữ liệu giả lập; **không** kiểm tra trực tiếp website, Apps Script hoặc Google Sheets production.
- Trường hợp 516/45 từ ảnh là dữ liệu người dùng quan sát; mã mới đã được chứng minh nhất quán về logic, số production còn phụ thuộc dữ liệu/thời điểm và bộ lọc thực tế.
- Bản sửa không làm cho ngày kết thúc dự kiến trở thành chứng nhận tốt nghiệp.

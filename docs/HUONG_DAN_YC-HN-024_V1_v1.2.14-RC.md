# YC-HN-024 V1 — HƯỚNG DẪN TRIỂN KHAI v1.2.14-RC

**Ngày:** 22/10/2026  
**Nền:** v1.2.13-RC  
**Trạng thái:** Đã hoàn thành mã nguồn và kiểm thử mô phỏng; **chưa kết nối, cập nhật hoặc đo trên production**.

## 1. Chức năng mới

Ở **Báo cáo học nghề**, cuối danh sách `Tình trạng` có lựa chọn **Ngày hoàn thành khóa học** (mã nội bộ `FILTER_COURSE_END_DATE`). Khi chọn chế độ này, hai lịch lọc so sánh trường `NGAY_KET_THUC_DU_KIEN` (trong Chi tiết hồ sơ: `Thời gian đào tạo – Đến ngày`); các chế độ cũ vẫn lọc theo `NGAY_QUYET_DINH`. Cả hai ngày đầu/cuối đều được tính; chỉ nhập một ngày vẫn hợp lệ. Nếu để trống hai ngày, chế độ mới chỉ lấy những hồ sơ có ngày kết thúc dự kiến hợp lệ.

Nhãn mới là **bộ lọc ảo**, KHÔNG phải tình trạng người học đã thực tế hoàn thành/tốt nghiệp. Số `Đã tham gia`, `Bỏ học`, `Không tham gia`, `Chưa xác nhận` là số theo tình trạng thực tế *trong tập hồ sơ sau lọc*. Trong bảng và bản in có ghi rõ khoảng ngày kết thúc dự kiến **đã áp dụng** (không lấy giá trị mới gõ/chọn nếu chưa bấm Lọc dữ liệu).

**Đồng bộ:** số tổng Báo cáo, bốn tùy chọn xuất Excel (danh sách 25 cột, tổng hợp, theo cơ sở, theo nghề) và bản in có cùng tập điều kiện lọc. Không thêm tab/cột hoặc ghi mã lọc ảo xuống Sheets.

## 2. Các file thay đổi

- `public/app.js`: lựa chọn trạng thái ảo trong Báo cáo, đổi chú thích và nhãn lịch, hiện ghi chú phạm vi ngày đã áp dụng trên thống kê và bản in; nhãn phiên bản.
- `public/styles.css`: định dạng ghi chú phạm vi ngày cho màn hình và trang in.
- `public/index.html`: nhãn v1.2.14-RC và đường tải `app.js?v=1.2.14-RC` tránh JS cũ.
- `apps-script/Code.gs`: cho phép mã lọc ảo ở Báo cáo; `reportFilters_` kiểm ngày đúng loại; `reportRecords_` sử dụng đúng ngày khi tiền lọc, tránh loại nhầm QĐ cũ; nhãn phiên bản.
- `package.json`, `README.md`: đồng bộ phiên bản và mô tả.
- `tests/backend.test.js`, `tests/yc024-report.test.js`, `tests/browser_yc024_mock.py`: mở rộng ca kiểm thử mới.
- `tests/yc023-ui.test.js`, `tests/browser_yc023_mock.py`: cập nhật phạm vi đã được YC024 mở rộng (không còn cấm lọc ảo trên Báo cáo).
- `tests/ui-yc006.test.js`, `tests/yc021-v5_2-hotfix-wps.test.js`: đồng bộ kỳ vọng nhãn/URL phiên bản.
- `tests/browser_yc020_export.py`: cập nhật tiêu chí kiểm tra XLSX từ kiểu trước hotfix sang kiểu Excel YC021 V5.2 **đã nghiệm thu**, không chỉnh exporter.

**Không sửa** `public/xlsx-export.js`, `api/rpc.js`, `api/config.js`, luồng sửa/lưu hồ sơ, logic tháng bỏ học, mô hình 7 tab/94 cột, quyền hoặc nhật ký.

## 3. Kiểm thử đã thực hiện (offline/staging mô phỏng)

- `npm test`: **163/163** đạt, gồm kiểm thử end-to-end Apps Script trên mock Sheets; thử biên 01/07/2027–31/07/2027, QĐ 2026, quyền trường, Excel danh sách và 2 ma trận.
- `python tests/browser_yc024_mock.py`: đạt với ADMIN/NHAN_VIEN/CO_SO_DAO_TAO; thử chọn ngày bằng lịch, không tự submit khi đổi lựa chọn, ghi chú phạm vi đúng bản in, bốn dạng xuất Excel, chuyển trở lại `Tất cả` vẫn lọc theo Ngày QĐ.
- Browser hồi quy đạt: `browser_yc019_mock.py`, `browser_yc020_export.py` (đã cập nhật kỳ vọng theo style chuẩn hiện hành), `browser_yc021_v5_2_excel.py`, `browser_yc022_mock.py`, `browser_yc023_mock.py`.
- `npm run check`: kiểm tra cú pháp JS thành công.
- `public/xlsx-export.js` đối chiếu SHA-256 với bản 1.2.13-RC: **giống nguyên từng byte**.
- Chưa kiểm thử số liệu hoặc độ trễ Google Apps Script/Google Sheets/Vercel production; chưa in ra máy in thực tế.

## 4. Quy trình triển khai khuyến nghị

1. **Sao lưu** ZIP GitHub v1.2.13-RC, toàn bộ Code.gs, và thông tin deployment đang chạy. Nếu quy trình đơn vị yêu cầu, tạo bản sao Google Sheets riêng trước khi chạy thử staging.
2. Trên **Apps Script staging**, thay toàn bộ `Code.gs` bằng file trong gói mới. Vào **Deploy → Manage deployments → Edit → New version → Deploy** (chỉnh đúng deployment đang dùng). Xác minh URL Web app và quyền `Execute as`/`Who has access` giữ nguyên cấu hình hợp lệ. Nếu dùng một URL staging khác, cập nhật biến môi trường Apps Script endpoint của Vercel staging theo hướng dẫn cấu hình trước đây; **không đưa secret vào source GitHub**.
3. Deploy **GitHub/Vercel staging** từ ZIP v1.2.14-RC. Đồng bộ kết nối theo môi trường staging; không sử dụng dữ liệu cá nhân thật để test nếu không được phép. Không cần đổi cấu trúc Google Sheets hay quyền của người dùng.
4. Truy cập website staging và **Ctrl + Shift + R**. Kiểm tra chân menu hiển thị `v1.2.14-RC`. Chọn Báo cáo → Ngày hoàn thành khóa học → 01/07/2027–31/07/2027 → Lọc dữ liệu. Lấy hồ sơ có QĐ năm 2026 nhưng kết thúc dự kiến tháng 7/2027 để nghiệm thu. Đối chiếu thống kê, 4 bản Excel và bản in.
5. Thử tình trạng cũ với cùng khoảng ngày để xác nhận vẫn dựa Ngày QĐ. Kiểm tra Quản trị viên, Nhân viên và Cơ sở đào tạo đúng phạm vi. Kiểm tra trang Hồ sơ xuất Excel 25 cột và lưu hồ sơ một dòng vẫn đúng.
6. Sau khi nghiệm thu staging đạt, triển khai **Apps Script production phiên bản mới trước**, sau đó **Vercel production** đồng bộ. Tránh dùng UI v1.2.14 với Code.gs v1.2.13: backend cũ sẽ báo `Tình trạng báo cáo không hợp lệ`.

## 5. Quay về bản trước nếu gặp lỗi

- Vercel → Deployments → chọn deployment `v1.2.13-RC` → **Redeploy** hoặc Promote bản cũ theo quy trình vận hành.
- Apps Script → Manage deployments → Edit → chọn **phiên bản cũ v1.2.13-RC** → Deploy. Giữ lại Deployment ID/URL nếu không cần thay đổi.
- Làm mới trình duyệt và đối chiếu `Báo cáo → tình trạng cũ` và `Hồ sơ học nghề`.
- Không hoàn tác dữ liệu Google Sheets vì bản YC024 **không có di trú/schema**, chỉ thay đổi bộ lọc đọc.

## 6. Giới hạn và lưu ý nghiệp vụ

`NGAY_KET_THUC_DU_KIEN` là ngày kết thúc **dự kiến**; không xác nhận tốt nghiệp, không sửa `TRANG_THAI_THAM_GIA` hoặc hỗ trợ học nghề. Các quyết định lọc theo `Năm quyết định` vẫn căn cứ `NAM_QUYET_DINH`, kể cả khi ngày kết thúc dự kiến ở năm khác.

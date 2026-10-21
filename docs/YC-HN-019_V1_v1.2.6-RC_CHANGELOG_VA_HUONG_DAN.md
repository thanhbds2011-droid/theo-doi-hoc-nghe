# YC-HN-019 V1 — v1.2.6-RC — Thay đổi, kiểm thử và triển khai

## 1. Phạm vi nghiệp vụ đã CHỐT

- Hai bộ lọc **Từ ngày / Đến ngày ban hành quyết định học nghề** tại **Hồ sơ học nghề** và **Báo cáo học nghề**, nhập theo `dd/mm/yyyy`, truyền đến backend theo `yyyy-mm-dd`.
- Khoảng ngày bao gồm **cả ngày bắt đầu và ngày kết thúc**, có thể để trống một hoặc cả hai đầu mút, hoặc chọn cùng một ngày để thống kê một ngày.
- Các bộ lọc Năm ∩ Trường ∩ Nghề ∩ Tình trạng ∩ Số QĐ/tên ∩ Khoảng ngày phải **cùng được áp dụng**; bảng Hồ sơ giữ phân trang 20 dòng và tổng số kết quả đúng.
- Bảng Báo cáo, chức năng In, Excel **danh sách chi tiết 25 cột**, Excel **tổng hợp**, Excel **theo cơ sở đào tạo** và **theo nghề đào tạo** phải thống nhất bộ lọc *Báo cáo* đang chọn.
- Bộ lọc **Tổng quan** giữ nguyên, không bổ sung ngày theo phạm vi V1; các menu giữ bộ lọc riêng.
- Không thay đổi Google Sheets 7 tab/94 cột, dữ liệu hồ sơ, phân quyền, tên/chức năng các tình trạng, logic tháng bỏ học hoặc các mẫu Excel đã CHỐT.

## 2. Những file đã sửa

| File | Nội dung |
|---|---|
| `public/app.js` | Dựng 2 ô ngày ở Hồ sơ/Báo cáo; chuyển/kiểm tra dd/mm/yyyy nghiêm ngặt; duy trì giá trị đã nhập; truyền ngày ISO qua các API; đồng bộ snapshot form khi chuyển menu; phiên bản v1.2.6-RC. |
| `public/styles.css` | Lưới responsive 4/3/2/1 cột thích ứng, chú thích về ngày QĐHN. Không đổi font/logo/màu. |
| `apps-script/Code.gs` | `decisionRange_` xác thực đầu mút; bổ sung ngày vào `listRecords_`, `reportFilters_`, `reportRecords_`, `overview_` và cache key; `recordMatches_` lọc ngày có thật bao gồm hai đầu mút. |
| `public/index.html`, `package.json`, `README.md` | Đồng bộ nhãn và phiên bản. |
| `tests/backend.test.js`, `tests/yc019-ui.test.js`, `tests/browser_yc019_mock.py`, `tests/ui-yc006.test.js` | Kiểm thử mới và cập nhật kỳ vọng phiên bản. Không giảm hoặc xóa bài kiểm thử hồi quy. |

## 3. Cách sử dụng

1. Mở **Hồ sơ học nghề**, chọn hoặc nhập **Từ ngày** và **Đến ngày** theo mẫu `01/07/2026` – `31/07/2026` rồi bấm **Lọc dữ liệu**. Nếu chỉ muốn xem quyết định trong 1 ngày, nhập cùng ngày ở cả hai ô.
2. Chọn thêm Năm, Cơ sở đào tạo, Nghề, Tình trạng hoặc Tìm người học / số QĐ nếu cần. Hệ thống chỉ lấy hồ sơ thỏa tất cả điều kiện đã chọn.
3. Để đếm và xuất báo cáo, vào **Báo cáo học nghề**, chọn khoảng ngày và các tiêu chí tại **chính trang này**, bấm **Lọc dữ liệu**, sau đó In hoặc Xuất Excel.
4. Có thể xóa hai ô ngày để bỏ giới hạn thời gian, rồi bấm Lọc. Nếu Từ ngày sau Đến ngày hoặc ngày không tồn tại, ứng dụng không gửi truy vấn và thông báo cần sửa.
5. **Tháng 7 có 31 ngày:** lọc 01/07–30/07 không tính quyết định ngày 31/07. Chỉ dùng trường ngày **NGAY_QUYET_DINH**, không phải ngày QĐ TCTN hay ngày đào tạo.

## 4. Kiểm thử đã chạy (môi trường mô phỏng)

- `npm run check`: đạt (JS frontend, Vercel API).
- `node --check < apps-script/Code.gs`: đạt kiểm tra cú pháp Apps Script.
- `npm test`: **132/132 bài đạt** (124 nền + 8 mới), bao gồm ranh giới ngày, năm nhuận, ngày sai, lọc chồng điều kiện, thống kê, Excel và cách ly tài khoản cơ sở.
- Chromium headless: các bài `browser_yc014_mock.py`, `browser_yc015_mock.py`, `browser_yc017_mock.py`, `browser_yc018_mock.py`, `browser_yc019_mock.py` đều đạt.
- Chưa chạy đo thực tế Google Apps Script/Sheets trên bản sao gần 3.000 hồ sơ, chưa xác nhận thời gian phản hồi hoặc quota trên môi trường thật.

## 5. Triển khai an toàn

1. **Sao lưu** Apps Script `Code.gs`, mã nguồn GitHub/Vercel hiện chạy (kiểm tra chính xác tên dự án Apps Script/Deployment ID), bản sao Google Sheets và ghi lại cấu hình môi trường.
2. Tạo **staging** với bản sao Sheets và Deployment riêng. Trước hết thay Apps Script staging bằng **toàn bộ** `apps-script/Code.gs` v1.2.6-RC, kiểm tra cú pháp; cập nhật deployment đang dùng của staging hoặc tạo bản deployment mới và chỉnh URL tương ứng trên Vercel staging.
3. Triển khai GitHub/Vercel **staging** bằng toàn bộ repository v1.2.6-RC và xác nhận frontend/API trỏ đúng Apps Script staging; không nhầm URL production.
4. Chạy kiểm thử nghiệp vụ thủ công: tháng 7 đủ 31 ngày; lọc từ=đến; hai ô để trống; từ>đến; lọc nhiều điều kiện; Báo cáo/In/Excel theo trường/nghề; quyền ADMIN, NHAN_VIEN, CO_SO_DAO_TAO; quay lại menu sau 4 phút; tình trạng bỏ học và nhập Excel hàng loạt không bị ảnh hưởng.
5. Sau khi nghiệm thu staging mới cân nhắc triển khai production: **Apps Script trước, GitHub/Vercel sau**. Không chạy hàm thiết lập/migration trên Sheets thật nếu không có chỉ dẫn cụ thể.

## 6. Hoàn tác

Nếu phát sinh lỗi: chuyển Vercel về deployment/commit cũ, khôi phục `Code.gs` phiên bản trước và deployment tương thích. Không xóa hồ sơ, không xóa sheet, không xoá nhật ký. Nếu có thay đổi dữ liệu trong thời gian chạy production, không tự khôi phục toàn bộ Sheets làm mất dữ liệu mới; đối soát riêng.

**Trạng thái bàn giao:** đã sửa code và kiểm thử mô phỏng; **chưa triển khai, chưa tác động dữ liệu Google Sheets thật**.

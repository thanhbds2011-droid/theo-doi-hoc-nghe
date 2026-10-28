# KẾT QUẢ KIỂM THỬ – YC-HN-029 V5

**Nguồn test:** ZIP V4 bàn giao của người dùng, đã bổ sung sửa đổi V5. **Không sử dụng dữ liệu Google Sheets thật.**

## Tự động

- `npm run check`: PASS (cú pháp Vercel, app.js).
- `node --check` đối với bản sao tạm `Code.gs` thành `.js`: PASS.
- `npm test`: **195/195 PASS**. 191 bài kế thừa, bổ sung 4 bài backend mới: `record_fresh`/quyền/xung đột, sửa QĐ chống trùng, đọc hồ sơ một hàng, sửa một hàng. Bài YC022 cập nhật cách kiểm tra thuật toán chống trùng qua một cột. Các bài kiểm tra version được cập nhật cho phiên bản v1.2.23-RC.
- Browser Chromium: **PASS** các bộ `browser_yc017_mock.py`, `browser_yc027_rbac_mock.py`, `browser_yc028_mock.py`, `browser_yc029_v4_mock.py`, `browser_yc029_v5_two_clients.py`.
- Hai phiên Chromium, một nguồn backend giả lập: A lưu tình trạng; B nhìn thấy số liệu mới sau kiểm tra revision, không bị ghi đè form; khi B lưu phiên bản cũ hệ thống chặn, hiển thị tình trạng mới/draft, và chỉ cho thử lại sau khi xác nhận. Đồng thời xác nhận quyền ba menu nhân viên và nhãn V4.
- XLSX module so sánh SHA256 với V4: **không thay đổi**; Chromium kiểm tra XLSX 2.433 dòng, 25 cột đã đạt ở bộ kiểm thử hiện hành.

## Định lượng khối lượng đọc (ước tính theo mã, không phải thời gian thực đo)

Với 3.000 hồ sơ x 40 cột, mỗi lần đọc toàn bộ sẽ truy xuất khoảng 120.000 giá trị ô. Với đường xem tệp một hồ sơ, sau tối ưu sẽ đọc khoảng 3.000 ô mã ID và 40 ô dữ liệu (chưa tính xác thực/danh mục/các lệnh khác): giảm đáng kể **giá trị ô phải truy xuất**, không đồng nghĩa giảm thời gian tương ứng. Với 40 lượt tải một tệp 10 MB, giảm quét 40 cột lặp đi lặp lại.

## Chưa được kiểm chứng

- Chưa thử tải 1, 4, 10 và 20 người trên Apps Script/Google Sheets thật hoặc staging; chưa xác nhận tỉ lệ thành công, p95 và khả năng quota.
- Chưa xác minh triển khai thật Vercel↔GAS, thông báo sau 90 giây với mạng yếu, tác động log quota thực hoặc thứ tự request thất bại khi Drive mất kết nối.
- Đã giữ LockService + PHIEN_BAN, nhưng không có bảo đảm không bị BUSY khi nhiều người cập nhật đồng thời.

**Trạng thái:** Mã nguồn đã kiểm thử cục bộ; bắt buộc nghiệm thu staging trước production.

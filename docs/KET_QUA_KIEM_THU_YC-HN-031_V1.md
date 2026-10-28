# KẾT QUẢ KIỂM THỬ – YC-HN-031 V1

**Bản mã:** `v1.2.25-RC`  
**Phạm vi:** Kiểm thử cục bộ Node.js, kiểm tra cú pháp và Chromium dùng API giả lập.

## Kiểm thử Node.js

- `npm test`: 204/204 PASS, gồm 6 bài mới YC-HN-031.
- Kiểm tra quyền hiển thị danh mục từng cơ sở; ADMIN/NHAN_VIEN không đổi.
- Kiểm tra nghề dùng chung, danh mục nghề INACTIVE còn quyết định, loại hồ sơ đã xóa, bỏ trùng.
- Kiểm tra hiệu lực cache theo revision riêng, trạng thái học không làm mất cache nghề.
- Kiểm tra thêm mới, chuyển trường, xóa cuối, mã revision và đường ghi trong backend.
- `npm run check`: PASS đối với ba tệp JS theo cấu hình package.

## Kiểm thử Chromium (giả lập)

- `browser_yc027_rbac_mock.py`: PASS – RBAC và ba/sáu menu.
- `browser_yc028_mock.py`: PASS – chức danh, quyền và báo cáo.
- `browser_yc029_v4_mock.py`: PASS – nhãn chức danh và màn hình nhỏ.
- `browser_yc029_v5_two_clients.py`: PASS – dữ liệu mới và xung đột đồng thời.
- `browser_yc030_months.py`: PASS – tháng bỏ học 1–6.
- `browser_yc031_school_trades.py`: PASS – scope A/B, cả ba menu, ADMIN/NHAN_VIEN, thêm/xóa nghề, reset lựa chọn cũ; B không phải bootstrap khi chỉ A đổi.

## Chưa xác minh

- Không chạy trực tiếp trên Google Sheets, Apps Script, Vercel production/staging của đơn vị.
- Chưa đo độ trễ thực tế khi dữ liệu ~3.000 quyết định hoặc 4/10/20 người cập nhật đồng thời.
- Chưa chứng minh quota chịu tải thực tế. Khi triển khai cần đo và lưu kết quả.

**Kết luận:** Đủ điều kiện **bàn giao mã và thử nghiệm staging**, chưa đủ điều kiện kết luận đã nghiệm thu production.

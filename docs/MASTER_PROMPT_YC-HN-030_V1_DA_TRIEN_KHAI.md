# MASTER PROMPT – YC-HN-030 V1 – ĐÃ TRIỂN KHAI MÃ NGUỒN, CHỜ NGHIỆM THU STAGING

**Dự án:** THEO DÕI HỌC NGHỀ  
**Nền:** YC-HN-029 V5 `v1.2.23-RC`  
**Mã bàn giao:** `v1.2.24-RC`  
**Ngày:** 28/10/2026

## I. Các yêu cầu đã thực hiện

1. Tại Cập nhật tình trạng → Bỏ học: danh sách chỉ có "Tháng thứ 1" đến "Tháng thứ 6". Ngày bỏ học lưu theo `KY:1`…`KY:6`, không vượt số tháng hỗ trợ hợp lệ. Đối với dữ liệu cũ có kỳ 7+ hoặc ngày ISO, chỉ cho giữ nguyên giá trị lịch sử, không tạo mới ngoài 1–6.
2. Loại bỏ dòng hướng dẫn "Chỉ chọn tháng thứ 2 đến tháng thứ ... Tháng thứ 1 đã tham gia..." dưới ô chọn tháng bỏ học.
3. Ở góc phải trên, tài khoản Cơ sở đào tạo hiển thị đầy đủ họ tên và nhãn tên cơ sở đào tạo; cho phép xuống dòng, không hiển thị dấu ba chấm vì tràn, không thay đổi chức danh/phân quyền.
4. Mẫu Excel "Báo cáo tổng hợp (Chỉ tiêu / Số lượng)" đổi thành 3 cột STT / Chỉ tiêu / Số lượng. Dòng STT đánh liên tục từ 1; cột A/B/C có độ rộng khoảng 5.3/21.2/15.9 như bản người dùng gửi; chữ wrap, căn giữa dọc, hàng cao tự đủ nội dung. Giữ nguyên giá trị tính từ backend và tất cả mẫu Excel khác.

## II. Ràng buộc

- Không thêm tab/cột vào Google Sheets.
- Không thay đổi ADMIN/NHAN_VIEN/CO_SO_DAO_TAO, session, kiểm tra PHIEN_BAN và khóa ghi.
- Không đổi định nghĩa Đã tham gia, Bỏ học, Hoàn thành khóa học hoặc lọc báo cáo.
- Không sửa định dạng danh sách Excel 25 cột đã nghiệm thu.
- Không tự thay đổi hệ thống production. Bắt buộc nghiệm thu staging trước.

## III. Tình huống nghiệm thu

- Khóa 1 tháng: chọn kỳ 1 hợp lệ, kỳ 2–6 bị vô hiệu.
- Khóa 2 tháng: chọn kỳ 1–2; kỳ 3–6 hiển thị nhưng không được chọn.
- Khóa 6 tháng: chọn 1–6.
- Khóa 12 tháng: chỉ hiển thị các kỳ 1–6; không có 7–12.
- Kỳ cũ 7–12 có sẵn: chỉ bảo toàn như giá trị lịch sử, không tạo mới hoặc tự chuyển kỳ.
- Tên trường dài: đầy đủ ở góc phải; nút Đăng xuất hoạt động; không lộ trường khác.
- Báo cáo tổng hợp: STT/bốn hay bảy chỉ tiêu tùy lọc được đánh đúng; không che chữ, số lượng là số Excel; ba mẫu còn lại và 25 cột giữ nguyên.

## IV. Kiểm thử

Node.js 198/198 đạt; Chromium kiểm tra tháng bỏ học và header trường dài đạt; xác nhận hai máy giả lập còn hoạt động như V5. Chưa kiểm thử staging/production, chưa tuyên bố đủ điều kiện vận hành 20 người cập nhật cùng lúc.

**Trạng thái:** ĐÃ HOÀN THÀNH MÃ NGUỒN – CHỜ NGHIỆM THU STAGING.

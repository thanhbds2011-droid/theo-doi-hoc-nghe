# HƯỚNG DẪN TRIỂN KHAI VÀ HOÀN TÁC – YC-HN-030 V1

**Mã nguồn:** `v1.2.24-RC` | **Nền:** V5 `v1.2.23-RC`

## 1. Trước khi triển khai

1. Sao lưu mã nguồn GitHub V5 và bản **Code.gs đang triển khai**. Lưu deployment ID, thông tin cấu hình Vercel/Apps Script hiện có.
2. Sao lưu bảng Google Sheets và tệp liên quan theo quy trình quản trị. **Không cần thay đổi cấu trúc 7 tab hoặc chạy hàm nâng cấp dữ liệu.**
3. Không đưa `API_SHARED_SECRET`, credentials hay `.env` thực vào GitHub.
4. Triển khai **staging với bản sao dữ liệu**, không chạy thử trực tiếp trên dữ liệu người dùng cuối.

## 2. Triển khai trên staging

1. Thay toàn bộ `apps-script/Code.gs` bằng Code.gs V1 tương ứng; lưu và triển khai Web App phiên bản mới.
2. Xác nhận Vercel staging trỏ tới đúng Apps Script Web App mới. Không thay đổi phương thức xác minh danh tính và chữ ký request.
3. Upload mã nguồn từ ZIP `THEO_DOI_HOC_NGHE_YC-HN-030_V1_v1.2.24-RC.zip` lên nhánh staging của GitHub; kết nối Vercel staging. Nếu GitHub đã nối nhánh production, **không commit vào nhánh đó trước khi nghiệm thu.**
4. Tải lại bằng Ctrl+F5 nếu còn giao diện cũ, kiểm tra chân trang `v1.2.24-RC`.
5. Kiểm tra trực tiếp các ca: khóa 1 tháng chọn kỳ 1; khóa 3 tháng chọn kỳ 1–3 và kỳ 4–6 bị vô hiệu; khóa 12 tháng chỉ được kỳ 1–6; dữ liệu lịch sử KY:7–12 không tự xóa; hàng loạt chỉ chọn 1–6; không còn câu gợi ý cũ.
6. Đăng nhập tài khoản Cơ sở đào tạo có tên trường dài; kiểm tra tên trường hiển thị đầy đủ, nút Đăng xuất không bị che, các menu và quyền giữ nguyên.
7. Xuất Báo cáo tổng hợp và đối chiếu mẫu người dùng gửi: STT, Chỉ tiêu, Số lượng; cột A/B/C có độ rộng tương ứng 5.3/21.2/15.9; kiểm tra chữ xuống dòng không che lấp. So sánh số liệu với bảng báo cáo trên website. Kiểm tra ba mẫu Excel còn lại không bị biến đổi.
8. Kiểm tra ít nhất 2 tài khoản cùng cập nhật hồ sơ, phiên bản không ghi đè, nhật ký đúng như V5.

**Lưu ý triển khai:** V1 cần cập nhật **cả Code.gs lẫn GitHub**, nên ưu tiên khoảng bảo trì ngắn để không có trường hợp giao diện mới làm việc với backend cũ. Triển khai đầy đủ cả hai phần trước khi mở lại cho người dùng.

## 3. Hoàn tác

1. Tạm dừng thay đổi; đưa cả Apps Script và mã nguồn GitHub/Vercel trở về cùng bản V5 `v1.2.23-RC`.
2. Tải lại ứng dụng, kiểm tra quyền, menu, báo cáo, Excel, cập nhật hồ sơ.
3. **Không tự xóa hoặc sửa các hồ sơ đã ghi thành công bằng V1**, nhất là `KY:1`. Bản V5 trước đây không cho sửa/lưu lại trạng thái kỳ 1. Nếu đã có dữ liệu `KY:1`, cần phương án chuyển tiếp nghiệp vụ hoặc khôi phục dữ liệu được phê duyệt trước khi đưa backend cũ vào sử dụng rộng rãi.
4. Khôi phục dữ liệu từ bản sao lưu chỉ sau khi đối soát nhật ký và có phê duyệt.

## 4. Kiểm thử đã làm và chưa làm

- Node.js: 198/198 PASS (môi trường cục bộ/mock).
- Chromium: PASS trường hợp tháng 1–6, tên trường dài ở 5 cỡ màn hình, vai trò chức danh V4 và hai máy xử lý xung đột V5.
- Workbook xuất từ chính mã mới: đọc được đủ 3 cột/bảy chỉ tiêu, số lượng là số.
- **Chưa kiểm thử ghi lên Apps Script/Google Sheets staging thật**, tải 10–20 người thật hoặc bản in từng phiên bản Excel/WPS ngoài môi trường hiện tại.

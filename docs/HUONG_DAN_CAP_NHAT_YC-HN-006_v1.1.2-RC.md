# HƯỚNG DẪN TRIỂN KHAI YC-HN-006 — v1.1.2-RC

**Phần mềm:** Theo dõi học nghề. **Chưa triển khai production.**

## I. Trước khi cập nhật

1. Đăng nhập GitHub repository `thanhbds2011-droid/theo-doi-hoc-nghe` và ghi lại mã commit đang chạy, hoặc tải ZIP sao lưu toàn bộ repository hiện hành.
2. Trong Vercel, ghi lại deployment đang hoạt động để có thể quay về bản cũ.
3. Đối chiếu source hiện hành. Bản YC-HN-006 được xây trên full source **v1.1.1-RC**. Nếu bạn đang dùng frontend/API cũ khác kiến trúc, hãy thông báo để rà soát trước khi thay.
4. Không chia sẻ OAuth secret/API secret trong cuộc trò chuyện, không xóa/cập nhật biến môi trường Vercel.

## II. Cập nhật GitHub và Vercel

1. Tải file `THEO_DOI_HOC_NGHE_FULL_SOURCE_YC-HN-006_v1.1.2-RC.zip` rồi giải nén.
2. Mở thư mục **theo-doi-hoc-nghe** bên trong ZIP. Đây là mã nguồn dự án; **không** tải nguyên file ZIP lên GitHub như một file duy nhất.
3. Chỉ cần thay các file frontend `public/app.js`, `public/styles.css`, `public/index.html` nếu repo đang thực sự ở v1.1.1-RC. Nếu bạn muốn bảo đảm đồng bộ, có thể cập nhật toàn bộ thư mục theo ZIP **sau khi kiểm tra baseline**, nhưng không ghi đè bất kỳ thay đổi độc lập nào mới hơn.
4. Cập nhật `package.json`, `README.md`, file kiểm thử và docs khi sử dụng full source. **Không bắt buộc thay `apps-script/Code.gs` hoặc Vercel `api/rpc.js` vì chúng giữ nguyên so với v1.1.1-RC**.
5. Commit/push bản nâng cấp lên nhánh/preview theo quy trình GitHub/Vercel đang sử dụng. Không tự thay đổi domain hoặc secret.
6. Mở **Preview Deployment** Vercel trước. Nếu mọi kiểm tra đạt mới tiến hành cập nhật production theo quyền phê duyệt của bạn.

## III. Kiểm tra sau khi triển khai

- Tải lại website với `Ctrl + Shift + R` để nhận file frontend mới.
- Đăng nhập Admin bằng tài khoản hiện có.
- Trang Tổng quan: có một banner, bộ lọc năm/cơ sở/nghề, 6 KPI nhỏ trên **một hàng** ở desktop từ 1366px trở lên.
- Bên dưới là **hai biểu đồ**: cơ sở đào tạo dạng cột và nghề đào tạo dạng vòng. Dữ liệu phải đúng với hồ sơ hiện tại, không lấy dữ liệu ví dụ trên ảnh thiết kế.
- Nhấn “Xem chi tiết” (nếu có quyền Báo cáo) để chuyển đến Báo cáo; nút Lọc dữ liệu phải hoạt động.
- Kiểm tra sáu icon menu: Nhà, Hồ sơ, Biểu đồ, Lưới 4 ô, Người dùng, Đồng hồ.
- Kiểm tra tất cả sáu phân hệ, Thêm/Sửa hồ sơ, danh mục, tài khoản và cửa sổ nhập liệu.
- Giao diện không hiển thị từ “Google Sheets” cho người sử dụng cuối.
- Thử trên laptop/máy tính màn hình 1366×768 và ở chế độ zoom 100%; nếu ảnh chụp khác mẫu, kiểm tra kích thước trình duyệt, zoom, cache và font có sẵn.
- Kiểm thử tạo/sửa/xóa thử nghiệm theo quyền đã cấp và tệp đính kèm khi triển khai chính thức. **Đừng dùng hồ sơ hoặc tệp thật để thử thao tác xóa**.

## IV. Kiểm thử nguồn (nếu có người hỗ trợ IT)

```bash
npm run check
npm test
```

44/44 bài kiểm thử tự động đạt tại thời điểm bàn giao; kiểm tra Chromium với API giả lập đạt ở 6 kích thước. Phần kiểm thử này **không thay thế** nghiệm thu production.

## V. Khôi phục khi gặp lỗi

1. Trong Vercel, tái triển khai deployment cũ hoặc hoàn nguyên commit GitHub trước YC-HN-006.
2. Tải lại website và thử các chức năng như trước.
3. Không cần phục hồi Google Sheets hay thay deployment Apps Script, vì **YC-HN-006 chỉ nâng cấp giao diện**.
4. Nếu API/Apps Script vốn chưa đồng bộ với bản v1.1.1-RC, cần xử lý xung đột phiên bản riêng trước khi triển khai, không dùng việc rollback CSS làm cách chữa lỗi backend.

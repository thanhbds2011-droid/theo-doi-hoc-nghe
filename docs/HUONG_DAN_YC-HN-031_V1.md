# HƯỚNG DẪN TRIỂN KHAI VÀ HOÀN TÁC – YC-HN-031 V1

**Nguồn:** v1.2.24-RC → **Đích:** v1.2.25-RC.  
**Áp dụng cho:** Người quản trị triển khai, không dành cho tài khoản cơ sở đào tạo.

## 1. Sao lưu trước khi cập nhật

1. Lưu bản ZIP V6/v1.2.24-RC đang chạy, hoặc tải snapshot mã nguồn GitHub hiện hành, xác định commit để có thể quay lại. Không dùng tệp ZIP cũ chưa kiểm tra làm bản sao lưu production.
2. Sao lưu toàn bộ `Code.gs` đã triển khai và ghi lại **deployment ID/phiên bản Apps Script** đang dùng; sao lưu Google Sheets nếu quy trình đơn vị yêu cầu. Không chạy các hàm nâng cấp/cấu hình cơ sở dữ liệu vì YC-HN-031 không thay đổi schema.
3. Xác nhận đang dùng **đúng** Vercel frontend, Apps Script backend và Google Sheets dự kiến; đặc biệt tránh ghi đè Script đang phục vụ ứng dụng khác.

## 2. Triển khai trên staging

1. Chuẩn bị bản sao môi trường và dữ liệu kiểm thử; tối thiểu cần hai cơ sở A/B, ba nghề và các quyết định liên quan, có tài khoản thử từng vai trò.
2. Sao chép **toàn bộ** `apps-script/Code.gs` từ ZIP mới vào Apps Script staging; tạo phiên bản Web App mới (nếu dùng deployment theo phiên bản). Duy trì các Script Properties và phân quyền hiện có, không xóa dữ liệu. Xác định URL deployment mà Vercel staging đang gọi.
3. Triển khai frontend `public/app.js`, `public/index.html` từ ZIP trên nhánh staging; không thay `api/rpc.js`, Excel, CSS nếu không có thay đổi độc lập khác.
4. Tải lại website (Ctrl+F5) và xác nhận nhãn phiên bản **v1.2.25-RC**.
5. Đăng nhập tài khoản A/B: A chỉ thấy nghề của A, B chỉ thấy nghề của B ở Tổng quan, Hồ sơ học nghề và Báo cáo.
6. Quản trị viên thêm quyết định nghề mới cho A; sau khi A làm mới/ứng dụng tự phát hiện, A thấy nghề mới, B không thấy. Kiểm tra cả nghề có trong danh mục chung nhưng chưa từng có quyết định tại A.
7. Chuyển trường/nghề, xóa hồ sơ cuối cùng của một nghề; kiểm tra dropdown cập nhật và xóa riêng lựa chọn nghề không còn phù hợp. Thử chọn khoảng ngày, năm, từ khóa để chắc chắn bộ lọc khác được giữ.
8. Đối chiếu số lượng Tổng quan, Báo cáo, in và bốn mẫu Excel, phân quyền NHAN_VIEN và ADMIN. Kiểm tra không truy xuất được hồ sơ trường khác qua request tự gửi.
9. Kiểm tra đồng thời người dùng và log Apps Script trên staging nếu có tải thực; đây là bước cần thực hiện trước khi phát hành cho toàn Trung tâm.

## 3. Đưa lên production

Chỉ sau khi nghiệm thu staging. Vì frontend và backend có bổ sung giao thức `tradeScopeRevision`, **cập nhật Apps Script trước**, sau đó phát hành frontend cùng phiên bản. Nếu GitHub nối tự động Vercel, commit lên nhánh production có thể tự triển khai. Thông báo người dùng tải lại trang để nhận code mới.

## 4. Hoàn tác

- Tạm dừng chỉnh sửa dữ liệu trong lúc hoàn tác. Khôi phục **frontend và backend đồng bộ** về bản đã sao lưu; đừng chỉ hoàn tác một bên nếu chưa kiểm tra tương thích.
- Xác nhận deployment/URL proxy và mã phiên bản sau hoàn tác; thử đăng nhập và lọc nghề trên cả tài khoản quản trị và cơ sở.
- Các khóa revision mới trong Script Properties có thể được giữ lại, không cần xóa; không thay đổi schema và dữ liệu hồ sơ.
- Nếu trong thời gian dùng V1 có thêm quyết định thì quay lại bản cũ sẽ khiến dropdown trường tạm nhìn thấy toàn danh mục như trước; không gây mất hồ sơ nhưng phải tránh phát hành dài hạn nếu chưa khắc phục.

## 5. Điểm cần lưu ý

- Tự đồng bộ áp dụng cho thay đổi hồ sơ thực hiện qua **ứng dụng**. Khi chỉnh tay trực tiếp trên Google Sheets, mã revision có thể không tăng và cache không tự làm mới tức thì.
- Cơ chế hiện là kiểm tra gần thời gian thực, không phải push ngay lập tức; thời gian phụ thuộc lịch kiểm tra phiên, trình duyệt và kết nối.
- Không công bố đã chịu tải 20 người nếu chưa đo trực tiếp trên môi trường đại diện production.

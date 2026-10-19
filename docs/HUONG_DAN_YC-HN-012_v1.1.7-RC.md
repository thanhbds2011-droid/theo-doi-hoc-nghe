# HƯỚNG DẪN CẬP NHẬT VÀ QUAY LẠI — YC-HN-012 v1.1.7-RC

**Đọc trước khi thao tác.** YC-HN-012 thay đổi cả frontend lẫn Apps Script. Không cần thêm cột vào Google Sheets nếu YC-HN-011 đã được cập nhật và xác nhận đủ **40 cột Hồ sơ học nghề / 94 cột toàn bộ**.

## 1. Sao lưu

1. Sao chép file Google Sheets `CSDL_THEO_DOI_HOC_NGHE` thành bản riêng; ghi ngày giờ và tên bản sao.
2. Sao lưu nguyên file Apps Script `Code.gs` đang triển khai và ghi nhận **Deployment ID/Version** đang hoạt động.
3. Sao lưu mã GitHub ở nhánh/tag hiện hành và ghi lại phiên bản Vercel đang sử dụng.
4. Tuyệt đối không đưa `API_SHARED_SECRET`, `GOOGLE_CLIENT_ID`, token hay khóa riêng vào GitHub hoặc trò chuyện.

## 2. Cập nhật backend trước

1. Mở dự án Apps Script `THEO_DOI_HOC_NGHE_API`.
2. Thay **toàn bộ** `Code.gs` bằng file `THEO_DOI_HOC_NGHE_Code_YC-HN-012_v1.1.7-RC.gs` đính kèm. Giữ Script Properties cũ; không nhập khóa bí mật vào source.
3. Kiểm tra tab `Hồ sơ học nghề` có đủ 40 tiêu đề theo YC-HN-011. Nếu chưa, thực hiện quy trình sao lưu/chuyển đổi **YC-HN-011** trước, không chạy nhập Excel lúc chưa đủ cột.
4. Lưu, chọn **Deploy → Manage deployments → Edit → New version → Deploy** để cập nhật đúng Web App deployment đã liên kết với Vercel.
5. Không chạy hàm khởi tạo/Việt hóa hoặc xóa dữ liệu khi không cần. YC-HN-012 **không có migration mới**.

## 3. Cập nhật frontend

1. Giải nén full source v1.1.7-RC; đưa các tệp đúng thư mục của repository GitHub `thanhbds2011-droid/theo-doi-hoc-nghe`, không đẩy một file ZIP vào root.
2. Kiểm tra Vercel Environment Variables / API endpoint giữ nguyên giá trị đang chạy. Triển khai bản mới; kiểm tra footer hiển thị `v1.1.7-RC`.
3. Đăng nhập bằng tài khoản Quản trị viên, vào **Hồ sơ học nghề → Nhập Excel → chọn file → Kiểm tra dữ liệu**.
4. Kết quả xem trước phải phân biệt: hồ sơ hợp lệ, quyết định trùng, lỗi thực tế, **số và tên cơ sở/nghề mới**. Không nhấn Xác nhận nhập nếu có tên gần giống/INACTIVE cần đối chiếu.
5. Sau khi kiểm tra và xác nhận, nhập thử một tệp **2–5 hồ sơ giả** trên bản sao môi trường; kiểm tra hồ sơ và danh mục tạo đúng ID, không nhân đôi khi nhập lại cùng file.

## 4. Quy tắc nhập và mẫu

- Mẫu chuẩn YC-HN-011 có **25 cột**, không thay đổi tên hay thứ tự. File 2.326 hồ sơ gốc không cần thêm cột.
- Nếu file bổ sung tình trạng bỏ học, có thể đặt ba cột tùy chọn: `Tình trạng học nghề`, `Ngày bỏ học`, `Lý do bỏ học`. Chỉ khi tình trạng **Bỏ học** và ngày/lý do hợp lệ, hệ thống mới dùng dữ liệu đó và có thể tạo danh mục lý do mới. Không có dữ liệu này thì trạng thái hồ sơ nhập mới **Chưa xác nhận**.
- Mức `1.500.000` được lưu là `1500000` và hiển thị/đưa ra báo cáo là `1.500.000`; tháng `3,5` được lưu là `3.5` và hiển thị `3,5`.
- Cơ sở/nghề mới được tạo tự động sau khi Admin xác nhận, chỉ cho **những hồ sơ hợp lệ**. Các mục trùng tên, đã ngừng sử dụng hoặc không rõ phải xử lý trước.
- Khi nhập 2.326 dòng, hệ thống xử lý tối đa 40 hồ sơ/đợt dưới LockService. Không đóng cửa sổ trong khi có đợt đang ghi. Đối soát số lượng thực tế nếu bị mất kết nối.

## 5. Xác nhận nghiệm thu trên hệ thống thử nghiệm

- Nhập trường tháng `3,5`, tiền `1.500.000` bằng cách Thêm và Sửa hồ sơ, rồi mở Chi tiết và xuất Excel.
- Nhập hai hồ sơ cùng nghề/cơ sở chưa có: chỉ sinh **một** mã danh mục cho mỗi tên.
- Nhập lại file: không tạo trùng quyết định/danh mục.
- Không thay đổi danh mục INACTIVE hoặc DELETED; xem lỗi rõ để xử lý.
- Đăng nhập Nhân viên không thể gọi API nhập hàng loạt; các hồ sơ Admin nhập vẫn thuộc phạm vi Admin (chưa có tính năng phân công).
- Xác nhận mọi KPI, hồ sơ cũ và tệp đính kèm vẫn hoạt động bình thường.

## 6. Rollback

Nếu nghiệm thu không đạt, ngừng nhập ngay; giữ nguyên dữ liệu đã ghi để đối soát.

1. Đưa Vercel/GitHub về bản frontend **v1.1.6-RC**.
2. Đưa Apps Script Web App deployment về phiên bản `Code.gs` đã sao lưu trước nâng cấp.
3. Không tự xóa danh mục hoặc hồ sơ vừa nhập, vì Google Sheets không có cơ chế rollback đa tab. Lập danh sách đối soát theo đợt và chỉ khôi phục bản sao Sheets nếu có quy trình được người quản trị xác nhận; sao lưu lại trạng thái hiện tại trước khi phục hồi.

**Chưa có nghiệm thu production:** kết quả kiểm thử trong gói là offline/mô phỏng, không phải chứng nhận Vercel và Google Sheets thật đã được cập nhật.

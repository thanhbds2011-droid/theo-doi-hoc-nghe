# HƯỚNG DẪN TRIỂN KHAI AN TOÀN – THEO DÕI HỌC NGHỀ v1.1.0-RC

**Đối tượng sử dụng:** Chủ hệ thống. Nhân viên cuối cùng **chỉ dùng website**.

## 1. Trước khi thực hiện

1. Mở Google Sheets `CSDL_THEO_DOI_HOC_NGHE` bằng tài khoản quản trị; chọn **Tệp → Tạo bản sao**, đặt tên có ngày/giờ. Đây là bản dự phòng, không sửa dữ liệu bản chính.
2. Lưu lại bộ ZIP hiện đang vận hành hoặc tải phiên bản GitHub hiện tại về máy. Ghi lại commit đang hoạt động và deployment đang hoạt động trên Vercel.
3. Mở Apps Script `THEO_DOI_HOC_NGHE_API`; sao lưu nguyên `Code.gs` hiện tại và ghi lại mã deployment/URL `/exec` hiện đang hoạt động.
4. Đảm bảo không có người dùng đang thao tác, không tải tệp đang dở. Không cấp liên kết Google Sheets cho nhân viên.
5. **Không** gửi `API_SHARED_SECRET`, `SPREADSHEET_ID`, ID token hoặc quyền truy cập cho người hỗ trợ trong chat.

## 2. Cập nhật Apps Script

1. Trong Apps Script Editor, chọn tệp `Code.gs`, thay toàn bộ bằng **`apps-script/Code.gs` phiên bản v1.1.0-RC** được bàn giao. Lưu dự án.
2. Khi Apps Script yêu cầu quyền để sử dụng Google Drive và gửi yêu cầu tới Google Drive API (`UrlFetchApp`), cấp quyền **trên tài khoản quản trị sở hữu dự án**, sau khi đọc thông báo quyền. Nếu Apps Script không nhận diện quyền, xem tệp `apps-script/appsscript.json` để đối chiếu các phạm vi cho phép. Không tự thay manifest cũ nếu chưa so sánh.
3. **Không** chạy hàm `setupDatabase` hoặc `chuyenSangTiengViet` nếu 7 tab đã tồn tại và đúng cấu trúc; nâng cấp lần này không yêu cầu chuyển đổi 79 cột.
4. Vào **Deploy → Manage deployments → Edit** của Web App đang dùng, chọn **New version → Deploy**. Sử dụng deployment Web App hiện có; không thay URL đã cấu hình ở Vercel.
5. Chế độ chạy Apps Script phải là tài khoản chủ ứng dụng (Execute as me/tài khoản quản trị). Endpoint vẫn kiểm tra HMAC + tài khoản thực tế của từng người dùng. Không cấp quyền Spreadsheet cho nhân viên.
6. Nếu Google yêu cầu xác nhận thêm OAuth, hoàn tất với tài khoản sở hữu Apps Script. Việc tăng dung lượng cần quyền Google Drive REST API qua `UrlFetchApp`.

## 3. Cập nhật GitHub/Vercel

1. Dùng bộ **FULL SOURCE** trong ZIP, thay các file của repository `thanhbds2011-droid/theo-doi-hoc-nghe` theo đúng cấu trúc. Không tải lên `.env` chứa secret.
2. Không xóa các biến môi trường Vercel hiện có (`GOOGLE_CLIENT_ID`, `GAS_WEB_APP_URL`, `API_SHARED_SECRET`).
3. Commit bộ source mới lên GitHub hoặc trên nhánh thử nghiệm; theo dõi build/deploy trên Vercel. Trước khi chuyển production, nên kiểm thử trên một deployment thử nghiệm phù hợp.
4. Đăng nhập website bằng tài khoản Admin và xác minh footer chỉ hiển thị phiên bản/phần mềm nội bộ; **không có chữ Google Sheets**.
5. Nếu bản backend và frontend không cùng phiên bản, ngừng kiểm thử ghi tệp và quay lại đối chiếu các bước 2–3.

## 4. Kiểm thử nghiệp vụ trên dữ liệu thử nghiệm

1. Tạo một danh mục từ website chỉ bằng tên. Kiểm tra sau khi lưu, mã đã được cấp và mục xuất hiện trong biểu mẫu hồ sơ. Không cần mở Sheets.
2. Vào **Danh mục → Nhập hàng loạt**, dán 3–5 tên, trong đó có một tên trùng; bấm **Kiểm tra danh sách**, sau đó **Xác nhận nhập**. Kiểm tra số tên hợp lệ/trùng và nhật ký.
3. Tạo một tài khoản nhân viên thử nghiệm có quyền `RECORD_CREATE,RECORD_VIEW,RECORD_DELETE`, không chia sẻ Sheets. Tài khoản phải đăng nhập được website bằng Google thực tế.
4. Nhân viên thử nghiệm tạo một hồ sơ mới; sau đó được xóa hồ sơ đó. Kiểm tra số quyết định vẫn không được tái sử dụng trong cùng năm.
5. Nhân viên khác có quyền `RECORD_DELETE` phải bị từ chối nếu cố xóa hồ sơ do nhân viên thứ nhất tạo; Admin có thể xóa hồ sơ thuộc mọi nhân viên.
6. Kiểm tra 6 KPI trước và sau xóa mềm. Hồ sơ đã xóa không hiển thị trong danh sách và không tính vào báo cáo hoạt động.
7. Kiểm tra tệp PDF/JPG/PNG có dung lượng xấp xỉ 1 MB, 5 MB, 9,9 MB và đúng 10 MiB; tải lên và tải xuống, so sánh độ dài và mã băm SHA-256 của tệp gốc với tệp tải về.
8. Tệp vượt 10 MiB hoặc sai định dạng phải được từ chối với thông báo tiếng Việt. Thử gián đoạn mạng giữa chừng và xác minh không có tệp hỏng được gắn vào hồ sơ.
9. Thử thêm/sửa tài khoản, cấp quyền, đăng xuất/đăng nhập, sửa hồ sơ, cập nhật tình trạng, lọc báo cáo, xuất CSV, in báo cáo, xem nhật ký.
10. Kiểm tra layout desktop/laptop/mobile; đặc biệt nút Xóa, biểu mẫu hai cột, checkbox và modal không tràn hoặc chồng lấn.

**Quan trọng:** Chỉ được coi là triển khai thành công khi kiểm thử trên môi trường thực tế đạt. Kiểm thử offline không thay thế kiểm thử production.

## 5. Lưu ý với tệp tối đa 10 MB

- Tệp được truyền theo **các phần 256 KiB**, từng phần qua Vercel proxy và Apps Script; Apps Script gửi đến phiên tải tiếp tục của Google Drive API bằng quyền của tài khoản sở hữu hệ thống. Người dùng không cần được chia sẻ Drive.
- Quá trình này có thể mất thời gian tùy mạng và quota Apps Script/Google Drive/Vercel. Không cam kết thời gian hoặc tính sẵn sàng ngoài giới hạn nhà cung cấp.
- Khi bắt đầu tải, kết quả chưa được xác nhận cho đến khi phần cuối hoàn tất và hồ sơ được cập nhật. Tránh đóng trình duyệt trong khi tải.
- Khi gặp sự cố khi đang tải, kiểm tra tệp đính kèm thực tế trước khi thử lại. Một lượt tải đang dang dở có thể được Google tự hết hạn.
- Nếu Google Drive API trả lỗi 403/401, chủ hệ thống cần kiểm tra phạm vi quyền OAuth của Apps Script và quyền sở hữu thư mục Drive; **không cấp quyền Sheets cho nhân viên để khắc phục**.

## 6. Quay về bản trước (rollback)

1. Tạm ngừng thao tác ghi dữ liệu nếu có sự cố.
2. Trong Apps Script, trở lại deployment version cũ hoặc khôi phục `Code.gs` đã sao lưu, triển khai phiên bản tương thích.
3. Trong Vercel, dùng **Promote/Rollback** tới deployment GitHub cũ, hoặc khôi phục commit đã ghi nhận. Luôn rollback **frontend và Apps Script theo cặp tương thích**.
4. Không khôi phục bản sao Sheets ngay lập tức vì có thể ghi đè dữ liệu phát sinh hợp lệ trong thời gian sau khi nâng cấp. Chỉ thực hiện sau khi đối chiếu kỹ với nhật ký và được chủ hệ thống chấp thuận.
5. Khi phát hiện hồ sơ đã xóa mềm, dòng dữ liệu gốc vẫn còn trong tab `Hồ sơ học nghề` và giá trị trạng thái là `DELETED`; không tự xóa dòng này.
6. Kiểm tra lại đăng nhập, tài khoản, danh mục, tạo hồ sơ, tải tệp và số KPI sau rollback.

## 7. Nội dung chưa được xác minh trực tiếp

- Chưa kết nối Apps Script/Google Sheets/Google Drive/Vercel production trong phiên tạo bản bàn giao này.
- Kiểm thử truyền tệp 10 MiB được mô phỏng; việc Google Drive trả HTTP 308, 200 và HTTP Range trong môi trường vận hành cần được kiểm chứng bằng tệp thử nghiệm thật.
- Cần kiểm tra tốc độ và quota thực tế khi nhập hàng trăm danh mục hoặc tải tệp 10 MB.

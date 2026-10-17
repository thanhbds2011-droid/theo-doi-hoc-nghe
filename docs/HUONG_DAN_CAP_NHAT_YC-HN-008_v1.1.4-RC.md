# Hướng dẫn nâng cấp Theo dõi học nghề v1.1.4-RC – YC-HN-008

## 1. Chuẩn bị – không bỏ qua
1. Dùng bản source v1.1.3-RC đang chạy để đối chiếu trước khi cập nhật, nhất là Apps Script Editor và Vercel đang triển khai bản nào.
2. Sao lưu **toàn bộ Spreadsheet `CSDL_THEO_DOI_HOC_NGHE`** (File → Tạo bản sao), thư mục Drive nếu có thể, và **Code.gs** hiện tại.
3. Sao lưu GitHub (commit/tag/branch bản đang hoạt động). Lưu lại deployment ID Web App Apps Script và phiên bản Vercel có thể rollback.
4. Chỉ thực hiện nâng cấp khi chủ hệ thống có quyền quản lý Apps Script, GitHub và Vercel. Không cấp quyền truy cập Sheets cho người dùng cuối.

## 2. Triển khai Apps Script trước
1. Mở `THEO_DOI_HOC_NGHE_API` trong Apps Script Editor.
2. Thay **toàn bộ nội dung** `Code.gs` bằng file `apps-script/Code.gs` trong bộ v1.1.4-RC.
3. Không chạy `setupDatabase` hay xóa/đổi thứ tự 79 cột: YC-HN-008 **không thay schema**.
4. Deploy → Manage deployments → chọn Web App đang dùng → Edit → New version → Deploy.
5. Giữ đúng URL `/exec` đã cấu hình tại biến môi trường `GAS_WEB_APP_URL` của Vercel. Nếu URL thay đổi, cập nhật biến môi trường ở Vercel.
6. Giữ kín Script Properties như `API_SHARED_SECRET`, `SPREADSHEET_ID`, `GOOGLE_CLIENT_ID`, `APP_ORIGIN`, `DRIVE_FOLDER_ID`. **Không đưa các giá trị này lên GitHub hoặc gửi qua chat**.

## 3. Triển khai GitHub/Vercel
1. Giải nén `THEO_DOI_HOC_NGHE_FULL_SOURCE_YC-HN-008_v1.1.4-RC.zip`.
2. Cập nhật **cấu trúc source bên trong** thư mục `theo-doi-hoc-nghe/` vào repository. Không upload nguyên ZIP làm website. Giữ `.env`/secret ngoài GitHub.
3. Đảm bảo có cả thư mục `public/templates/` gồm **3 file XLSX**, `api/rpc.js`, `public/app.js`, `public/index.html` và `apps-script/Code.gs` được cập nhật đồng bộ.
4. Vercel triển khai commit mới. Kiểm tra tên miền `https://theo-doi-hoc-nghe.vercel.app`, không thay Client ID hoặc origin đăng nhập.
5. Giao diện footer dự kiến hiện `v1.1.4-RC`.
6. `API_SHARED_SECRET` phía Vercel phải trùng với Apps Script; cookie phiên dùng **chính biến môi trường này**, không phát sinh secret mới.

## 4. Kiểm thử nghiệp vụ trên môi trường thử nghiệm
1. Đăng nhập tài khoản Admin. Bấm F5 nhiều lần trong vòng 8 giờ: vẫn sử dụng được khi phiên hợp lệ; bấm Đăng xuất rồi F5: không được vào lại khi chưa xác thực.
2. Mở Danh mục → đổi nhanh ba tab → sang menu khác rồi quay lại: không hiện màn hình tải toàn trang nếu dữ liệu đã có.
3. Thử tạo một danh mục tạm, xóa danh mục **chưa liên kết hồ sơ**; thử xóa danh mục đã dùng: phải bị từ chối và hướng dẫn Ngừng sử dụng.
4. Thử tạo một tài khoản nhân viên tạm, xóa: tài khoản phải bị từ chối đăng nhập; hồ sơ do người đó tạo không mất. Không được xóa Admin cuối cùng.
5. Dùng hai tài khoản nhân viên A, B; tạo 1–2 hồ sơ khác nhau: A chỉ thấy A, B chỉ thấy B, Admin thấy tổng. Kiểm tra cả Tổng quan, Hồ sơ, tìm kiếm, báo cáo, xuất CSV, sửa/xóa và tệp đính kèm. Thử API trực tiếp với ID hồ sơ của người khác phải bị từ chối.
6. Tài khoản Nhân viên chỉ thấy **Tổng quan / Hồ sơ học nghề / Báo cáo**, nhưng khi tạo hồ sơ vẫn chọn được cơ sở/nghề/lý do hiện hoạt động.
7. Trong Danh mục → Nhập hàng loạt → Tải file mẫu: Excel phải hiển thị các tiêu đề ở các cột riêng. Điền từ dòng 2 → lưu XLSX → tải lên → Kiểm tra danh sách → Xác nhận nhập. Kiểm tra số hàng và các cột địa chỉ, viết tắt trong website/Sheets.
8. Kiểm tra logo có hình mũ tốt nghiệp tại sidebar và trang đăng nhập; không còn chữ HN giả hoặc “PHẦN MỀM ĐỘC LẬP”.
9. Kiểm tra tải tệp PDF/JPG/PNG từ nhỏ đến 10 MB nếu môi trường Drive/Apps Script cho phép. Không ghi dữ liệu thử nghiệm lẫn hồ sơ thật.

## 5. Rollback khi phát hiện lỗi
- **Nếu chưa ghi dữ liệu mới:** Redeploy phiên bản Apps Script trước, sau đó rollback Vercel về commit/deployment v1.1.3-RC.
- **Nếu đã ghi dữ liệu:** Không khôi phục đè ngay bảng tính vì có thể làm mất thao tác mới. Trước tiên sao lưu trạng thái hiện tại, đối chiếu nhật ký và hồ sơ phát sinh sau khi nâng cấp; chỉ khôi phục có chọn lọc.
- Nếu thấy Nhân viên có thể đọc hồ sơ của người khác, **dừng triển khai/cấp quyền ngay**, rollback bản an toàn và kiểm tra audit/cache.
- Nếu đăng nhập F5 không hoạt động, xác minh cookie qua trình duyệt (không gửi giá trị cookie cho người khác), URL/Origin, phiên Vercel và quyền tài khoản. Không tắt xác thực để xử lý lỗi.

## 6. Tiêu chí bàn giao
Source đã được kiểm thử **offline**, chưa tự triển khai production. Chỉ coi vận hành chính thức hoàn thành khi kiểm thử thật 2 vai trò, lưu/xóa mềm, Excel, phiên đăng nhập, API bảo mật và dữ liệu thực tế đều đạt.

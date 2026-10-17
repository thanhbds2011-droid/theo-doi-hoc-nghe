# HƯỚNG DẪN CẬP NHẬT PHẦN MỀM THEO DÕI HỌC NGHỀ — YC-HN-007 v1.1.3-RC

**Dành cho người quản trị, không chuyên lập trình.** Không gửi khóa bí mật, mật khẩu hay mã truy cập cho người khác.

## 1. Trước khi làm

1. Mở website đang sử dụng, ghi nhận các màn hình/các tài khoản hiện có. Ghi lại nhãn phiên bản và ngày kiểm tra.
2. Vào Google Sheets `CSDL_THEO_DOI_HOC_NGHE` bằng tài khoản chủ hệ thống; tạo bản sao lưu trong Google Drive (File → Make a copy / Tạo bản sao). Không xóa dữ liệu cũ.
3. Trong Apps Script `THEO_DOI_HOC_NGHE_API`, sao lưu toàn bộ `Code.gs` cũ hoặc giữ nguyên deployment đang chạy để có thể quay lại.
4. Trong GitHub, sao lưu repository hiện hành hoặc ghi lại mã commit để rollback. Trong Vercel, ghi lại deployment hiện tại.
5. Giữ nguyên các Script Properties: `API_SHARED_SECRET`, `SPREADSHEET_ID`, `GOOGLE_CLIENT_ID`, `DRIVE_FOLDER_ID`, `APP_ORIGIN`; giữ các biến Vercel `GAS_WEB_APP_URL`, `GOOGLE_CLIENT_ID`, `API_SHARED_SECRET`. Không gửi giá trị cho tôi.

## 2. Cập nhật Apps Script (cần làm vì YC007 thay đổi backend)

1. Mở Apps Script đã liên kết với Spreadsheet đúng dự án `THEO_DOI_HOC_NGHE_API`.
2. Mở `Code.gs`, chọn tất cả nội dung cũ và **thay bằng toàn bộ nội dung** file `THEO_DOI_HOC_NGHE_Code_YC-HN-007_v1.1.3-RC.gs` đi kèm (không ghép đoạn nhỏ).
3. Lưu. Kiểm tra không có lỗi cú pháp; không chạy các hàm `setupDatabase`, `chuyenSangTiengViet` hoặc đồng bộ trực tiếp từ Sheets nếu không cần.
4. **Deploy → Manage deployments → Edit → Version: New version → Deploy**. Kiểm tra URL `/exec` của Web App đang được Vercel cấu hình. Nếu bạn tạo một deployment **mới hoàn toàn**, phải cập nhật URL tương ứng trong biến `GAS_WEB_APP_URL` của Vercel **ở môi trường thử nghiệm trước**.
5. Không thay đổi cách thực thi Web App hay quyền truy cập nếu chưa đối chiếu với cấu hình đang vận hành.

## 3. Cập nhật GitHub/Vercel

1. Giải nén ZIP vào máy. Bên trong có thư mục `theo-doi-hoc-nghe` với `public`, `api`, `apps-script`, `tests`, `templates`, `docs`.
2. Đối chiếu repository hiện tại với bản v1.1.2-RC. Nếu đúng baseline, dùng các file trong ZIP; không ghi đè code khác mới hơn chưa được xem xét.
3. Tải **nội dung đã giải nén**, không phải bản ZIP, lên repository hoặc nhánh thử nghiệm. Giữ nguyên secrets môi trường Vercel.
4. Đợi Vercel Preview build và mở URL preview. Dùng tài khoản kiểm thử được cấp quyền; không thực hiện thay đổi trên hồ sơ thật khi chưa kiểm tra.
5. Sau khi cả Apps Script và frontend cùng v1.1.3-RC, kiểm tra các chức năng; khi đạt mới chuyển production.

## 4. Kiểm tra chức năng theo thứ tự

1. Đăng nhập Admin; xem 6 KPI và trang Hồ sơ; chuyển qua lại các menu trong vòng một phút, xác nhận không xuất hiện màn hình chờ liên tục.
2. Thêm **danh mục thử nghiệm** trên website, bấm Lưu danh mục. Kết quả phải hiện trên website, kiểm tra trong Sheets bằng tài khoản chủ (người dùng cuối không cần Sheets).
3. Thêm tài khoản Nhân viên bằng một email Google thử nghiệm có thật, bấm Lưu tài khoản. Nhân viên phải đăng nhập được; giao diện không còn ô tick quyền.
4. Tạo hồ sơ thử nghiệm theo quyết định thử không trùng dữ liệu đang dùng; mặc định “Đã tham gia – Đang học”; chỉ khi chọn Bỏ học mới có ngày và lý do bắt buộc. Thử cập nhật trạng thái, theo dõi KPI.
5. Đăng nhập Nhân viên: thử xóa **hồ sơ thử do chính họ tạo**; thử xóa hồ sơ do người khác tạo phải bị từ chối. Admin thử xóa hồ sơ thử của Nhân viên, không thử với hồ sơ thật.
6. Mở Danh mục → Nhập hàng loạt → chọn loại → **Tải file mẫu**. Thử 2 dòng mới, có địa chỉ/tên viết tắt/ghi chú. Bấm Kiểm tra rồi Xác nhận nhập; thử nhập lại để xác nhận không nhân đôi.
7. Kiểm tra báo cáo và nhật ký. Thử PDF/JPG/PNG dưới 10 MB và gần 10 MB trên một hồ sơ thử, đối chiếu file tải xuống; thao tác này cần kiểm thử thực tế vì bài test offline không xác minh được production.

## 5. File CSV mẫu

- `MAU_CO_SO_DAO_TAO_YC007.csv`: Tên cơ sở đào tạo, Tên viết tắt, Địa chỉ, Ghi chú.
- `MAU_NGHE_DAO_TAO_YC007.csv`: Tên nghề, Thứ tự hiển thị, Ghi chú.
- `MAU_LY_DO_BO_HOC_YC007.csv`: Nội dung lý do, Thứ tự hiển thị, Ghi chú.

Điền từ **dòng 2**, giữ nguyên tiêu đề **dòng 1**; để trống cột không bắt buộc. Không điền mã kỹ thuật. Chỉ tải file cho đúng loại danh mục đã chọn. CSV dùng UTF-8 với BOM; nếu mở bằng Excel và lưu lại hãy chọn **CSV UTF-8**, tránh làm mất dấu tiếng Việt. Có thể sử dụng dấu phẩy hoặc chấm phẩy làm dấu phân tách nếu tệp được lưu đúng định dạng CSV. Mỗi lượt tối đa 2.000 dòng kiểm tra; khi nhập, backend thực hiện tối đa 100 bản ghi/lần.

**Ví dụ một dòng (cơ sở đào tạo):** `Trường Cao đẳng ABC,ABC,123 Nguyễn Văn A,Liên hệ phòng đào tạo`. Không nhập dòng ví dụ này nếu không phải dữ liệu thật. Các mẫu đính kèm chỉ gồm hàng tiêu đề để tránh vô tình nhập dữ liệu mẫu.

## 6. Khi gặp lỗi

- **Lưu không được:** kiểm tra cùng lúc phiên bản frontend và Apps Script deployment đang thực thi; làm mới website bằng `Ctrl+Shift+R`; kiểm tra quyền Admin và nhật ký thực thi Apps Script. Không công khai lỗi chứa token/secret.
- **Tài khoản không đăng nhập được:** kiểm tra trạng thái Hoạt động, email Google và `GOOGLE_CLIENT_ID`; tài khoản đã được gắn Google SUB có thể từ chối một Google Account khác cùng địa chỉ trong trường hợp thay đổi danh tính.
- **Trùng số quyết định:** không dùng lại số trong cùng năm, kể cả hồ sơ đã xóa mềm.
- **Danh mục không hiển thị:** chờ ít giây rồi tải lại; xác minh đã lưu thành công trên backend, không chỉnh trực tiếp ID trong Sheet.

## 7. Khôi phục (rollback)

1. Nếu **chỉ lỗi giao diện:** tái triển khai GitHub/Vercel commit v1.1.2-RC và tải lại trang; Apps Script mới có thể vẫn đang chạy nhưng phải xác minh tương thích.
2. Nếu **lỗi nghiệp vụ/backend:** đưa lại source Apps Script v1.1.2-RC từ bản sao và tạo **new version deployment**; phục hồi frontend v1.1.2-RC tương ứng để không dùng lẫn cơ chế phân quyền mới/cũ.
3. Nếu có dữ liệu bị ghi sai, tạm dừng thao tác ghi; đối chiếu bản sao Sheets và Nhật ký, khôi phục **có chọn lọc** sau khi đánh giá tác động. Không ghi đè toàn bộ Sheets khi có người khác đã nhập dữ liệu mới.
4. Kiểm tra lại ít nhất Đăng nhập, Thêm hồ sơ, Lưu danh mục, Lưu tài khoản và phân quyền trước khi mở cho mọi người sử dụng.

**Lưu ý:** Bản này chưa tự triển khai vào GitHub/Vercel/Apps Script của bạn và chưa kiểm thử trên dịch vụ thật.

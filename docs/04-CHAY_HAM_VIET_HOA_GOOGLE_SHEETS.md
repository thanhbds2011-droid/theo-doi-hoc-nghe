# HƯỚNG DẪN VIỆT HÓA GOOGLE SHEETS — v1.0.1-RC

**Chỉ dành cho phần mềm Theo dõi học nghề độc lập. Không sửa app Work/KPI.**

## Kết quả sẽ nhận được

| Tab cũ | Tab sau chuyển đổi |
|---|---|
| `HO_SO_HOC_NGHE` | **Hồ sơ học nghề** |
| `DANH_MUC_TRUONG` | **Danh mục cơ sở đào tạo** |
| `DANH_MUC_NGHE` | **Danh mục nghề** |
| `DANH_MUC_LY_DO` | **Danh mục lý do bỏ học** |
| `TAI_KHOAN` | **Tài khoản người dùng** |
| `NHAT_KY` | **Nhật ký thay đổi** |
| `CAU_HINH` | **Cấu hình hệ thống** |

79 tiêu đề cột trong 7 tab cũng là tiếng Việt, theo `02-TEN-COT-7-TAB.tsv.txt`.

## Thực hiện từng bước

1. Mở **Google Apps Script** → dự án `THEO_DOI_HOC_NGHE_API`.
2. **Sao lưu thủ công** mã Apps Script đang dùng (có thể sao chép code cũ sang tệp riêng để rollback).
3. Mở `Code.gs` → chọn tất cả → dán toàn bộ tệp `apps-script/Code.gs` **v1.0.1-RC** → **Ctrl+S**.
4. Vào **Project Settings → Script Properties**. Kiểm tra `SPREADSHEET_ID` đang trỏ tới bảng `CSDL_THEO_DOI_HOC_NGHE`; giữ nguyên `DRIVE_FOLDER_ID`, `GOOGLE_CLIENT_ID`, `API_SHARED_SECRET` và `APP_ORIGIN` nếu đã có. **Không gửi các ID/khóa bí mật cho người lạ.**
5. Trong menu chọn hàm ở thanh công cụ, chọn **`chuyenSangTiengViet`**, không chọn `doPost`. Bấm **Run/Chạy**.
6. Google có thể yêu cầu **Review permissions / Xem lại quyền** để truy cập bảng tính và sao lưu Drive; đăng nhập đúng tài khoản sở hữu bảng tính rồi cấp quyền cần thiết.
7. Mở **Execution log / Nhật ký thực thi**. Phải thấy dòng `Đã Việt hóa ... tab` và **Bản sao lưu** chứa liên kết Google Drive. Nếu dữ liệu đã là tiếng Việt, hàm thông báo không cần chuyển đổi.
8. Mở Google Sheets **CSDL_THEO_DOI_HOC_NGHE** và kiểm tra 7 tab cùng 79 tiêu đề. Mỗi hàng dữ liệu từ dòng 2 phải giữ nguyên. Không xóa các tab tiếng Anh nếu có báo xung đột.
9. **Nếu bạn đã triển khai Apps Script Web App**, mở **Deploy → Manage deployments → chọn deployment hiện hành → Edit → Version: New version → Deploy**. Không tạo URL `/exec` mới nếu không cần, và không xóa deployment hiện hành.
10. Nếu đã đồng bộ GitHub, thay file `apps-script/Code.gs` trong repository bằng bản này để code nguồn trên GitHub không bị lệch bản đang chạy. Frontend/Vercel không cần cập nhật giao diện chỉ vì thay tên tab.

## Khi phát sinh lỗi

- `SCHEMA_MISMATCH`: hàng 1 của ít nhất một tab không giống cấu trúc cũ hoặc mới. **Không xóa tab hay chép đè tiêu đề khi có dữ liệu.** Đối chiếu 79 cột với tệp hướng dẫn và báo tên tab bị lỗi.
- `SHEET_CONFLICT`: tồn tại cả tab tên tiếng Anh và tiếng Việt cho cùng một bảng. **Không xóa tab nào** trước khi kiểm tra dữ liệu.
- Lỗi quyền sao lưu `DriveApp`: đăng nhập tài khoản có quyền sở hữu/chỉnh sửa bảng tính. Hàm thiết kế để **dừng trước khi thay đổi** nếu không sao lưu được.
- Lỗi sau khi đã tạo bản sao lưu và đã chuyển được vài tab: **không tự xóa**, có thể chạy lại để xử lý tiếp vì hàm nhận diện được cả hai loại tên và tiêu đề; nếu vẫn lỗi, đối chiếu bản sao đã lưu.
- Tab `Trang tính1` còn dư: hàm **không tự xóa**. Chỉ xóa thủ công sau khi kiểm tra chắc chắn tab đó trống và không chứa dữ liệu cần giữ.

## Chú ý khi bàn giao

- Tab và tiêu đề cột là tiếng Việt; những giá trị `ADMIN`, `ACTIVE`, `DA_THAM_GIA`, `APP_NAME` là **mã kỹ thuật**, không tự dịch giá trị trong ô vì sẽ gây lỗi phân quyền/nghiệp vụ.
- Các khóa `HO_SO_ID`, `SO_QUYET_DINH`... vẫn là tên thuộc tính trong Apps Script/JSON; không dùng làm tiêu đề hiển thị nữa.
- Bản sao lưu được tạo trong Google Drive theo mẫu `SAO_LUU_TRUOC_VIET_HOA_HOC_NGHE_yyyyMMdd_HHmmss` trước khi đổi tên/tiêu đề; sao lưu không thay thế cho quy trình phục hồi đã kiểm thử.
- Đây là bản kiểm thử offline; thao tác trên Google Sheets thật cần được bạn chạy và kiểm tra trực tiếp.

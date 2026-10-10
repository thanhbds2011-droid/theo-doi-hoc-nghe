# HƯỚNG DẪN TRIỂN KHAI — v1.0.1-RC

**Dự án Học nghề hoàn toàn độc lập — không triển khai đè lên bất cứ ứng dụng Work/KPI nào.**

## A. Tên và địa chỉ đã thống nhất

| Hạng mục | Tên |
|---|---|
| Google Drive folder | `PHAN_MEM_THEO_DOI_HOC_NGHE` |
| Google Sheets | `CSDL_THEO_DOI_HOC_NGHE` |
| Google Apps Script | `THEO_DOI_HOC_NGHE_API` |
| GitHub | `theo-doi-hoc-nghe` |
| Vercel | `theo-doi-hoc-nghe` (nếu được cấp) |
| Google Cloud Project | `THEO-DOI-HOC-NGHE-AUTH` (ID thực tế đọc từ Cloud Console) |
| Google OAuth Web Client | `THEO_DOI_HOC_NGHE_WEB` |

## B. Google Sheets: 7 tab, 79 cột TIẾNG VIỆT

**Quan trọng cho cơ sở dữ liệu đã tạo tiếng Anh:** Không tự xóa tab cũ hay sửa tiêu đề thủ công. Bộ mã mới có hàm `chuyenSangTiengViet()` để đổi tên tab và tiêu đề trên cùng các ô cũ, giữ nguyên dữ liệu và thứ tự 79 cột.

- Thay toàn bộ Apps Script `Code.gs` v1.0.1-RC vào dự án **THEO_DOI_HOC_NGHE_API**.
- Chọn và chạy **`chuyenSangTiengViet`** trên thanh Functions → Run.
- Cấp quyền truy cập Google Sheets và Google Drive nếu Google yêu cầu; hàm sẽ tạo bản sao lưu có tiền tố `SAO_LUU_TRUOC_VIET_HOA_HOC_NGHE_` trong Google Drive trước khi thay đổi.
- Kiểm tra 7 tab đã đổi tên; 79 tiêu đề cột hiển thị tiếng Việt. Tab `Trang tính1` thừa nếu có không bị xóa.
- Nếu báo `SCHEMA_MISMATCH` hoặc `SHEET_CONFLICT`, dừng lại và kiểm tra tab được chỉ rõ; không xóa dữ liệu để sửa lỗi.
- Chạy lại hàm nhiều lần an toàn; khi không có tên/tiêu đề cần chuyển, không tạo bản sao lưu thừa.
- Nếu ứng dụng đã hoạt động, sao lưu trước, thực hiện lúc ít người dùng, rồi **cập nhật deployment Apps Script sang New version**. Phiên bản cũ không tương thích với tab đã đổi tên.
- Tài liệu đầy đủ về 79 tiêu đề ở `docs/02-TEN-COT-7-TAB.tsv.txt`.

Các trạng thái nội bộ như `ACTIVE`, `ADMIN`, `DA_THAM_GIA`, `APP_NAME` và các mã định danh **tiếp tục là mã kỹ thuật**, không được tự dịch nội dung ô dữ liệu vì các hàm backend cần chúng.

## C. Apps Script: chép một file code hoàn chỉnh

1. Truy cập `https://script.google.com` và mở dự án **THEO_DOI_HOC_NGHE_API** đã tạo.
2. Mở `Code.gs` trong trình biên tập. **Thay toàn bộ nội dung bằng file `apps-script/Code.gs` của gói này**, rồi Save. Không sao chép Code.gs từ ứng dụng khác.
3. Vào Project Settings → Script Properties, khai báo:

| Khóa Script Property | Giá trị |
|---|---|
| `SPREADSHEET_ID` | ID **thực tế** lấy giữa `/d/` và `/edit` trong URL Sheets |
| `DRIVE_FOLDER_ID` | ID **thực tế** của folder Drive dành riêng cho Học nghề |
| `GOOGLE_CLIENT_ID` | Client ID **thực tế** có đuôi `.apps.googleusercontent.com` do Cloud Console cấp |
| `API_SHARED_SECRET` | Chuỗi ngẫu nhiên bí mật tối thiểu 32 ký tự; nên 32 byte (64 ký tự hex); phải **giống chính xác** giá trị `API_SHARED_SECRET` trên Vercel |
| `APP_ORIGIN` | **Để trống trong giai đoạn tạo website**; sau triển khai, điền origin Vercel chính thức, ví dụ `https://your-real-project.vercel.app` (không có `/` cuối) |

`API_SHARED_SECRET` phải do chính bạn tạo ngẫu nhiên, không sử dụng chuỗi ví dụ trong tài liệu. Nếu có Node trên máy tính, chạy `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` để tạo một khóa mới. Không cần Cloud Shell. Có thể dùng trình quản lý mật khẩu có chức năng tạo chuỗi bí mật ngẫu nhiên.

4. Trong danh sách Functions của Apps Script, chọn **`chuyenSangTiengViet`** → Run → cấp quyền Google cho tài khoản sở hữu Sheet/Drive.
5. Khi `chuyenSangTiengViet` chạy thành công, 7 tab sẽ được đổi tên tiếng Việt và hoàn thiện header, giữ nguyên dữ liệu hiện có. Nếu báo `SCHEMA_MISMATCH`, dừng và gửi thông báo lỗi để kiểm tra tiêu đề, **không xóa dữ liệu hay sửa tùy ý**.
6. Mở tab `Tài khoản người dùng` và khai báo thủ công **dòng 2** của Admin đầu tiên (giữ nguyên giá trị mã `ADMIN`, `ACTIVE`, `*`):

| Cột | Header | Giá trị |
|---|---|---|
| A2 | Mã tài khoản | `TK_ADMIN_001` |
| B2 | Email Google | Email Google thực tế của bạn đang dùng để đăng nhập |
| C2 | Định danh Google | **Để trống** (backend sẽ liên kết sau lần đầu đăng nhập thành công) |
| D2 | Họ và tên | Họ và tên quản trị viên |
| E2 | Vai trò | `ADMIN` |
| F2 | Quyền được cấp | `*` |
| G2 | Trạng thái tài khoản | `ACTIVE` |
| H2–L2 | Các cột khác | Để trống |

7. Trong Apps Script, nhấn Deploy → **New deployment** → chọn **Web app**. Execute as: **Me** (chủ dự án có quyền ghi Sheet). Who has access: **Anyone**, vì ứng dụng Vercel proxy gọi Web App không mang phiên Google Apps Script của trình duyệt; URL `/exec` được bảo vệ bằng HMAC trên mỗi request. Nếu chính sách của tổ chức không cho triển khai chế độ Anyone, kiến trúc này không thể vận hành nguyên trạng và cần điều chỉnh xác thực ở tầng dịch vụ.
8. Chọn Deploy → Authorize → sao chép **URL `/exec`** thực tế, lưu để khai báo Vercel `GAS_WEB_APP_URL`. Không sao chép URL `/dev`. Khi cập nhật code Apps Script, cần **Deploy → Manage deployments → Edit → New version → Deploy** để production dùng code mới.

**Cảnh báo:** Web App triển khai "Anyone" không có nghĩa các API mở công khai; toàn bộ `doPost` kiểm tra khóa ký HMAC trước khi xử lý. Không xóa hoặc thay đổi lớp xác minh này.

## D. GitHub và Vercel

1. Tạo GitHub repository mới `theo-doi-hoc-nghe`, ưu tiên Private khi phát triển.
2. Giải nén và đưa **toàn bộ nội dung thư mục gốc** của gói ZIP này (bao gồm `api/`, `public/`, `package.json`, `vercel.json`) lên repo. Không chỉ tải `public/` hoặc mỗi `index.html`.
3. Tuyệt đối không commit các giá trị `API_SHARED_SECRET`, Script Properties, Client Secret hoặc tệp `.env` thực; `.env.example` chỉ là mẫu.
4. Vào Vercel → Add New Project → Import repository `theo-doi-hoc-nghe`. Framework Preset: Other; **Root Directory = repository root**, không chọn `public` làm root, vì cần nhận các hàm `api/`. File `vercel.json` khai báo `outputDirectory` = `public`.
5. Vercel → Project Settings → Environment Variables, tạo đủ **ba khóa**:

   - `GOOGLE_CLIENT_ID` = Client ID của Google Cloud đã tạo.
   - `GAS_WEB_APP_URL` = URL Web App `/exec` của Apps Script vừa deploy.
   - `API_SHARED_SECRET` = cùng khóa bí mật ở Script Properties.

6. Deploy hoặc Redeploy để nạp biến môi trường (trong lúc đầu đừng đưa dữ liệu thật lên Sheet).
7. Vercel cấp domain thực tế, ví dụ `https://theo-doi-hoc-nghe.vercel.app` **nếu domain còn khả dụng**; không tự giả định tên này đã được cấp.
8. Mở Google Cloud Console → Google Auth Platform → Clients → `THEO_DOI_HOC_NGHE_WEB` → Authorized JavaScript origins → thêm **origin chính xác** của website Vercel: giao thức `https://`, tên miền thật, **không có dấu `/` ở cuối**. Với đăng nhập bằng GIS callback qua JavaScript, không cần đăng ký redirect URI nếu không dùng redirect flow.
9. Mở Apps Script → Project Settings → Script Properties → bổ sung `APP_ORIGIN` chính xác giống origin Vercel chính thức. Khi bật khóa này, các Vercel Preview deployments từ URL khác sẽ bị từ chối; triển khai production theo domain đã khóa.
10. Kiểm tra website: trang đăng nhập Google → tài khoản admin được cấp quyền → Dashboard. Nếu báo không đủ quyền, đối chiếu `Tài khoản người dùng` dòng 2; nếu lỗi 503, đối chiếu biến môi trường Vercel; nếu báo thiếu schema, chạy `setupDatabase`.

## E. Kiểm thử trước khi sử dụng thật

- Đăng nhập Email Admin chính xác; tài khoản ngoài tab `Tài khoản người dùng` không thể xem hồ sơ.
- Admin tạo một trường, một nghề, một lý do bỏ học; lập hồ sơ quyết định `02` năm 2026.
- Thử thêm số `2`/`002` cho người khác cũng năm 2026 → phải chặn.
- Thêm số `02` năm 2027 → phải được chấp nhận.
- Tạo quyết định mới cho **cùng `NGUOI_HOC_ID`** bằng tìm người học hiện có.
- Đổi trạng thái từ chưa xác nhận sang đã tham gia, rồi bỏ học cùng ngày và lý do; kiểm tra 6 ô thống kê.
- Dùng hai phiên đăng nhập để thử sửa cùng hồ sơ; phiên sau phải bị chặn bởi kiểm tra `PHIEN_BAN`.
- Thử quyền nhân viên chỉ `RECORD_VIEW`, không được thêm/sửa/danh mục/quản trị tài khoản.
- Kiểm tra tệp đính kèm chỉ tải được nếu có quyền và không tự mở quyền Drive công khai.
- Kiểm tra CSV, nhật ký, điều hướng Desktop/Mobile, cập nhật code GitHub → Vercel.
- Kiểm tra trước/sau triển khai số lượt đọc/ghi thực tế Apps Script, thời gian tải, quota; không giả định giảm quota theo tỷ lệ cố định.

## F. Lưu ý về quota và dữ liệu

- Danh mục cache 5 phút, bảng hồ sơ cache theo bộ lọc 45 giây, dashboard 90 giây; sau ghi tăng `REV_DATA`, cache tự bị vô hiệu theo revision. Danh sách phân trang nhưng khi hết cache server vẫn phải đọc các dòng dữ liệu Sheets theo lô; không có index giống Firestore.
- Tối đa 100 bản ghi mỗi trang từ API; mặc định frontend 20; xuất tối đa 5.000 hồ sơ/lần để hạn chế tải dữ liệu lớn.
- Ứng dụng không xóa hồ sơ đã lập. Việc hủy/lưu trữ quyết định hoặc tự động cấp số theo năm chưa được đặc tả thành tính năng; phải thống nhất riêng nếu phát sinh.
- Tệp tải lên tối đa 1,2 MB do giới hạn truyền qua Apps Script/Vercel; với tệp lớn hơn cần thiết kế API tải tệp riêng trước khi dùng.
- Định kỳ sao lưu file Google Sheets/Drive, thiết lập nguyên tắc quản lý chủ sở hữu, không thao tác trực tiếp để xóa dòng hồ sơ đã phát sinh.
- Mã nguồn đã kiểm thử offline, **chưa được xác minh end-to-end với Google Sheets/Google Sign-In/Vercel/Google Drive thật**.

## G. Rollback khi triển khai gặp lỗi

1. Sao lưu một bản ZIP/release gốc và commit hash triển khai đang hoạt động.
2. GitHub: dùng `Revert` commit/khôi phục bản release trước; Vercel: Redeploy deployment trước đó nếu cần.
3. Apps Script: Manage deployments → Edit → chọn version trước đó và Deploy (giữ nguyên URL nếu sửa đúng deployment).
4. **Không rollback dữ liệu Google Sheets bằng cách xóa/reset** khi có người sử dụng mới; sao lưu bản hiện tại và đối chiếu thay đổi trước khi phục hồi.
5. Nếu nghi ngờ lộ bí mật, tạo API_SHARED_SECRET mới và cập nhật **đồng thời** tại Script Properties và Vercel Environment Variables rồi redeploy.

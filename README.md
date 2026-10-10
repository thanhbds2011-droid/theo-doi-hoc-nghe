# THEO DÕI HỌC NGHỀ — v1.0.1-RC

Ứng dụng **độc lập** quản lý hồ sơ học nghề, được xây dựng **mới** trên Google Sheets, Google Apps Script, GitHub và Vercel. Không dùng Firebase/Firestore, không chia sẻ mã nguồn, database hoặc phân quyền với ứng dụng Theo dõi công việc & Báo cáo hay Nhắc việc KPI.

## Công nghệ

- `public/`: HTML/CSS/JavaScript frontend responsive, Google Identity Services.
- `api/config.js`: API cung cấp Google OAuth Client ID công khai và phiên bản cho frontend.
- `api/rpc.js`: Vercel Function xác minh Google ID token với `google-auth-library`, ký HMAC-SHA256 lên request gửi Apps Script.
- `apps-script/Code.gs`: Apps Script Trusted Gateway độc lập, xác minh HMAC/audience/origin, kiểm tra bảng `TAI_KHOAN`, phân quyền và đọc/ghi Google Sheets.
- `tests/`: bộ kiểm thử offline backend và Vercel proxy.

**Không đưa `API_SHARED_SECRET` hoặc `GAS_WEB_APP_URL` vào `public/` hay commit lên GitHub.**

## Nghiệp vụ đã thực hiện

1. Một người học có thể có nhiều hồ sơ; mỗi hồ sơ là một quyết định riêng.
2. Một quyết định cho đúng một người. Trong cùng một năm, `2`, `02`, `002` là cùng số và không được trùng; khác năm được phép trùng số.
3. Năm theo `NGAY_QUYET_DINH`, không theo thời điểm nhập.
4. **Giả định khi CHỐT:** phần mềm nhập số quyết định **đã được ban hành**, không tự sinh/cấp số hành chính.
5. Sáu chỉ số: Tổng, Đã tham gia, Đang học, Bỏ học, Không tham gia, Chưa xác nhận. Đã tham gia = Đang học + Bỏ học.
6. Danh mục trường, nghề, lý do; phân quyền tài khoản; nhật ký thay đổi; phân trang và lọc; CSV; tải tệp PDF/JPG/PNG tối đa 1,2MB vào Drive riêng.
7. Chống ghi đè phiên bản, request idempotency ngắn hạn, LockService; cache dữ liệu/danh mục có invalidation theo phiên bản.

## Bản v1.0.1-RC – Việt hóa Google Sheets

- 7 **tên tab tiếng Việt** và **79 tiêu đề cột tiếng Việt**; mã trường xử lý bên trong giữ nguyên để website không bị thay đổi.
- Hàm `chuyenSangTiengViet()` chuyển đổi trên cùng các tab, **giữ nguyên dòng dữ liệu, thứ tự cột, mã số quyết định và hồ sơ**.
- Sao lưu toàn bộ bảng Google Sheets vào Drive trước khi sửa; từ chối chuyển nếu phát hiện cấu trúc tiêu đề không khớp hoặc tồn tại đồng thời tên tab mới và cũ.
- Chạy lại hàm an toàn; không tạo lại bản sao nếu đã Việt hóa xong.
- **Sau khi chạy hàm, phải cập nhật Apps Script Web App deployment sang New version** trước khi sử dụng website đã phát hành; bản backend cũ không biết tên tab tiếng Việt.
- Các giá trị máy như `ADMIN`, `ACTIVE`, `DA_THAM_GIA`, `APP_NAME` giữ nguyên vì là mã backend. Các cột và tab hiển thị cho người dùng bằng tiếng Việt.

## Cài đặt

Đọc **[docs/01-HUONG-DAN-TRIEN-KHAI.md](docs/01-HUONG-DAN-TRIEN-KHAI.md)** theo thứ tự. Có thể thao tác hoàn toàn bằng trình duyệt, không cần Google Cloud Shell.

## Kiểm thử

```sh
npm test
npm run check
```

`npm test` sử dụng thư viện dựng sẵn của Node (không cần Internet). Việc triển khai Vercel sẽ cài dependency `google-auth-library` từ `package.json`.

## Bảo vệ dữ liệu

- `TAI_KHOAN`, dữ liệu hồ sơ, file Drive phải do chủ Apps Script giữ quyền riêng tư.
- Không cấp quyền Editor Google Sheets rộng rãi cho nhân viên chỉ sử dụng website.
- Apps Script Web App chạy dưới quyền chủ triển khai; người khác có thể gọi URL nhưng yêu cầu không ký hợp lệ sẽ bị từ chối.
- Chức năng không được kiểm thử end-to-end trên hệ thống thật trước khi bàn giao RC.

## Giới hạn thực tế

Google Sheets + Apps Script phù hợp quy mô vừa/nhỏ; truy vấn dùng đọc theo lô và cache nhưng vẫn có giới hạn dung lượng, thời gian Apps Script và quota. Trong phiên bản này, mỗi truy vấn danh sách vẫn phải đọc một khối dữ liệu Sheet khi cache hết hạn; không phải database có chỉ mục như Firestore. Với vài chục nghìn hồ sơ hoặc nhiều yêu cầu đồng thời, cần đánh giá lại lưu trữ thay vì bảo đảm "miễn phí không giới hạn".

Hồ sơ đã nhập cần bảo vệ bằng sao lưu định kỳ; không có thao tác xóa hồ sơ từ website. Sửa trực tiếp Sheet, xóa dòng hay thay đổi `SO_QUYET_DINH_KEY` bằng tài khoản Editor có thể phá vỡ các ràng buộc ứng dụng.

**Trạng thái bàn giao: Release Candidate — cần kiểm thử đăng nhập thực tế, deployment, tải tệp và phân quyền trên tài khoản/dữ liệu thử trước vận hành chính thức.**

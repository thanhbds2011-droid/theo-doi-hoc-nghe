# HƯỚNG DẪN TRIỂN KHAI VÀ HOÀN TÁC – YC-HN-034 V3

**Phiên bản:** v1.2.28-RC. **Chỉ triển khai sau khi đã sao lưu và thử staging.**

## 1. Kiểm tra bản nền

Bộ tệp cập nhật rút gọn chỉ dùng khi website/GitHub và Apps Script đang dùng đúng **v1.2.27-RC**. Nếu môi trường chạy phiên bản khác hoặc có chỉnh sửa riêng, cần đối chiếu/diff, không dán đè máy móc.

## 2. Sao lưu

1. Sao lưu repository GitHub tại commit hiện hành hoặc tải ZIP/đánh dấu commit.
2. Sao lưu **toàn bộ `Code.gs` đang triển khai** vào tệp riêng và ghi lại mã Deployment ID/phiên bản đang chạy.
3. Sao lưu **Google Spreadsheet** (File → Tạo bản sao) trước khi triển khai vì chức năng quản trị mới sẽ ghi metadata trong tab Cấu hình hệ thống.
4. Không phát tán URL/tokens/khóa API hoặc dữ liệu cá nhân trong tài liệu bàn giao.

## 3. Triển khai trên staging (theo thứ tự)

1. Mở Apps Script staging, thay toàn bộ `Code.gs` bằng bản mới trong gói `GOOGLE_APPS_SCRIPT/Code.gs`, lưu và tạo **phiên bản triển khai mới**. Không chạy hàm thay đổi cấu trúc bảng.
2. Cập nhật GitHub staging ba tệp: `public/app.js`, `public/index.html`, `package.json`; xác nhận Vercel đã deploy phiên bản mới.
3. Tải lại bằng Ctrl+F5 và kiểm tra góc dưới `v1.2.28-RC`.
4. Vào **Danh mục → Tình trạng học nghề** bằng ADMIN. Các tình trạng cũ (VD: Tai nạn) sẽ có nhãn **Cần rà soát**. Không bị xóa khỏi hồ sơ.
5. Chọn **Rà soát** → đối chiếu hồ sơ → lựa chọn **Được phép chọn** hoặc **Ngừng sử dụng** → Lưu tình trạng. Trạng thái được đồng bộ đến tài khoản khác theo chu kỳ hệ thống hiện có.
6. Kiểm tra ba vai trò: ADMIN được quản lý, NHAN_VIEN và CO_SO_DAO_TAO không thấy menu quản lý; chỉ có các tình trạng đã duyệt trong biểu mẫu.
7. Kiểm tra thao tác sửa thông tin gốc của một hồ sơ có tình trạng cũ chưa duyệt: giữ nguyên tình trạng, không xóa dữ liệu lịch sử.
8. Kiểm tra hồ sơ mới, cập nhật tình trạng, nhập Excel, các bộ lọc, báo cáo, in và 4 mẫu Excel.
9. Đối soát tổng số QĐ, Đã tham gia, Bỏ học, Hoàn thành và số hồ sơ từng tình trạng với dữ liệu trước/sau.
10. Không kết luận đủ tải 10–20 người nếu chưa có thử tải staging với Apps Script và Sheets thực tế.

## 4. Dán đè chính xác những tệp nào?

| Nơi | Tệp | Bắt buộc |
|---|---|---|
| GitHub | `public/app.js` | Có |
| GitHub | `public/index.html` | Có |
| GitHub | `package.json` | Đồng bộ phiên bản |
| Google Apps Script | `Code.gs` | Có |

**Không cần thay** `api/rpc.js`, `api/config.js`, `styles.css`, `xlsx-export.js`, tệp template Excel hoặc bất kỳ dữ liệu Sheet nào.

## 5. Hoàn tác

1. Nếu chưa triển khai production: giữ nguyên production, chỉ quay lại commit staging và phiên bản Apps Script staging cũ.
2. Nếu đã triển khai: tạm ngừng người dùng cập nhật, quay GitHub về commit cũ và chọn phiên bản triển khai Apps Script cũ. Kiểm tra lại xác thực/quyền và báo cáo.
3. **Không tự xóa dòng `HN_STATUS_CUS_...` hoặc `HN_STATUS_RULE_...`** để hoàn tác, vì có thể liên quan hồ sơ vừa cập nhật. Metadata thêm vào có thể được giữ nguyên trong Cấu hình hệ thống.
4. Chỉ khôi phục toàn bộ bản sao Google Sheets sau khi đã đánh giá và đối soát mọi giao dịch phát sinh từ thời điểm sao lưu; không ghi đè các cập nhật hợp lệ của người dùng.
5. Lưu log triển khai, thời điểm, người phụ trách và kết quả đối soát.

## 6. Lưu ý đặc biệt

- **Tình trạng cũ chưa duyệt không còn hiện trong danh sách chọn mới**, nhưng vẫn hiện đúng trong hồ sơ đã lưu và thống kê lịch sử.
- ADMIN ngừng sử dụng một tình trạng không có nghĩa là xóa hoặc sửa tất cả hồ sơ đang mang tình trạng đó.
- Bản mã nguồn chưa được kiểm thử tích hợp trên Google Apps Script + Google Sheets thật trong lượt bàn giao này.

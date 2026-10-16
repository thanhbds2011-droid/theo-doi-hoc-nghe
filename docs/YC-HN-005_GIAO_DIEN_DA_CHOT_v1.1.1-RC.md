# BÀN GIAO YC-HN-005 — GIAO DIỆN ĐƯỢC PHÊ DUYỆT (v1.1.1-RC)

**Ngày:** 16/10/2026  
**Trạng thái:** Đã hoàn thiện file nguồn để triển khai; **chưa cập nhật production**.  
**Baseline:** Bản `THEO_DOI_HOC_NGHE_FULL_SOURCE_v1.1.0-RC.zip` người dùng đã nhận ở vòng trước.

## 1. Phạm vi CHỐT

- **Tổng quan:** bỏ hẳn “Biểu đồ tổng hợp 6 chỉ tiêu”; giữ sáu chỉ tiêu ở bố cục 3 cột × 2 hàng trên desktop; banner thấp; bộ lọc thẳng hàng; hai bảng tổng hợp theo cơ sở và nghề cạnh nhau, các cột STT / tên / số hồ sơ.
- **Báo cáo:** bỏ lớp CSS chờ sau khi nhận dữ liệu (nguyên nhân thực tế gây căn giữa và khoảng trống); đưa bảng sát bộ lọc, tên chỉ tiêu căn trái và số lượng căn phải.
- **Danh mục:** gom tab và tìm kiếm vào thanh công cụ thống nhất, bổ sung class cho dòng dữ liệu để bộ lọc tên/mã danh mục hoạt động đúng.
- **Tài khoản và Nhật ký:** bỏ lớp CSS chờ sau khi tải; bảng sử dụng chiều rộng thật của vùng nội dung.
- **Các trang/cửa sổ:** thống nhất font hệ thống `Segoe UI` / `Tahoma` / `Arial`, khoảng cách, lề, độ cao ô nhập, nút, checkbox và modal; phần nội dung modal có thể cuộn, nút Hủy/Lưu vẫn hiển thị ở đáy modal.
- **Người dùng cuối:** không hiển thị tên Google Sheets trên giao diện.
- **Không thay đổi** cơ chế Google Sign-In, Vercel API, Apps Script, Google Sheets, quy tắc thống kê, quyền xóa hồ sơ Phương án A hoặc luồng tệp 10 MB đã có ở bản v1.1.0-RC.

## 2. File thay đổi

| File | Thay đổi |
|---|---|
| `public/app.js` | Render Tổng quan, bảng thống kê; bỏ lớp chờ ở Báo cáo/Tài khoản/Nhật ký; đồng nhất thanh tìm kiếm Danh mục; sửa việc tìm kiếm không nhận diện được các dòng bảng |
| `public/styles.css` | Bộ CSS thống nhất cho 6 phân hệ và các modal; responsive, căn chỉnh, font |
| `public/index.html` | Nhãn phiên bản giao diện v1.1.1-RC |
| `package.json` | Nhãn phiên bản gói v1.1.1-rc.0 |
| `README.md` | Ghi rõ phạm vi nâng cấp giao diện |
| `tests/ui-yc005.test.js` | Sáu kiểm thử cấu trúc UI mới |

**Giữ nguyên hoàn toàn:** `apps-script/Code.gs`, `api/rpc.js`, `api/config.js`, `apps-script/appsscript.json` và cấu trúc cơ sở dữ liệu. Phiên bản API/backend vẫn là v1.1.0-RC; không cần tái triển khai Apps Script vì chỉ thay frontend.

## 3. Kiểm thử đã thực hiện

- `npm run check`: đạt (kiểm tra cú pháp `api/rpc.js`, `api/config.js`, `public/app.js`).
- `npm test`: **38/38 đạt**, bao gồm 32 test có sẵn và 6 test giao diện mới.
- Trình duyệt Chromium với nguồn HTML/CSS/JS thực tế nhưng **đăng nhập và phản hồi API mô phỏng**:
  - 1440 × 900, 1366 × 768, 1920 × 1080 và 390 × 844.
  - Sáu KPI, desktop xếp đúng 3 × 2; không còn biểu đồ tổng hợp.
  - Chuyển đủ sáu phân hệ; không có lỗi JavaScript trong các tình huống đã chạy.
  - Tìm kiếm Danh mục, mở cửa sổ Thêm hồ sơ và Nhập hàng loạt; nút tạo hồ sơ vẫn hiển thị khi nội dung cuộn.
  - Không thấy chữ Google Sheets trong giao diện đăng nhập và các trang được kiểm tra sau đăng nhập.
- Ảnh chụp trong `docs/anh-kiem-thu/` được tạo từ trình duyệt trên **dữ liệu mô phỏng**, không phải dữ liệu production.

**Chưa kiểm thử trong lần nâng cấp YC-HN-005:** Google Sign-In thật; Apps Script/Google Sheets và Drive production; quyền người dùng trên môi trường production; tải lên/tải xuống tệp 10 MB thực tế. Các phần này giữ nguyên source v1.1.0-RC và vẫn cần xác nhận trong đợt nghiệm thu production.

## 4. Hướng dẫn cập nhật an toàn

1. Sao lưu/ghi lại commit GitHub và deployment Vercel đang hoạt động. Nếu chưa triển khai v1.1.0-RC ở môi trường đang chạy, **không** chỉ đẩy ba tệp frontend lên code v1.0.x; cần đồng bộ từ cả gói nguồn mới để tránh API mismatch.
2. Giải nén file `THEO_DOI_HOC_NGHE_FULL_SOURCE_YC-HN-005_v1.1.1-RC.zip`.
3. Tải **toàn bộ cấu trúc thư mục** `theo-doi-hoc-nghe/` lên repository GitHub dự án, thay đúng các tệp trong source; không tải nguyên file ZIP như một file ứng dụng.
4. Kiểm tra trên preview deployment Vercel. Không đổi biến môi trường hiện có. Không công khai bí mật.
5. Kiểm tra lần lượt 6 phân hệ; 6 KPI, 2 bảng, không có biểu đồ thừa; modal thêm/sửa, danh mục và tài khoản; thử trên 1366×768, 1440×900.
6. Sau khi xác nhận preview đạt và kiểm thử nghiệp vụ với dữ liệu thử phù hợp, mới quyết định đưa bản mới lên production.

**Không phải chỉnh Code.gs, không phải chạy hàm chuyển đổi Google Sheets** cho riêng YC-HN-005. Tệp Code.gs được cung cấp riêng chỉ nhằm đối chiếu/khôi phục theo bộ source.

## 5. Rollback

- Vercel: redeploy deployment thành công trước đó hoặc revert commit giao diện YC-HN-005 trên GitHub.
- Không cần rollback schema vì không có thay đổi Google Sheets.
- Không chạy lệnh xóa dữ liệu, không thay deployment Apps Script chỉ vì rollback giao diện.

## 6. Giới hạn cần nêu rõ

Giao diện được hiện thực bám thiết kế YC-HN-005 trên các độ phân giải kiểm tra. Ảnh thiết kế trước đây là mockup đồ họa, nên các chi tiết hiển thị có thể khác nhau theo độ phân giải, trình duyệt, hệ điều hành và font có sẵn; không có cơ sở để cam kết pixel-for-pixel cho mọi thiết bị. Nếu production khác ảnh mô phỏng, cần kiểm tra DOM/CSS trên trình duyệt thực tế và phản hồi lỗi để điều chỉnh đúng vị trí.

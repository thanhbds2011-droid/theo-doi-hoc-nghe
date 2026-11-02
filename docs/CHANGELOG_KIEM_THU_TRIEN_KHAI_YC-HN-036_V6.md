# BÁO CÁO BÀN GIAO YC-HN-036/V6 – v1.2.31-RC

**Ngày:** 02/11/2026  
**Trạng thái:** Người dùng đã CHỐT V6; đã sửa và kiểm thử trên bản sao. Chưa triển khai production.

## 1. Phạm vi thay đổi

Trên menu **Hồ sơ học nghề**, bổ sung một cột **Thời gian đào tạo** ngay sau **Nghề**, gồm hai dòng:

- `Từ ngày: dd/mm/yyyy` lấy từ `NGAY_BAT_DAU`.
- `Đến ngày: dd/mm/yyyy` lấy từ `NGAY_KET_THUC_DU_KIEN` (kết thúc **dự kiến**).

Khi thiếu ngày hoặc chuỗi ngày sai định dạng/lịch, hiển thị **Chưa có thông tin**, không tự tính ngày.

Cột này xuất hiện cho ADMIN, NHAN_VIEN và CO_SO_DAO_TAO theo quyền xem hồ sơ đã cấp. Không sửa quyền.

## 2. Những sửa đổi có kiểm soát

| Tệp GitHub | Nội dung thay đổi |
|---|---|
| `public/app.js` | Dựng ô ngày hai dòng từ dữ liệu `records_list` có sẵn; bảng cố định 8 cột; bỏ ngày kết thúc bị lặp ở bộ lọc Hoàn thành; đổi cách chọn ô Tình trạng để thao tác cập nhật đúng cột |
| `public/styles.css` | Định dạng riêng cột thời gian; tự xuống dòng, giữ cuộn ngang trên màn hình nhỏ và không che nút Thao tác |
| `public/index.html` | Hiển thị phiên bản v1.2.31-RC và đổi URL app.js/styles.css để tránh dùng giao diện cũ từ cache trình duyệt |
| `package.json` | Nâng phiên bản frontend lên `1.2.31-rc.0` |

**Không thay đổi:** `apps-script/Code.gs`, `api/rpc.js`, `api/config.js`, `public/xlsx-export.js`, 7 tab Google Sheets, cấu trúc biểu mẫu Excel, bốn mẫu Xuất báo cáo. **Không chạy các hàm nâng cấp Google Sheets** khi triển khai V6.

### Chú ý quan trọng khi chuyển cột

Code cũ cập nhật trạng thái tại `td:nth-child(6)` sau khi lưu. Bổ sung cột sẽ khiến đây trở thành ô Thời gian đào tạo. V6 đã sửa sang chọn theo lớp `td.record-status-cell`, tránh ghi nhãn Tình trạng nhầm vào ô Thời gian đào tạo.

## 3. Kết quả kiểm thử thực chạy

- `npm run check`: cú pháp JavaScript đạt.
- `npm test`: **237/237** bài Node.js đạt; gồm 234 bài có sẵn và 3 bài bổ sung cho V6.
- Chromium mock V6: đạt đủ 3 vai trò, hiển thị 8 cột, ngày hợp lệ/thiếu/sai, không lộ trường khác ở vai trò CO_SO_DAO_TAO, cập nhật tình trạng không làm hỏng ô ngày, lọc Hoàn thành không lặp ngày, không phát sinh thêm `records_list` ở thao tác cập nhật tình trạng theo kịch bản mock, màn hình hẹp có cuộn ngang.
- Chromium hồi quy: `browser_yc036_preload_status.py`, `browser_yc027_rbac_mock.py`, `browser_yc035_catalog_tabs.py`, `browser_yc032_dependent_trades.py`, `browser_yc029_v5_two_clients.py` đều đạt trên backend giả lập.

**Giới hạn:** Đây là kiểm thử local/mock, không truy cập production, không đo tải 10–20 người đồng thời và không xác nhận thời gian phản hồi/quota trên Apps Script thật.

## 4. Hướng dẫn triển khai dành cho người dùng cuối

1. **Sao lưu** mã nguồn GitHub v1.2.30-RC hiện đang hoạt động, hoặc ghi nhận commit trước khi cập nhật để có thể hoàn tác.
2. Giải nén file `THEO_DOI_HOC_NGHE_YC-HN-036_V6_CHI_FILE_CAP_NHAT.zip`.
3. Trong kho mã nguồn GitHub đang triển khai Vercel, **thay đúng bốn tệp theo đường dẫn bên dưới**, giữ nguyên cấu trúc thư mục:
   - `public/app.js`
   - `public/styles.css`
   - `public/index.html`
   - `package.json`
4. Commit và để Vercel tạo deployment mới; **không** cập nhật Apps Script hoặc Google Sheets vì V6 chỉ thay giao diện.
5. Kiểm tra dòng phiên bản dưới menu là `v1.2.31-RC`. Nếu còn phiên bản cũ, tải lại trang bằng `Ctrl + F5` và xác minh deployment Vercel mới đã được phục vụ.
6. Đăng nhập bằng tài khoản ADMIN, NHAN_VIEN và CO_SO_DAO_TAO; mở Hồ sơ học nghề, kiểm tra cột mới ở sau Nghề, trạng thái và các nút Thao tác không bị lệch.
7. Kiểm tra thực tế với 1 hồ sơ có đủ ngày, 1 hồ sơ thiếu ngày, lọc Hoàn thành khóa học và cập nhật tình trạng có quyền.

## 5. Hoàn tác

Nếu có vấn đề, khôi phục đúng bốn tệp từ commit v1.2.30-RC (hoặc redeploy bản Vercel trước đó). Không cần khôi phục Google Sheets hay Apps Script vì V6 không thay đổi dữ liệu và backend.

## 6. Điều chưa thể kết luận

Chỉ sau khi chạy trên hệ thống đang dùng mới xác nhận được độ rộng bảng trên các thiết bị thực tế, khả năng dùng cache ở nhiều trình duyệt và thời gian tải production. V6 không tạo thêm API hoặc lượt đọc chỉ để hiển thị hai trường ngày.

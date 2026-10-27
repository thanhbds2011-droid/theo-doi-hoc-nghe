# MASTER PROMPT — YC-HN-027 V2 — ĐÃ CHỐT VÀ TRIỂN KHAI MÃ NGUỒN

**Dự án:** THEO DÕI HỌC NGHỀ — GitHub/Vercel + Google Apps Script + Google Sheets.

**Phiên bản nền:** `v1.2.20-RC` (YC-HN-026 V2). **Phiên bản bàn giao:** `v1.2.21-RC` (YC-HN-027 V2). **Ngày:** 27/10/2026.

**Trạng thái:** ĐÃ CHỐT; mã nguồn đã sửa và chạy kiểm thử cục bộ. **CHƯA triển khai production và CHƯA kiểm chứng trên Google Sheets thực.**

## 1. Quyết định V2 thay thế V1

- `ADMIN` (A): quyền đầy đủ như cũ, xem, thêm, sửa, xóa, quản trị, cập nhật tình trạng tất cả cơ sở.
- `NHAN_VIEN` (B): xem Tổng quan/Hồ sơ/Báo cáo **toàn Trung tâm**, xem hồ sơ do mọi tài khoản và trường tạo, được cập nhật **tình trạng** của **tất cả cơ sở**; không phải được A phân công, không lưu danh sách trường được phân công.
- `CO_SO_DAO_TAO` (C): chỉ xem, cập nhật tình trạng, xuất Excel/in báo cáo trong phạm vi `TRUONG_ID` gắn với Gmail.
- B không được tạo/sửa thông tin/xóa hồ sơ, nhập hàng loạt, thay đổi tệp đính kèm, sửa danh mục, quản trị tài khoản hoặc xem nhật ký qua API. B chỉ thấy ba menu **Tổng quan — Hồ sơ học nghề — Báo cáo**. Quyền xem tệp và quyền xuất hiện hữu giữ nguyên.
- Khi B cập nhật hồ sơ của C/D, lịch sử `CAP_NHAT_BOI` và nhật ký phải ghi **Gmail thực của B**; phiên bản `PHIEN_BAN`, khóa ghi và xác thực backend không thay đổi.

## 2. Thiết kế đã áp dụng

- `apps-script/Code.gs`: ma trận staffRights chỉ còn `RECORD_VIEW`, `RECORD_STATUS`, `REPORT_VIEW`, `FILE_VIEW`, `REPORT_EXPORT`; dữ liệu cột `QUYEN` lịch sử không quyết định quyền thật.
- Tách helper `canViewRecord_`, `canStatusUpdateRecord_`, `canEditRecord_`, `canDeleteRecord_`, `canManageRecordFile_`, `requireRecordView_`.
- `visibleRecords_`, tìm đúng số QĐ theo index, `personLookup_`, Tổng quan, Xuất/Báo cáo theo `canViewRecord_`: A và B toàn Trung tâm; C theo trường.
- `statusRecord_` yêu cầu `canStatusUpdateRecord_` và kiểm `PHIEN_BAN`, LockService, audit. Việc ghi luôn lấy dòng thật theo `HO_SO_ID` dưới lock.
- Mọi sửa nội dung/xóa/tệp tiếp tục bị chặn ở máy chủ. Vai trò B không có các quyền thay đổi hồ sơ/tệp; phần kiểm tra riêng ở thao tác ghi được tăng cường.
- `public/app.js`: `STAFF_RIGHTS` chỉ chứa quyền xem/cập nhật tình trạng/báo cáo/xem tệp/xuất báo cáo đang có; 3 menu theo quyền; không có nút tạo/sửa/xóa/tải lên tệp của B.
- Thêm `APP.version` trong khóa cache `RECORDS` và `OVERVIEW` để tránh kết quả theo scope cũ trong thời gian cache còn sống khi cập nhật phiên bản.
- Frontend import Excel dùng đường dẫn versioned `xlsx-export.js?v=1.2.21-RC`. Nội dung file `public/xlsx-export.js` **không đổi**.
- `accountSave_()` ghi cột mô tả `QUYEN` đúng ma trận quyền. Không cần thêm cột/tab hoặc trường phân công.

## 3. Nghiệm thu

- ADMIN thấy đủ 6 menu; B chỉ 3 menu; C chỉ 3 menu.
- B xem được hồ sơ của trường C và trường D, do quản trị viên tạo; B có icon Cập nhật tình trạng với cả hai; C chỉ thấy hồ sơ trường mình.
- Gọi API giả mạo `record_save`, `record_delete`, `file_remove`, `file_upload_begin`, `record_bulk_import`, `accounts_list`, `catalog_save`, `audit_list` từ B bị từ chối.
- B cập nhật C rồi C lưu với `PHIEN_BAN` cũ bị `VERSION_CONFLICT`; ghi log từng Gmail thật.
- Khóa tài khoản hoặc chuyển B sang C phải thu hồi quyền toàn Trung tâm theo revision USERS.
- Báo cáo/lọc/xuất Excel 25 cột và định dạng được giữ nguyên.

**Chưa thay đổi:** Các quy tắc hoàn thành khóa học (đã tham gia, không bỏ học, ngày kết thúc đào tạo dự kiến), tháng bỏ học còn chờ quyết định riêng, cấu trúc 7 tab/94 cột, chế độ báo cáo thống kê, máy chủ phiên đăng nhập/Vercel HMAC, logic Excel, kiểm tra trùng quyết định.

## 4. Bàn giao

- ZIP GitHub đầy đủ phiên bản `v1.2.21-RC`, không có `.git`, `.env` thật, `node_modules` hay dữ liệu thật.
- `Code.gs` đầy đủ đã cập nhật.
- Changelog/Hướng dẫn triển khai và hoàn tác; báo cáo kiểm thử.
- Chỉ triển khai trên staging trước; rollback về ZIP, Code.gs và deployment của `v1.2.20-RC` khi cần.

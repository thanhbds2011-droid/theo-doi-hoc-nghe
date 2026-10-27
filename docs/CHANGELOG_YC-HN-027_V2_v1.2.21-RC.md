# CHANGELOG — YC-HN-027 V2 / v1.2.21-RC (27/10/2026)

Nền: `v1.2.20-RC`.

## Thay đổi chức năng

- NHAN_VIEN: xem toàn Trung tâm, cập nhật tình trạng tất cả cơ sở không cần phân công; thu hồi quyền tạo/sửa/xóa hồ sơ, thêm/xóa tệp. Chỉ 3 menu Tổng quan/Hồ sơ/Báo cáo.
- ADMIN: giữ toàn quyền.
- CO_SO_DAO_TAO: tiếp tục scope trường, chức năng báo cáo và Excel như phiên bản trước.
- Backend tách permission predicate xem/tình trạng/sửa/xóa/tệp, dùng ngay trong các luồng cần kiểm soát.
- Phạm vi bộ lọc/khóa cache list + overview gắn thêm APP.version để tránh kết quả cũ sau deployment.
- Đồng bộ version string từ 1.2.20 sang 1.2.21 trên frontend + Code.gs + api/config + package.json và phiên bản import XLSX.

## Tệp sửa / bổ sung

`apps-script/Code.gs`, `public/app.js`, `public/index.html`, `api/config.js`, `package.json`, `tests/backend.test.js`, `tests/ui-yc006.test.js`, `tests/yc021-v5_2-hotfix-wps.test.js`, `tests/yc023-ui.test.js`, `tests/browser_yc022_mock.py`, và bổ sung `tests/yc027-rbac.test.js`, `tests/browser_yc027_rbac_mock.py`, cùng các tài liệu mới.

Không đổi nội dung `public/xlsx-export.js` hoặc cấu trúc Sheets.

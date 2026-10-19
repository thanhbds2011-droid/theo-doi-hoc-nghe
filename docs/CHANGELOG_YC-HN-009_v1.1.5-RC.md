# CHANGELOG – YC-HN-009 v1.1.5-RC

## Thay đổi

- `public/app.js`: Nút **Nhập Excel** chỉ Admin tại trang Hồ sơ; modal chọn file, tải mẫu, đọc `.xlsx`, nhận diện 1 hoặc 2 hàng tiêu đề, chuẩn hóa ngày Excel, đối chiếu tên cột, xem trước 10 dòng, cảnh báo cột không hỗ trợ, kiểm tra, xuất danh sách lỗi/trùng, nhập theo từng đợt 40 dòng. Tất cả là chức năng của website; không hiển thị Google Sheets cho người dùng cuối.
- `public/styles.css`: Định dạng gọn và đồng nhất các khối trong cửa sổ Nhập Excel.
- `apps-script/Code.gs`: `record_bulk_check`, `record_bulk_import`, `recordBulkPlan_`, `recordBulkCheck_`, `recordBulkImport_`; khóa ghi, chống số quyết định trùng toàn bộ lịch sử, quyền ADMIN phía server, ghi hàng loạt theo lần, ID hồ sơ nội bộ tự sinh, nhật ký từng đợt.
- `public/templates/MAU_NHAP_HO_SO_HOC_NGHE.xlsx`: mẫu Excel 10 cột và tab hướng dẫn bằng tiếng Việt.
- `tests/backend.test.js`: +6 tình huống mới: preflight 1.000 dòng; ghi 1.000 hồ sơ và nhập lại; quyết định khác năm; lỗi trong file; chặn nhân viên; giới hạn đợt/file.
- `tests/browser_yc009_mock.py`: kiểm tra Chromium frontend và nhận diện tiêu đề hai hàng.
- `public/index.html`, `package.json`, `tests/ui-yc006.test.js`: đồng bộ nhãn phiên bản.

## Không thay đổi

- Cấu trúc 7 tab/79 cột Google Sheets, ID hồ sơ cũ, API proxy (`api/rpc.js`), Google Sign-in, Vercel session, tải tệp 10 MB và các phân hệ/giao diện đã phê duyệt trước đó.
- Không ghi dữ liệu TCTN, BHXH, mức trợ cấp khi database chưa có trường phù hợp.
- Không gán nhân viên sở hữu hồ sơ do Admin nhập: bảo toàn trường TAO_BOI thực tế, nhân viên vẫn chỉ đọc hồ sơ chính mình tạo.

## Kiểm thử

- `npm run check`: đạt.
- `npm test`: **73/73 đạt** offline.
- `python tests/browser_yc009_mock.py`: đạt; không gọi production.
- Chưa thử trên Google Sheets/Drive/Vercel thực.

## Rủi ro còn mở

- File Excel thực có thể dùng tên cột khác ảnh; cần đối chiếu file gốc nếu không tự nhận diện.
- Chưa có cơ chế phân công các hồ sơ do Admin nhập cho nhân viên. Cần thiết kế lưu thông tin phân công an toàn, không sửa người tạo lịch sử, trước khi triển khai luồng giao việc.
- Các cột không có trong schema không được lưu. Có bước cảnh báo và xác nhận rõ ràng trước khi nhập.

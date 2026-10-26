# YC-HN-025 V2 — v1.2.17-RC: Hướng dẫn triển khai và rollback

## Yêu cầu nghiệp vụ

Đếm **Hoàn thành khóa học** chỉ với hồ sơ `TRANG_THAI_THAM_GIA = DA_THAM_GIA`, không bỏ học (`DA_BO_HOC` false), ngày `Thời gian đào tạo – Đến ngày` hợp lệ và phù hợp với Từ ngày/Đến ngày đang được áp dụng. Những hồ sơ Chưa xác nhận, Không tham gia, Bỏ học và trạng thái khác bị loại trừ. Với 10 QĐ chỉ một hồ sơ đủ điều kiện kết thúc 10/06/2026, tháng 06/2026 trả 1.

Lưu ý: điều kiện này dựa trên *ngày kết thúc dự kiến*, không chứng minh có xác nhận tốt nghiệp thực tế. Số Hoàn thành có thể **bằng** số Đã tham gia trong tình huống tất cả đều đủ điều kiện; tuyệt đối không ép số nhỏ hơn một cách nhân tạo.

## Tệp mã nguồn đã sửa

- `apps-script/Code.gs`: thêm hàm `courseEndEligible_`, áp tiêu chí cùng lúc trong `recordMatches_` (đường Hồ sơ/Báo cáo/Excel) và `overview_` (KPI `courseEndParticipated`). Giữ nguyên KPI cũ `courseEndScheduled` cho tương thích. Đổi khóa cache báo cáo theo bản logic mới.
- `public/app.js`: dòng Hoàn thành khóa học lấy số đếm mới từ server (cùng báo cáo tổng hợp Excel), hỗ trợ làm mới vùng kết quả khi đổi tình trạng/bỏ học trong chế độ lọc mới.
- `public/index.html`: phiên bản và `app.js?v=1.2.17-RC` để giảm nguy cơ dùng JavaScript cache cũ.
- `package.json`, `tests/*`, `README.md`, `docs/*`: đồng bộ phiên bản, ca kiểm thử và tài liệu.
- **Không sửa** `public/xlsx-export.js`, kiểu ngày, căn lề, Wrap Text, chiều cao Excel; không thêm cột/tab Google Sheets hay thay cấu hình phân quyền.

## Triển khai an toàn

1. Sao lưu bộ GitHub/Vercel và Apps Script hiện chạy `v1.2.16-RC`, ghi lại deployment ID/commit cũ. Không tự động thay môi trường production khi chưa kiểm thử.
2. Trên **Apps Script staging**, chép đủ nội dung `apps-script/Code.gs` của bản mới (hoặc file `CODE_APPS_SCRIPT_YC-HN-025_V2_v1.2.17-RC_Code.gs`), chọn **Deploy > Manage deployments > Edit > New version > Deploy**. Giữ nguyên Script Properties, Spreadsheet ID và khóa bí mật; không đưa vào mã nguồn.
3. Cập nhật toàn bộ frontend dự án lên nhánh staging GitHub/Vercel; xác nhận deployment đã xuất bản và chân trang hiện `v1.2.17-RC`. Không chỉ thay label phiên bản.
4. Ctrl+Shift+R. Kiểm tra: Hồ sơ học nghề, Báo cáo → `Hoàn thành khóa học` và khoảng ngày trong tháng 6 có đúng người Đã tham gia/không Bỏ học; khi xuất Excel mẫu Danh sách/Báo cáo tổng hợp các số liệu nhất quán. Trả về Tất cả tình trạng và Tổng số Quyết định đã ban hành không bị thay đổi. Thử tài khoản cơ sở đào tạo chỉ thấy trường mình.
5. Sau nghiệm thu staging mới đưa vào production theo quy trình đơn vị.

## Hoàn tác

Nếu có lỗi, **cùng lúc** đưa Vercel/GitHub về commit `v1.2.16-RC` và Apps Script về phiên bản deployment `v1.2.16-RC`, rồi đăng nhập/tải lại. Không khôi phục/ghi đè dữ liệu Sheets. Bộ ZIP chỉ chứa mã nguồn, không có dữ liệu hồ sơ thật.

## Kiểm thử / Giới hạn

- `npm run check`, `npm test`, Chromium mock với ba vai trò; kết quả ghi trong `docs/YC-HN-025_V2_v1.2.17-RC_KET_QUA_KIEM_THU.txt`.
- Không kiểm thử trực tiếp môi trường Google Apps Script/Vercel production, độ trễ mạng, hay hành vi in/lưu bằng Excel/WPS trên máy thật. Số liệu test là dữ liệu giả lập.

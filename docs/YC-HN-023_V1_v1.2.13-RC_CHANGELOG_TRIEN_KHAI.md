# YC-HN-023 V1 — CHANGELOG, KIỂM THỬ VÀ TRIỂN KHAI

**Phiên bản:** `v1.2.13-RC` — 22/10/2026.  **Trạng thái:** đã sửa mã nguồn, kiểm thử offline và Chromium mock; **CHƯA deploy website/GAS/Google Sheets production**. Nền: `v1.2.12-RC` (YC-HN-022 V2). Giữ nguyên thư viện xuất Excel `public/xlsx-export.js` đã nghiệm thu.

## 1. Chức năng được chốt

- Tại **Hồ sơ học nghề**, các tình trạng thực tế (Tất cả, Đã tham gia học, Không tham gia, Không nhận quyết định, Chưa xác nhận, Bỏ học, trạng thái tự định nghĩa) kết hợp với **Từ ngày – Đến ngày** và lọc theo **Ngày ban hành quyết định** (`NGAY_QUYET_DINH`). Hai đầu mút đều được tính.
- Bổ sung trong **dropdown Tình trạng của Hồ sơ học nghề** mục **Ngày hoàn thành khóa học**. Đây là **chế độ lọc ảo** `FILTER_COURSE_END_DATE`: lúc này hai ô ngày lọc theo `NGAY_KET_THUC_DU_KIEN` — **Thời gian đào tạo – Đến ngày**. Đây chỉ là **ngày kết thúc dự kiến**, *không xác nhận người học hoàn thành*. Không có ngày kết thúc hợp lệ thì không nằm trong kết quả chế độ này, kể cả khi không chọn khoảng ngày.
- Năm quyết định vẫn là `NAM_QUYET_DINH`, các bộ lọc khác và quyền xem dữ liệu vẫn giữ nguyên. Không làm mới/thay đổi tình trạng hồ sơ trên Sheets hoặc KPI.
- Chế độ mới có thêm cột **Ngày kết thúc đào tạo (dự kiến)** ngay sau cột Ngày QĐ; sắp xếp ngày kết thúc tăng dần. Chế độ thông thường giữ 7 cột và thứ tự cũ. Dữ liệu có thể cuộn ngang ở màn hình hẹp.
- `Hồ sơ học nghề → Xuất Excel` gửi `source:'records'` để backend dùng **cùng toàn bộ bộ lọc đang áp dụng**, bao gồm ngày, tình trạng ảo, năm, trường, nghề, từ khóa. Excel đủ **25 cột**, cột N chứa ngày kết thúc; không sửa định dạng căn lề/Wrap Text/độ cao đã chốt. **Báo cáo** và các mẫu tổng hợp không thêm tình trạng ảo.
- Sau sửa hồ sơ trong chế độ lọc mới, thay đổi `NGAY_KET_THUC_DU_KIEN` kích hoạt tải lại **chỉ vùng kết quả**; sửa tên không ảnh hưởng kết quả vẫn cập nhật **đúng một hàng**, kế thừa YC-HN-022.

## 2. File chỉnh sửa

| File | Nội dung |
|---|---|
| `public/app.js` | Dropdown trạng thái ảo, trợ giúp/nhãn ngày theo chế độ, cột kết thúc dự kiến, `colspan` khi bảng trống, kiểm điều kiện refresh sau lưu, `source:'records'` khi Xuất Excel từ trang Hồ sơ; tăng nhãn phiên bản. |
| `apps-script/Code.gs` | Đổi ngày so sánh theo mã lọc ảo, xác thực ngày ISO/range, sắp xếp theo ngày kết thúc tăng dần, kiểm quyền trước lọc, xử lý `report_export` riêng khi `source:'records'`. Luồng report/overview không cho mã tình trạng ảo. **Phải triển khai GAS cùng frontend.** |
| `public/index.html`, `package.json`, `README.md` | Đồng bộ nhãn `v1.2.13-RC` và đường nạp JS có version, mô tả phạm vi. |
| `tests/backend.test.js`, `tests/yc023-ui.test.js`, `tests/browser_yc023_mock.py` | Kiểm thử nghiệp vụ, bảng động, export, phân trang, ba vai trò và bảo toàn KPI. |
| `tests/ui-yc006.test.js`, `tests/yc019-ui.test.js`, `tests/browser_yc019_mock.py` | Đồng bộ assertion phiên bản và fixture JavaScript cho app module version mới; giữ nguyên ý nghĩa bài thử cũ. |

**Không đổi byte nào:** `public/xlsx-export.js`, `public/styles.css`, `api/rpc.js`, `api/config.js`, `vercel.json`. **Không thêm tab/cột Google Sheets; giữ nguyên 7 tab/94 cột, version lock, check quyền, audit, và quy tắc tháng bỏ học chưa được duyệt.**

## 3. Kết quả kiểm thử tự động

- `npm run check`: **đạt**, JavaScript frontend và API đúng cú pháp.
- `npm test`: **157/157 đạt** (2 backend test mới, 3 UI test mới; 152 bài nền đạt).
- `python tests/browser_yc023_mock.py`: **đạt** với ADMIN, NHAN_VIEN, CO_SO_DAO_TAO. Kiểm tra chọn ngày tháng 7 từ lịch, thay đổi nhãn ngày, bảng 8 cột, thứ tự tăng dần, Excel khớp bộ lọc, scope cơ sở, sau sửa ngày kết thúc chỉ vùng kết quả làm mới; trang Báo cáo không có tình trạng ảo.
- `python tests/browser_yc022_mock.py`: **đạt**, sửa một hồ sơ không đổi filter thì cập nhật một dòng, version conflict và sort-change vẫn an toàn.
- `python tests/browser_yc019_mock.py`: **đạt**, cả hai khoảng ngày được truyền ISO và kiểm tra đầu mút/date invalid.
- `python tests/browser_yc021_v5_2_excel.py`: **đạt**; XLSX 25 cột, B/J/O/V/W căn trái, R căn giữa, ngày Excel và mã có số 0 đầu, độ cao động giữ nguyên.

**Giới hạn:** Các bài thử dùng Google Sheets giả lập và Chromium. Chưa chạy trên dữ liệu thật, chưa đo tốc độ truy vấn trên GAS/Vercel production, chưa mở/ghi lại Excel bằng WPS trên máy người dùng. Vì vậy chưa thể tuyên bố hệ thống thật đã được cập nhật.

## 4. Triển khai an toàn — cần cập nhật **cả GitHub/Vercel và Apps Script**

1. Sao lưu commit GitHub/Vercel đang hoạt động (`v1.2.12-RC`), mã `Code.gs` hiện hành và cấu hình deployment GAS **không chia sẻ khóa bí mật**.
2. Tạo **môi trường thử nghiệm** Apps Script gắn bảng dữ liệu phi định danh, thay thế `Code.gs` bằng `apps-script/Code.gs` mới. Lưu, triển khai **Deploy → Manage deployments → Edit → New version → Deploy**. Ghi nhận URL Web App staging và xác minh quyền deploy như cũ. **Chỉ dán code rồi Save mà không cấp phiên bản triển khai mới có thể khiến Web App vẫn chạy code cũ.**
3. Cập nhật **toàn bộ** GitHub từ ZIP và tạo Preview deployment trên Vercel. Cấu hình `GAS_WEB_APP_URL` của Preview trỏ vào Web App GAS staging. Giữ bí mật `API_SHARED_SECRET`, `GOOGLE_CLIENT_ID`, `SPREADSHEET_ID`; hai tầng API/GAS phải cùng secret hiện hành. Không commit `.env` thật lên GitHub.
4. Trong trình duyệt thử nghiệm: tải cứng `Ctrl+Shift+R`, xem chân trang `v1.2.13-RC`. Vào **Hồ sơ học nghề** → trạng thái **Ngày hoàn thành khóa học** → chọn 01/07/2027–31/07/2027 → **Lọc dữ liệu**; kiểm cột **Ngày kết thúc đào tạo (dự kiến)** và trường N của Excel. Quyết định ban hành năm 2026 vẫn xuất hiện khi *Năm quyết định* để trống hoặc chọn 2026. Đổi lại trạng thái **Đã tham gia học** với cùng khoảng thì lọc theo **Ngày QĐ**, không lọc theo kết thúc dự kiến.
5. So sánh số lượng xuất Excel với **tổng kết quả lọc trên mọi trang**, thử tìm số QĐ và phân quyền từng loại tài khoản; đảm bảo Báo cáo/KPI bình thường. Thử sửa ngày kết thúc khiến hồ sơ ra khỏi bộ lọc, không làm trắng giao diện.
6. Khi staging đạt yêu cầu mới cập nhật **Apps Script production phiên bản mới**, sau đó cập nhật **Vercel production**; tránh khoảng thời gian frontend mới dùng backend cũ sẽ báo lỗi lọc. Có thể tạm ngưng thao tác trong lúc chuyển phiên nếu cần.

## 5. Rollback

Nếu phiên bản mới có lỗi: đổi Vercel về deployment `v1.2.12-RC` và Apps Script **Manage deployments** về version backend tương ứng, sau đó hard refresh. Không có migration cấu trúc Sheet nên không cần phục hồi dữ liệu chỉ vì thay code. **Không rollback data mới tạo/sửa hợp lệ** nếu không có chỉ đạo riêng.

## 6. Lưu ý nghiệp vụ

Tên menu người dùng yêu cầu là **Ngày hoàn thành khóa học** nhưng nguồn chỉ là **ngày kết thúc dự kiến của khóa đào tạo**. Vì vậy không dùng kết quả bộ lọc này để kết luận người học đã hoàn thành hay đủ điều kiện hưởng hỗ trợ; cần bằng chứng xác nhận riêng nếu muốn quản lý **hoàn thành thực tế** trong tương lai.

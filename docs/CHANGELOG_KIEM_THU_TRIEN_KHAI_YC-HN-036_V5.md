# YC-HN-036/V5 – Changelog, kết quả kiểm thử và bàn giao

**Phiên bản bàn giao:** Frontend/Apps Script `v1.2.30-RC` (31/10/2026).  
**Phiên bản nền:** Frontend `v1.2.29-RC`; Apps Script `v1.2.28-RC`.  
**Trạng thái:** Đã CHỐT và đã sửa bản sao mã nguồn; **chưa triển khai lên hệ thống đang sử dụng, chưa nghiệm thu production**.

## A. Những thay đổi đã thực hiện

1. **Chuẩn bị menu trước khi bấm:** sau khi hiển thị Tổng quan, giao diện tự chuẩn bị có kiểm soát (từng yêu cầu, không dồn đồng thời) dữ liệu trang đầu Hồ sơ, Báo cáo, và đối với ADMIN có Tình trạng học nghề, Tài khoản, Nhật ký. Dùng chung cache/yêu cầu đang xử lý. Không tự tải toàn bộ hồ sơ, toàn bộ nhật ký hoặc file Excel.
2. **Tab Tình trạng học nghề:** có nội dung thông báo khi đang tải, bỏ cột “Hồ sơ đang dùng”; nút Sửa/Xóa. Chỉ hiển thị tình trạng ACTIVE trong bảng đang sử dụng; tình trạng cũ chờ duyệt PENDING nằm ở nhóm riêng để ADMIN rà soát. INACTIVE/DELETED bị ẩn khỏi danh sách dùng mới.
3. **Xóa mềm tình trạng:** metadata trạng thái đặt trong tab `Cấu hình hệ thống` (các khóa `HN_STATUS_BUILTIN_*`, `HN_STATUS_RULE_*`). Không xóa mã hoặc thay đổi nội dung hồ sơ hiện hữu. Trạng thái mặc định giữ nguyên tên/mã phục vụ nghiệp vụ và báo cáo; trạng thái tùy chỉnh chỉ được đổi tên nếu chưa có hồ sơ lịch sử tham chiếu.
4. **Bảo toàn nghiệp vụ Bỏ học:** vẫn lưu `TRANG_THAI_THAM_GIA=DA_THAM_GIA`, `DA_BO_HOC=TRUE`, giữ chỉ tiêu đã tham gia và báo cáo bỏ học độc lập. Nếu “Đã tham gia” ngừng chọn mới nhưng “Bỏ học” còn hoạt động, hồ sơ cũ vẫn chuyển sang Bỏ học được.
5. **Đồng bộ theo cơ sở:** mỗi giao dịch ghi hồ sơ tăng revision toàn Trung tâm cho ADMIN/NHAN_VIEN và revision theo `TRUONG_ID` cho tài khoản cơ sở liên quan; hạn chế việc Cơ sở B phải tải lại khi chỉ Cơ sở A thay đổi. Vẫn kiểm quyền server và `PHIEN_BAN`.
6. **Giảm đọc lặp:** truy vấn danh sách trạng thái không đọc bảng hồ sơ để đếm số lượng; truy xuất một dòng dùng `TextFinder` khi có thể; cache danh sách/báo cáo dùng khóa theo vai trò, cơ sở và revision để tái sử dụng an toàn trong phạm vi quyền.
7. **Thông báo lỗi:** sau khi cập nhật tình trạng hoặc Sửa/Xóa tình trạng, nếu ghi nhật ký thất bại thì trả về cảnh báo đối soát (`auditPending`) thay vì im lặng. Điều này **không thay thế cơ chế giao dịch nguyên tử** và không được coi là đã giải quyết hết rủi ro ghi nhật ký của các chức năng kế thừa.
8. **Tải lại khi đồng bộ lỗi:** giữ cờ cần cập nhật để có thể thử lại sau lỗi mạng. Giữ nguyên biểu mẫu người dùng đang nhập.

## B. Tệp thay đổi

| Tệp | Công dụng | Đưa lên đâu |
|---|---|---|
| `public/app.js` | Tải trước, cache, tình trạng Sửa/Xóa, thông báo | GitHub/Vercel |
| `public/index.html` | Cập nhật URL phiên bản JS và nhãn phiên bản | GitHub/Vercel |
| `package.json` | Phiên bản npm | GitHub/Vercel |
| `apps-script/Code.gs` | Backend trạng thái, phân quyền, revision, đọc dữ liệu | Apps Script – cập nhật và triển khai Web App, đồng thời nên giữ bản trong GitHub |
| `tests/*` (một số tệp) | Kiểm thử hồi quy và kịch bản mới | GitHub, không bắt buộc để vận hành |
| `docs/MASTER_PROMPT_YC-HN-036_V5_DA_CHOT.md` và báo cáo này | Hồ sơ bàn giao | Tài liệu dự án |

**Không sửa:** `api/rpc.js`, `api/config.js`, `public/xlsx-export.js`, `vercel.json`, 7 tab/tiêu đề Google Sheets, tệp mẫu Excel/CSV.

## C. Kiểm thử đã chạy thực tế

| Kiểm thử | Kết quả |
|---|---|
| `npm run check` | Đạt – cú pháp JavaScript frontend/gateway |
| `npm test` | **234/234 đạt** (225 hồi quy hiện có + 9 bài mới; có cập nhật kỳ vọng cho chức năng đã thay đổi có chủ ý) |
| `browser_yc035_catalog_tabs.py` | Đạt – 4 tab danh mục, PENDING của ADMIN, giữ tab và tìm kiếm |
| `browser_yc031_school_trades.py` | Đạt – lọc nghề và giới hạn dữ liệu theo cơ sở |
| `browser_yc032_dependent_trades.py` | Đạt – nghề phụ thuộc cơ sở qua 3 menu |
| `browser_yc027_rbac_mock.py` | Đạt – 3 vai trò ADMIN/NHAN_VIEN/CO_SO_DAO_TAO |
| `browser_yc036_preload_status.py` | Đạt – preload/cache menu, Sửa/Xóa mềm tình trạng |
| `browser_yc029_v5_two_clients.py` | Đạt – 2 phiên giả lập, chống cập nhật xung đột |
| Mô phỏng 1,5,10,20 phiên trong `yc036-preload-status.test.js` | Đạt – không phát sinh tải nền trùng **trong từng phiên** theo mock |

**Giới hạn quan trọng:** Browser test dùng API giả lập; không có quyền truy cập môi trường production để đo thời gian thực, số ô đọc thực tế hay quota Google Apps Script. Chưa thể khẳng định đáp ứng 10–20 người đồng thời khi triển khai thật. Không coi mọi kịch bản lỗi mạng/ghi nhật ký đã được bao phủ.

## D. Hướng dẫn cập nhật an toàn – chưa thực hiện thay người dùng

1. **Sao lưu trước:** sao chép Google Sheets, Apps Script `Code.gs`, bản deploy Web App hiện tại và commit GitHub ổn định. Lưu URL Apps Script `/exec` đang được Vercel sử dụng, không công khai Secret/Token.
2. **Thử trên staging:** sao chép bảng Sheets có dữ liệu kiểm thử được phép sử dụng; tạo Apps Script/biến môi trường staging tương ứng. Không thử ghi xóa trên bảng production.
3. **Cập nhật backend:** mở Apps Script của dự án cần cập nhật → thay nội dung `Code.gs` bằng tệp bàn giao đầy đủ → Save → Deploy → Manage deployments → Edit deployment Web App và cập nhật **New version**. Không chạy `setupDatabase()` hoặc hàm nâng cấp dữ liệu; phiên bản này không yêu cầu thêm tab/cột.
4. **Cập nhật frontend:** giải nén ZIP rút gọn, đưa `public/app.js`, `public/index.html`, `package.json` lên đúng vị trí trong repository GitHub. Commit và để Vercel deploy. Nếu lưu `apps-script/Code.gs` trong GitHub, đây chỉ là bản nguồn – vẫn phải deploy riêng Apps Script. Không tải nguyên file ZIP như một tệp website.
5. **Kiểm thử sau triển khai staging:** đăng nhập từng vai trò; kiểm tra đúng 6/3 menu, tải trước không báo lỗi, tab Tình trạng, Sửa/Xóa mềm, dữ liệu hồ sơ cũ, báo cáo, chuyển A→B→A; cập nhật đồng thời hai tài khoản, xác nhận báo cáo tổng và theo cơ sở. Kiểm tra Logs/Executions và hạn mức Apps Script.
6. **Triển khai production có kiểm soát:** nên thông báo tạm ngưng ghi trong thời gian chuyển backend + frontend để tránh hai phiên bản xử lý giao dịch xen kẽ. Triển khai backend trước, sau đó frontend. Kiểm tra trang ẩn danh/refresh mạnh và phiên bản góc màn hình `v1.2.30-RC`.
7. **Theo dõi và nghiệm thu:** đo thời gian mở menu lạnh/nóng, truy vấn hồ sơ, cập nhật trạng thái, số lần đọc Sheets, thời gian chờ khóa, lỗi HTTP, lỗi nhật ký và tỷ lệ thành công khi 1/5/10/20 người sử dụng trên staging. Chỉ tuyên bố nghiệm thu khi số liệu thực tế đạt mục tiêu.

## E. Hoàn tác nếu có sự cố

1. Ngừng giao dịch ghi trong thời gian hoàn tác.
2. Trên Vercel, rollback về commit/deployment `v1.2.29-RC`; trên Apps Script, khôi phục `Code.gs` của `v1.2.28-RC` và redeploy Web App.
3. Vì V5 không thay cấu trúc Google Sheets và xóa mềm chỉ ghi metadata, **không được khôi phục cả bảng Sheets tùy tiện** nếu đã phát sinh giao dịch hợp lệ trong thời gian sử dụng bản mới; làm vậy có thể mất dữ liệu mới. Kiểm tra và đối soát trước khi phục hồi bảng.
4. Khi rollback, cần kiểm tra lại các cache phiên bản, truy cập quyền, báo cáo và các hồ sơ đã cập nhật; cho người dùng đăng nhập lại để tránh HTML/cache cũ.

## F. Những giới hạn chưa tuyên bố giải quyết hoàn toàn

- Không thể đảm bảo *mọi menu* hoàn tất tải đúng lúc Tổng quan xong trong mạng chậm, nhưng đã có tải trước và chỉ báo chờ khi chưa sẵn sàng.
- Cache Apps Script có thời hạn/dung lượng; sau khi hết cache vẫn có tình huống đọc lại toàn bộ snapshot hồ sơ.
- Việc ghi nhật ký chưa hoàn toàn nguyên tử với ghi hồ sơ trên Google Sheets. V5 thông báo trường hợp một số ghi nhật ký thất bại để đối soát; cần giám sát thật.
- Tối ưu mới chưa được benchmark trên Google Sheets thực với 3.000+ hồ sơ và 10–20 người thực, vì vậy không cam kết thời gian đáp ứng hoặc mức quota cụ thể.
- Không có thay đổi các dịch vụ thanh toán hoặc dự án Firebase nào (dự án này độc lập Firebase).

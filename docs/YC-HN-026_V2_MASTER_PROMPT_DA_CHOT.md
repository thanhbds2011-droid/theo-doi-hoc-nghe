# MASTER PROMPT — YC-HN-026 / V2 — ĐỒNG BỘ SỐ LIỆU “ĐÃ THAM GIA” GIỮA BÁO CÁO VÀ EXCEL

**Dự án:** THEO DÕI HỌC NGHỀ (GitHub/Vercel + Google Apps Script + Google Sheets).  
**Nền mã nguồn được kiểm tra trực tiếp:** `THEO_DOI_HOC_NGHE_YC-HN-026_V1_v1.2.19-RC.zip`, các file `apps-script/Code.gs`, `public/app.js`.  
**Bằng chứng nghiệp vụ:** Hai ảnh Báo cáo học nghề và file Excel báo cáo theo cơ sở đào tạo người dùng cung cấp ngày 26/10/2026.  
**Trạng thái:** **ĐÃ CHỐT V2 — ĐÃ SỬA SOURCE VÀ KIỂM THỬ CỤC BỘ v1.2.20-RC; CHƯA DEPLOY PRODUCTION.**

## I. Sự cố được tái hiện từ mã nguồn và hai ảnh

Trong phạm vi báo cáo không lọc (hoặc phạm vi nhất quán của hai ảnh):

| Chỉ tiêu | Báo cáo UI (overview) | Excel theo cơ sở (report_matrix) |
|---|---:|---:|
| Tổng số Quyết định đã ban hành | 2.433 | 2.433 |
| Đã tham gia | **1.343** | **1.299** (nhãn `Đã tham gia học`) |
| Bỏ học | 44 | 44 |
| Chưa xác nhận | 1.090 | 1.090 |

**Giải thích chính xác:** 1.299 + 44 = 1.343. Trong mô hình nghiệp vụ đã chốt, người **Bỏ học** là người **đã tham gia** rồi mới bỏ học (`TRANG_THAI_THAM_GIA='DA_THAM_GIA'` và cờ `DA_BO_HOC=true`). Do đó, `Đã tham gia` phải đếm 1.343, gồm cả 44 trường hợp Bỏ học. Cột Bỏ học là một phép đếm con, không phải nhóm rời để cộng thêm vào Tổng số Quyết định.

Đối chiếu nguồn:

1. `apps-script/Code.gs`, `overview_()`, khoảng dòng 952–976: `if(r.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'){k.participated++; if(bool_(r.DA_BO_HOC))k.dropout++;else k.learning++;}`. `k.participated` đếm **tất cả** đã tham gia, kể cả Bỏ học; UI hiển thị `k.participated` tại `public/app.js` → `reportKpiRows()`, khoảng dòng 547–558.
2. `apps-script/Code.gs`, `reportMatrix_()`, khoảng dòng 979–1015: nhóm `g.learning` **chỉ tăng khi** `DA_THAM_GIA` và **không bỏ học**: `if(...){if(bool_(r.DA_BO_HOC))g.dropout++;else g.learning++;}`. Mỗi nhóm chưa có trường `participated` tương đương với `k.participated`.
3. `public/app.js`, `exportSummaryOrMatrix()`, khoảng dòng 1063–1083: tiêu đề cột đang là `Đã tham gia học`, và dữ liệu cột đang dùng `r.learning`: `['...','Đã tham gia học',...]` và `[...r.total,r.learning,r.dropout,...]`.
4. `public/xlsx-export.js` không phải nguyên nhân khác biệt số đếm; đây là lỗi **ngữ nghĩa trường dữ liệu** từ Apps Script và cách frontend ánh xạ khi xuất ma trận.

**Chứng cứ đã đủ để quy kết sai lệch 44 cho công thức xuất ma trận**, nhưng số liệu đã triển khai thực tế có thể thay đổi khi dữ liệu Sheet tiếp tục được cập nhật. Không tuyên bố đã đo/kiểm chứng trực tiếp production.

## II. Yêu cầu đã được người dùng CHỐT

### YC-026.V2.01 — Cột Đã tham gia trong hai báo cáo ma trận phải khớp KPI

1. Trong cả **Báo cáo theo cơ sở đào tạo** và **Báo cáo theo nghề đào tạo**, đổi tên cột từ **`Đã tham gia học`** thành **`Đã tham gia`**, đúng nhãn KPI trên website.
2. Cột **Đã tham gia** đếm **mọi** hồ sơ `TRANG_THAI_THAM_GIA==='DA_THAM_GIA'` trong đúng tập quyết định đã áp dụng bộ lọc `NGAY_QUYET_DINH`, năm, trường, nghề và quyền — **bao gồm cả hồ sơ có `DA_BO_HOC=true`**. Không dùng nhóm `learning` loại người bỏ học.
3. Cột **Bỏ học** tiếp tục đếm các trường hợp `DA_THAM_GIA && DA_BO_HOC=true` tương ứng; cột **Đã tham gia** bao gồm nhóm này, không trừ lại và không coi 2 cột là hai trạng thái loại trừ nhau.
4. Ưu tiên bổ sung nhóm `g.participated` tại backend, đếm trước khi rẽ nhánh Bỏ học/Đang học; giữ `g.learning` nếu có nơi sử dụng nhằm tránh đổi nghĩa trường đã tồn tại. Sau đó frontend ánh xạ **Đã tham gia** sang `r.participated`, không sang `r.learning`. Hoặc chọn cách thực thi tương đương sau khi rà soát đầy đủ test/khả năng tương thích. Không thay đổi công thức `overview_().k.participated` đang đúng.
5. Tại cùng thời điểm và cùng phạm vi lọc/quyền, phải đúng bất biến: `SUM(report_matrix.items[].participated) === overview.kpi.participated`. Cần bảo đảm từng nhóm tính độc lập đúng, tổng theo **cơ sở** và theo **nghề** đều khớp, không chỉ sửa con số tại dòng Tổng cộng.
6. Không đổi tên hoặc nội dung cột Hoàn thành khóa học, không đụng quy tắc riêng ngày kết thúc đào tạo dự kiến theo YC-HN-025 V3; không cộng nhầm Hoàn thành vào Tổng QĐ.

### YC-026.V2.02 — Đúng quyền, đúng điều kiện lọc và đúng Excel

1. Áp dụng cả **ADMIN**, **NHAN_VIEN** (theo quyền đã có) và **CO_SO_DAO_TAO** với scope `TRUONG_ID` kiểm ở backend. Tài khoản trường chỉ xuất được dữ liệu của trường gán, không gửi payload tùy ý để lấy trường khác.
2. Khi báo cáo lọc một tình trạng cụ thể, ma trận phải phản ánh **chính tập hồ sơ đã lọc**, không trả KPI toàn hệ thống. Với `Bỏ học` thì mọi hồ sơ trong tập bỏ học vốn thuộc `DA_THAM_GIA`, nên cột Đã tham gia bằng số hồ sơ bỏ học trong phạm vi; cột Bỏ học vẫn đếm đúng. Với `Tất cả`, khớp KPI Đã tham gia trên giao diện. Không thay ý nghĩa bộ lọc đã áp dụng.
3. Giữ hai mẫu Excel ma trận cột: STT, Tên cơ sở/Tên nghề, Tổng số Quyết định đã ban hành, Đã tham gia, Bỏ học, Không tham gia, Không nhận Quyết định, Chưa xác nhận, Hoàn thành khóa học, và các cột trạng thái tùy chỉnh nếu có.
4. Giữ dòng Tổng cộng màu vàng, viền, Wrap Text của tiêu đề, căn lề/căn giữa; không sửa mẫu Excel danh sách 25 cột đã nghiệm thu hoặc mẫu tổng hợp hai cột.
5. Nếu đổi cấu trúc JSON từ `report_matrix`, xem xét giao diện/kiểm thử/khả năng triển khai hai tầng lệch phiên bản, tránh hiển thị 0 sai hoặc kết quả NaN. Khi triển khai production cập nhật Apps Script và Vercel/GitHub đồng bộ, gắn version/cache salt nếu cần để tránh kết quả cũ.

### YC-026.V2.03 — Các ca kiểm thử bắt buộc

1. Bộ dữ liệu giả lập gồm 10 hồ sơ: 6 `DA_THAM_GIA` trong đó 2 `DA_BO_HOC=true`, 4 chưa tham gia/chưa xác nhận. Tổng `Đã tham gia` phải là 6, `Bỏ học` là 2, **không được hiện Đã tham gia = 4**. Kiểm từng trường/nghề, không chỉ dòng Tổng cộng.
2. Với số liệu trên ảnh người dùng trong cùng phạm vi: website Đã tham gia **1.343**, Bỏ học **44**; Excel theo cơ sở/nghề cột Đã tham gia phải **1.343** thay vì 1.299 (nếu dữ liệu không đổi), cột Bỏ học vẫn 44; tổng QĐ vẫn 2.433.
3. Khi lọc các mốc `Từ ngày`/`Đến ngày`, năm, trường, nghề, tình trạng, kết quả ma trận phải bằng KPI tương ứng với các quy tắc đã chốt. Hai đầu mút ngày có tính bao gồm.
4. ADMIN và CO_SO_DAO_TAO kiểm khác phạm vi; tài khoản trường không xuất dữ liệu trường khác qua UI hoặc RPC sửa payload. NHAN_VIEN không bị tự cấp thêm quyền ngoài chính sách.
5. Đã tham gia học + cờ bỏ học → nằm trong **cả** Đã tham gia và Bỏ học, không cộng đôi vào Tổng Quyết định. Các trạng thái không tham gia/chưa xác nhận không được tính vào Đã tham gia.
6. Cột Hoàn thành dùng `NGAY_KET_THUC_DU_KIEN` theo YC-HN-025 V3; số tổng trong ma trận khớp chỉ tiêu Hoàn thành của báo cáo tổng hợp với cùng scope.
7. Chạy toàn bộ suite nền `v1.2.19-RC` (đã báo cáo 179/179 trong vòng bàn giao trước) và test mới; nếu sửa test cũ, phải phân biệt thay đổi điều kiện nghiệm thu đúng với bỏ test cho tiện. Kiểm tra Excel thật bằng công cụ phù hợp. Không tuyên bố đã kiểm thử nếu chưa chạy.

## III. Phạm vi và nguyên tắc không được thay đổi

- **Không sửa Google Sheets thật**, không thêm cột/tab, không tự thay các tình trạng tham gia, tháng bỏ học hoặc dữ liệu gốc.
- **Không sửa** `overview_().k.participated` đã đúng, ngoài trường hợp phát hiện sự cố khác có chứng cứ rõ.
- **Không bỏ** kiểm tra quyền backend, HMAC/cookie, `PHIEN_BAN`, khóa ghi, kiểm trùng QĐ, nhật ký.
- **Không sửa** thuật toán Excel danh sách 25 cột (căn lề, Wrap Text, chiều cao dòng) và không ghi đè các chức năng YC-HN-013–026 V1 đã nghiệm thu.
- **Không tự deploy production**.

## IV. Quy trình sau CHỐT

Đã thực hiện sửa có kiểm soát tối thiểu `apps-script/Code.gs`, `public/app.js` và test liên quan, trên nền ZIP `v1.2.19-RC`. Chạy hồi quy; bàn giao **ZIP GitHub hoàn chỉnh**, **Code.gs đầy đủ**, Master Prompt/changelog, kết quả test thực chạy, hướng dẫn cập nhật staging → production/rollback. Nếu chưa CHỐT, chỉ phân tích và tích lũy yêu cầu.

**TRẠNG THÁI: YC-HN-026 V2 — ĐÃ CHỐT, ĐÃ CHỈNH MÃ NGUỒN v1.2.20-RC, CHƯA TRIỂN KHAI.**

## V. Kết quả sau CHỐT — 26/10/2026

- Backend `reportMatrix_()` bổ sung `g.participated` cho tất cả `DA_THAM_GIA` trước khi tách `g.dropout`/`g.learning`; giữ trường `learning` cũ để tương thích.
- Frontend ma trận đổi tiêu đề thành `Đã tham gia`, lấy `r.participated` thay `r.learning`. Frontend từ chối xuất nếu Apps Script cũ không trả trường số `participated`, tránh xuất sai thành 0.
- Đồng bộ phiên bản frontend/Code.gs, đường tải JavaScript gắn `v1.2.20-RC`.
- Kiểm thử Node.js 180/180 đạt; Chromium hồi quy trang Báo cáo, Hồ sơ, cập nhật cục bộ và Excel 25 cột đạt. Chưa truy cập hệ thống production.
- `public/xlsx-export.js` được giữ nguyên byte so với v1.2.19-RC; không thay đổi cấu trúc 7 tab/94 cột Google Sheets, phân quyền hay thuật toán Hoàn thành khóa học.


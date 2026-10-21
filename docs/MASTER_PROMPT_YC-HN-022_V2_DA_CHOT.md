# MASTER PROMPT — YC-HN-022 / V2 — CẬP NHẬT CỤC BỘ VÀ GIẢM ĐỘ TRỄ LƯU HỒ SƠ

**Dự án:** THEO DÕI HỌC NGHỀ — Google Sheets + Google Apps Script + Vercel/GitHub.

**Ngày ghi nhận:** 21/10/2026.

**Trạng thái tổng:** **YC-HN-022 V2 CHỜ CHỐT — CHƯA SỬA MÃ NGUỒN / CHƯA TRIỂN KHAI.**

**Phạm vi tích lũy:** Toàn bộ phần V1 dưới đây (YC-022.01–04) và phụ lục V2 (YC-022.05–10) về việc người dùng quan sát thấy mỗi lần lưu hồ sơ mất khoảng 6 giây.

**Nền phải bảo toàn:** `v1.2.11-RC` đã được người dùng nghiệm thu phần Excel, cùng mọi YC-HN-013–021 đã hoàn thành. Ảnh minh họa người dùng cho thấy chân trang `v1.2.10-RC`; đã đối chiếu mã `record_save` và `afterMutation` giữa 1.2.10 và 1.2.11, luồng tải lại không đổi. Khi sửa thực tế phải đối chiếu bộ source mới nhất người dùng đang vận hành, tránh ghi đè hotfix Excel.

## 1. Yêu cầu đã nêu

Người dùng mô tả: sau khi mở **Sửa hồ sơ** của một người và bấm **Lưu**, trang **Hồ sơ học nghề** tạm mất bảng/bộ lọc; xuất hiện `Đang đồng bộ phiên làm việc…` rồi `Đang tải hồ sơ…` trước khi bảng xuất hiện trở lại. Người dùng muốn **khi sửa một hồ sơ thì chỉ dữ liệu đúng hồ sơ đó được cập nhật tại chỗ**, không dựng lại toàn bộ giao diện / gọi lại danh sách không cần thiết. Các ảnh chụp có bộ lọc `Tình trạng: Đã tham gia học`, kết quả `20 / 1.295 hồ sơ · Trang 5`, và các hồ sơ QĐ 4279–4284.

**Nguyên tắc được đề nghị:** Không mặc định yêu cầu tải lại toàn trang sau khi lưu một hồ sơ; vẫn phải bảo đảm dữ liệu sau sửa chính xác, không lộ dữ liệu ngoài quyền, không hiển thị kết quả cũ khi hồ sơ không còn thuộc bộ lọc hoặc thay đổi thứ tự.

## 2. Chứng cứ kỹ thuật từ mã nguồn thật

**Đã kiểm tra bộ source bàn giao** `THEO_DOI_HOC_NGHE_YC-HN-021_V5_2_HOTFIX_v1.2.11-RC.zip` (bản giải nén):

| File và vị trí | Hiện trạng | Hệ quả |
|---|---|---|
| `public/app.js`, gần dòng 1200: `if(formId==='record-form')` | `rpc('record_save', p, {mutate:true})`; sau thành công `await afterMutation('records')` | Có sẵn hồ sơ vừa lưu trong `d.record`, nhưng không cập nhật riêng dòng |
| `public/app.js`, dòng 90–116: `rpc()` | Sau mutation: `generation++`, `dataRevision=''`; nếu không `preserveRecordList` thì `state.cache.clear()`, `state.pageViews.clear()`, `state.renderedPage=null` | Hủy toàn bộ cache/snapshot, dù sửa một hồ sơ |
| `public/app.js`, dòng 950–956: `afterMutation()` | `closeModal(); navigate(page,true)` | Bắt buộc luồng điều hướng/tái dựng trang sau lưu |
| `public/app.js`, dòng 221–261: `navigate(...,force)` | `force=true` không phục hồi snapshot, render `safeRouteShell` với `Đang đồng bộ phiên làm việc…`, sau xác minh mới gọi renderer | Ảnh thứ hai khớp source, không phải bắt buộc do Google Sheets |
| `public/app.js`, dòng 450–467: `renderRecords`/`loadRecordList` | Dựng lại bộ lọc + `#record-count`=`Đang tải hồ sơ…`, gọi `records_list` với pageSize=20, sau đó dựng lại `<tbody>` và phân trang | Ảnh thứ ba khớp source; đây là gọi lại dữ liệu danh sách, chưa chứng minh trình duyệt F5 |
| `apps-script/Code.gs`, dòng 646–671: `saveRecord_()` | Xác thực quyền/sở hữu/PHIEN_BAN, kiểm trùng QĐ, ghi hồ sơ, `bump_('DATA')`, audit, trả `{record:safeRecord_(data)}` | Backend đã trả hồ sơ mới, frontend có thể dùng để cập nhật một dòng; không cần truy vấn lại chỉ để lấy nội dung dòng |
| `apps-script/Code.gs`, dòng 647 và 666 | `sheetRows_('HO_SO_HOC_NGHE')` đọc bảng để kiểm tra hồ sơ/số QĐ và `findRowNumber_` tìm vị trí ghi | Cần phân biệt **quét bảng ở backend khi lưu** với **tải lại toàn giao diện**; tối ưu hiển thị không mặc nhiên giảm chi phí đọc backend |
| `public/app.js`, dòng 1201–1214: form tình trạng | Đã có phương án thay badge cục bộ trong một số trường hợp; nếu không phù hợp bộ lọc vẫn `navigate('records',true)` | Có thể tham khảo mô hình, nhưng không sao chép nguyên lỗi cache/race; bảo toàn quy tắc lọc |

Đối chiếu source `v1.2.10-RC`: các đoạn lưu/điều hướng nói trên không thay đổi trong `v1.2.11-RC`. Chưa đo trực tiếp network waterfall của website production; các kết luận dựa ảnh + source.

## 3. Phạm vi đề xuất sau CHỐT

### YC-022.01 — Chỉ cập nhật hàng vừa sửa nếu vẫn thuộc kết quả hiện tại (P0)

1. Khi submit form **sửa** một hồ sơ có `HO_SO_ID` hợp lệ: gửi **duy nhất thao tác lưu cần thiết** `record_save`, chờ server trả thành công; không tự động gọi `afterMutation('records')`.
2. Sau thành công, dùng **đúng** `d.record` phía backend (`safeRecord_`) để thay hồ sơ cùng `HO_SO_ID` trong `state.records`, bao gồm `PHIEN_BAN` mới. Render/replace duy nhất `<tr>` tương ứng (thêm thuộc tính `data-record-id` khi dựng bảng hoặc phương thức an toàn tương đương). Tất cả trường thay đổi trong cột **Ngày QĐ, Số QĐ, Người học, Cơ sở, Nghề, Tình trạng, các icon theo quyền/file** phải hiển thị đúng. Escape mọi chuỗi từ dữ liệu như renderer hiện hành; không dùng dữ liệu form chưa được server chấp nhận làm nguồn sự thật.
3. Giữ nguyên form bộ lọc, từ khóa, `state.recordPage`, tổng số phù hợp, thanh phân trang, vùng cuộn ngang/dọc, menu và vị trí cuộn; không hiện `Đang đồng bộ phiên làm việc…` hoặc `Đang tải hồ sơ…` cho một bản ghi đã xác minh vẫn ở đúng vị trí.
4. Chỉ báo thành công sau khi server hoàn tất; modal đóng sau commit. Nút Lưu được khóa chống gửi lặp khi đang xử lý. Nếu lỗi/validation/version conflict, modal và các giá trị người dùng đang sửa vẫn giữ để điều chỉnh; không làm mất bảng hoặc báo thành công sai.

### YC-022.02 — Trường hợp phải làm mới riêng vùng kết quả (P0)

1. Nếu hồ sơ sau sửa **không còn thỏa các bộ lọc** (năm, cơ sở, nghề, tình trạng, từ/đến ngày, tìm tên/số QĐ) thì loại khỏi kết quả hiện tại sau commit, đồng thời tải **chỉ vùng kết quả/pagination** theo quyền và filter hiện tại để lấp đầy trang và cập nhật `total` chuẩn xác.
2. Nếu thay đổi **khóa sắp xếp** (ví dụ Ngày QĐ, số QĐ, năm QĐ) khiến vị trí/phân trang thay đổi, không thay nguyên hàng tại vị trí cũ rồi để thứ tự sai. Tải lại vùng kết quả hiện tại (không thay `#main`, không dựng lại bộ lọc), và giữ vị trí cuộn khi hợp lý.
3. Nếu đổi **TRUONG_ID** làm thay phạm vi hiển thị của tài khoản cơ sở đào tạo, tuyệt đối không để hồ sơ từ trường cũ trong UI hoặc cache riêng tư; phải áp đúng quyền và điều kiện trên backend trước khi render. Nếu role/quyền bị đổi, fail-closed theo cơ chế kiểm tra phiên.
4. Trường hợp **thêm hồ sơ mới** khác với sửa một hồ sơ; có thể cần tải vùng bảng để lấy thứ tự, tổng và phân trang chính xác. Không tự động áp quy tắc chỉ thay dòng cho thao tác thêm.
5. Với thao tác cập nhật tình trạng/tệp, giữ mô hình hiện có trừ khi việc dùng chung hàm render hàng mang lại lợi ích chắc chắn và test không thay đổi nghiệp vụ.

### YC-022.03 — Cache, revision và đồng bộ dữ liệu (P0)

1. Thay cách vô hiệu hóa trên `record_save` thành *đúng phạm vi*, tránh `state.pageViews.clear()`/`state.renderedPage=null` và `navigate(..., true)` cho thay đổi một hàng. Đồng thời **bắt buộc** làm mới/đánh dấu stale cache nào có thể chứa hồ sơ cũ (toàn bộ filter/page thuộc `records_list`, `overview`, `report_matrix`, `report_export`) theo `HO_SO_ID` và dữ liệu sửa.
2. Không làm sai revision/permission snapshot: `bump_('DATA')` vẫn giữ; không được gắn nhãn cache cũ là mới chỉ vì muốn mượt. Khi một menu khác cần số liệu mới, gọi backend phù hợp; khi về lại Hồ sơ, có chiến lược đối chiếu revision và dữ liệu mà không tự hiển thị thông tin đã bị thu hồi quyền.
3. Chống phản hồi chậm ghi đè thao tác mới bằng `recordLoadVersion`/`routeVersion` hoặc sequence token; khi đang chạy `records_list`, kết quả cũ tới sau `record_save` không được ghi đè `d.record` vừa lưu. Chặn UI update nếu người dùng đã đổi trang/bộ lọc/mở bản ghi khác trong lúc chờ.
4. Dữ liệu riêng tư chỉ trong cache RAM phiên đã xác minh, **không** chuyển sang localStorage/sessionStorage/public CDN. Backend tiếp tục áp `authorize_`, kiểm phiên bản `PHIEN_BAN`, khóa ghi, quyền sở hữu, kiểm số QĐ trùng và ghi nhật ký.
5. Không thêm tab/cột Google Sheets, không thay cấu trúc 7 tab/94 cột, không thay đổi công thức tháng bỏ học chưa được làm rõ, không ảnh hưởng mẫu Excel `v1.2.11-RC` đã nghiệm thu.

### YC-022.04 — Kiểm thử nghiệm thu (P0)

1. Với một trang danh sách có 20 hồ sơ, lọc **Đã tham gia học**, trang 5: sửa họ tên của hồ sơ QĐ 4281; danh sách giữ nguyên, chỉ một `<tr>` được cập nhật; 19 hàng khác không bị dựng lại, không có `records_list` phát sinh khi không cần; vị trí cuộn/ô lọc/trang 5 giữ nguyên.
2. Sửa nghề nhưng vẫn thuộc bộ lọc hiện tại: cập nhật đúng hàng; sau đó mở Sửa lại phải nhận `PHIEN_BAN` mới, không lỗi phiên bản.
3. Sửa nghề/trạng thái/năm/QĐ/ngày/cơ sở khiến hồ sơ không còn hợp bộ lọc hoặc đổi thứ tự: chỉ vùng bảng được refresh, tổng/trang đúng, không lộ hồ sơ trường ngoài quyền; trong lúc refresh bộ lọc vẫn hiện và không mất giá trị.
4. Đổi filter và đổi menu trong lúc request lưu hoặc refresh; kết quả cũ không đè lên filter/page mới. Hai tài khoản sửa cùng một hồ sơ: xung đột phiên bản báo đúng, không ghi đè.
5. Server từ chối hoặc mất mạng: không cập nhật sai dữ liệu, không báo lưu thành công khi chưa có ACK; nếu server có thể đã commit nhưng response bị mất, không retry ghi mù.
6. Thử ADMIN / NHAN_VIEN / CO_SO_DAO_TAO theo đúng quyền: tài khoản cơ sở chỉ được cập nhật các trường/trạng thái theo quyền cũ, không vì thay đổi frontend mà được phép sửa hồ sơ trái quyền. Kiểm tra token hết hạn, role/trường thay đổi khi tab ở nền.
7. Xuất Excel 25 cột, wrap/height/căn lề đúng chuẩn `v1.2.11-RC`; lọc/đếm Báo cáo cập nhật đúng sau đổi menu. Kiểm thử nền đầy đủ + bài thử mới; nêu số lượng thực chạy, không tự tuyên bố đạt trước khi thực hiện.
8. Đo request count và latency trước/sau cho 3 tình huống **sửa một trường không ảnh hưởng filter**, **sửa ảnh hưởng filter/sort**, **thêm hồ sơ**. Phân biệt chi phí lưu ở Apps Script với lượt load danh sách ở frontend; không hứa cải thiện thời gian ghi Sheets nếu không thay code backend.

## 4. Nguyên tắc bàn giao sau CHỐT

- Chỉ sửa file cần thiết (ưu tiên `public/app.js`, và `public/styles.css` nếu cần); xem xét backend **chỉ khi chứng cứ/kiểm thử cho thấy bắt buộc**.
- Khi CHỐT triển khai: giao **ZIP GitHub hoàn chỉnh**, tài liệu giải thích thay đổi, kết quả test thực chạy và hướng dẫn backup/rollback. Nếu không sửa logic backend, **không yêu cầu deploy lại Apps Script**.
- Không động chạm file xuất `public/xlsx-export.js` ngoài lý do không thể tránh khỏi; phải giữ đúng mẫu Excel đã nghiệm thu.
- **CHƯA CHỐT:** Chỉ phân tích và lập đặc tả, chưa chỉnh sửa mã nguồn trong lần trao đổi này.


---

# PHỤ LỤC V2 — ĐO VÀ TỐI ƯU THỜI GIAN LƯU HỒ SƠ (21/10/2026)

**Yêu cầu mới:** Người dùng xác nhận sau khi nhấn **Lưu hồ sơ** phải chờ **khoảng 6 giây** mới xong. Mong muốn hệ thống phản hồi nhanh hơn, tiếp nối yêu cầu V1 không tải lại toàn bộ trang. Đây là **quan sát người dùng, chưa phải phép đo có log**; không được quy kết toàn bộ 6 giây cho Google Sheets hoặc frontend trước khi đo.

## V2.1. Kết quả rà soát tĩnh từ chính mã nguồn `v1.2.11-RC`

| Khâu thực hiện | Đường chạy đã kiểm chứng | Ghi nhận / khả năng gây trễ |
|---|---|---|
| Trình duyệt | `public/app.js` submit `record-form` → `rpc('record_save',p,{mutate:true})` → thông báo → `afterMutation('records')` | Kết quả ghi đã có `d.record`. Phần điều hướng dựng lại UI sau khi backend trả về có thể khiến người dùng phải đợi thêm để thấy bảng; việc tối ưu V1 xử lý khoản này nhưng **không tự rút ngắn round-trip ghi dữ liệu**. |
| Gateway | `api/rpc.js` `POST()` xác minh phiên/cookie, ký HMAC, gửi fetch Apps Script, timeout 52 giây | Mỗi lần lưu cần một lượt HTTP qua Vercel → Apps Script. Chưa có thời gian thực đo của từng đoạn. |
| Xác thực GAS | `apps-script/Code.gs` `doPost()` → `authorize_()`; cache phân quyền TTL khoảng 25 giây | Khi cache quyền miss có thể đọc bảng tài khoản/cấu hình trường. Không được bỏ kiểm tra quyền chỉ để nhanh. |
| Chờ khóa giao dịch | `doPost()` `withLock_()` → `LockService.getScriptLock().tryLock(25000)` | Có thể phải chờ khi có yêu cầu ghi song song. **25 giây là thời gian chờ tối đa theo cấu hình, KHÔNG phải bằng chứng rằng lần lưu nào cũng mất 25 giây.** |
| Đọc hồ sơ và kiểm tra trùng | `saveRecord_()` ngay khi bắt đầu: `sheetRows_('HO_SO_HOC_NGHE')` đọc **toàn bộ 40 cột của tất cả hồ sơ** bằng `getDisplayValues()`, lọc/sắp xếp trong RAM để tìm ID và rà `SO_QUYET_DINH_KEY` trùng | Với 2.433 dòng dữ liệu, một lượt đọc lý thuyết khoảng **97.320 ô**; con số này nói về lượng dữ liệu được đọc, **không tự suy ra thời gian**. |
| Tìm vị trí để ghi | `findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id)` lại đọc riêng một cột ID của tất cả dòng | Có thêm chuyến đọc Sheet dù đối tượng đã tìm trong danh sách toàn bộ ở bước trước. Cần phân tích khả năng giảm đọc thừa nhưng không giả định vị trí hàng luôn cố định. |
| Ghi và ghi lịch sử | `writeRecord_()` ghi 40 cột của một hàng, `bump_('DATA')`, `audit_()` thêm bản ghi `NHAT_KY` | Cần giữ version `PHIEN_BAN`, khóa, kiểm trùng QĐ cùng năm, nhật ký, idempotency `dedupeWrite_()`; chưa được loại bước vì lý do tốc độ. |
| Đo tốc độ có sẵn | GAS `HN_PERF_TEST=1` (chỉ staging) có totalMs/authMs/lockWaitMs/read counts; các trường lookup/validation/write/audit chủ yếu được đánh dấu trong `statusRecord_()` chứ **chưa chia pha chi tiết cho `saveRecord_()`** | Cần bổ sung đo riêng khi muốn biết chính xác nguồn trễ của thao tác **Sửa hồ sơ**. |

**Phân biệt bắt buộc:** (A) Thời gian từ nhấn Lưu đến server phản hồi `record_save` thành công; (B) thời gian từ phản hồi đó đến giao diện hoàn tất/hiển thị danh sách; (C) tổng A+B. Không dùng C để khẳng định khâu ghi Sheets mất 6 giây. Nút toast thành công có thể xuất hiện trước khi bảng trở lại.

## YC-022.05 — Đo baseline trước khi sửa thuật toán ghi (P0)

1. Bổ sung đo client bằng `performance.now()` (không log họ tên/QĐ/email/PII): `saveClickAt`, `fetchStart`, `fetchEnd`, `serverAck`, `localRowCommitted`, `listRefreshDone`, độ dài phản hồi, loại thao tác `edit/create`. Không cần gửi dữ liệu hồ sơ cho dịch vụ thống kê bên ngoài.
2. Bổ sung thời gian giai đoạn trên Vercel cho phiên hợp lệ: đọc request/xác thực/ký envelope, chờ upstream Apps Script, chuyển JSON; log ID tương quan phù hợp nhưng **không log cookie, ID token, payload hoặc HMAC secret**.
3. Mở rộng `HN_PERF_TEST` ở Apps Script **chỉ trên staging** để đo riêng `saveRecord_`: `authMs`, `lockWaitMs`, `fullSheetReadMs`, `validateMs`, `rowLookupMs`, `writeMs`, `revisionMs`, `auditMs`, `totalMs`, số chuyến đọc/số ô đọc; không log dữ liệu cá nhân. Không bật chi tiết môi trường thật khi chưa được phép.
4. Đo tối thiểu **3 lần cache lạnh + 3 lần cache nóng** cho: (i) sửa họ tên; (ii) sửa trường ảnh hưởng filter/sort; (iii) thêm hồ sơ; và khi có 2 người ghi đồng thời. Nếu được cấp staging có dữ liệu phi định danh, kiểm ở quy mô 100 / 1.000 / ~2.433 / 5.000 hồ sơ. Không thử bằng cách sửa hàng loạt dữ liệu thật.
5. Báo cáo kết quả theo từng tầng/trường hợp và nêu hạn chế của phép đo; không hứa cố định 'dưới 1 giây' khi chưa đo thực tế qua mạng.

## YC-022.06 — Ưu tiên giảm thời gian cảm nhận mà không thay đổi tính đúng đắn (P0)

1. Kết hợp **YC-022.01–04 (V1)**: khi sửa hồ sơ còn trong trang/bộ lọc, chỉ cập nhật đúng `<tr>` theo `HO_SO_ID` bằng `d.record`, giữ form, trang phân trang, menu, vị trí cuộn; không bắt tải lại `records_list` và `bootstrap` khi không cần.
2. Ngay khi click Lưu, nút Lưu phản hồi trạng thái 'Đang lưu…' và bị khóa để tránh double-submit; **chưa** báo thành công hoặc ghi đè dữ liệu UI khi backend chưa ACK.
3. Khi server xác nhận commit, cập nhật dòng nhanh chóng, đóng modal và hiển thị thông báo. Nếu lọc/sort/permission thay đổi, chỉ làm mới vùng kết quả, không dựng lại cả `#main`.
4. Tránh `rpc(...,{mutate:true})` xóa toàn bộ snapshot/cache không liên quan đến thay đổi một hồ sơ, nhưng phải invalidation nhất quán theo revision; không giữ dashboard/báo cáo cũ như dữ liệu mới. Thực hiện phân quyền ở server như hiện tại.
5. Nếu mất mạng khi có thể đã commit, không tự gửi thao tác ghi lần hai với `requestId` mới. Giữ an toàn phiên bản và đối soát trước khi thử lại.

## YC-022.07 — Đề xuất tối ưu thao tác `saveRecord_()` **chỉ sau khi có số đo** (P1)

1. Nếu `fullSheetReadMs` chiếm nhiều thời gian, thiết kế lại đường **sửa một hồ sơ** tách khỏi đường **thêm hồ sơ**: tìm bằng cột `HO_SO_ID`, đọc 40 ô của đúng hàng, kiểm `PHIEN_BAN`, owner và quyền, sau đó kiểm trùng quyết định bằng cột khóa `SO_QUYET_DINH_KEY` (kèm ID để loại đúng bản ghi đang sửa) hoặc cấu trúc chỉ mục có đối chiếu hiện trạng. Tránh đọc **40 × N ô** nếu chứng minh có thể duy trì tương đương kết quả.
2. Giữ toàn bộ quy tắc trùng quyết định trong cùng năm; `SO_QUYET_DINH` có tiền tố 0 và `SO_QUYET_DINH_KEY` phải so sánh theo logic hiện tại. Nếu người khác đã sort/chèn/xóa/thay đổi Sheet, không được ghi nhầm hàng: **đối chiếu lại HO_SO_ID ngay trước ghi trong lock**, không tin chỉ mục hoặc hàng cache cũ.
3. Các đường `allowedRecord_`, `requireRecordOwner_`, `registerCustomStatus_`, `personId`, dữ liệu hồ sơ cũ, quy tắc ký tự an toàn, ngày, trạng thái, `PHIEN_BAN`, `dedupeWrite_()` và NHAT_KY phải giữ đúng kết quả. Không tối ưu bằng cách bỏ quy trình xác minh hoặc bỏ ghi lịch sử.
4. Khi các lần ghi cạnh tranh nhau: phải giữ khóa ghi và khả năng từ chối xung đột. Chỉ cân nhắc giảm thời gian **giữ lock** khi chứng minh không tạo TOCTOU/race; không đưa việc kiểm trùng/phiên bản ra ngoài lock một cách thiếu an toàn.
5. Không thêm tab/cột/index cố định, chuyển database, cache dữ liệu nhạy cảm ở trình duyệt hoặc chỉnh Google Sheets thật nếu chưa được phê duyệt riêng. Thuật toán chỉ mục cache ngắn nếu đề xuất phải kèm kiểm tra đúng sai và cơ chế fallback.
6. Ưu tiên cải thiện có số đo, tránh 'tối ưu' phức tạp làm tăng số lần đọc/ghi hoặc vi phạm quota. Nếu phần đọc full-sheet **không** phải nút cổ chai, xử lý đúng khâu chậm được log chỉ ra.

## YC-022.08 — Xử lý độ trễ Vercel/GAS và lock khi cần (P1)

1. Nếu thời gian Vercel→GAS chủ đạo, kiểm độ trễ upstream/cold start/quota/log lỗi theo thời điểm; không suy luận từ tốc độ mở trang. Kiểm tra cấu hình triển khai/đường request nhưng **không** thay auth/cookie/HMAC hay mở cache công khai cho dữ liệu nhạy cảm.
2. Nếu `lockWaitMs` lớn do nhiều lượt ghi, phân tích hàng chờ và tần suất lưu đồng thời. Không giảm/bỏ khóa 25s để 'nhanh' nếu việc đó chỉ gây lỗi BUSY hoặc sai bản ghi.
3. Nếu audit/Sheet write chủ đạo, tối ưu đúng batch hoặc giảm API call dư thừa sau benchmark nhưng phải giữ ghi nhật ký/chính xác. Phân biệt chi phí kiểm tra duplicate và chi phí ghi audit.

## YC-022.09 — Nghiệm thu hiệu năng và tính đúng (P0)

1. Sửa hồ sơ **không ảnh hưởng filter/sort**: đúng một `record_save`; sau ACK chỉ một hàng cập nhật, không phát sinh request `records_list` do chính thao tác đó, bảng không flash và vẫn giữ đúng trang/cuộn/lọc. Bảng không bị refresh trước commit.
2. Sửa **ảnh hưởng filter/sort**: làm mới **riêng kết quả**, đúng số lượng/trang, không mất bộ lọc, không lộ hồ sơ khác trường.
3. Đo và báo cáo tổng thời gian tách pha: click→ACK, ACK→dòng cập nhật, click→hoàn tất; so với ước lượng người dùng khoảng 6s, **báo số thực đo trước/sau**. Mục tiêu hiệu quả là giảm độ trễ cảm nhận và giảm lượt đọc thừa; không đặt SLA backend tùy tiện.
4. Kiểm tra cùng lúc 2 người sửa một hồ sơ (version conflict), trùng số QĐ, xóa mềm, trường đào tạo khác quyền, thêm mới, trạng thái đặc biệt, mạng lỗi/timeout và quay lại tab sau 240 giây; đúng phân quyền và `PHIEN_BAN`.
5. Kiểm tra sau commit: các báo cáo, trang tổng quan, phân trang, xuất Excel và các tab khác cập nhật đúng khi tải lại theo revision hợp lệ; tuyệt đối không gắn nhãn cache cũ như mới.
6. Chạy đầy đủ kiểm thử nền của `v1.2.11-RC`, giữ nguyên chức năng xuất Excel chuẩn đã nghiệm thu. Test bằng dữ liệu staging; không được tuyên bố đạt nếu chưa chạy.

## YC-022.10 — Ranh giới triển khai và bàn giao sau CHỐT

- **Giai đoạn A:** sửa frontend cập nhật cục bộ (V1) + thêm đo thời gian ở đúng điểm (V2); có thể bàn giao an toàn trước và dùng số đo để quyết định Giai đoạn B.
- **Giai đoạn B:** chỉ sửa thuật toán ghi Apps Script nếu baseline cho thấy đọc Sheet/lookup/lock/ghi là nút cổ chai có thể tối ưu an toàn; thực hiện so sánh trước/sau. Nếu sửa Code.gs phải bàn giao **toàn file** và hướng dẫn triển khai chính xác.
- Không hứa sửa frontend sẽ làm `record_save` hoàn tất trong 1–2 giây; phần ghi dữ liệu thực vẫn cần ACK mới báo thành công.
- Bảo toàn **v1.2.11-RC** (đặc biệt `public/xlsx-export.js` đã nghiệm thu), 7 tab/94 cột, toàn bộ quy tắc nghiệp vụ, phân quyền, kiểm trùng, lịch sử, hạn mức và cấu hình cũ.
- Sau CHỐT: giao ZIP GitHub đủ mã nguồn, Code.gs nếu sửa, hướng dẫn staging/rollback, kết quả kiểm thử thực chạy, báo cáo thời gian thực đo nếu có môi trường. Chưa được tự triển khai production.

**TRẠNG THÁI YC-HN-022 V2: CHỜ CHỐT — CHƯA CHỈNH CODE / CHƯA DEPLOY.**

---

## V2.11 — KẾT QUẢ SAU KHI NGƯỜI DÙNG CHỐT (21/10/2026)

**Trạng thái thực tế mới nhất (ghi đè dòng “CHỜ CHỐT” ở phần lịch sử): YC-HN-022 V2 ĐÃ CHỐT; giai đoạn A đã chỉnh mã nguồn `v1.2.12-RC`, chưa deploy production.**

- Cập nhật riêng dòng sau ACK nếu không ảnh hưởng filter/sort, dữ liệu lấy từ `d.record`, giữ PHIEN_BAN, không gọi lại `records_list` cho sửa đơn giản.
- Khi ảnh hưởng sort/filter thì làm mới riêng vùng kết quả; tạo mới cũng cập nhật vùng kết quả; giữ phân quyền và cache invalidation.
- Bật đo thời gian browser/Vercel/GAS trên staging theo cấu hình opt-in. Không thay thuật toán full-sheet trong `saveRecord_` trước khi có benchmark hệ thống thật.
- `npm run check` đạt; `npm test` đạt **152/152**, Chromium mock browser đạt với ba vai trò theo quyền; chưa có benchmark production.
- Excel exporter từ v1.2.11-RC giữ nguyên byte-for-byte. Tài liệu changelog: `docs/YC-HN-022_V2_v1.2.12-RC_CHANGELOG_HUONG_DAN.md`.

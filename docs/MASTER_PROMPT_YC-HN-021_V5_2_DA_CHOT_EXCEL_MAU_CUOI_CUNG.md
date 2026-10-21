# MASTER PROMPT — YC-HN-021 V5.1 — ĐÃ CHỐT (21/10/2026)

**Bản tích lũy cuối:** V1–V5 cùng nội dung V5.1. **Trạng thái ĐÃ CHỐT phạm vi được xác định rõ và đã triển khai mã nguồn thử nghiệm `v1.2.9-RC`; chưa deploy production.** Các nhãn “CHỜ CHỐT” trong phần lịch sử được giữ để đối chiếu, không phản ánh trạng thái hiện tại. Ngoại lệ: quy tắc tháng bỏ học V1 vẫn chưa đủ căn cứ nghiệp vụ, không thực hiện trong đợt V5.1.

**Chốt V5:** Chỉ B/J/O/R căn trái ngang, giữa dọc, Wrap Text; 21 cột Excel còn lại căn giữa ngang/dọc. Ghi đè các quy tắc căn trái S/V/W của phiên bản cũ.

**Chốt V5.1:** (1) Tiêu đề “Thao tác” căn giữa đúng trục các icon ở danh sách Hồ sơ; (2) chỉ hiển thị số quyết định, xóa dòng “Năm 2026”/năm tương ứng bên dưới; năm vẫn được giữ trong dữ liệu, bộ lọc, xuất Excel và backend; (3) không chỉnh các bảng khác, không đổi luồng nghiệp vụ hoặc cấu trúc Sheets. Bàn giao ZIP source đầy đủ, `Code.gs` đồng bộ chỉ cập nhật nhãn phiên bản, tài liệu và kết quả test. Không deploy.

---

# MASTER PROMPT — YC-HN-021 / V5 (TÍCH LŨY)

**Trạng thái của phần bổ sung V5: CHỜ CHỐT. Chưa chỉnh sửa mã nguồn, chưa deploy hoặc thay đổi dữ liệu.**

**Nền để thực hiện thay đổi mới:** `v1.2.8-RC` — YC-HN-021 V4.1 đã CHỐT/đã bàn giao. Các mục V1–V4.1 phía dưới là lịch sử quyết định và không mở lại phạm vi nghiệp vụ chưa rõ. **Phần V5 chỉ điều chỉnh định dạng của Excel danh sách 25 cột.**

---

# MASTER PROMPT — YC-HN-021 / V4 (tích lũy V1–V4)

> **Bản đang hiệu lực để thảo luận:** V4 — bao gồm trọn V1–V3 và mục VIII. Các tiêu đề “CHỜ CHỐT V2/V3” dưới đây chỉ là lịch sử phiên bản, không thay đổi trạng thái hiện tại **ĐÃ CHỐT V4.1: triển khai các hạng mục đã rõ; nghiệp vụ tháng bỏ học V1 chưa được chốt công thức**.

## Điều chỉnh tháng bỏ học theo thời gian đào tạo và thu gọn cột Thao tác bằng biểu tượng

**Dự án:** Theo dõi học nghề  
**Mã nguồn nền để đối chiếu:** `THEO_DOI_HOC_NGHE_YC-HN-020_V1_v1.2.7-RC.zip` (`public/app.js`, `apps-script/Code.gs`).  
**Trạng thái:** CHỜ CHỐT YC-HN-021 V2. **Chưa viết code, chưa deploy, chưa sửa dữ liệu.**

### I. Yêu cầu người dùng đã nêu rõ

> “Hồ sơ trong phạm vi tháng nào thì chỉ được chọn tháng đó. Ví dụ: Thời gian học đến thời gian kết thúc là 3 tháng, thì chỉ chọn tháng 1,2,3. Không được chọn tháng thứ 4; thời gian học đến kết thúc là 7 tháng thì chỉ chọn được tháng từ tháng 1 đến tháng thứ 7.”

**Thay đổi so với YC-HN-018:** Tháng thứ 1 **không còn bị khóa mặc định** trong dropdown `Tháng bỏ học`. Hệ thống phải cho chọn từ **tháng thứ 1** đến **tháng thứ N**, trong đó N là số tháng của **thời gian đào tạo thực tế được xác định hợp lệ cho hồ sơ**. Những tháng vượt N không được chọn.

Ví dụ chấp nhận:

| Thời gian đào tạo của hồ sơ | Lựa chọn được bật | Lựa chọn bị khóa |
|---|---|---|
| 1 tháng | Tháng thứ 1 | Tháng 2–12 |
| 3 tháng | Tháng thứ 1, 2, 3 | Tháng 4–12 |
| 7 tháng | Tháng thứ 1–7 | Tháng 8–12 |
| 12 tháng | Tháng thứ 1–12 | Không có trong phạm vi 1–12 |

### II. Rà soát mã nguồn hiện tại

- Frontend `public/app.js`, hàm `dropoutPeriodOptions(months,selected,original)` hiện có điều kiện `valid=n>=2&&n<=limit`; `refreshDropoutPeriod` cũng coi `n>=2` mới hợp lệ. Cần thay đổi **đồng bộ** điều kiện mở tháng thứ 1 và logic cập nhật lựa chọn.
- Backend `apps-script/Code.gs`, hàm `dropoutPeriod_(raw,months,allowLegacy)` yêu cầu `n>=2` và `n<=N`. Không được chỉ mở dropdown mà bỏ qua backend; validator mới phải nhận `KY:1` **khi đáp ứng quy tắc nghiệp vụ được chốt**.
- Hiện `months` ở UI và backend dựa trên `SO_THANG_HO_TRO`. Người dùng vừa mô tả **thời gian học từ ngày bắt đầu đến ngày kết thúc**; hai dữ liệu này có thể không trùng nhau. Nguồn dữ liệu khóa đào tạo lưu ở `NGAY_BAT_DAU` và `NGAY_KET_THUC_DU_KIEN`; phải đối chiếu với `SO_THANG_HO_TRO` trước khi quyết định nguồn N ưu tiên. **Chưa được âm thầm coi số tháng hỗ trợ luôn bằng thời gian đào tạo.**

### III. Yêu cầu kỹ thuật sau khi CHỐT

**YC-021.01 — Dropdown theo phạm vi thời gian đào tạo.** Vẫn hiển thị 12 nhãn tháng thứ 1 đến thứ 12. Với N nguyên hợp lệ 1–12, bật các tháng 1...N, vô hiệu hóa N+1...12; có hướng dẫn “Khóa đào tạo N tháng — chỉ chọn tháng thứ 1 đến thứ N”. Các mục vô hiệu hóa không thể ghi qua API tự chế.

**YC-021.02 — Nguồn thời gian đào tạo.** Xác định N từ thời gian học (`NGAY_BAT_DAU`, `NGAY_KET_THUC_DU_KIEN`) **theo cách tính tháng được đơn vị chấp thuận**, đồng thời kiểm tra `SO_THANG_HO_TRO`. Nếu thiếu ngày, hai trường không khớp, hoặc khóa có tháng lẻ, không tự làm tròn hoặc tự chọn số tháng; hiển thị cảnh báo cần kiểm tra và tạm ngăn cập nhật kỳ không đủ căn cứ. Cần chốt quy tắc xác định N trước khi sửa logic tính nghiệp vụ.

**YC-021.03 — Tháng thứ 1 và nghiệp vụ trạng thái.** Người dùng đã yêu cầu **cho chọn tháng thứ 1**; việc được chọn không mặc nhiên xác định học viên “chưa tham gia” hay “đã tham gia ít nhất một ngày”. Phải tách **tháng bắt đầu nghỉ** khỏi **tình trạng tham gia thực tế** và **số tháng được xác nhận đã học**. Giữ quy tắc cũ rằng học ít nhất 1 ngày trong tháng được tính là đã học tháng đó nếu áp dụng; không tự suy luận `KY:1` thành `Không tham gia`, không tự ghi 0 tháng đã học, và không tự quyết toán hỗ trợ khi chưa có quy tắc nghiệp vụ chi tiết. Đối với trường hợp chưa từng học ngày nào, trạng thái `Không tham gia` vẫn tồn tại. Đây là điểm cần xác nhận về ý nghĩa `KY:1` trước khi đưa vào triển khai.

**YC-021.04 — Phòng tránh hỏng dữ liệu cũ.** Những hồ sơ đã lưu `KY:n` hoặc `NGAY_BO_HOC` kiểu ngày lịch sử vẫn giữ nguyên, không tự chuyển đổi khi chỉ mở/xem/sửa các trường khác. Không thêm tab/cột hoặc thay đổi nhật ký/PHIEN_BAN/phân quyền/nhập Excel hàng loạt, không làm thay đổi cách đếm quyết định trong báo cáo ngoài điều kiện nghiệp vụ được duyệt.

**YC-021.05 — Đồng bộ các đường ghi.** Sửa đồng bộ hàm `dropoutPeriodOptions`, `dropoutPeriodHelp`, `refreshDropoutPeriod`, các biểu mẫu thêm/sửa/tình trạng và `dropoutPeriod_` của Apps Script, cùng bất kỳ validator nghiệp vụ nào gọi lại. Lúc lưu, backend kiểm tra hồ sơ hiện tại dưới quyền đã xác thực, xác minh N, khóa ghi, phiên bản và giá trị KY:n.

**YC-021.06 — Kiểm thử nghiệm thu.** (1) N=3 chọn 1/2/3, chặn 4–12; (2) N=7 chọn 1–7, chặn 8–12; (3) N=1 chọn 1; (4) N=12 chọn 1–12; (5) tháng lẻ/thiếu ngày/hai trường khác nhau báo kiểm tra; (6) API giả mạo KY>N bị từ chối; (7) hồ sơ cũ và nhật ký được bảo toàn; (8) 3 vai trò giữ nguyên phân quyền; (9) chạy lại các kiểm thử v1.2.7-RC; chưa tuyên bố đạt khi chưa chạy.

### IV. Điểm cần làm rõ trước khi triển khai

1. **Ý nghĩa chọn tháng thứ 1:** Chọn `Bỏ học – Tháng thứ 1` có nghĩa là học viên **đã tham gia học trong tháng đầu rồi bỏ học ngay trong tháng đó**, hay là **ngưng tham gia từ đầu khóa và chưa học ngày nào**? Hai trường hợp không thể tự nhập nhằng với trạng thái `Không tham gia` và ảnh hưởng thống kê/thời gian hưởng.
2. **Khi số tháng hỗ trợ khác số tháng đào tạo theo ngày**, đơn vị muốn dùng con số nào làm giới hạn lựa chọn? Không thể tự quyết định từ mã nguồn.

**QUY TẮC BẢO TOÀN:** Chỉ cập nhật yêu cầu trong Master Prompt cho đến khi người dùng CHỐT. Nếu còn một trong hai điểm nghiệp vụ trên chưa xác định, chỉ sửa phần đã rõ khi có chỉ đạo, không tự sửa quy tắc hạch toán hoặc dữ liệu gốc.

---

### V. BỔ SUNG V2 — THAY NÚT CHỮ BẰNG ICON TRONG CỘT THAO TÁC (21/10/2026)

**Yêu cầu người dùng:** “Tôi muốn chi tiết, sửa, xóa, tình trạng, đính kèm thì để icon cho thu gọn lại cho hợp lí”. Ảnh chụp cho thấy bảng Hồ sơ học nghề hiện có 5 nút chữ `Chi tiết / Sửa / Xóa / Tình trạng / Đính kèm` trên một hàng. Yêu cầu là **thu gọn trình bày, không thêm/bớt hay thay đổi chức năng**.

**Đối chiếu source nền `v1.2.7-RC` (đã rà soát):** `public/app.js` tạo nút ngay khi dựng bảng ở `renderRecordRows()`/đường hiển thị danh sách, sử dụng lớp `.table-actions` với các `data-detail-record`, `data-edit-record`, `data-delete-record`, `data-status-record`, `data-file-modal`. Ngoài 5 nút được yêu cầu, có một nút điều kiện `Tệp` (`data-file-get`) nếu hồ sơ có tệp và tài khoản có quyền `FILE_VIEW`. `public/styles.css` đã định dạng `.table-actions{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;min-width:max-content}` và nút riêng. Mã nguồn đã có `iconSvg(name,size)` và bảng `ICON_PATHS`, nên ưu tiên bổ sung biểu tượng vào hệ thống sẵn có, không phụ thuộc CDN/thư viện icon ngoài.

#### YC-021.07 — Quy chuẩn nút icon-only trong bảng hồ sơ (P1)

1. Đổi phần **hiển thị** của 5 chức năng thành nút vuông gọn, dùng biểu tượng SVG nhất quán:
   - **Chi tiết:** biểu tượng `eye` (hình con mắt), nhãn truy cập `Chi tiết hồ sơ`.
   - **Sửa:** `pencil` (bút chì), nhãn `Sửa hồ sơ`.
   - **Xóa:** `trash-2` (thùng rác), nhãn `Xóa hồ sơ`, dùng dấu hiệu màu đỏ nhẹ/cảnh báo theo phong cách hiện tại.
   - **Tình trạng:** `clipboard-check` hoặc `list-check` (kiểm tra/cập nhật tình trạng), nhãn `Cập nhật tình trạng`.
   - **Đính kèm:** `paperclip` (kẹp giấy), nhãn `Quản lý tệp đính kèm`.
2. **Giữ nguyên chức năng `Tệp` hiện có**: nếu `r.HAS_FILE && allowed('FILE_VIEW')`, tiếp tục có nút biểu tượng riêng `file-down`/`file-text` với nhãn `Xem hoặc tải tệp hiện có`; không nhập nhằng nút này với `Đính kèm` vốn mở modal thao tác tệp, không được xóa chức năng hoặc tự hợp nhất hai luồng chưa được chốt.
3. Giữ đúng **thứ tự nút cũ** `Chi tiết → Sửa → Xóa → Tình trạng → Tệp (nếu có) → Đính kèm`, trừ khi thay đổi thứ tự được chốt riêng. Các nút chỉ hiển thị khi được cấp quyền như trước (`RECORD_EDIT`, `RECORD_STATUS`, `FILE_VIEW`, `FILE_UPLOAD`, `canDeleteRecord(r)`); không chỉ dựa vào giao diện để kiểm tra quyền.
4. Duy trì HTML `data-*` và event delegation/luồng sự kiện cũ; thay chữ hiển thị bằng icon và nhãn hỗ trợ mà **không viết lại logic mở modal, xác nhận xóa, tải tệp hoặc cập nhật tình trạng**.

#### YC-021.08 — Bố cục gọn, đồng nhất với giao diện đã duyệt (P1)

1. Nút hình vuông khoảng 34–38 px trên máy tính, kích thước nét icon 16–18 px; bo góc/border/màu xanh hiện hành. Khoảng cách nút 4–6 px. Trên thiết bị cảm ứng bảo đảm **vùng chạm hữu dụng khoảng 40–44 px**, tránh bấm nhầm khi ở sát nhau.
2. Cột `Thao tác` căn giữa ngang/dọc; trên desktop các icon nằm một hàng đồng đều, không để một icon rớt xuống dòng hoặc nút cao thấp bất thường. Không làm thay đổi căn lề/cỡ chữ của các cột thông tin khác.
3. Chỉ giảm độ rộng cột nếu vẫn đủ không gian cho tất cả nút người dùng **thực sự được phép thấy**, gồm nút Tệp điều kiện. Không ép bảng hẹp tới mức icon chồng nhau; trên màn hình nhỏ tận dụng cuộn ngang hiện có, hoặc điều chỉnh responsive trong đúng phạm vi và vẫn dùng đủ nút.
4. Không dùng riêng màu làm phương thức phân biệt; biểu tượng phải dễ hiểu và tương phản đủ. Nút Xóa được tách sắc thái cảnh báo, nhưng không đổi màu toàn bộ bảng hoặc nền đang được duyệt.
5. Không yêu cầu biểu tượng mới ở các nơi khác (trang Danh mục, Quản lý tài khoản, modal, nút lọc, nhập Excel) trừ khi có yêu cầu sau; chỉ giới hạn cột thao tác của bảng **Hồ sơ học nghề**.

#### YC-021.09 — Chú giải, khả năng sử dụng và phản hồi trạng thái (P1)

1. Khi rê chuột hoặc focus bàn phím vào mỗi icon, hiện chú giải tiếng Việt tương ứng (`Chi tiết`, `Sửa`, `Xóa`, `Tình trạng`, `Tệp`, `Đính kèm`), ví dụ bằng `title` hoặc tooltip phù hợp; mỗi nút phải có `aria-label` rõ, icon SVG phải `aria-hidden=true`.
2. Dùng thẻ `<button type="button">` để không vô tình submit biểu mẫu, có `:focus-visible`, thao tác bằng Tab + Enter/Space và trạng thái disabled/busy khi đang thực hiện tác vụ. Tooltip không cản bấm; trên điện thoại không dựa duy nhất vào hover để xác định chức năng: tên truy cập và nội dung trong modal cần rõ ràng.
3. **Chi tiết:** vẫn mở chi tiết chính xác hồ sơ đã chọn. **Sửa:** giữ luồng sửa. **Xóa:** giữ xác nhận nguy hiểm, ngăn gửi lặp, không xóa ngay chỉ vì bấm icon. **Tình trạng:** giữ modal và luồng kiểm tra/ghi, xử lý loading hiện có. **Đính kèm/Tệp:** giữ phân biệt tải/xem và quản lý tệp.
4. Không tạo `onclick` toàn cục mới hay thêm request API chỉ để hiển thị icon; dựng icon tại frontend, không tăng quota Apps Script.

#### YC-021.10 — Kiểm thử hồi quy trước khi bàn giao (P0/P1)

1. Ảnh chụp desktop: năm nút icon cùng hàng, căn giữa, kích thước nhất quán, không còn chữ tên nút; khi có tệp tồn tại thì có thêm icon Tệp đúng vị trí.
2. Từng nút vẫn trỏ đúng `HO_SO_ID`; không mở nhầm hồ sơ khi thay trang, lọc, tìm số quyết định hoặc đổi menu.
3. Quyền ADMIN / NHAN_VIEN / CO_SO_DAO_TAO: biểu tượng hiện/ẩn đúng quyền và backend không cấp quyền mới; `Xóa` vẫn chỉ hiện khi `canDeleteRecord()` đúng.
4. Kiểm thử chuột + keyboard (Tab, Enter, Space), focus, screen reader label, tooltip, màn hình hẹp/cảm ứng và bảng cuộn ngang; tránh nút chồng lấn và bấm nhầm.
5. Mở modal Chi tiết/Sửa/Tình trạng/Đính kèm, tải tệp hiện có; kiểm tra luồng Xóa có xác nhận, báo lỗi và thành công như trước, không double-submit.
6. Chạy lại ít nhất bộ **135 bài kiểm thử nền của v1.2.7-RC** và bổ sung kiểm thử UI đúng quyền/nút mới. Phần tháng bỏ học YC-021.01–06 phải được nghiệm thu độc lập sau khi các quy tắc nghiệp vụ còn mở được xác nhận. Không tuyên bố đã chạy test nếu chưa chỉnh code.

### VI. TRẠNG THÁI VÀ QUY TẮC TRIỂN KHAI

- **Đã xác định rõ, sẵn sàng thực hiện sau khi CHỐT:** YC-021.07–10, chỉ đổi 5/6 nút chữ thành icon + CSS/nhãn hỗ trợ, giữ luồng nghiệp vụ.
- **Đã nêu yêu cầu nhưng còn hai điểm nghiệp vụ cần chốt riêng:** YC-021.01–06 về tháng thứ 1 và nguồn tính số tháng đào tạo N khi `SO_THANG_HO_TRO` khác ngày bắt đầu/kết thúc. KHÔNG tự suy diễn số tháng đã học hoặc chế độ hưởng.
- **Chưa CHỐT YC-HN-021:** chưa viết code, chưa thay bản v1.2.7-RC, chưa deploy Apps Script/GitHub/Vercel, chưa sửa dữ liệu thật. Khi user CHỐT, nếu hai điểm nghiệp vụ tháng còn chưa rõ, chỉ triển khai phần icon đã xác định hoặc xin xác nhận cho phần tháng trước khi sửa, không tự chọn công thức.
- Giữ tất cả nghiệp vụ YC-HN-013–020 đã chốt, 7 tab/94 cột Google Sheets, phân quyền, cache, nhập Excel hàng loạt, báo cáo và cấu hình hiện hữu.

**TRẠNG THÁI: YC-HN-021 V2 — CHỜ CHỐT TỔNG THỂ, CHƯA VIẾT CODE.**


---

## VII. BỔ SUNG V3 — LẤY FILE EXCEL NGƯỜI DÙNG CUNG CẤP LÀM CHUẨN CĂN LỀ VÀ WRAP TEXT (21/10/2026)

**Nguồn mẫu được giao:** `danh-sach-hoc-nghe-2026-10-21 (2).xlsx`, sheet `Danh sách`. Đây là **file mẫu trình bày** gồm **25 cột A:Y, 2 dòng tiêu đề và 1 dòng dữ liệu minh họa**; không phải nguồn thay thế dữ liệu người học. Đã kiểm tra trực tiếp các thuộc tính alignment, wrapText, chiều cao hàng và chiều rộng cột từ tệp XLSX. **Trạng thái V3: CHỜ CHỐT; KHÔNG viết code hoặc thay đổi dữ liệu.**

### YC-021.11 — Quy tắc ưu tiên và phạm vi thay đổi (P0)

1. **Quy định mới ghi đè yêu cầu cũ** của YC-HN-020/V1 về `B — Họ và tên` và `O — Cơ sở đào tạo nghề` **căn phải**: từ V3, **cả B và O phải căn trái (`horizontal=left`)**, đồng thời căn giữa chiều dọc (`vertical=center`). Không được giữ căn phải vì đó là yêu cầu đã được thay thế bằng tệp mẫu mới.
2. Chỉ sửa **định dạng đầu ra danh sách Excel 25 cột** từ nút `Xuất Excel` trang Hồ sơ học nghề và lựa chọn `Danh sách` trong trang Báo cáo. Không can thiệp hai mẫu báo cáo ma trận theo cơ sở/nghề, bảng Tổng cộng nền vàng hoặc báo cáo 2 cột đang hoạt động đúng.
3. Giữ nguyên tất cả dữ liệu nguồn, trường dữ liệu, ngày tháng kiểu ngày thực, các mã định danh dạng text, cấu trúc Sheet/nguồn Google Sheets 7 tab/94 cột, phân quyền và quota. Không lấy giá trị dữ liệu giả định trong dòng mẫu để ghi vào hồ sơ thật.

### YC-021.12 — Phân loại căn ngang theo file mẫu (P1)

| Cột dữ liệu | Tính chất | Căn ngang | Căn dọc | Wrap Text |
|---|---|---|---|---|
| `B` — Họ và tên | Văn bản | **Trái** | **Giữa** | **Có nếu dài** |
| `O` — Cơ sở đào tạo nghề | Văn bản dài | **Trái** | **Giữa** | **Có, đặc biệt khi tên trường dài** |
| `J` — Nghề đăng ký | Văn bản dài | Trái | Giữa | Có |
| `R`, `S` — Địa chỉ tạm trú/thường trú | Văn bản dài | Trái | Giữa | Có khi dài |
| `V` — Nơi cấp CMND | Văn bản dài | Trái | Giữa | Có |
| `W` — Địa chỉ cơ sở đào tạo | Văn bản dài | Trái | Giữa | Có |
| `A,C,D,E,F,G,H,I,K,L,M,N,P,Q,T,U,X,Y` | STT, mã, số, ngày, giới tính, nhãn ngắn | **Giữa** | **Giữa** | Chỉ bật khi cần để hiển thị không bị cắt |

- Đối chiếu tệp gốc cho thấy **B3 và O3 có alignment `left/center` và `wrapText=true`**. J3, R3, V3 và W3 có `vertical=center` và `wrapText=true`, còn `horizontal` để mặc định (Excel tự hiển thị văn bản sang trái); phiên bản nâng cấp nên **đặt căn trái tường minh** để thống nhất. S3 trong mẫu hiện chưa bật Wrap Text; yêu cầu mới là **bật khi nội dung dài**.
- Dòng **tiêu đề 1–2** của mọi cột vẫn **căn giữa ngang/dọc**, chữ đậm, đường viền và Wrap Text. Không áp quy tắc căn trái của **ô dữ liệu B/O** cho tiêu đề B1/O1.
- Không dùng căn đều hai bên (justify/distributed) khi người dùng chỉ yêu cầu căn trái và căn giữa.

### YC-021.13 — Độ rộng cột, ngắt dòng và chiều cao hàng (P1)

1. Giữ đủ 25 cột A:Y, 2 dòng tiêu đề và vùng gộp `M1:N1`. Căn theo tỷ lệ của file mẫu, có thể điều chỉnh hợp lý theo thực tế: `B ≈ 30`, `O ≈ 31.4` đơn vị độ rộng Excel; các cột dài J/R/S/V/W cho độ rộng phù hợp và **Wrap Text** để không tràn sang cột bên cạnh.
2. Trong file mẫu, hàng tiêu đề 1 **43 pt**, hàng tiêu đề 2 **33 pt** và **hàng dữ liệu minh họa 76 pt**. Đây là **số đo để tham chiếu**, không được áp cố định 76 pt cho mọi hồ sơ; dữ liệu ngắn dùng chiều cao tối thiểu thống nhất, dữ liệu dài tự tăng chiều cao đủ để nhìn thấy hết các dòng sau wrap. Nội dung luôn `vertical=center`.
3. Khi tạo file 2.433–5.000 hồ sơ, tính chiều cao theo số dòng hiển thị/độ rộng cột với giới hạn hợp lý, tránh tất cả hàng bất thường cao như nhau hoặc cắt chữ. Nếu thư viện ghi XLSX chưa có tự đo hàng chính xác, chọn thuật toán có kiểm thử thực tế Excel/WPS với chuỗi dài có dấu tiếng Việt.
4. Tất cả các vùng dữ liệu phải có viền, không che khuất chữ; không phá định dạng ngày `dd/mm/yyyy` và kiểu dữ liệu date thực, mã có số 0 ở đầu, `Nam/Nữ/Khác` đã chốt tại YC-HN-020.

### YC-021.14 — Cập nhật đúng đường mã nguồn và kiểm thử (P1)

1. Tại frontend/`public/xlsx-export.js`, nơi sinh XLSX danh sách đã được đồng bộ từ YC-HN-020, tạo styles căn **trái/giữa dọc/wrap** cho B,O,J,R,S,V,W; căn giữa ngang/dọc cho các cột còn lại. Kiểm tra `public/app.js` chỉ để bảo đảm cả hai đường xuất danh sách sử dụng cùng exporter; **không đổi Apps Script nếu không cần thiết**.
2. Chạy kiểm thử cấu trúc file: quan sát các cell B3/O3 và nhiều hàng dài, `horizontal=left`, `vertical=center`, `wrapText=true`; A3/D3/G3, v.v. `center/center`; hàng 1–2 `center/center`; đúng 25 cột và gộp M1:N1.
3. Mở file bằng **Microsoft Excel hoặc WPS** để xem hàng có tên trường dài, địa chỉ dài; kiểm tra văn bản không đè/tràn, chiều cao hàng tăng vừa đủ, không bị mất dấu tiếng Việt, không lệch cột. Kiểm tra tài liệu ngày và giới tính giữ như v1.2.7-RC.
4. Thử xuất từ **Hồ sơ học nghề** và **Báo cáo → Danh sách**; so sánh cùng kết quả/cùng style. Kiểm thử trên nhiều khối dữ liệu và tối đa giới hạn xuất, không tạo thêm request Google Sheets chỉ vì định dạng.
5. Sau CHỐT phần code, chạy lại bộ test nền v1.2.7-RC + kiểm thử V3 mới và rà các phần icon V2, tháng bỏ học V1 theo phạm vi nghiệp vụ được xác nhận; ghi rõ test tự động với test mở file trên máy thật nếu chưa thực hiện.

### VII.1. Trạng thái sau V3

- **V1**: quy tắc tháng bỏ học 1...N theo thời gian đào tạo; còn điểm nghiệp vụ cần thống nhất riêng về `KY:1` và nguồn tính N khi dữ liệu đào tạo khác tháng hỗ trợ.
- **V2**: thay nút chữ Chi tiết/Sửa/Xóa/Tình trạng/Đính kèm và nút Tệp điều kiện bằng icon; không đổi chức năng.
- **V3**: **lấy tệp Excel mẫu làm chuẩn**; B/O căn **trái** và giữa dọc, Wrap Text; các trường văn bản dài còn lại căn trái, các cột số/ngày/ngắn căn giữa; độ cao hàng tự thích ứng, không tự copy dữ liệu mẫu.

**YC-HN-021 V3 — CHỜ CHỐT TỔNG THỂ. Chưa chỉnh code, chưa deploy, chưa sửa Google Sheets hoặc Excel gốc.**

---

# VIII. BỔ SUNG V4 — KIỂM TOÁN HIỆU NĂNG, CACHE, PHÂN QUYỀN VÀ TRẢI NGHIỆM CHUYỂN MENU (21/10/2026)

**Yêu cầu người dùng:** Hệ thống phải phản hồi mượt khi tìm số quyết định, xóa từ khóa để quay lại toàn bộ hồ sơ, chuyển menu, trở lại phần mềm sau vài phút làm việc ở website khác; tránh chặn toàn bộ màn hình bằng “Đang kiểm tra quyền truy cập…”. Tối ưu trên **cả ba nhóm ADMIN / NHAN_VIEN / CO_SO_DAO_TAO** và không gây rò rỉ dữ liệu hay ghi sai.

**Trạng thái:** PHÂN TÍCH VÀ ĐẶC TẢ, **CHỜ CHỐT YC-HN-021 V4**. Chưa sửa code, chưa deploy, chưa thay Google Sheets. V4 tích lũy toàn bộ V1–V3; phần tháng bỏ học V1 vẫn còn hai điểm nghiệp vụ chưa được chốt và không được tự suy diễn.

**Mã nguồn đã rà soát trực tiếp (người dùng vừa cung cấp):**
- GitHub ZIP `theo-doi-hoc-nghe (2).zip`: `public/app.js` (~1.192 dòng), `api/rpc.js` (~111 dòng), `apps-script/Code.gs` (~1.388 dòng), `public/styles.css`, `vercel.json`.
- `Văn bản đã dán (2).txt` chứa **cùng nội dung Code.gs** với file trong ZIP (khác xuống dòng CRLF/LF); vì vậy không có hai phiên bản logic backend bất nhất trong hai đầu vào này.
- Ảnh v1.2.7-RC cho thấy menu Hồ sơ học nghề bị thay bằng thông báo `Đang kiểm tra quyền truy cập…`.
- Nhận định dưới đây căn cứ mã nguồn (tĩnh); **chưa benchmark mạng/Vercel/Google Sheets production, chưa có log để khẳng định số giây hay tỉ trọng mỗi khâu**.

## VIII.1. Phát hiện có chứng cứ từ source

| Mã | Mức | File / đường code thực tế | Kết luận có chứng cứ | Tác động |
|---|---|---|---|---|
| F-V4.01 | P0 | `public/app.js`: `verifyPermission()` ~56–88, `navigate()` ~199–252 | `permissionChecked` hết hạn sau **120.000 ms**; `navigate()` khi `!permissionFresh` **thay toàn bộ `#main`** bằng thông báo kiểm tra quyền trước khi gọi API. Đây là nguyên nhân trực tiếp của ảnh. | Sau khi chuyển website 3–4 phút, bấm menu lại thấy màn hình trắng/chờ thay vì trang đã xem. |
| F-V4.02 | P1 | `public/app.js`: `PAGE_AGE` ~182 = **300.000 ms**; `rpc()` ~90–116 lưu cache đọc theo TTL; `loadRecordList()` ~445–456 TTL **45.000 ms**, `overview` **90.000 ms** | Ba tuổi thọ không đồng bộ. Trang snapshot còn tồn tại nhưng khi quyền >120 s phải đợi xác minh, khi dữ liệu trang >300 s lại gọi API. | Chuyển menu nhanh lúc đầu nhưng chậm lại theo thời gian. |
| F-V4.03 | P0 | `public/app.js`: `cacheKey()` ~49 tạo `permissionScope() + '::' + action + '|' + JSON`; xử lý xóa hồ sơ ~1067 dùng `k.startsWith('records_list|')` | Điều kiện **không thể khớp** với khóa bình thường có tiền tố `permissionScope()::`. Vì vậy vòng lặp điều chỉnh cache kết quả sau khi xóa không thực thi trên các khóa này. | Có nguy cơ tái hiển thị hàng đã xóa, sai tổng số ở cache frontend cho đến lúc bị invalidation/TTL. |
| F-V4.04 | P1 | `public/app.js`: `input` handler ~1144–1145; submit `records-filters` ~1151; `applyRecordFilters()` ~347–354 | Không có event tự áp dụng bộ lọc khi **xóa rỗng ô `query`**; chỉ lọc khi submit. Việc xóa giá trị và xóa điều kiện **là hai thao tác khác nhau**. | Người dùng nghĩ đã xóa tìm kiếm nhưng bảng còn kết quả cũ tới khi bấm Lọc. |
| F-V4.05 | P1 | `apps-script/Code.gs`: `listRecords_()` ~632–636, `filteredRecords_()` ~561–563, `cachedRecordSnapshot_()` ~505–537, `sheetRows_()` ~265–270 | Khi query rỗng/cache miss, toàn bộ hồ sơ nhìn thấy được lọc/sắp xếp trước khi cắt **20 dòng**. Cache snapshot miss có thể đọc ~2.433 × **40 cột** = **97.320 ô** (nếu 2.433 hồ sơ; với 3.000 = 120.000 ô). | Truy vấn về Tất cả lâu hơn tìm quyết định chính xác; tăng quota Sheets và thời gian thực thi. |
| F-V4.06 | P1 | `apps-script/Code.gs`: `exactDecisionRecords_()` ~566–610 | Có chỉ mục quyết định trong CacheService TTL **60 s**, nhưng nếu miss vẫn phải đọc cột số QĐ của toàn bộ hàng; đọc riêng 40 ô cho mỗi hit; hit nhiều có fallback full-scan. Chỉ mục dựa trên `REV_DATA`+`lastRow` không tự nhận biết chỉnh sửa thủ công trong Sheet. | Tìm một số quyết định có thể nhanh khi nóng, chậm khi lạnh; chỉnh sửa trực tiếp Sheet có nguy cơ sai lệch trong cửa sổ cache. |
| F-V4.07 | P1 | `apps-script/Code.gs`: `authorize_()` ~354–399; `permissionCheck_()` ~415–418; `schoolBinding_()` ~302–308; `api/rpc.js` ~39–103 | Mọi RPC đều phải qua Vercel, xác thực, HMAC và Apps Script. Cache quyền server tối đa **25 s**; khi miss có thể đọc bảng tài khoản, cấu hình gán trường và danh mục. `permission_check` nhẹ hơn `bootstrap`, nhưng **không phải chi phí 0**. | Mốc 120s của frontend thường kéo theo chuyến đi server, dễ sinh cảm giác lag do mạng/cold-start. |
| F-V4.08 | P1 | `apps-script/Code.gs`: `statusRecord_()` ~670–706; `writeRecord_()` ~273–277; `findRowNumber_()` ~280–286; `withLock_()` ~288–294 | Mỗi cập nhật trạng thái vẫn đọc ID của hàng nghìn hồ sơ, đọc đúng 40 ô một hàng, xác minh phiên bản/owner, ghi một hàng 40 ô, tăng `REV_DATA`, ghi audit trong lock. **Lock có thể chờ tối đa 25s.** | Lượt ghi có thể chậm; chỉnh frontend không làm thao tác ghi thật nhanh hơn. |
| F-V4.09 | P1 | `apps-script/Code.gs`: `bump_('DATA')` ~701; `overview_()` ~919–933 và `reportRecords_()` ~628–630; `public/app.js` ~98–111 | Mỗi lần cập nhật tăng revision toàn bộ tập dữ liệu. Các cache đọc theo revision sẽ miss, kể cả trang thống kê và query không trực tiếp liên quan đến hồ sơ vừa sửa. `rpc(mutate)` frontend còn đặt `dataRevision=''`. | Sau ghi thành công, lần chuyển Tổng quan/Báo cáo có thể phải thống kê lại toàn bộ. |
| F-V4.10 | P1 | `public/app.js`: `loadRecordList()` ~445–456; `routeVersion` + `recordLoadVersion`; `navigate()`; `pageViews` | Đã có chống response cũ ghi đè và snapshot trang, nhưng một số tình huống điều hướng `force=true`/hết hạn tuổi trang dẫn đến gọi lại RPC và dựng lại vùng bảng. | Chuyển 1→2→1, đổi menu nhiều lần vẫn không ổn định về tốc độ sau TTL. |
| F-V4.11 | P2 | `api/rpc.js` ~81–86 | Gateway gọi Apps Script với timeout **52 s**, không cache công khai (`no-store`); chưa có số đo phân rã thời gian tại Vercel. | Không thể quy kết Google Sheets chịu 100% độ trễ chỉ từ ảnh. |
| F-V4.12 | P2 | `apps-script/Code.gs`: `HN_PERF_TEST`, `perfEmit_()` ~239–254; ghi đo `statusRecord_()` | Có thống kê `totalMs`, `authMs`, `lockWaitMs`, lượt đọc ô, và thời gian lookup/read/validation/write/revision/audit. Thiếu phép đo đầy đủ `client-click → fetch → Vercel → GAS → render`, cache hit/miss và độ trễ route. | Cần dựng baseline có số đo trước khi quyết định thay đổi index/cache và đưa ra mục tiêu. |

**Phân biệt:** F-V4.01 và F-V4.03 là **lỗi/điểm bất hợp lý xác định từ mã nguồn**. F-V4.05–12 là **chi phí hoặc cơ hội tối ưu đã xác định đường chạy**; độ trễ thực tế cần đo trong môi trường staging/production được phép. Google Sheets chứa ~2.400–3.000 hồ sơ **chưa phải lý do bắt buộc chuyển database**.

## VIII.2. Yêu cầu khắc phục đề xuất sau khi CHỐT

### YC-021.15 — Chuyển menu không làm trắng toàn màn hình (P0)
1. **Không còn thay toàn bộ `#main` bằng “Đang kiểm tra quyền truy cập…” chỉ vì mốc 120s khi người dùng bấm menu.** Tách (a) shell, menu, tiêu đề, bộ lọc, vị trí cuộn và (b) dữ liệu có quyền truy cập, thành hai vòng đời rõ ràng.
2. Giữ trang đang xem, không đặt banner toàn màn hình để đợi `permission_check`. Khi có quyền còn hiệu lực, chuyển nhanh bằng snapshot/cache RAM. Với quyền cần xác minh lại: thực hiện đồng bộ quyền **không chặn shell**; chỉ bật dữ liệu nhạy cảm của trang đích sau khi xác minh hợp lệ. Có thể dùng skeleton gọn tại vùng bảng trong khi chờ, không được hiển thị dữ liệu không còn quyền.
3. Khi chuyển tab website đi rồi quay lại, thực hiện kiểm tra quyền tối ưu theo tín hiệu `visibilitychange`/`focus`/`pageshow` **có debounce/single-flight**; ưu tiên kiểm tra sớm khi có điều kiện và tránh tạo một request mới cho mỗi menu. Lưu ý trình duyệt có thể throttle tác vụ nền, vì vậy **không hứa bảo đảm xác minh xong trước khi quay lại trong mọi trường hợp**.
4. Nếu quyền đổi, tài khoản bị khóa/đổi trường/email, logout hoặc cookie hết hạn: dừng request cũ, xóa dữ liệu/cache riêng tư, chuyển sang login hoặc thông báo phù hợp; tuyệt đối không tái hiện snapshot trường cũ. Nếu quyền còn hợp lệ: giữ shell và nội dung đã có; không làm flash trang trắng.
5. Giữ quy tắc backend: **mọi thao tác API vẫn xác minh quyền tại Apps Script**. Không “tối ưu” bằng cách bỏ `permission_check` vĩnh viễn, bỏ `authorize_()`, kéo dài vô hạn quyền hay cho frontend tự xác nhận.

### YC-021.16 — Xây lại quản lý snapshot và vòng đời route (P0)
1. Rà `navigate`, `rememberPage`, `finishPageLoad`, `renderRecords`, `renderDashboard`, `renderReports`, `pageViews`, `pageDataAt`, `permissionChecked`, `routeVersion`.
2. Cache trang theo scope `{accountId,email,role,TRUONG_ID,permissionRevision,dataRevision,filter,page}` và thời hạn hợp lý; phân biệt hiển thị tức thời (render cache đã được quyền xác minh) với nền refresh. Không dùng `innerHTML` cũ chứa trạng thái form khác; hiện lại đúng draft/applied filters.
3. Chuyển menu nhiều lần trong một khoảng ngắn không được tạo các request trùng nhau. Chặn response route A ghi vào route B và response filter A ghi đè filter B. Dọn request/promise cũ không còn người chờ, không mất thông báo lỗi.
4. Không xóa cache dữ liệu khi **chỉ đổi menu, đổi trang hoặc xóa từ khóa**, trừ cache đúng scope/phiên bản hết hiệu lực. `force=true` chỉ có nghĩa là *được yêu cầu refresh*, không đồng nghĩa phải hủy toàn bộ DOM và cache.
5. Giữ scroll, bộ lọc và trang phân trang khi phù hợp. Sự kiện đổi bộ lọc được người dùng áp dụng thì quay về trang 1; chỉ nhấn menu không được tự reset.

### YC-021.17 — Tìm số quyết định nhanh, nhất quán (P0/P1)
1. Tối ưu đường tìm số QĐ chính xác đang có trong `exactDecisionRecords_`: cân nhắc chỉ mục gọn trong cache theo `REV_DATA`, năm/row position, kiểm tra lại `HO_SO_ID`, số QĐ và quyền trước khi trả; không xây index dài hạn giữ thông tin cá nhân không cần thiết.
2. Đo cold/warm performance của đọc một cột/đọc snapshot/lọc trong RAM và số hit. Chỉ chọn chiến lược dựa benchmark; **không mặc định tạo thêm tab Sheet, database, hoặc tải cả 3.000 hồ sơ xuống frontend**.
3. Chỉ mục phải xử lý được quyết định `67`, `067`, `0067` theo nghiệp vụ đã chốt; tên người học có dấu/không dấu, trùng tên khác hồ sơ; số QĐ trùng khác năm nhưng khác phạm vi filter. Không tự “fuzzy” số QĐ nếu người dùng nhập số chính xác.
4. Khi direct edit / sort Google Sheets xảy ra ngoài ứng dụng và `REV_DATA` không tăng, index có thể stale: cần chiến lược thời hạn/kiểm tra lại/fallback rõ ràng, đặc biệt đối với **kết quả không tìm thấy**. Không trả quyết định sai sau sort.

### YC-021.18 — Xóa từ khóa là trở về kết quả “Tất cả” nhanh (P0)
1. **KHÔNG bổ sung nút X** vào ô tìm Người học/số QĐ (người dùng đã bác bỏ khi CHỐT V4.1). Chỉ khi tự xóa hết từ khóa bằng bàn phím thì `query=''`, giữ các filter năm/trường/nghề/tình trạng/ngày, tự áp dụng mà không cần nhấn Lọc lần hai; `page=1`.
2. Hỗ trợ xóa **chỉ bằng Backspace/Delete:** khi chuỗi thành rỗng thì tự trả về danh sách phù hợp sau debounce ngắn; thao tác nhập từ khóa bình thường không phát request cho từng ký tự, hỗ trợ IME tiếng Việt/composition. Có thể giữ nút Lọc dữ liệu và Enter để áp dụng tường minh.
3. Dùng bộ lọc Tất cả đã cache và **còn hợp lệ theo quyền + data revision** để hiển thị ngay; nếu không có thì giữ form/header, hiện trạng thái nhỏ tại danh sách và thực hiện một request. Không làm trống toàn bộ trang và không tự phục hồi giá trị từ khóa cũ.
4. Rà đồng thời `state.filters`, giá trị DOM, `pageViews`, `recordPage`, `activeRecordRequestKey`, cacheKey JSON; sau khi **xóa trắng bằng bàn phím**, quay menu rồi quay lại không được khôi phục query cũ.
5. Có kiểm tra response race: tìm `6273` → xóa rỗng → tìm `6204`, kết quả cũ tới sau không đè bảng/từ khóa mới. Lỗi mạng giữ từ khóa hiện tại và nút thử lại đúng filter.

### YC-021.19 — Fix lỗi cache sau xóa và thống nhất invalidation (P0)
1. Thay logic kiểm tra `k.startsWith('records_list|')` ở đường `data-confirm-delete`: khóa thực có tiền tố `permissionScope()::`, nên phải dùng bộ phân tích hành động/khóa thống nhất (`cacheAction()` hoặc cấu trúc cache record chuẩn) thay vì kiểm tra chuỗi sai.
2. Sau xóa mềm: vô hiệu hóa/điều chỉnh **mọi** cache mà hồ sơ này có thể xuất hiện (bảng lọc, tổng số, page thứ N, tìm QĐ, KPI, báo cáo, xuất Excel, scope); việc optimistic remove nếu áp dụng chỉ là phản hồi tức thời, không được coi là bằng chứng đã commit trước khi server xác nhận.
3. Sau cập nhật trạng thái: không để cache danh sách với filter cũ hiển thị sai số dòng/tổng. Rà `preserveRecordList`, `dataRevision=''`, `state.generation` và cache query. Nếu kết quả lọc thay đổi, đổi badge và loại/thêm hàng hợp lệ hoặc làm mới riêng vùng danh sách, không dựng lại cả trang.
4. Khi thao tác thất bại hoặc phiên bản xung đột, trả lại trạng thái trước đó; dữ liệu của người khác vừa sửa luôn được ưu tiên. Không giả định cache frontend là nguồn sự thật.

### YC-021.20 — Tối ưu đọc Google Sheets và phân trang (P1)
1. Benchmark `sheetRows_`, `cachedRecordSnapshot_`, `filteredRecords_`, `exactDecisionRecords_`, `listRecords_`, `overview_`, `reportRecords_`.
2. Tránh full sort trong luồng chỉ cần thống kê đếm; dùng thuật toán chỉ giữ top K khi phù hợp **và** vẫn bảo đảm `total`, sort ổn định, page đúng. Đối với filter, cân nhắc snapshot dạng nhẹ và chi tiết theo hàng; chỉ triển khai khi đo nhanh hơn. Giữ lọc đúng quyền *trước* phân trang.
3. Dùng `CacheService.getAll/putAll` đã có đúng cách; tránh cache quá lớn/giới hạn chunk hoặc cache hết hạn lệch gây đọc toàn bộ liên tục. Nếu cache miss nửa chừng phải fallback đủ dữ liệu, không trả thiếu.
4. Chú ý cache tại các tầng: browser RAM theo session/scope/revision, GAS CacheService revisioned, và **không dùng cache công khai chứa thông tin học viên ở Vercel/CDN**. Không đưa PII ra localStorage/sessionStorage/IndexedDB trừ khi được duyệt riêng (mặc định KHÔNG).
5. Google Sheets vẫn là nguồn sự thật và giữ nguyên 7 tab, 94 cột. Không mở rộng schema hay chia Sheet ngầm trong phạm vi V4.

### YC-021.21 — Rút ngắn thời gian xác thực mà không suy giảm quyền (P1)
1. Tối ưu số lần mở Spreadsheet, đọc bảng tài khoản, `schoolBinding_`, danh mục trường và thuộc tính cấu hình ở `authorize_`/`permissionCheck_`; ưu tiên cache quyền ngắn theo `USERS`/`CAT` revision nhưng bắt buộc fail-closed và kiểm tra Google `sub`/email/session.
2. Single-flight request `permission_check` trong trình duyệt; không gửi request trùng khi người dùng click menu liên tục. Xác minh lại sau app focus/back-forward khi cần, nhưng không cản shell và không lặp vô hạn nếu lỗi mạng.
3. Đổi người dùng/role, đổi Gmail, trường ABC→XYZ, khóa hoặc xóa tài khoản từ giao diện phải làm mất ngay cache scope cũ. Ghi log nguyên nhân làm mới mà không lộ email hay hồ sơ trong telemetry.
4. Không nới TTL quyền tùy tiện chỉ để có tốc độ; quy tắc bảo mật và dữ liệu của cơ sở đào tạo được ưu tiên.

### YC-021.22 — Tối ưu sau cập nhật tình trạng (P1)
1. Đo `findRowNumber_` (đọc ID), đọc 40 ô/1 hàng, `writeRecord_`, lock wait, `bump_('DATA')`, `audit_`; giảm *số chuyến gọi Sheets* và thời gian giữ lock nếu có chứng cứ an toàn.
2. Không bỏ khóa ghi, version `PHIEN_BAN`, kiểm quyền, tính hợp lệ trạng thái/khóa học, chống request trùng hoặc nhật ký. Không hứa “1 giây” nếu chưa benchmark môi trường thật.
3. Nếu cập nhật thành công, sửa badge và thông tin của đúng dòng; refresh số liệu thống kê liên quan theo revision khi cần. Nếu response mất sau commit, tra cứu lại trước khi gửi lần hai.
4. Không xóa mọi snapshot do một sửa nhỏ nếu scope khác dữ liệu không cần thay đổi; nhưng không giữ số liệu sai chỉ để tốc độ nhanh.

### YC-021.23 — Phản hồi thao tác và giao diện nhẹ (P1)
1. Người dùng bấm tìm/lọc/xóa query/đổi trang/menu: nút phản hồi ngay (`aria-busy`, spinner nhỏ chỉ vùng kết quả), giữ tiêu đề/bộ lọc/danh sách trước đó nếu có thể sử dụng hợp lệ; không flash toàn màn hình, không che toàn bộ bảng và không tự cuộn về đầu bất ngờ.
2. Giao diện đang xác minh lại quyền hoặc kiểm tra dữ liệu có trạng thái nhỏ, dễ hiểu nhưng không có dòng chặn toàn trang `Đang kiểm tra quyền truy cập…`. Nếu cần tạm khóa thao tác ghi trong lúc xác minh, chỉ khóa đúng nút/khối chức năng.
3. Có lỗi mạng/hết session: hiện thông báo tường minh, một lần thử lại, không loop vô tận, không đè bộ lọc/giá trị đang nhập; phân biệt `Không có kết quả` với `Chưa tải xong` và `Có lỗi`.
4. Giữ toàn bộ màu, logo, font, bố cục đã duyệt; xử lý YC-021.07–10 icon Thao tác và YC-021.11–14 Excel theo V2/V3 **không xung đột** với cải tiến hiệu năng.

### YC-021.24 — Đo lường và quota bắt buộc (P0)
1. Bổ sung log **không PII** tại frontend: `click→UI feedback`, `click→request start`, `request end`, `DOM paint`, `cache hit/miss`, route, query type (numeric/empty/text, không log query), `requestId` đã ẩn thông tin.
2. Bổ sung phép đo tại Vercel: thời gian xác minh phiên, ký envelope, chờ GAS, đọc/trả payload, lỗi/timeout; tại GAS: `authorize`, cache metadata, đọc Sheets, lọc/sort, lock wait, read/write/audit, revision.
3. Chỉ bật chi tiết trên staging/cấu hình đo kiểm; hạn chế log số BHXH, họ tên, số CMND, email, dữ liệu hồ sơ, cookie, HMAC secret và ID token.
4. Test 100/1.000/3.000/5.000 hồ sơ (mock và nếu được phép staging có dữ liệu phi định danh), 3 lần cold + 3 warm, ít nhất hai mạng nhanh/chậm; đo 3 vai trò. Báo cáo trước–sau ở median/p95, Google Sheet read calls, cells read, CacheService calls/hit, Apps Script execution time, Vercel timing. **Đích nghiệm thu UX (không phải cam kết thời gian network):** nhấn nút có phản hồi <150–250ms trong thử nghiệm môi trường kiểm soát; phục hồi DOM đã xác minh và cache nóng mục tiêu <300ms; các giao dịch cần backend phải nêu số thực đo sau triển khai.

### YC-021.25 — Kiểm thử và tiêu chí nghiệm thu

**Tối thiểu các ca bắt buộc sau, ngoài bộ test nền v1.2.7-RC (135 bài nếu có đủ môi trường):**

1. ADMIN/NHAN_VIEN/CO_SO_DAO_TAO: Tổng quan → Hồ sơ → Báo cáo → Tổng quan trong dưới 120s, sau 120s, sau 240s, sau 300s; không thay toàn bộ `#main` bằng thông báo kiểm tra quyền khi vẫn có thể hiển thị shell hợp lệ. Khi cache nóng và quyền còn hiệu lực không gửi lại API dữ liệu chỉ vì đổi menu.
2. Chuyển sang website khác 4 phút rồi quay lại: giao diện không trắng; nếu cần xác minh quyền thì kiểm tra nền có single-flight, đảm bảo dữ liệu hồ sơ khác trường không lộ trong lúc chờ; sau quyền hợp lệ phục hồi đúng menu/bộ lọc.
3. ADMIN tìm QĐ `6273`; ô giữ `6273` trong suốt request. **Xóa bằng Backspace/Delete (không có dấu X mới)**, danh sách tự về kết quả Tất cả theo filter còn lại, trang 1, ô luôn rỗng, không cần submit lần hai; debounce/IME an toàn.
4. Lọc QĐ `6273` → `6204` → xóa → `67` khi mạng phản hồi đảo thứ tự: chỉ hiển thị kết quả của request mới nhất; có handling lỗi mạng; không làm nhấp nháy form.
5. Lọc theo năm/trường/nghề/tình trạng/từ-đến ngày + xóa từ khóa: giữ nguyên các filter còn lại, giữ tổng đếm đúng. Tìm QĐ có số 0 đầu và trùng tên khác hồ sơ phải đúng.
6. Trở về trang 1→2→1 trong cùng filter, cache nóng phục hồi mà không tải lại toàn bộ; nếu dữ liệu đã đổi thì cập nhật đúng và không ghi đè request mới.
7. Xóa hồ sơ thành công: cache đã lọc/search/list/count không còn hiển thị bản ghi đó; sửa điều kiện `startsWith` nêu F-V4.03, có test trực tiếp **cacheKey thật có tiền tố scope**; xóa lỗi/version conflict không loại bản ghi trên màn hình.
8. Sau cập nhật trạng thái, bảng/trang Tổng quan/Báo cáo đúng số; hai tài khoản sửa cùng hồ sơ có phiên bản xung đột, không ghi đè; mạng đứt sau commit không tự gửi trùng.
9. Đổi gán trường ABC→XYZ, đổi email/role, khóa tài khoản trong lúc tab đang ngủ: mọi cache/snapshot sai quyền bị xóa, không xem được dữ liệu cũ; backend chặn mọi request ngoài phạm vi.
10. Manual reorder/sort Sheets sau khi index số QĐ được cache: kiểm tra lại vị trí hàng, fallback nếu stale; không bao giờ trả nhầm hồ sơ. Nếu chỉnh sửa trực tiếp ngoài app và revision không tăng, phải ghi rõ giới hạn consistency và cơ chế tự hồi phục.
11. Rà tính ổn định của Dashboard, Báo cáo, Danh mục, Quản lý tài khoản, Nhật ký; thử menu back/forward/reload/F5/đa tab; không tạo vòng request lặp.
12. Test quota/cache lạnh/nóng, concurrent calls, quota chạm ngưỡng, Apps Script cold-start, mất mạng, lỗi 401/403/5xx, timeout; có báo cáo phân biệt lỗi và chậm, không vô hạn spinner.
13. Kiểm thử UX trên Chrome desktop và màn hình nhỏ; các icon V2 đúng quyền, Excel V3 giữ định dạng mẫu, không sửa nghiệp vụ tháng bỏ học chưa chốt.

## VIII.3. Thứ tự triển khai được đề xuất sau CHỐT

- **Đợt A — P0 khẩn:** fix `navigate/verifyPermission` không trắng trang; sửa nhận diện cache sau Xóa; tự reset query và xử lý race/draft; giữ shell ổn định.
- **Đợt B — P1 backend:** benchmark và tối ưu full scan, decision index, auth lookup, cache snapshot/aggregate, invalidation, ghi trạng thái mà không hạ an toàn.
- **Đợt C — đo/kiểm thử:** so sánh cold/warm, test 3 vai trò, test tính nhất quán và bảo mật, đánh giá quota; rollback theo phiên bản cũ khi lỗi.
- Không tự đổi cơ sở dữ liệu sang Firebase/Supabase, không tạo Sheet mới, không tăng thời gian cache quyền vô hạn, không gửi thông tin hồ sơ lên CDN, không bỏ kiểm tra phân quyền.
- Nếu việc chỉnh sửa mới ảnh hưởng `YC-021.01–06` **tháng bỏ học** chưa được làm rõ, **không đụng logic nghiệp vụ đó**. Các phần icon V2, Excel V3 vẫn tích lũy; không được lược bỏ khi bàn giao toàn bộ phiên bản YC-HN-021.

## VIII.4. Bàn giao sau CHỐT / trạng thái hiện tại

**Khi được CHỐT triển khai:** sửa chính xác các file thực tế cần sửa, cung cấp ZIP GitHub hoàn chỉnh, Apps Script `Code.gs` đầy đủ nếu backend thay đổi, changelog có dòng/luồng sửa, kết quả test thật, baseline benchmark (nếu có môi trường), và quy trình staging→rollback→production. Không chỉ đưa đoạn patch rời. Không thay dữ liệu Google Sheets production.

**Hiện tại:** chỉ kiểm toán tĩnh từ mã nguồn và cập nhật MASTER PROMPT, chưa có kết quả kiểm thử/chạy benchmark production. Không tuyên bố đã sửa lỗi hay đã tăng tốc hệ thống chỉ dựa trên đặc tả.

**TRẠNG THÁI TỔNG: YC-HN-021 V4.1 — ĐÃ CHỐT VÀ TRIỂN KHAI MÃ NGUỒN v1.2.8-RC trên môi trường làm việc, CHƯA DEPLOY PRODUCTION. Phần tháng bỏ học V1 vẫn chờ hai điểm nghiệp vụ.**


## IX. CHỐT V4.1 — NGOẠI LỆ ƯU TIÊN YÊU CẦU MỚI NHẤT

**Không thêm nút X**. Người dùng tự xóa hết số quyết định bằng Backspace/Delete, phần mềm tự thực hiện lọc `query=''`, giữ nguyên các bộ lọc khác và về trang 1. Quy tắc này ghi đè mọi chỗ trong bản V4 còn gợi ý dấu X.

Nội dung đã chỉnh sửa (code và kiểm thử) xem `docs/YC-HN-021_V4_1_v1.2.8-RC_CHANGELOG_VA_HUONG_DAN.md` trong ZIP. Không tự sửa logic tháng bỏ học chưa rõ.


---

# IX. BỔ SUNG V5 — CĂN TRÁI B/J/O/R, CÁC CỘT KHÁC CĂN GIỮA; WRAP TEXT KHI DÀI

**Ngày bổ sung:** 21/10/2026. **Phạm vi:** File Excel **Danh sách học nghề 25 cột A:Y** được tải từ trang **Hồ sơ học nghề → Xuất Excel** và **Báo cáo học nghề → lựa chọn Danh sách**. Không thay đổi Excel báo cáo tổng hợp theo trường/nghề, in báo cáo hay cấu trúc Google Sheets.

## IX.1. Quy tắc trình bày mới — ưu tiên cao hơn V3 và các quy định Excel cũ

| Cột | Nội dung | Căn ngang | Căn dọc | Wrap Text |
|---|---|---|---|---|
| B | Họ và tên | **Trái (Left), không thụt lề** | **Giữa (Middle/Center)** | **Bật** để tự xuống dòng khi dài |
| J | Nghề đăng ký | **Trái (Left), không thụt lề** | **Giữa (Middle/Center)** | **Bật** để tự xuống dòng khi dài |
| O | Cơ sở đào tạo nghề | **Trái (Left), không thụt lề** | **Giữa (Middle/Center)** | **Bật** để tự xuống dòng khi dài |
| R | Địa chỉ tạm trú | **Trái (Left), không thụt lề** | **Giữa (Middle/Center)** | **Bật** để tự xuống dòng khi dài |
| **Tất cả cột khác: A,C,D,E,F,G,H,I,K,L,M,N,P,Q,S,T,U,V,W,X,Y** | Số liệu, ngày, mã định danh, địa chỉ và các trường khác | **Giữa (Center)** | **Giữa (Middle/Center)** | Có thể bật Wrap Text để tránh cắt chữ **nhưng không được đổi sang căn trái** |

**Giải quyết thay đổi so với V3:** Trước đây **S, V, W** cùng B/J/O/R được căn trái. Từ V5 **S, V, W bắt buộc căn giữa ngang và dọc**. B/J/O/R vẫn căn trái và giữa dọc. Quy định mới ghi đè quy định cũ ở điểm xung đột; không giữ lại căn trái cho S/V/W.

- **Dữ liệu** bắt đầu từ hàng 3. Hai hàng **tiêu đề** vẫn thống nhất căn giữa ngang/dọc, in đậm, Wrap Text hợp lý và giữ gộp `M1:N1`.
- Với B/J/O/R: đặt `horizontal=left`, `vertical=center`, `wrapText=true`, không bật `justify`, `distributed`, không dùng thụt lề. Với 21 cột còn lại: `horizontal=center`, `vertical=center`, nội dung dài có thể Wrap Text nhưng phải giữ Center.
- Tự tăng chiều cao hàng đủ hiển thị nội dung sau khi xuống dòng; giữ chiều cao tối thiểu hợp lý, **không ép tất cả hàng có cùng chiều cao rất lớn** và không để chữ bị cắt/đè lên ô khác. Căn giữa dọc áp dụng sau khi hàng tăng cao.
- Giữ nguyên 25 cột, thứ tự cột, độ rộng phù hợp của file mẫu, số 0 đầu ở BHXH/CCCD/điện thoại, ngày Excel thực `dd/mm/yyyy`, giới tính `Nam`/`Nữ`, màu, viền, phông chữ, tên sheet và giới hạn xuất hiện hành.

## IX.2. Điểm cần sửa theo nguồn mã v1.2.8-RC (đã kiểm tra trực tiếp)

**Tệp:** `public/xlsx-export.js`, hàm `buildXlsx(rows)` — dòng lựa chọn style hiện hành:

```js
const style=headerRow?(index===0?1:4):([1,9,14,17,18,21,22].includes(col)?2:0);
```

Đây là **chỉ số cột tính từ 0**: `[1,9,14,17,18,21,22]` tương ứng B/J/O/R/S/V/W. Theo yêu cầu mới, tập căn trái phải là **`[1,9,14,17]`**, tương ứng **B/J/O/R**. **Đây là gợi ý vị trí sửa; khi triển khai phải đối chiếu đúng source đang bàn giao, không chỉnh nhầm phiên bản hoặc làm thay đổi hàm xuất báo cáo ma trận.**

Các định dạng đã có trong `recordStyles()` bao gồm style căn giữa ngang/dọc và style căn trái/giữa dọc/Wrap Text; có thể tái sử dụng nếu phù hợp. Tối ưu số styles và bảo đảm định dạng cell ngày giữ nguyên.

## IX.3. Tiêu chí nghiệm thu bắt buộc sau CHỐT

1. Xuất cùng một danh sách từ cả **Hồ sơ học nghề** và **Báo cáo → Danh sách**; thông tin, số hồ sơ, cấu trúc và style phải giống nhau.
2. Dùng công cụ đọc XLSX kiểm tra dữ liệu từ hàng 3 (ít nhất 3 dòng), các ô **B3/J3/O3/R3** phải `left/center/wrapText=true`; thử chuỗi họ tên/nghề/cơ sở/địa chỉ dài để xác nhận xuống dòng không mất dữ liệu.
3. Ô **S3/V3/W3** và mọi cột khác trừ B/J/O/R phải **`center/center`**, không thụt lề. Có Wrap Text cho văn bản dài cũng phải giữ căn ngang giữa.
4. Hai dòng tiêu đề căn giữa, giữ `M1:N1` gộp, 25 cột A:Y và chiều cao hàng theo nội dung; kiểm tra bằng Microsoft Excel hoặc WPS nếu có môi trường. Nếu chưa mở bằng Excel/WPS thật, phải báo rõ chưa nghiệm thu hiển thị thực tế.
5. Ngày dạng date thực `dd/mm/yyyy`, giới tính Nam/Nữ, mã định danh có số 0 đầu, số dòng và báo cáo theo điều kiện lọc vẫn đúng.
6. Không tăng request Apps Script hoặc thay đổi quyền/biểu mẫu/luồng nhập Excel để thực hiện căn lề; kiểm thử hồi quy chức năng có liên quan.

## IX.4. Bảo toàn và trạng thái

- **Không sửa** thuật toán/thống kê/thời gian đào tạo/tháng bỏ học, việc thêm/xóa/sửa hồ sơ, xác minh quyền, bộ lọc, điều hướng hay hiệu năng đã bàn giao ở V4.1.
- Không thay đổi `Code.gs` nếu backend không cần sửa; chỉ sửa đúng exporter frontend và file cần thiết. Không động đến Google Sheets thật.
- **TRẠNG THÁI HIỆN TẠI: YC-HN-021 V5 — CHỜ CHỐT RIÊNG PHẦN ĐỊNH DẠNG EXCEL. CHƯA VIẾT CODE/DEPLOY.**


---

## X. BỔ SUNG V5.1 — CHỈNH HIỂN THỊ CỘT THAO TÁC / SỐ QUYẾT ĐỊNH

1. Trong `public/app.js` hàm `loadRecordList()`, chỉ header `Thao tác` của bảng `#list-output` được thêm class `record-action-header`, và cột dữ liệu chứa `.record-actions` có class `record-action-cell`; CSS scoped trong `#list-output` căn giữa ngang/dọc cả hai. Không áp dụng cho Danh mục/Quản lý tài khoản.
2. Trong bảng Hồ sơ, bỏ duy nhất `<div class="muted small">Năm ${esc(r.NAM_QUYET_DINH)}</div>` dưới số quyết định; giữ `<b>${esc(r.SO_QUYET_DINH)}</b>`. Không xóa `NAM_QUYET_DINH` khỏi payload/schema hoặc form chi tiết, không xóa bộ lọc năm hoặc quy tắc trùng năm.
3. Chốt V5 Excel B/J/O/R, giữ các loại ô/date/mã khác đúng yêu cầu, không sửa báo cáo tổng hợp.
4. Nghiệm thu: header Thao tác có cùng tâm với cụm icon của từng hàng, ba vai trò đều đúng quyền; `6267` hiển thị một dòng, bộ lọc năm/chi tiết không mất năm; XLSX B3/J3/O3/R3 căn trái/giữa dọc/Wrap, S3/V3/W3 và mọi cột khác căn giữa/giữa dọc; chạy lại kiểm thử nền và xác minh hiển thị bằng Chromium.
5. **Đã thực hiện:** `v1.2.9-RC`, **142/142 bài Node.js đạt**, kiểm thử Chromium 3 vai trò + kiểm tra cấu trúc tệp Excel đạt; chưa kiểm tra production và chưa deploy.


---

# PHỤ LỤC V5.2 — CHỐT MẪU EXCEL CUỐI CÙNG / 21-10-2026

**Trạng thái: ĐÃ CHỐT.** Mẫu duyệt: `danh_sach_hoc_nghe_2026-10-21_chieu_cao_can_doi.xlsx`. Quy tắc này ghi đè phần Excel V5.1 ở những điểm khác nhau; các nghiệp vụ khác tiếp tục giữ nguyên.

1. Căn trái ngang, giữa dọc, Wrap Text: chỉ **B, J, O, V, W**.
2. Căn giữa ngang, giữa dọc, Wrap Text khi dài: **A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, U, X, Y**. Đặc biệt, **R trở lại căn giữa** theo mẫu Excel đã nghiệm thu.
3. Chiều cao dòng dữ liệu tự điều chỉnh theo nội dung: mặc định điển hình ~47pt với các ô có 3 dòng; nhiều dòng tăng dần ~61/75/89pt; hàng chỉ 1–2 dòng có thể ~33pt. Không đặt cùng một chiều cao cho toàn bộ bảng.
4. Bảo toàn 25 cột, 2 dòng tiêu đề, ngày `dd/mm/yyyy`, giới tính Nam/Nữ, mã giữ số 0 đầu, dữ liệu nguồn và mẫu báo cáo khác.
5. **Đã triển khai trong mã nguồn xuất danh sách frontend `v1.2.10-RC`**, không sửa Google Sheets, không thay đổi API backend. Đã chạy 145/145 bài Node và kiểm thử Chromium tạo XLSX mô phỏng. Chưa đo trực tiếp/kiểm tra bằng Excel/WPS trên máy người dùng sau triển khai.
6. Riêng nghiệp vụ tháng bỏ học còn mở trong V1 vẫn giữ nguyên, không sửa trong đợt này.

# MASTER PROMPT – YC-HN-029 V4 – ĐÃ CHỐT, ĐÃ TRIỂN KHAI CỤC BỘ

**Dự án:** THEO DÕI HỌC NGHỀ  
**Mã nguồn nền:** v1.2.22-RC  
**Ngày CHỐT:** 28/10/2026  
**Phạm vi:** CHỈ LÀM ĐẸP THÔNG TIN HỌ TÊN/CHỨC DANH TẠI GÓC TRÊN BÊN PHẢI  
**Triển khai website thật:** Chưa thực hiện.

## 1. Quyết định đã CHỐT

Người dùng đã đồng ý mẫu giao diện để làm nổi bật chức danh tài khoản, đồng thời giới hạn rõ: **chỉ đổi cách hiển thị chức danh; không thêm tính năng, không đổi bố cục khác, không thay đổi quyền truy cập**.

- Giữ khu vực thông tin tài khoản và nút **Đăng xuất** tại vị trí cũ; giữ tên người dùng ở dòng trên.
- Tên người dùng đậm và dễ đọc; chức danh ở dòng dưới dưới dạng **nhãn bo tròn**, có nền sáng và chữ đậm.
- Hiển thị nguyên văn `CHUC_DANH_HIEN_THI` do ADMIN nhập cho tài khoản `NHAN_VIEN`; khi trống hiển thị **Nhân viên**.
- Nhãn **Trưởng phòng**: vàng nhẹ, biểu tượng sao nhỏ; **Phó phòng/Phó Trưởng phòng**: xanh lam nhẹ, ký hiệu nhỏ; **Nhân viên**: xanh nhạt; **Quản trị viên**: tím nhạt; **Cơ sở đào tạo**: xanh lá nhạt. Biểu tượng chỉ mang tính trang trí.
- Nhãn dài được cắt bớt bằng dấu ba chấm trên giao diện và có thể xem toàn văn bằng cách đưa con trỏ lên. Không che nút Đăng xuất, không làm thanh tiêu đề cao hơn.
- Với màn hình điện thoại <=600px, giữ nguyên hành vi của bản nền: ẩn khu vực tên/chức danh để tránh tràn màn hình, giữ nút Đăng xuất.

## 2. Ranh giới tuyệt đối

- **Không cấp quyền theo chức danh, màu nhãn hoặc lớp CSS.** Tài khoản có `VAI_TRO='NHAN_VIEN'` vẫn chỉ được truy cập ba menu **Tổng quan – Hồ sơ học nghề – Báo cáo**, dù chức danh là Trưởng phòng.
- ADMIN vẫn có sáu menu; CO_SO_DAO_TAO vẫn bị giới hạn dữ liệu theo cơ sở được cấp.
- Không thêm avatar, chuông thông báo, menu thả xuống, đổi mật khẩu, nút mới hoặc trang thông tin tài khoản.
- Không sửa quy trình đăng nhập, session, cache, đồng bộ, API, báo cáo, file Excel, Google Sheets, Apps Script hoặc Vercel.
- Các yêu cầu tối ưu hiệu năng, đồng bộ nhiều máy, xử lý xung đột và chuẩn hóa thông báo ở **YC-HN-029 V1–V3 vẫn được bảo lưu, chưa triển khai trong V4**.

## 3. Thay đổi kỹ thuật đúng phạm vi

- `public/app.js`: chỉ chỉnh `renderCurrentUser()` để gắn lớp trình bày theo nhãn, vẫn escape tên và chức danh; không gọi API mới hoặc thay đổi nghiệp vụ.
- `public/styles.css`: chỉ bổ sung CSS được giới hạn dưới `.topbar .user-box` cho tên, nhãn, biểu tượng trang trí, màu sắc và giới hạn chiều rộng.
- `public/index.html`, `api/rpc.js`, `apps-script/Code.gs`, `public/xlsx-export.js`, bảy tab Google Sheets và các mẫu Excel: **giữ nguyên**.
- Không nâng số phiên bản kỹ thuật vì đây là bản vá giao diện nhỏ; vẫn hiển thị `v1.2.22-RC` như bản nền.

## 4. Điều kiện nghiệm thu

1. Tên và chức danh hiển thị đúng, chữ rõ và nhãn bo tròn.
2. Admin/nhân viên/cơ sở có nhãn phù hợp; Nhân viên không có chức danh hiển thị mặc định.
3. Trưởng phòng, Phó phòng và Phó Trưởng phòng có hình thức nhận diện phù hợp.
4. Người có chức danh quản lý nhưng role `NHAN_VIEN` không có thêm quyền và menu.
5. Không làm mất, che hoặc thay hành vi nút Đăng xuất.
6. Nội dung tùy nhập được escape trước khi hiển thị; không thể đưa HTML vào header.
7. Nhãn dài không tràn header hoặc nút Đăng xuất; giữ hiển thị cũ trên điện thoại.
8. 191 bài kiểm thử Node.js nền và kiểm thử Chromium phân quyền tiếp tục đạt.
9. Không phát sinh đường gọi dữ liệu mới chỉ để trang trí nhãn.
10. Không có thay đổi hoặc di chuyển dữ liệu thật.

## 5. Trạng thái bàn giao

**ĐÃ CHỐT V4 VÀ ĐÃ SỬA MÃ NGUỒN CỤC BỘ**, đã chạy kiểm thử offline và đóng gói. **CHƯA DEPLOY PRODUCTION.**

Hồ sơ bàn giao gồm ZIP GitHub hoàn chỉnh (không chứa `.git`), changelog, hướng dẫn triển khai/hoàn tác và kết quả kiểm thử. Backend không thay đổi nên không cần thay thế hoặc triển khai lại `Code.gs`.

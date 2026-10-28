import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('YC028: dropdown tài khoản có chức danh độc lập vai trò, hiển thị danh sách và header an toàn',()=>{
 assert.match(app,/name="displayTitle"/);
 assert.match(app,/name="displayTitle"[^>]*maxlength="100"/);
 assert.match(app,/function renderCurrentUser\(\)/);
 assert.match(app,/esc\(sub\)/);
 assert.match(app,/x\.VAI_TRO==='NHAN_VIEN'\?esc\(x\.CHUC_DANH_HIEN_THI/);
 assert.match(app,/CHUC_DANH_HIEN_THI:n\.CHUC_DANH_HIEN_THI/);
 assert.match(app,/titleInput\.disabled=!staff/);
});
test('YC028: bảo toàn ba menu và mở Xuất Excel có kiểm quyền cho Nhân viên',()=>{
 assert.match(app,/allowed\('REPORT_EXPORT'\)\?'<button class="btn btn-primary" id="report-export"/);
 assert.match(app,/allowed\('REPORT_EXPORT'\)\?'<button class="btn btn-light" data-export-list/);
 assert.match(gas,/var staffRights=\[[^\]]*'REPORT_EXPORT'/);
 assert.match(gas,/if\(action==='record_save'\)must_/);
 assert.match(html,/v1\.2\.23-RC/);
});
test('YC028: không thêm cột tài khoản hoặc đổi module xlsx',()=>{
 assert.match(gas,/'TAI_KHOAN': 'TAI_KHOAN_ID EMAIL GOOGLE_SUB HO_TEN VAI_TRO QUYEN TRANG_THAI TAO_LUC TAO_BOI CAP_NHAT_LUC CAP_NHAT_BOI DANG_NHAP_CUOI'/);
 assert.match(gas,/HN_STAFF_DISPLAY_/);
 assert.match(gas,/setStaffDisplay_\(item\.TAI_KHOAN_ID,displayTitle,admin\)/);
 assert.match(gas,/displayTitleBefore:previousTitle,displayTitleAfter:displayTitle/);
});

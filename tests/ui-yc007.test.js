import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../public/app.js', import.meta.url),'utf8');
const backend = readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const css = readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
test('YC007: lỗi nút Lưu danh mục/tài khoản được xử lý bằng thuộc tính id thật của form',()=>{
 assert.match(source,/form\.getAttribute\('id'\)/);
 assert.match(source,/formId==='catalog-form'/);
 assert.match(source,/formId==='account-form'/);
 assert.doesNotMatch(source,/if\(form\.id==='catalog-form'\)/);
});
test('YC007: menu dùng bộ nhớ phiên không gọi lại overview ở lượt quay lại còn hạn',()=>{
 assert.match(source,/pageViews:new Map\(\)/);
 assert.match(source,/state\.pageViews\.get\(page\)/);
 assert.match(source,/PAGE_AGE/);
});
test('YC007: biểu mẫu dùng 4 lựa chọn nghiệp vụ, bỏ ô bỏ học cũ',()=>{
 assert.match(source,/BO_HOC:'Bỏ học'/);
 assert.match(source,/updateDropoutFields/);
 assert.match(css,/\.dropout-only\[hidden\]/);
 const form=source.slice(source.indexOf('function recordForm('),source.indexOf('function catalogForm('));
 assert.doesNotMatch(form,/Đã bỏ học\?/);
 assert.doesNotMatch(form,/Số quyết định được nhập theo văn bản đã ban hành/);
});
test('YC007: không hiển thị ID người học trong danh sách và kết quả tìm người',()=>{
 assert.doesNotMatch(source,/<small>\$\{esc\(x\.NGUOI_HOC_ID\)\}<\/small>/);
 assert.doesNotMatch(source,/Đã chọn mã người học/);
});
test('YC007: bỏ checkbox phân quyền theo vai trò nhưng backend kiểm tra ADMIN/NHAN_VIEN',()=>{
 const form=source.slice(source.indexOf('function accountForm('),source.indexOf('function fileModal('));
 assert.doesNotMatch(form,/checkbox|permission/);
 assert.match(backend,/var staffRights=/);
 assert.match(backend,/row\.VAI_TRO==='NHAN_VIEN'/);
});
test('YC007: mẫu CSV đầy đủ các trường nghiệp vụ',()=>{
 assert.match(source,/BULK_HEADERS/);
 for(const term of ['Tên cơ sở đào tạo','Tên viết tắt','Địa chỉ','Tên nghề','Nội dung lý do','Thứ tự hiển thị'])assert.ok(source.includes(term));
 assert.match(source,/parseCsv\(/);
 assert.match(source,/catalog_bulk_import/);
});

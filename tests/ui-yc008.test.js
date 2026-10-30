import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const js=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const gas=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const rpc=fs.readFileSync(new URL('../api/rpc.js',import.meta.url),'utf8');

test('YC008: menu Nhân viên chỉ có 3 phân hệ; danh mục dành riêng quản trị',()=>{
 assert.match(js,/\['catalogs','layout-grid','Danh mục','CATALOG_MANAGE'\]/);
 assert.match(js,/\['accounts','user-round','Quản lý tài khoản','ACCOUNT_MANAGE'\]/);
 assert.match(js,/\['audits','clock-3','Nhật ký thay đổi','AUDIT_VIEW'\]/);
 assert.match(gas,/catalog_list:'CATALOG_MANAGE'/);
});
test('YC008: Danh mục lấy từ bộ nhớ bootstrap, không bắt buộc RPC khi đổi tab',()=>{
 assert.match(js,/const data=\{items:state\.cats\[type\]\|\|\[\]\}/);
 assert.match(js,/catalogSearch/);
});
test('YC008: có nút xóa, xác nhận và API ở cả frontend/backend',()=>{
 for(const code of ['catalog_delete','account_delete']){assert.match(gas,new RegExp("case '"+code+"'"));assert.match(js,new RegExp("rpc\\('"+code+"'"));}
 assert.match(js,/data-confirm-account-delete/);
 assert.match(js,/data-confirm-catalog-delete/);
});
test('YC008: không có chữ HN giả và khẩu hiệu phần mềm độc lập',()=>{
 assert.match(html,/<img src="\/assets\/logo.svg" alt="Logo Theo dõi học nghề"/);
 assert.doesNotMatch(html,/>HN<\/div>/);
 assert.doesNotMatch(html,/PHẦN MỀM ĐỘC LẬP/);
 assert.doesNotMatch(html,/Google Sheets/);
});
test('YC008: file mẫu XLSX tồn tại và website có luồng đọc XLSX thực sự',()=>{
 assert.match(js,/async function readXlsxRows\(/);
 assert.match(js,/DecompressionStream\('deflate-raw'\)/);
 assert.match(js,/\.xlsx/i);
 for(const n of ['TRUONG','NGHE','LYDO'])assert.ok(fs.statSync(new URL('../public/templates/MAU_DANH_MUC_'+n+'.xlsx',import.meta.url)).size>2000);
});
test('YC008: F5 khôi phục phiên bằng cookie HttpOnly, không localStorage',()=>{
 assert.match(rpc,/__Host-hocnghe_session/);
 assert.match(rpc,/HttpOnly; Secure; SameSite=Lax/);
 assert.match(rpc,/timingSafeEqual/);
 assert.match(js,/activateSession\(data\)/);
 assert.match(js,/state\.session=true;const result=await rpc\('bootstrap'/);
 assert.doesNotMatch(js,/localStorage\.setItem\(/);
});

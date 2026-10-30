import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const a=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const b=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
test('YC034 nhãn Xuất báo cáo ở hai menu, không đổi tên chức năng nhập Excel',()=>{
 assert.match(a,/data-export-list="1">Xuất báo cáo/);
 assert.match(a,/id="report-export">Xuất báo cáo/);
 assert.match(a,/showModal\('Xuất báo cáo học nghề'/);
 assert.match(a,/Nhập Excel/);assert.match(a,/Cập nhật tình trạng từ Excel/);
 assert.doesNotMatch(a,/>Xuất Excel</);
});
test('YC034 biểu mẫu không có lựa chọn Khác nhập tự do, vẫn giữ Khác của giới tính',()=>{
 const f=a.slice(a.indexOf('function statusSelect('),a.indexOf('function dropoutMaxPeriod('));
 assert.doesNotMatch(f,/option\('KHAC','Khác'/);assert.doesNotMatch(f,/name="customStatusName"/);
 assert.match(a,/option\('KHAC','Khác',x\.GIOI_TINH\)/);
 assert.match(b,/status_manage_save:'CATALOG_MANAGE'/);
 assert.match(b,/must_\(!p\.customStatusName/);
});
test('YC034 tình trạng lịch sử cần phê duyệt, báo cáo vẫn có nhãn cũ',()=>{
 assert.match(b,/state:state,approved:state==='ACTIVE'/);
 assert.match(b,/function safeRecord_/);
 assert.match(b,/x\.TRANG_THAI_NHAN=customStatusLabel_/);
 assert.match(a,/data-status-usage/);assert.match(a,/data-edit-status/);
 assert.match(a,/state\.managedStatuses/);
});

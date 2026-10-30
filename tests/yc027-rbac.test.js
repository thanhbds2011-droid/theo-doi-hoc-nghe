import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const backend=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('YC027: Nhân viên chỉ 3 menu, không có quyền viết dữ liệu hoặc tệp trong client',()=>{
 const rights=app.match(/const STAFF_RIGHTS=new Set\((\[[^;]+\])\);/)[1];
 for(const wanted of ['RECORD_VIEW','RECORD_STATUS','REPORT_VIEW','FILE_VIEW'])assert.ok(rights.includes("'"+wanted+"'"));
 for(const denied of ['RECORD_CREATE','RECORD_EDIT','RECORD_DELETE','FILE_UPLOAD','CATALOG_MANAGE','ACCOUNT_MANAGE','AUDIT_VIEW'])assert.ok(!rights.includes("'"+denied+"'"));
 assert.match(app,/\['dashboard','house','Tổng quan','RECORD_VIEW'\]/);
 assert.match(app,/\['records','file-text','Hồ sơ học nghề','RECORD_VIEW'\]/);
 assert.match(app,/\['reports','chart-column','Báo cáo','REPORT_VIEW'\]/);
 assert.match(app,/\]\.filter\(i=>allowed\(i\[3\]\)\)/);
});
test('YC027: backend chặn ghi ngoài tình trạng, tách check xem/cập nhật/sửa/xóa',()=>{
 for(const name of ['canViewRecord_','canStatusUpdateRecord_','canEditRecord_','canDeleteRecord_','canManageRecordFile_'])assert.ok(backend.includes('function '+name+'('));
 const rights=backend.match(/var staffRights=(\[[^;]+\]);/)[1];
 for(const denied of ['RECORD_CREATE','RECORD_EDIT','RECORD_DELETE','FILE_UPLOAD'])assert.ok(!rights.includes("'"+denied+"'"));
 assert.match(backend,/must_\(canStatusUpdateRecord_\(user,old\)/);
 assert.match(backend,/must_\(canEditRecord_\(user,old\)/);
 assert.match(backend,/must_\(canDeleteRecord_\(user,r\)/);
 assert.match(backend,/must_\(canManageRecordFile_\(user,r\)/);
 assert.match(backend,/TRANG_THAI_HO_SO!=='DELETED'/);
});
test('YC027+028: bản tiếp theo chỉ đổi metadata hiển thị, bảo toàn API gateway / Excel',()=>{
 assert.match(html,/v1\.2\.28-RC/);
 assert.match(backend,/version: '1\.2\.28-RC'/);
 assert.match(app,/xlsx-export\.js\?v=1\.2\.28-RC/); // Keep the approved Excel module unchanged
});

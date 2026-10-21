import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const gateway=readFileSync(new URL('../api/rpc.js',import.meta.url),'utf8');
const branch=app.slice(app.indexOf("if(formId==='record-form'){"),app.indexOf("if(formId==='status-form')"));

test('YC022 sửa hồ sơ dùng ACK backend, không điều hướng hoặc làm mới cả trang',()=>{
 assert.match(branch,/rpc\('record_save',p,\{mutate:true,preserveRecordList:true\}\)/);
 assert.match(branch,/await commitSavedRecord\(d\.record,context\)/);
 assert.doesNotMatch(branch,/afterMutation\(|navigate\('records',true\)/);
 assert.match(branch,/label:'Đang lưu…'/);
});
test('YC022 chỉ cập nhật dòng trùng HO_SO_ID, giữ các dòng khác và chống XSS',()=>{
 assert.match(app,/function renderRecordRow\(r\)/);
 assert.match(app,/data-record-id="\$\{dataAttr\(r\.HO_SO_ID\)\}"/);
 assert.match(app,/\$\{esc\(r\.HO_TEN\)\}/);
 assert.match(app,/data\.items\.map\(renderRecordRow\)\.join\(''\)/);
 assert.match(app,/row\.replaceWith\(replacement\.firstElementChild\)/);
 assert.match(app,/state\.records\[idx\]=next/);
 assert.match(app,/state\.recordLoadVersion\+\+/);
});
test('YC022 dữ liệu thay đổi ảnh hưởng sort/filter phải làm mới riêng vùng kết quả',()=>{
 assert.match(app,/function recordNeedsListRefresh\(before,after,filters\)/);
 assert.match(app,/before\.NGAY_QUYET_DINH!==after\.NGAY_QUYET_DINH/);
 assert.match(app,/before\.TRUONG_ID!==after\.TRUONG_ID/);
 assert.match(app,/context\.filters===JSON\.stringify\(state\.filters\)/);
 assert.match(app,/refreshRecordResults\('Đang cập nhật danh sách sau khi lưu…'\)/);
 assert.match(app,/expireCacheActions\(\['records_list','overview','report_matrix','report_export','audit_list'\]\)/);
});
test('YC022 đo tốc độ có điều kiện, không log dữ liệu cá nhân; không sửa kiểm quyền và trùng QĐ',()=>{
 assert.match(app,/window\.HN_PERF_TEST!==true/);
 assert.match(app,/clickToAckMs/);
 assert.match(gateway,/process\.env\.HN_PERF_TEST==='1'/);
 assert.match(gateway,/identityMs:perfIdentityMs,upstreamMs:perfUpstreamMs/);
 assert.match(gas,/fullSheetReadMs/);
 assert.match(gas,/if\(HN_PERF_\)HN_PERF_\.validationMs/);
 assert.match(gas,/must_\(!records\.some\(function\(x\)\{return x\.SO_QUYET_DINH_KEY/);
 assert.match(gas,/VERSION_CONFLICT/);
 assert.match(gas,/try\{audit_\(user,old\?'SUA_HO_SO'/);
});

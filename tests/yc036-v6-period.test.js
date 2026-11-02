import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('V6: ngày đào tạo hợp lệ dd/mm/yyyy, thiếu và ngày sai không tạo ngày giả',()=>{
 const snippet=app.slice(app.indexOf('const dateVN ='),app.indexOf('const STATUS ='));
 const ctx=vm.createContext({Date});vm.runInContext(snippet+'\nthis.toDisplay=trainingDateVN;',ctx);
 assert.equal(ctx.toDisplay('2026-09-01'),'01/09/2026');
 assert.equal(ctx.toDisplay('2027-02-28'),'28/02/2027');
 for(const value of ['',null,undefined,'2026-02-29','2026-13-01','2026-04-31','<script>alert(1)</script>'])
  assert.equal(ctx.toDisplay(value),'Chưa có thông tin');
});

test('V6: bảng tám cột cố định, thời gian ngay sau nghề, không có cột ngày kết thúc trùng',()=>{
 const table=app.slice(app.indexOf('async function loadRecordList('),app.indexOf('/** YC-HN-025 V2:',app.indexOf('async function loadRecordList(')));
 assert.match(table,/<th>Nghề<\/th><th class="training-period-header"/);
 assert.match(table,/Thời gian đào tạo<\/th><th>Tình trạng<\/th>/);
 assert.doesNotMatch(table,/courseEndMode|Ngày kết thúc đào tạo \(dự kiến\)<\/th>/);
 assert.match(table,/colspan="8"/);
 const row=app.slice(app.indexOf('function renderRecordRow('),app.indexOf('// A changed sort key',app.indexOf('function renderRecordRow(')));
 assert.match(row,/trainingDateVN\(r\.NGAY_BAT_DAU\)/);
 assert.match(row,/trainingDateVN\(r\.NGAY_KET_THUC_DU_KIEN\)/);
 assert.match(row,/record-status-cell/);
 assert.match(app,/querySelector\('td\.record-status-cell'\)/);
 assert.doesNotMatch(app,/td:nth-child\(6\)/);
 assert.match(css,/#list-output td\.training-period-cell/);
 assert.match(css,/flex-wrap:wrap/);
});

test('V6: dùng ngày có sẵn từ records_list không thay đổi backend và Excel',()=>{
 assert.match(gas,/function listRecords_\(user,p\)/);
 assert.match(gas,/return \{items:all\.slice\([\s\S]*?\.map\(safeRecord_\)/);
 assert.match(gas,/function safeRecord_\(r\)\{var x=Object\.assign\(\{\},r\)/);
 assert.match(html,/app\.js\?v=1\.2\.31-RC/);
 assert.match(html,/styles\.css\?v=1\.2\.31-RC/);
 assert.match(app,/xlsx-export\.js\?v=1\.2\.30-RC/);
 assert.doesNotMatch(app.slice(app.indexOf('function renderRecordRow('),app.indexOf('// A changed sort key')),/\brpc\(/);
});

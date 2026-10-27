import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildReportXlsx} from '../public/xlsx-export.js';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('YC026+028 xuất cho các vai trò có REPORT_EXPORT, backend vẫn kiểm scope',()=>{
 assert.match(app,/allowed\('REPORT_EXPORT'\)\?'<button class="btn btn-light" data-export-list/);
 assert.match(app,/allowed\('REPORT_EXPORT'\)\?'<button class="btn btn-primary" id="report-export"/);
 assert.match(gas,/var schoolRights=\[[^\]]*'REPORT_EXPORT'/);
 assert.match(gas,/must_\(user\._has && user\._has\('REPORT_EXPORT'\)/);
 assert.match(gas,/var visible=visibleRecords_\(user\)/);
});
test('YC026 xuất ma trận cột hoàn thành, QĐ đầy đủ, trạng thái tùy chỉnh và tổng',()=>{
 assert.match(app,/Tổng số Quyết định đã ban hành','Đã tham gia'/);
 assert.match(app,/Hoàn thành khóa học',\.\.\.customs\.map/);
 assert.match(app,/r\.courseEndParticipated\|\|0/);
 assert.match(app,/r\.participated/);
 assert.match(gas,/g\.participated\+\+/);
 assert.match(app,/rows\.push\(total\)/);
 assert.match(gas,/completed\.forEach\(function\(r\)\{group\(r\)\.courseEndParticipated\+\+;/);
 assert.match(gas,/customStatusCounts/);
});
test('YC026 XLSX 9+ cột và 32 cột: giữ đủ tiêu đề wrap, cột số và dòng tổng',async()=>{
 for(const n of [9,16,32]){
  const cols=['STT','Tên cơ sở đào tạo','Tổng số Quyết định đã ban hành','Đã tham gia','Bỏ học','Không tham gia','Không nhận Quyết định','Chưa xác nhận','Hoàn thành khóa học',...Array.from({length:n-9},(_,i)=>'Tình trạng phát sinh '+i)];
  const row=[1,'Cơ sở A',10,6,2,1,1,2,3,...Array(n-9).fill(0)];
  const total=['Tổng cộng','',...row.slice(2)];
  const blob=buildReportXlsx(cols,[row,total],'Báo cáo học nghề',{matrixTotals:true});
  const content=Buffer.from(await blob.arrayBuffer()).toString('utf8');
  assert.match(content,/Tổng số Quyết định đã ban hành/);
  assert.match(content,/Đã tham gia/);
  assert.match(content,/Hoàn thành khóa học/);
  assert.match(content,/wrapText="1"/);
  assert.match(content,/<c r="D3" s="2"><v>6<\/v><\/c>/);
  assert.match(content,/<c r="E3" s="2"><v>2<\/v><\/c>/);
  assert.match(content,/<c r="I3" s="2"><v>3<\/v><\/c>/);
  assert.match(content,/FFFFFF00/);
  assert.match(content,new RegExp('mergeCell ref="A4:B4"'));
 }
});

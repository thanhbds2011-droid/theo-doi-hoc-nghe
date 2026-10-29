import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildReportXlsx} from '../public/xlsx-export.js';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('YC030: chỉ mẫu tổng hợp có STT và bố cục ba cột theo file Excel đã cung cấp',async()=>{
  const row=[[1,'Tổng số Quyết định đã ban hành',302],[2,'Đã tham gia',180],[3,'Bỏ học',17],[4,'Không tham gia',0],[5,'Không nhận Quyết định',17],[6,'Chưa xác nhận',105],[7,'Hoàn thành khóa học',163]];
  const blob=buildReportXlsx(['STT','Chỉ tiêu','Số lượng'],row,'Báo cáo học nghề',{summaryCompact:true});
  const xml=Buffer.from(await blob.arrayBuffer()).toString('utf8');
  assert.match(xml,/mergeCell ref="B1:C1"/);
  assert.match(xml,/<col min="1" max="1" width="5\.3"/);
  assert.match(xml,/<col min="2" max="2" width="21\.2"/);
  assert.match(xml,/<col min="3" max="3" width="15\.9"/);
  assert.match(xml,/<c r="A3" s="2"><v>1<\/v><\/c>/);
  assert.match(xml,/<c r="C3" s="2"><v>302<\/v><\/c>/);
  assert.match(xml,/<row r="3" ht="44" customHeight="1">/);
  assert.match(xml,/wrapText="1"/);
  assert.match(app,/summaryCompact:true/);
  assert.match(app,/\['STT','Chỉ tiêu','Số lượng'\]/);
});
test('YC030: mẫu theo trường và nghề vẫn theo layout hiện hành',async()=>{
  const blob=buildReportXlsx(['STT','Tên cơ sở đào tạo','Tổng số Quyết định'],[[1,'A',10]],'Báo cáo học nghề');
  const xml=Buffer.from(await blob.arrayBuffer()).toString('utf8');
  assert.match(xml,/mergeCell ref="A1:C1"/);
  assert.match(xml,/<col min="2" max="2" width="52"/);
  assert.doesNotMatch(xml,/width="21\.2"/);
});
test('YC030: không đổi quyền, khóa phiên bản; UI và backend đều giới hạn tháng bỏ học 1–6',()=>{
  assert.match(app,/for\(let n=1;n<=6;n\+\+\)/);
  assert.doesNotMatch(app,/Chỉ chọn tháng thứ 2 đến tháng thứ/);
  assert.match(gas,/must_\(n<=6,'VALIDATION'/);
  assert.doesNotMatch(gas,/must_\(n<=N,'VALIDATION'/);
  assert.match(gas,/PHIEN_BAN/);
  assert.match(gas,/NO_PERMISSION/);
});

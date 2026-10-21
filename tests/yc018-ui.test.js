import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const slice=src.slice(src.indexOf('function dropoutMaxPeriod('),src.indexOf('function recordPayload('));
const ctx={option:(value,label,selected='')=>`<option value="${value}" ${String(value)===String(selected)?'selected':''}>${label}</option>`,dateVN:s=>s.split('-').reverse().join('/'),esc:s=>String(s),activeCatOptions:()=>'',selectField:()=>''};
vm.runInNewContext(slice,ctx);
test('YC018: báo cáo và Excel tổng hợp không còn dòng Đang học, vẫn giữ nội bộ KPI',()=>{
 const part=src.slice(src.indexOf('function reportKpiRows('),src.indexOf('async function renderReports('));
 assert.doesNotMatch(part, /Đang học/);assert.match(part,/Bỏ học/);assert.match(part,/Đã tham gia/);
 assert.match(src,/\['DA_THAM_GIA','Đang học'\]/); // Bộ lọc Đang học nằm ngoài phạm vi báo cáo chỉ tiêu
});
test('YC018: N=3 vẫn có đủ 12 option, chỉ tháng 2-3 cho phép chọn',()=>{
 const html=ctx.dropoutPeriodOptions('3');
 assert.equal((html.match(/>Tháng thứ \d+</g)||[]).length,12);
 assert.match(html, /value="KY:1"[^>]*disabled/);
 assert.match(html, /value="KY:2"[^>]*>Tháng thứ 2/);
 assert.match(html, /value="KY:3"[^>]*>Tháng thứ 3/);
 assert.match(html, /value="KY:4"[^>]*disabled/);
});
test('YC018: N=12 có 2-12; N=1 hoặc số lẻ không có kỳ hợp lệ',()=>{
 const html=ctx.dropoutPeriodOptions('12');assert.match(html,/value="KY:12"[^>]*>Tháng thứ 12/);
 for(const n of ['1','2,5','', '0']){
  const opts=ctx.dropoutPeriodOptions(n);
  for(let i=1;i<=12;i++)assert.match(opts,new RegExp(`value="KY:${i}"[^>]*disabled`));
 }
 assert.match(ctx.dropoutPeriodHelp('2,5'),/không tự làm tròn/);
});
test('YC018: ngày lịch sử và KY:13 được giữ dưới dạng mục riêng nếu đã có',()=>{
 assert.match(ctx.dropoutPeriodOptions('3','2026-10-19','2026-10-19'),/Dữ liệu cũ — 19\/10\/2026/);
 assert.match(ctx.dropoutPeriodOptions('15','KY:13','KY:13'),/Kỳ lịch sử — 13/);
 assert.doesNotMatch(ctx.dropoutPeriodOptions('15','KY:13',''),/Kỳ lịch sử — 13/);
});

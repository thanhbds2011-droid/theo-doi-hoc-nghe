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
 assert.doesNotMatch(src,/\['DA_THAM_GIA','Đang học'\]/); // YC025 bỏ Đang học khỏi bộ lọc Báo cáo
});
test('YC033: đúng sáu lựa chọn từ tháng 1 đến tháng 6, không khóa theo thời gian hỗ trợ',()=>{
 const html=ctx.dropoutPeriodOptions('3');
 assert.equal((html.match(/>Tháng thứ \d+</g)||[]).length,6);
 for(const n of [1,2,3,4,5,6])assert.match(html,new RegExp(`value="KY:${n}"[^>]*>Tháng thứ ${n}`));
 assert.doesNotMatch(html,/disabled/);
 assert.doesNotMatch(html,/Tháng thứ (?:7|8|9|10|11|12)/);
});
test('YC033: tháng 6 là tối đa với hỗ trợ số nguyên, số lẻ hoặc trống',()=>{
 const html=ctx.dropoutPeriodOptions('12');assert.match(html,/value="KY:6"[^>]*>Tháng thứ 6/);
 assert.doesNotMatch(html,/KY:7|KY:12/);
 const one=ctx.dropoutPeriodOptions('1');assert.match(one,/value="KY:1"[^>]*>Tháng thứ 1/);
 for(let i=2;i<=6;i++)assert.match(one,new RegExp(`value="KY:${i}"[^>]*>Tháng thứ ${i}`));
 for(const n of ['3,5','2,5','', '0'])for(let i=1;i<=6;i++)assert.match(ctx.dropoutPeriodOptions(n),new RegExp(`value="KY:${i}"[^>]*>Tháng thứ ${i}`));
 assert.doesNotMatch(ctx.dropoutFields({SO_THANG_HO_TRO:'2'}),/Chỉ chọn tháng thứ/);
});
test('YC018: ngày lịch sử và KY:13 được giữ dưới dạng mục riêng nếu đã có',()=>{
 assert.match(ctx.dropoutPeriodOptions('3','2026-10-19','2026-10-19'),/Dữ liệu cũ — 19\/10\/2026/);
 assert.match(ctx.dropoutPeriodOptions('15','KY:13','KY:13'),/Kỳ lịch sử — 13/);
 assert.match(ctx.dropoutPeriodOptions('12','KY:8','KY:8'),/Kỳ lịch sử — 8/);
 assert.doesNotMatch(ctx.dropoutPeriodOptions('15','KY:13',''),/Kỳ lịch sử — 13/);
});

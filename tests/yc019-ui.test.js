import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const fragment=app.slice(app.indexOf('// YC-HN-019: Nhập ngày'),app.indexOf('function getFormFields('));
const ctx={esc:v=>String(v),iconSvg:()=>'',schoolOpts:()=>'',tradeOpts:()=>'',allStatusOptions:()=>[],option:()=>'',state:{statuses:[]},getFormFields:()=>({})};
vm.createContext(ctx);vm.runInContext("const COURSE_END_FILTER='FILTER_COURSE_END_DATE';const ALL_DECISIONS_FILTER='FILTER_ALL_DECISIONS';"+fragment,ctx);

test('YC019: hiển thị trường ngày trong Hồ sơ và Báo cáo, không ở Tổng quan',()=>{
  const rec=ctx.filterFields({from:'2026-07-01',to:'2026-07-31'},'records');
  assert.match(rec,/name="from"/);assert.match(rec,/name="to"/);assert.match(rec,/readonly/);assert.match(rec,/value="01\/07\/2026"/);
  assert.match(rec,/value="31\/07\/2026"/);assert.match(rec,/ngày ban hành quyết định học nghề/);
  const rep=ctx.filterFields({from:'',to:''},'reports');assert.match(rep,/name="from"/);assert.match(rep,/name="to"/);
  const dash=ctx.filterFields({},'dashboard');assert.doesNotMatch(dash,/name="from"/);
  assert.match(css,/#records-filters/);assert.match(css,/#reports-filters/);
});

test('YC019: ngày nhập dd/mm/yyyy chuyển ISO, không lệch ngày, có năm nhuận',()=>{
  assert.equal(ctx.dateFilterToISO('01/07/2026','Từ ngày'),'2026-07-01');
  assert.equal(ctx.dateFilterToISO('31/07/2026','Đến ngày'),'2026-07-31');
  assert.equal(ctx.dateFilterToISO('29/02/2024','Từ ngày'),'2024-02-29');
  assert.equal(ctx.dateFilterToISO('','Từ ngày'),'');
  assert.throws(()=>ctx.dateFilterToISO('29/02/2025','Từ ngày'));
  assert.throws(()=>ctx.dateFilterToISO('31/02/2026','Từ ngày'));
  assert.throws(()=>ctx.dateFilterToISO('2026-07-01','Từ ngày'));
});

test('YC019: giữ các bộ lọc đồng thời và chặn khoảng ngày đảo ngược trước khi gửi',()=>{
  ctx.getFormFields=()=>({year:'2026',truong:'ABC',nghe:'BanhAu',status:'BO_HOC',query:'6273',from:'01/07/2026',to:'30/07/2026'});
  const filters=ctx.readRangeFilters({});assert.equal(filters.from,'2026-07-01');assert.equal(filters.to,'2026-07-30');
  assert.equal(filters.status,'BO_HOC');assert.equal(filters.query,'6273');assert.equal(filters.truong,'ABC');
  ctx.getFormFields=()=>({from:'31/07/2026',to:'01/07/2026'});
  assert.throws(()=>ctx.readRangeFilters({}),/Từ ngày không được sau Đến ngày/);
});

test('YC019: dữ liệu bộ lọc ngày đi tới báo cáo, ma trận, xuất Excel và records',()=>{
  assert.match(app,/state\.reportFilters=filters;/);
  assert.match(app,/dateFilterToISO\(data\.from/);
  assert.match(app,/report_matrix',\{\.\.\.state\.reportFilters,groupBy:mode\}/);
  assert.match(app,/rpc\('report_export',filters/);
  assert.match(app,/const filters=normalizeRecordFilters\(fields\)/);
});

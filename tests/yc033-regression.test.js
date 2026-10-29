import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

const piece=app.slice(app.indexOf('const schoolNameCollator='),app.indexOf('const schoolOpts='));
assert.ok(piece.length>200,'Không tìm thấy mã sắp xếp cơ sở và báo cáo');
const ctx=vm.createContext({Intl});
vm.runInContext(piece,ctx);
const asJS=x=>JSON.parse(JSON.stringify(x));
test('YC033 A-Z: toàn bộ cơ sở được sắp xếp theo tên Việt, không đổi thứ tự nguồn',()=>{
 const items=[{TRUONG_ID:'T3',TEN_TRUONG:'Trường Trung cấp'},{TRUONG_ID:'C1',TEN_TRUONG:'Công ty A'},{TRUONG_ID:'T1',TEN_TRUONG:'Trung tâm D'},{TRUONG_ID:'D1',TEN_TRUONG:'Đào tạo nghề'},{TRUONG_ID:'C2',TEN_TRUONG:'Công ty B'}];
 const before=items.map(x=>x.TRUONG_ID);
 assert.deepEqual(asJS(ctx.sortedFilterSchools(items)).map(x=>x.TRUONG_ID),['C1','C2','D1','T1','T3']);
 assert.deepEqual(items.map(x=>x.TRUONG_ID),before);
 assert.match(app,/sortedFilterSchools\(state\.cats\.truong\.filter/);
});
test('YC033 Excel ma trận: số QĐ giảm dần, hòa số dùng A-Z, giữ nhóm total=0 và STT mới',()=>{
 const rows=[{id:'T',name:'Trường C',total:0,courseEndParticipated:2},{id:'B',name:'Trường B',total:10},{id:'A',name:'Trường A',total:10},{id:'D',name:'Trường D',total:20}];
 assert.deepEqual(asJS(ctx.sortedReportMatrixItems(rows)).map(x=>x.id),['D','A','B','T']);
 assert.equal(rows[0].id,'T'); // không đổi dữ liệu gốc
 assert.match(app,/const sortedItems=sortedReportMatrixItems\(d\.items\);/);
 assert.match(app,/const rows=sortedItems\.map\(\(r,i\)=>\[i\+1,r\.name,r\.total/);
 assert.match(app,/const total=\[\.\.\.Array\(2\)\.fill\(''\)/);
 assert.match(app,/matrixTotals:true/);
});
test('YC033 tháng 1–6 không phụ thuộc hỗ trợ hay ngày, vẫn bảo vệ dữ liệu lịch sử',()=>{
 const period=app.slice(app.indexOf('function dropoutMaxPeriod('),app.indexOf('function recordPayload('));
 assert.doesNotMatch(period,/n<=limit|Number\.isInteger\(n\)\&\&n>=1|<option[^>]*disabled/);
 assert.match(period,/for\(let n=1;n<=6;n\+\+\)/);
 assert.match(period,/historicalDropoutPeriod/);
 const backend=gas.slice(gas.indexOf('function dropoutPeriod_('),gas.indexOf('function authorize_('));
 assert.match(backend,/must_\(n<=6/);
 assert.doesNotMatch(backend,/Number\(months\)|n<=N|NGAY_BAT_DAU|NGAY_KET_THUC_DU_KIEN/);
 for(const caller of ['statusBulkEligible_','statusRecord_','allowedRecord_'])assert.ok(gas.includes('function '+caller+'('));
});
test('YC033 cập nhật Excel không gọi catch trên navigate, giữ kết quả trước khi làm mới',()=>{
 const fragment=app.slice(app.indexOf('async function statusBulkApply('),app.indexOf('function bulkRecordForm('));
 assert.doesNotMatch(fragment,/navigate\('records',true\)\.catch/);
 assert.match(fragment,/s\.session=null;s\.verified=false/);
 assert.match(fragment,/statusBulkRenderResults\(s\.results,s\.skipped\)/);
 assert.match(fragment,/state\.needsActiveRefresh=true/);
 assert.match(app,/if\(state\.needsActiveRefresh&&\$\('#modal-layer'\)\?\.classList\.contains\('hidden'\)\)/);
 assert.match(app,/Ứng dụng gặp sự cố khi hiển thị kết quả/);
});

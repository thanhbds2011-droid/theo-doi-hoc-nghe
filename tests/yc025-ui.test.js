import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const xlsx=fs.readFileSync(new URL('../public/xlsx-export.js',import.meta.url));
const reportFunction=app.slice(app.indexOf('/** YC-HN-025 V2: Hoàn thành khóa học'),app.indexOf('// Thông tin phạm vi chỉ in trên giấy'));
function kpiRows(status='',statuses=[]){
 const ctx={state:{statuses},num:v=>String(v),esc:v=>String(v)};
 vm.createContext(ctx);
 vm.runInContext("const COURSE_END_FILTER='FILTER_COURSE_END_DATE';const ALL_DECISIONS_FILTER='FILTER_ALL_DECISIONS';"+reportFunction,ctx);
 return JSON.parse(JSON.stringify(ctx.reportKpiRows({total:10,participated:6,dropout:2,notParticipating:1,pending:2,courseEndScheduled:10,courseEndParticipated:4},{notReceived:1,other:2},status)));
}
test('YC025 dropdown 2 màn có Tổng số QĐ, nhãn Hoàn thành và Báo cáo không có Đang học',()=>{
 const selectors=app.slice(app.indexOf('function filterFields('),app.indexOf('function getFormFields('));
 assert.equal((selectors.match(/ALL_DECISIONS_FILTER,'Tổng số Quyết định đã ban hành'/g)||[]).length,2);
 assert.equal((selectors.match(/COURSE_END_FILTER,'Hoàn thành khóa học'/g)||[]).length,2);
 assert.doesNotMatch(selectors,/\['DA_THAM_GIA','Đang học'\]/);
 assert.match(app,/function reportKpiRows/);
});
test('YC025 Tất cả tình trạng đầy đủ, cụ thể chỉ một hàng đúng số',()=>{
 const all=kpiRows('');assert.equal(all.length,8);
 assert.equal(all[0][0],'Tổng số Quyết định đã ban hành');
 assert.equal(all.at(-1)[0],'Hoàn thành khóa học');
 assert.deepEqual(kpiRows('FILTER_ALL_DECISIONS'),[['Tổng số Quyết định đã ban hành',10]]);
 assert.deepEqual(kpiRows('REPORT_PARTICIPATED_ALL'),[['Đã tham gia',6]]);
 assert.deepEqual(kpiRows('BO_HOC'),[['Bỏ học',2]]);
 assert.deepEqual(kpiRows('KHONG_THAM_GIA'),[['Không tham gia',1]]);
 assert.deepEqual(kpiRows('CHO_XAC_NHAN'),[['Chưa xác nhận',2]]);
 assert.deepEqual(kpiRows('KHONG_NHAN_QUYET_DINH'),[['Không nhận Quyết định',1]]);
 assert.deepEqual(kpiRows('EX001',[{id:'EX001',label:'Tạm hoãn'}]),[['Tạm hoãn',10]]);
 assert.deepEqual(kpiRows('FILTER_COURSE_END_DATE'),[['Hoàn thành khóa học',4]]);
});
test('YC025 chưa có nguồn xác nhận thì không báo người tốt nghiệp bằng kpi lịch dự kiến',()=>{
 const all=kpiRows('');assert.equal(all.at(-1)[1],4);
 assert.match(app,/k.courseEndParticipated\?\?0/);
 assert.match(gas,/courseEndScheduled:0/); // dùng cho lịch dự kiến cũ; KHÔNG dùng cho tốt nghiệp thực tế.
 assert.match(app,/reportKpiRows\(k,data.statusCounts,state.reportFilters.status\)/);
 assert.match(app,/reportKpiRows\(d.kpi,d.statusCounts,state.reportFilters.status\)/);
});
test('YC025 không thay đổi module XLSX nguyên tắc 25 cột',()=>{
 assert.equal(createHash('sha256').update(xlsx).digest('hex'),'244d494d2cc9535dc631a1544409816f0502ba0f8ee17e7052c5d6c9e7f180dc');
 assert.match(gas,/ALL_DECISIONS_FILTER_/);
 assert.match(gas,/p.status!==ALL_DECISIONS_FILTER_/);
 assert.match(gas,/status===ALL_DECISIONS_FILTER_/);
});

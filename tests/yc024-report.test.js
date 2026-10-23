import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const exportCurrent=readFileSync(new URL('../public/xlsx-export.js',import.meta.url));


test('YC024 cùng một mã lọc ảo trong Hồ sơ và Báo cáo, có trợ giúp lịch đúng nhãn',()=>{
 const filters=app.slice(app.indexOf('function filterFields('),app.indexOf('function getFormFields('));
 const matches=filters.match(/\[COURSE_END_FILTER,'Ngày hoàn thành khóa học'\]/g)||[];
 assert.equal(matches.length,2);
 assert.match(app,/mode==='records'\|\|mode==='reports'/);
 assert.match(app,/closest\('#records-filters,#reports-filters'\)/);
 assert.match(app,/updateRecordDateFilterHelp\(e\.target\.closest\('#records-filters,#reports-filters'\)\)/);
 assert.match(app,/if\(formId==='reports-filters'\)/);
});
test('YC024 backend không lọc nhầm ngày QĐ ở bước đầu và không ghi trạng thái ảo',()=>{
 assert.match(gas,/function reportStatusValid_\(status\)/);
 assert.match(gas,/COURSE_END_FILTER_\]\.indexOf\(status\)/);
 assert.match(gas,/decisionRange_\(p,status===COURSE_END_FILTER_\)/);
 assert.match(gas,/status:f\.status===COURSE_END_FILTER_\?COURSE_END_FILTER_:''/);
 assert.match(gas,/function reportMatches_\(r,p\)/);
 assert.match(gas,/function reportRecords_\(p,user,sorted\)/);
 assert.match(gas,/function overview_\(user,p\)/);
 assert.match(gas,/function reportMatrix_\(user,p\)/);
 assert.match(gas,/function exportRecords_\(user,p\)/);
});
test('YC024 V2 bảng thống kê có thêm hàng số lượng lịch kết thúc nhưng không tạo trạng thái học viên mới',()=>{
 assert.match(app,/\['Ngày hoàn thành khóa học',k\.courseEndScheduled\?\?0\]/);
 assert.match(gas,/courseEndScheduled:0/);
 assert.match(gas,/validDate_\(String\(r\.NGAY_KET_THUC_DU_KIEN\|\|''\)\.slice\(0,10\)\)\)k\.courseEndScheduled\+\+/);
 assert.doesNotMatch(gas,/TRANG_THAI_THAM_GIA\s*=\s*COURSE_END_FILTER_/);
 assert.match(app,/const lines=reportKpiRows\(d\.kpi,d\.statusCounts\)/);
});
test('YC024 V2 bỏ banner màu xanh ở thống kê, chỉ giữ metadata phạm vi ngày khi in',()=>{
 assert.doesNotMatch(app,/reportCourseEndScope/);
 assert.doesNotMatch(app,/report-course-end-note/);
 assert.doesNotMatch(css,/report-course-end-note/);
 assert.match(app,/function reportPrintDateScope\(filters\)/);
 assert.match(app,/Ngày kết thúc đào tạo dự kiến: Từ /);
 assert.match(app,/reportPrintDateScope\(state\.reportFilters\)/);
 assert.match(css,/\.report-print-date-scope\{display:none!important\}/);
 assert.match(css,/@media print\{body:has\(#report-output\) \.report-print-date-scope\{display:block!important/);
 assert.match(app,/if\(node\.id==='print-report'\)\{window\.print\(\);return;\}/);
});
test('YC024 vẫn sử dụng 4 dạng Excel cũ, không sửa exporter',()=>{
 for(const mode of ['list','summary','truong','nghe'])assert.match(app,new RegExp('value="'+mode+'"'));
 assert.match(app,/report_export',filters/);
 assert.match(app,/report_matrix',\{\.\.\.state\.reportFilters,groupBy:mode\}/);
 assert.match(app,/overview',state\.reportFilters/);
 assert.ok(exportCurrent.length>10000);
});

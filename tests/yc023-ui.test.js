import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const backend=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const xlsx=fs.readFileSync(new URL('../public/xlsx-export.js',import.meta.url));

test('YC023 lựa chọn lọc ảo ở Hồ sơ, không được đưa vào trạng thái cập nhật hoặc lọc KPI',()=>{
  assert.match(app,/\[COURSE_END_FILTER,'Hoàn thành khóa học'\]/);
  const rec=app.slice(app.indexOf('function filterFields('),app.indexOf('function getFormFields('));
  assert.match(rec,/mode==='records'\?/);
  const repSection=rec.match(/\$\{mode==='reports'\?[\s\S]+?dateFilterControls/);
  assert.ok(repSection);
  assert.match(repSection[0],/\[COURSE_END_FILTER,'Hoàn thành khóa học'\]/);
  assert.match(backend,/p\.source==='records'\?filteredRecords_\(listExportFilters_\(p\),user\):reportRecords_\(p,user\)/);
  assert.match(backend,/reportStatusValid_\(status\)/);
  assert.match(app,/exportReport\(\{\.\.\.state\.filters,source:'records'\}\)/);
});

test('YC023 cập nhật cục bộ khi đổi ngày kết thúc dự kiến bắt buộc refresh đúng vùng danh sách',()=>{
  const fragment=app.slice(app.indexOf('function recordNeedsListRefresh('),app.indexOf('function invalidateSavedRecordViews('));
  const ctx={};vm.createContext(ctx);
  vm.runInContext("const COURSE_END_FILTER='FILTER_COURSE_END_DATE';"+fragment,ctx);
  const before={HO_SO_ID:'A',NGAY_QUYET_DINH:'2026-10-13',NAM_QUYET_DINH:'2026',TRUONG_ID:'S1',NGHE_ID:'N1',TAO_LUC:'t',HO_TEN:'Tên',NGAY_KET_THUC_DU_KIEN:'2027-07-14',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE'};
  const next={...before,NGAY_KET_THUC_DU_KIEN:'2027-08-01'};
  assert.equal(ctx.recordNeedsListRefresh(before,next,{status:'FILTER_COURSE_END_DATE'}),true);
  assert.equal(ctx.recordNeedsListRefresh(before,next,{status:'DA_THAM_GIA'}),false);
  assert.equal(ctx.recordNeedsListRefresh(before,{...before,HO_TEN:'Tên khác'},{status:'FILTER_COURSE_END_DATE'}),false);
  assert.equal(ctx.recordNeedsListRefresh(before,{...before,DA_BO_HOC:'TRUE'},{status:'FILTER_COURSE_END_DATE'}),true,'Đổi Bỏ học làm mất điều kiện hoàn thành');
  assert.equal(ctx.recordNeedsListRefresh(before,{...before,TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN'},{status:'FILTER_COURSE_END_DATE'}),true,'Đổi tình trạng làm mất điều kiện hoàn thành');
});

test('YC023 giữ chuẩn XLSX đã nghiệm thu và không chỉnh cấu trúc bảng dữ liệu',()=>{
  assert.ok(xlsx.length>1000);
  assert.match(backend,/NGAY_KET_THUC_DU_KIEN/);
  assert.match(backend,/var COURSE_END_FILTER_='FILTER_COURSE_END_DATE'/);
  assert.match(backend,/version: '1\.2\.19-RC'/);
  assert.match(app,/v1\.2\.19-RC/);
});

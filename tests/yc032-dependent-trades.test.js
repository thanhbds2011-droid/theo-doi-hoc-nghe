import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const frontend=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const backend=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const cats=[
 {NGHE_ID:'T_M',TEN_NGHE:'Marketing thương mại',TRANG_THAI:'ACTIVE'},
 {NGHE_ID:'T_D',TEN_NGHE:'Đào tạo lái xe',TRANG_THAI:'ACTIVE'},
 {NGHE_ID:'T_K',TEN_NGHE:'Kỹ thuật trang điểm',TRANG_THAI:'ACTIVE'},
 {NGHE_ID:'T_A',TEN_NGHE:'Ẩm thực',TRANG_THAI:'ACTIVE'},
 {NGHE_ID:'T_C',TEN_NGHE:'Cắt may thời trang',TRANG_THAI:'INACTIVE'},
 {NGHE_ID:'T_H',TEN_NGHE:'Học sửa chữa',TRANG_THAI:'ACTIVE'},
 {NGHE_ID:'T_UNUSED',TEN_NGHE:'Nghề chưa có QĐ',TRANG_THAI:'ACTIVE'},
];
function client(role='ADMIN'){
 const fragment=frontend.slice(frontend.indexOf('const tradeNameCollator='),frontend.indexOf('function rid(){'));
 assert.ok(fragment.length>400);
 const state={user:{VAI_TRO:role},cats:{nghe:cats},tradeScopeMap:{A:['T_M','T_D','T_C','T_M','T_A'],B:['T_K','T_D','T_H']},dashboardFilters:{truong:'',nghe:''},filters:{truong:'',nghe:''},reportFilters:{truong:'',nghe:''}};
 if(role==='CO_SO_DAO_TAO')state.cats.nghe=[cats[2],cats[1]];
 const ctx=vm.createContext({state,isSchoolAccount:()=>role==='CO_SO_DAO_TAO',option:()=>'',document:{querySelector(){return null;}},Intl,Set,Object});
 vm.runInContext(fragment,ctx);
 return {ctx,state,ids:(school='')=>Array.from(ctx.filterTradeRows(school),r=>r.NGHE_ID)};
}
test('YC032: ADMIN/NHAN_VIEN Tất cả trường chỉ thấy nghề có QĐ, không trùng và A–Z tiếng Việt',()=>{
 for(const role of ['ADMIN','NHAN_VIEN']){
  const {ids}=client(role);
  assert.deepEqual(ids(),['T_A','T_C','T_D','T_H','T_K','T_M']);
  assert.deepEqual(ids('A'),['T_A','T_C','T_D','T_M']);
  assert.deepEqual(ids('B'),['T_D','T_H','T_K']);
  assert.deepEqual(ids('KHONG_TON_TAI'),[]);
 }
});
test('YC032: Cơ sở chỉ sử dụng danh mục đã được backend giới hạn, vẫn sắp xếp A–Z',()=>{
 const {ids}=client('CO_SO_DAO_TAO');
 assert.deepEqual(ids('B'),['T_D','T_K']);
});
test('YC032: đổi trường chỉ xóa nghề không còn hợp lệ, không đụng năm/ngày/từ khóa và quyền',()=>{
 const {ctx,state}=client();
 state.dashboardFilters={year:'2026',truong:'A',nghe:'T_C'};
 state.filters={year:'2025',truong:'B',nghe:'T_D',from:'2025-01-01',query:'6273'};
 state.reportFilters={year:'2024',truong:'A',nghe:'T_K',to:'2024-12-31'};
 assert.equal(ctx.reconcileSchoolTradeFilters(),true);
 assert.equal(state.dashboardFilters.nghe,'T_C');
 assert.equal(state.filters.nghe,'T_D');
 assert.equal(state.filters.query,'6273');
 assert.equal(state.reportFilters.nghe,'');
 assert.equal(state.reportFilters.to,'2024-12-31');
});
test('YC032: backend chỉ gửi map trường–nghề cho ADMIN/NHAN_VIEN, không gửi sang CO_SO_DAO_TAO',()=>{
 const ctx=vm.createContext({console});vm.runInContext(backend,ctx);
 let readCount=0;
 ctx.schoolTradeIndex_=()=>{readCount++;return {A:{T_A:true,T_M:true},B:{T_K:true,T_D:true}};};
 assert.deepEqual(JSON.parse(JSON.stringify(ctx.schoolTradeScopeForUser_({VAI_TRO:'ADMIN'}))),{A:['T_A','T_M'],B:['T_K','T_D']});
 assert.deepEqual(JSON.parse(JSON.stringify(ctx.schoolTradeScopeForUser_({VAI_TRO:'NHAN_VIEN'}))),{A:['T_A','T_M'],B:['T_K','T_D']});
 assert.equal(ctx.schoolTradeScopeForUser_({VAI_TRO:'CO_SO_DAO_TAO',TRUONG_ID:'A'}),null);
 assert.equal(readCount,2,'Tài khoản cơ sở không được cấp map toàn Trung tâm');
 ctx.version_=type=>'rev_'+type;
 assert.equal(ctx.schoolTradeRevision_({VAI_TRO:'ADMIN'}),'rev_SCHOOL_TRADES');
 assert.equal(ctx.schoolTradeRevision_({VAI_TRO:'NHAN_VIEN'}),'rev_SCHOOL_TRADES');
 assert.equal(ctx.schoolTradeRevision_({VAI_TRO:'CO_SO_DAO_TAO',TRUONG_ID:'A'}),'rev_SCHOOL_TRADES_A');
});
test('YC032: ba menu dùng chung bộ lọc; không đổi biểu mẫu sửa hồ sơ và Excel',()=>{
 assert.match(frontend,/\$\{tradeOpts\(filters\.nghe,'Tất cả nghề',filters\.truong\)\}/);
 assert.match(frontend,/function filterFields\(filters,mode\)/);
 assert.match(frontend,/e\.target\.name!=='truong'/);
 assert.match(frontend,/trades\.innerHTML=option\('','Tất cả nghề'/);
 assert.match(frontend,/activeCatOptions\('nghe',x\.NGHE_ID\)/);
 assert.match(frontend,/function sortedFilterTrades\(/);
 assert.doesNotMatch(backend,/\bYC-HN-032.*?insertSheet\(/);
});

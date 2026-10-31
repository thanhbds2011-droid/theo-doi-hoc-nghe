import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('YC036: tải nền tuần tự, tái sử dụng cache và chỉ lấy menu được cấp quyền',async()=>{
  const code=source.slice(source.indexOf('function startMenuPrefetch(){'),source.indexOf('/** YC-HN-017:',source.indexOf('function startMenuPrefetch(){')));
  assert.ok(code.startsWith('function startMenuPrefetch()'));
  const calls=[],timers=[],state={session:true,generation:2,dataRevision:'a',user:{VAI_TRO:'CO_SO_DAO_TAO',TRUONG_ID:'A'},filters:{},reportFilters:{},recordPage:1,auditPage:1,busy:false};
  const env=vm.createContext({state,document:{visibilityState:'visible'},
    setTimeout:fn=>{timers.push(fn);},permissionScope:()=> 'school-A',allowed:p=>!['CATALOG_MANAGE','ACCOUNT_MANAGE','AUDIT_VIEW'].includes(p),
    rpc:async(action,payload,options)=>{calls.push({action,payload,options});return {};}});
  vm.runInContext(code,env);
  env.startMenuPrefetch();env.startMenuPrefetch();
  assert.equal(timers.length,1,'Không lên lịch tải nền trùng cho cùng revision');
  timers.shift()();await new Promise(resolve=>setTimeout(resolve,10));
  assert.deepEqual(calls.map(x=>x.action),['records_list','overview']);
  assert.equal(calls[0].payload.pageSize,20);
  assert.equal(calls.some(x=>x.action==='accounts_list'),false);
  state.dataRevision='b';env.startMenuPrefetch();assert.equal(timers.length,1,'Dữ liệu thay đổi kích hoạt tải hợp lệ');
});

test('YC036: ADMIN có tải nền danh mục tình trạng/tài khoản/nhật ký; không tải Excel',()=>{
 assert.match(source,/allowed\('CATALOG_MANAGE'\).*status_manage_list/);
 assert.match(source,/allowed\('ACCOUNT_MANAGE'\).*accounts_list/);
 assert.match(source,/allowed\('AUDIT_VIEW'\).*audit_list/);
 assert.match(source,/state\.inFlight\.has\(key\)/);
 const warmup=source.slice(source.indexOf('function startMenuPrefetch(){'),source.indexOf('/** YC-HN-017:',source.indexOf('function startMenuPrefetch(){')));
 assert.doesNotMatch(warmup,/report_export|file_chunk|file_upload/);
});

test('YC036: Soft delete không được phép xóa mã hồ sơ hoặc đổi hằng số trạng thái',()=>{
 assert.match(gas,/case 'status_manage_delete'/);
 assert.match(gas,/status_manage_delete:'CATALOG_MANAGE'/);
 const del=gas.slice(gas.indexOf('function statusManageDelete_('),gas.indexOf('function normalizeCustomStatus_('));
 assert.match(del,/HN_STATUS_BUILTIN_/);
 assert.match(del,/HN_STATUS_RULE_/);
 assert.doesNotMatch(del,/HO_SO_HOC_NGHE.*setValues|deleteRow/);
 assert.match(source,/data-confirm-status-delete/);
 assert.match(source,/x\.state==='ACTIVE'/);
 assert.doesNotMatch(source.slice(source.indexOf('async function loadCatalogs('),source.indexOf('async function renderAccounts(')),/Hồ sơ đang dùng/);
});

test('YC036: mô phỏng luồng tải nền 1, 5, 10, 20 phiên – không tải trùng trong từng phiên',async()=>{
  const code=source.slice(source.indexOf('function startMenuPrefetch(){'),source.indexOf('/** YC-HN-017:',source.indexOf('function startMenuPrefetch(){')));
  for(const n of [1,5,10,20]){
    let total=0;
    for(let i=0;i<n;i++){
      const calls=[],timers=[],state={session:true,generation:1,dataRevision:'rev1',
        user:{VAI_TRO:'CO_SO_DAO_TAO',TRUONG_ID:'SCHOOL_A'},filters:{},reportFilters:{},recordPage:1,auditPage:1,busy:false};
      const ctx=vm.createContext({state,document:{visibilityState:'visible'},setTimeout:fn=>timers.push(fn),
        permissionScope:()=> 'school-A',allowed:key=>!['CATALOG_MANAGE','ACCOUNT_MANAGE','AUDIT_VIEW'].includes(key),
        rpc:async action=>{calls.push(action);return {};}});
      vm.runInContext(code,ctx);
      ctx.startMenuPrefetch();ctx.startMenuPrefetch();
      assert.equal(timers.length,1);
      timers[0]();
      for(let step=0;step<6;step++)await Promise.resolve();
      assert.deepEqual(calls,['records_list','overview']);
      total+=calls.length;
    }
    assert.equal(total,n*2,'Mỗi phiên chỉ tải trang hồ sơ và báo cáo được phép, không gửi trùng');
  }
});

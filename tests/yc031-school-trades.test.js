import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
function fixture(){
  const rows=[
    ['A','T1','ACTIVE'],['A','T2','ACTIVE'],['A','T1','ACTIVE'],
    ['A','T3','DELETED'],['B','T3','ACTIVE'],['B','T1','ACTIVE']
  ];
  const cats={
    truong:[{TRUONG_ID:'A',TEN_TRUONG:'Trường A',TRANG_THAI:'ACTIVE'}, {TRUONG_ID:'B',TEN_TRUONG:'Trường B',TRANG_THAI:'ACTIVE'}],
    nghe:[{NGHE_ID:'T1',TEN_NGHE:'Nghề 1',TRANG_THAI:'ACTIVE'},{NGHE_ID:'T2',TEN_NGHE:'Nghề 2 (lịch sử)',TRANG_THAI:'INACTIVE'},{NGHE_ID:'T3',TEN_NGHE:'Nghề 3',TRANG_THAI:'ACTIVE'},{NGHE_ID:'T4',TEN_NGHE:'Đã xóa',TRANG_THAI:'DELETED'}],
    lydo:[]
  };
  const revisions={SCHOOL_TRADES:'T0',DATA:'D0',CAT:'C0',USERS:'U0',STATUS:'S0'};
  let reads=0,seq=0;
  const map=new Map();
  const env=vm.createContext({console});
  vm.runInContext(source,env,{filename:'Code.gs'});
  env.now_=()=> '2026-10-28T10:00:00';
  env.customStatusList_=()=> [];
  env.builtinStatusList_=()=>[{id:'DA_THAM_GIA',label:'Đã tham gia học',state:'ACTIVE'},{id:'BO_HOC',label:'Bỏ học',state:'ACTIVE'},{id:'CHO_XAC_NHAN',label:'Chưa xác nhận',state:'ACTIVE'}];
  env.staffDisplayMap_=()=>({});
  env.version_=type=>revisions[type]||'0';
  env.bump_=type=>{revisions[type]=type+'_'+(++seq);};
  env.catalogRows_=type=>cats[type];
  env.cached_=(prefix,key,seconds,fn)=>{
    const k=prefix+'|'+JSON.stringify(key);
    if(!map.has(k))map.set(k,fn());
    return map.get(k);
  };
  env.getSheet_=name=>{
    assert.equal(name,'HO_SO_HOC_NGHE');
    return {
      getLastRow(){return rows.length+1;},
      getRange(start,col,count,width){
        assert.deepEqual([start,col,count,width],[2,10,rows.length,11]);
        reads++;
        return {getDisplayValues(){return rows.map(([school,trade,status])=>[school,trade,...Array(8).fill(''),status]);}};
      }
    };
  };
  env.perfRead_=()=>{};
  const user=(role,school)=>({TAI_KHOAN_ID:role+'_'+school,EMAIL:'fake@example.test',HO_TEN:'Demo',VAI_TRO:role,TRUONG_ID:school,DANG_NHAP_CUOI:'2026-10-28'});
  return {env,rows,cats,user,reads:()=>reads};
}
const ids=cats=>Array.from(cats.nghe,x=>x.NGHE_ID);

test('YC031: chỉ gửi các nghề có QĐ của trường; giữ nghề INACTIVE và loại hồ sơ xóa',()=>{
  const f=fixture();
  assert.deepEqual(ids(f.env.bootstrap_(f.user('CO_SO_DAO_TAO','A')).catalogs),['T1','T2']);
  assert.deepEqual(ids(f.env.bootstrap_(f.user('CO_SO_DAO_TAO','B')).catalogs),['T1','T3']);
  assert.equal(f.reads(),1,'một index dùng chung, không quét cho từng trường hoặc menu');
  assert.deepEqual(ids(f.env.bootstrap_(f.user('ADMIN','')).catalogs),['T1','T2','T3']);
  assert.deepEqual(ids(f.env.bootstrap_(f.user('NHAN_VIEN','')).catalogs),['T1','T2','T3']);
  assert.equal(f.reads(),1);
});

test('YC031: cập nhật tình trạng không làm mất cache nghề; QĐ mới của trường làm mới đúng tập nghề',()=>{
  const f=fixture(),A=f.user('CO_SO_DAO_TAO','A');
  f.env.bootstrap_(A);
  f.env.bump_('DATA'); // Chỉ trạng thái học, không sửa trường hoặc nghề.
  assert.deepEqual(ids(f.env.bootstrap_(A).catalogs),['T1','T2']);
  assert.equal(f.reads(),1);
  f.rows.push(['A','T3','ACTIVE']);
  f.env.bumpSchoolTradesForRecord_(null,{TRUONG_ID:'A',NGHE_ID:'T3',TRANG_THAI_HO_SO:'ACTIVE'});
  assert.deepEqual(ids(f.env.bootstrap_(A).catalogs),['T1','T2','T3']);
  assert.equal(f.reads(),2);
 assert.equal(f.env.permissionCheck_(A).tradeScopeRevision,f.env.version_('SCHOOL_TRADES_A'));
});

test('YC031: xóa cuối cùng và chuyển trường/nghề làm mới; không làm lộ nghề của B',()=>{
  const f=fixture();
  const A=f.user('CO_SO_DAO_TAO','A'),B=f.user('CO_SO_DAO_TAO','B');
  f.env.bootstrap_(A);
  const old={TRUONG_ID:'A',NGHE_ID:'T2',TRANG_THAI_HO_SO:'ACTIVE'};
  f.rows[1][2]='DELETED';
  f.env.bumpSchoolTradesForRecord_(old,{...old,TRANG_THAI_HO_SO:'DELETED'});
  assert.deepEqual(ids(f.env.bootstrap_(A).catalogs),['T1']);
  const before={TRUONG_ID:'B',NGHE_ID:'T3',TRANG_THAI_HO_SO:'ACTIVE'};
  f.rows[4][0]='A';
  f.env.bumpSchoolTradesForRecord_(before,{...before,TRUONG_ID:'A'});
  assert.deepEqual(ids(f.env.bootstrap_(A).catalogs),['T1','T3']);
  assert.deepEqual(ids(f.env.bootstrap_(B).catalogs),['T1']);
  assert.equal(f.env.canViewRecord_(A,{TRANG_THAI_HO_SO:'ACTIVE',TRUONG_ID:'B'}),false);
  assert.equal(f.env.canViewRecord_(B,{TRANG_THAI_HO_SO:'ACTIVE',TRUONG_ID:'A'}),false);
});

test('YC031: không bump khi chỉ cập nhật tình trạng hoặc khi không đổi quan hệ trường-nghề',()=>{
  const f=fixture();
  const v=()=>f.env.version_('SCHOOL_TRADES');
  const first=v(),r={TRUONG_ID:'A',NGHE_ID:'T1',TRANG_THAI_HO_SO:'ACTIVE'};
  f.env.bumpSchoolTradesForRecord_(r,{...r,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
  assert.equal(v(),first);
  f.env.bumpSchoolTradesForRecord_(r,{...r,NGHE_ID:'T2'});
  assert.notEqual(v(),first);
});

test('YC031: các lối ghi khác nhau chỉ cập nhật quan hệ khi thay đổi hồ sơ cấu trúc',()=>{
 assert.match(source,/var tRev=Date\.now\(\);bumpDataForSchools_\([^;]+\);bumpSchoolTradesForRecord_\(old,data\);/);
 assert.match(source,/bumpDataForSchools_\([^;]+\);bumpSchoolTradesForSchools_\(Object\.keys\(affectedSchools\)\);[\s\S]*?NHAP_HO_SO_HANG_LOAT/);
 assert.match(source,/bumpDataForSchools_\([^;]+\);bumpSchoolTradesForSchools_\(\[r\.TRUONG_ID\]\);[\s\S]*?XOA_MEM_HO_SO/);
 const status=source.split('function statusRecord_(')[1].split('function statusBulkTarget_')[0];
 assert.doesNotMatch(status,/bump_\('SCHOOL_TRADES'\)/);
 assert.match(source,/return catalog\.filter\(function\(r\)\{return Object\.prototype\.hasOwnProperty\.call\(allowed,r\.NGHE_ID\);\}\)/);
});

test('YC031: frontend sử dụng danh sách từ bootstrap, kiểm tra thay đổi riêng và không đổi biểu đồ/Excel',()=>{
 assert.match(client,/state\.tradeScopeRevision=data\.tradeScopeRevision\|\|''/);
 assert.match(client,/state\.tradeScopeRevision!==\(data\.tradeScopeRevision\|\|''\)/);
 assert.match(client,/function reconcileSchoolTradeFilters\(\)/);
 assert.match(client,/const tradeOpts=.*filterTradeRows\(schoolId\)/);
});

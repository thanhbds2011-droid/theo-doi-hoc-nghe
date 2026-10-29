import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'apps-script/Code.gs'), 'utf8');
const secret = 'a'.repeat(64);
const audience = '12345-example.apps.googleusercontent.com';

function makeEnv() {
  const tables = new Map();
  const props = new Map([['API_SHARED_SECRET',secret],['GOOGLE_CLIENT_ID',audience],['SPREADSHEET_ID','TEST_SPREADSHEET'],['DRIVE_FOLDER_ID','TEST_FOLDER']]);
  const cache = new Map();
  const backups = [];
  class Range {
    constructor(sh,row,col,height,width){this.sh=sh;this.row=row;this.col=col;this.height=height;this.width=width;}
    getDisplayValues(){return Array.from({length:this.height},(_,r)=>Array.from({length:this.width},(_,c)=>String(this.sh.rows[this.row+r-1]?.[this.col+c-1] ?? '')));}
    setValues(data){for(let i=0;i<data.length;i++){const idx=this.row+i-1;while(this.sh.rows.length<=idx)this.sh.rows.push([]);for(let j=0;j<data[i].length;j++)this.sh.rows[idx][this.col+j-1]=String(data[i][j]??'');}return this;}
    setBackground(){return this;}setFontColor(){return this;}setFontWeight(){return this;}setNumberFormat(){return this;}setWrap(){return this;}setVerticalAlignment(){return this;}
  }
  class Sheet {
    constructor(name){this.name=name;this.rows=[];}
    getName(){return this.name;}
    setName(name){assert.ok(!tables.has(name), 'Tên tab mới đã tồn tại');tables.delete(this.name);this.name=name;tables.set(name,this);return this;}
    getLastRow(){return this.rows.reduce((max,row,i)=>row.some(v=>String(v??'').length>0)?i+1:max,0);}
    getMaxRows(){return 120;}
    getRange(row,col,height=1,width=1){return new Range(this,row,col,height,width);}
    setFrozenRows(){}
    setColumnWidths(){}
    setRowHeight(){}
  }
  const spreadsheet={getId(){return 'TEST_SPREADSHEET';},getSheetByName(name){return tables.get(name)||null;},insertSheet(name){const sh=new Sheet(name);tables.set(name,sh);return sh;}};
  const properties={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>{props.set(k,v);},deleteProperty:k=>props.delete(k)};
  const global={
    console,Date,JSON,Number,Math,String,Object,Array,Boolean,Error,RegExp,Set,Map,
    SpreadsheetApp:{openById(id){assert.equal(id,'TEST_SPREADSHEET');return spreadsheet;}},
    DriveApp:{getFileById(id){assert.equal(id,'TEST_SPREADSHEET');return {makeCopy(name){backups.push(name);return {getUrl(){return 'https://example.test/backup/'+backups.length;}};}};}},
    PropertiesService:{getScriptProperties(){return properties;}},
    CacheService:{getScriptCache(){return {get(k){return cache.get(k)||null;},put(k,v){cache.set(k,v);},getAll(keys){return Object.fromEntries(keys.filter(k=>cache.has(k)).map(k=>[k,cache.get(k)]));},putAll(items){for(const [k,v] of Object.entries(items))cache.set(k,v);},remove(k){cache.delete(k);}};}},
    LockService:{getScriptLock(){return {tryLock(){return true;},releaseLock(){}};}},
    Utilities:{
      Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256'},
      formatDate(date){return date.toISOString().slice(0,19);},
      getUuid(){return crypto.randomUUID();},
      base64EncodeWebSafe(v){return Buffer.from(v).toString('base64url');},
      base64Encode(v){return Buffer.from(v).toString('base64');},
      base64Decode(v){return Array.from(Buffer.from(v,'base64'));},
      computeDigest(_,v){return Array.from(crypto.createHash('sha256').update(v).digest());},
      computeHmacSha256Signature(v,key){return Array.from(crypto.createHmac('sha256',key).update(v).digest());}
    },
    ContentService:{MimeType:{JSON:'application/json'},createTextOutput(t){return {value:t,setMimeType(){return this;},getContent(){return this.value;}};}}
  };
  vm.createContext(global);vm.runInContext(source,global,{filename:'Code.gs',timeout:10000});
  const init=()=>{global.setupDatabase();const sh=tables.get('Tài khoản người dùng');sh.rows.push(['TK_ADMIN_001','admin@example.com','','Admin','ADMIN','*','ACTIVE','','','','','']);};
  let requestCounter=0;
  const signed=(action,payload={},requestId='id_'+String(++requestCounter).padStart(15,'0'),identity={sub:'12345678901234567890',aud:audience,email:'admin@example.com',name:'Admin'})=>{
    const raw=JSON.stringify({v:1,ts:Date.now(),requestId,identity,action,payload});
    return {raw,signature:crypto.createHmac('sha256',secret).update(raw).digest('base64url')};
  };
  const send=(action,payload={},id)=>JSON.parse(global.doPost({postData:{contents:JSON.stringify(signed(action,payload,id))}}).getContent());
  return {global,tables,props,cache,backups,Sheet,init,signed,send};
}
function catalog(env,type,code,title){const res=env.send('catalog_save',{type,code,title,status:'ACTIVE'});assert.equal(res.ok,true,JSON.stringify(res.error));return res.data.item;}
function setupLive(){const env=makeEnv();env.init();const school=catalog(env,'truong','CS001','Trung tâm nghề số 1');const trade=catalog(env,'nghe','N001','Nghề may');const reason=catalog(env,'lydo','SK','Lý do sức khỏe');return {...env,school,trade,reason};}
const record=(ctx,number,date,over={})=>({HO_TEN:'Nguyễn Văn A',NGAY_SINH:'1990-01-02',GIOI_TINH:'NAM',SO_QUYET_DINH:number,NGAY_QUYET_DINH:date,TRUONG_ID:ctx.school.TRUONG_ID,NGHE_ID:ctx.trade.NGHE_ID,TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:false,...over});

test('7 tab, 94 cột, khởi tạo idempotent và không xóa dữ liệu',()=>{const c=makeEnv();c.init();assert.equal([...c.tables.keys()].length,7);assert.equal([...c.tables.values()].reduce((a,s)=>a+s.rows[0].length,0),94);const old=c.tables.get('Tài khoản người dùng').rows[1].slice();c.global.setupDatabase();assert.deepEqual(c.tables.get('Tài khoản người dùng').rows[1],old);});
test('Dừng khi schema hiện có sai, không tự ghi đè',()=>{const c=makeEnv();const sh=new c.Sheet('Hồ sơ học nghề');sh.rows.push(['WRONG']);c.tables.set(sh.name,sh);assert.throws(()=>c.global.setupDatabase(),e=>e.code==='SCHEMA_MISMATCH');});
test('Khóa quyết định: 2, 02, 002 cùng năm là một; khác năm hợp lệ',()=>{const c=makeEnv();assert.equal(c.global.decisionKey_('02','2026-01-08'),'2026|2');assert.equal(c.global.decisionKey_('002','2027-01-08'),'2027|2');assert.equal(c.global.decisionKey_('2','2026-01-01'),'2026|2');});
test('Không nhận số 0 hoặc ngày không hợp lệ',()=>{const c=makeEnv();assert.throws(()=>c.global.decisionKey_('00','2026-01-01'));assert.throws(()=>c.global.decisionKey_('02','2026-02-30'));});
test('Tạo hồ sơ theo quyết định; từ chối quyết định trùng cùng năm',()=>{const c=setupLive();const first=c.send('record_save',record(c,'02','2026-02-15'));assert.equal(first.ok,true,JSON.stringify(first.error));const second=c.send('record_save',record(c,'002','2026-12-20',{HO_TEN:'Trần Văn C'}));assert.equal(second.ok,false);assert.equal(second.error.code,'DECISION_DUPLICATE');});
test('Cùng số quyết định được dùng ở năm tiếp theo, không tái sử dụng cùng năm',()=>{const c=setupLive();assert.equal(c.send('record_save',record(c,'02','2026-02-15')).ok,true);const other=c.send('record_save',record(c,'02','2027-02-15',{HO_TEN:'Trần Văn C'}));assert.equal(other.ok,true);assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),3);});
test('Một người có nhiều hồ sơ nếu dùng cùng NGUOI_HOC_ID',()=>{const c=setupLive();const a=c.send('record_save',record(c,'01','2026-03-01'));const id=a.data.record.NGUOI_HOC_ID;const b=c.send('record_save',record(c,'03','2026-04-01',{NGUOI_HOC_ID:id}));assert.equal(b.ok,true);assert.equal(a.data.record.NGUOI_HOC_ID,b.data.record.NGUOI_HOC_ID);assert.notEqual(a.data.record.HO_SO_ID,b.data.record.HO_SO_ID);});
test('Không được liên kết NGUOI_HOC_ID với họ tên không trùng',()=>{const c=setupLive();const a=c.send('record_save',record(c,'01','2026-03-01'));const b=c.send('record_save',record(c,'02','2026-03-02',{NGUOI_HOC_ID:a.data.record.NGUOI_HOC_ID,HO_TEN:'Tên hoàn toàn khác'}));assert.equal(b.ok,false);assert.equal(b.error.code,'VALIDATION');});
test('Bỏ học cần đã tham gia, kỳ học và lý do',()=>{const c=setupLive();const r=c.send('record_save',record(c,'01','2026-01-01',{DA_BO_HOC:true}));assert.equal(r.ok,false);const yes=c.send('record_save',record(c,'01','2026-01-01',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));assert.equal(yes.ok,true);});
test('VERSION_CONFLICT ngăn ghi đè sửa từ phiên cũ',()=>{const c=setupLive();const a=c.send('record_save',record(c,'01','2026-01-01')).data.record;const b=c.send('record_save',{...record(c,'01','2026-01-01'),HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:'1',GHI_CHU:'Thay đổi'});assert.equal(b.ok,true);const stale=c.send('record_save',{...record(c,'01','2026-01-01'),HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:'1',GHI_CHU:'Ghi đè'});assert.equal(stale.ok,false);assert.equal(stale.error.code,'VERSION_CONFLICT');});
test('Dedupe theo requestId giúp chống ghi trùng cùng giao dịch',()=>{const c=setupLive();const payload=record(c,'01','2026-01-01');const first=c.send('record_save',payload,'same_transaction_00001');const second=c.send('record_save',payload,'same_transaction_00001');assert.equal(first.ok,true);assert.equal(second.ok,true);assert.equal(first.data.record.HO_SO_ID,second.data.record.HO_SO_ID);assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),2);});
test('Dashboard sáu KPI nhất quán với bỏ học và không tham gia',()=>{const c=setupLive();c.send('record_save',record(c,'01','2026-01-01',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}));c.send('record_save',record(c,'02','2026-01-02',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));c.send('record_save',record(c,'03','2026-01-03',{TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'}));c.send('record_save',record(c,'04','2027-01-03',{TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN'}));const all=c.send('overview',{}).data.kpi;assert.deepEqual(JSON.parse(JSON.stringify(all)),{total:4,participated:2,learning:1,dropout:1,notParticipating:1,pending:1,courseEndScheduled:0,courseEndParticipated:0});const y=c.send('overview',{year:'2026'}).data.kpi;assert.equal(y.total,3);});
test('Chặn chữ ký sai và audience sai ngay tại doPost',()=>{const c=setupLive();const x=c.signed('bootstrap');x.signature='fake_signature';let v=JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(x)}}).getContent());assert.equal(v.error.code,'NOT_AUTHORIZED');const bad=c.signed('bootstrap',{},'aud_bad_00000001',{sub:'12345678901234567890',aud:'other-id',email:'admin@example.com'});v=JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(bad)}}).getContent());assert.equal(v.error.code,'NOT_AUTHORIZED');});
test('Từ chối người chưa cấp quyền',()=>{const c=setupLive();let input=c.signed('bootstrap',{},'unlisted_user_0001',{sub:'12345678901234567890',aud:audience,email:'unlisted@example.com'});const x=JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(input)}}).getContent());assert.equal(x.error.code,'NOT_AUTHORIZED');});
test('Nhân viên không được quản lý danh mục hoặc tài khoản khi không cấp quyền',()=>{const c=setupLive();const acc=c.send('account_save',{email:'staff@example.com',name:'Staff',role:'NHAN_VIEN',status:'ACTIVE',permissions:'RECORD_VIEW'});assert.equal(acc.ok,true);const identity={sub:'82345678901234567890',aud:audience,email:'staff@example.com'};const raw=c.signed('catalog_save',{type:'nghe',code:'N003',title:'Điện'},'staff_denied_00001',identity);const d=JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(raw)}}).getContent());assert.equal(d.error.code,'NO_PERMISSION');});
test('Lọc & xuất báo cáo không làm thay đổi dữ liệu',()=>{const c=setupLive();c.send('record_save',record(c,'01','2026-01-01'));c.send('record_save',record(c,'02','2027-01-01'));const before=c.tables.get('Hồ sơ học nghề').getLastRow();const list=c.send('records_list',{year:'2026'});assert.equal(list.data.total,1);const exp=c.send('report_export',{year:'2027'});assert.equal(exp.data.items.length,1);assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),before);});

test('Chuyển 7 tab cũ sang tiếng Việt, giữ toàn bộ dữ liệu và đúng thứ tự 79 cột',()=>{
  const c=makeEnv(), schema=JSON.parse(JSON.stringify(c.global.APP.lists));
  for(const [name,fields] of Object.entries(schema)){
    const sh=new c.Sheet(name);sh.rows.push([...fields]);
    if(name==='HO_SO_HOC_NGHE')sh.rows.push(fields.map((_,i)=>i===5?'02':i===6?'2026':'NỘI DUNG '+i));
    if(name==='TAI_KHOAN')sh.rows.push(['TK_ADMIN_001','admin@example.com','','Admin','ADMIN','*','ACTIVE','','','','','']);
    c.tables.set(name,sh);
  }
  const before=c.tables.get('HO_SO_HOC_NGHE').rows[1].slice();
  const user=c.tables.get('TAI_KHOAN').rows[1].slice();
  const msg=c.global.chuyenSangTiengViet();
  assert.match(msg,/Việt hóa 7 tab/);
  assert.equal(c.tables.size,7);
  assert.equal(c.backups.length,1);
  assert.deepEqual(c.tables.get('Hồ sơ học nghề').rows[1],before);
  assert.deepEqual(c.tables.get('Tài khoản người dùng').rows[1],user);
  assert.equal(c.tables.get('Hồ sơ học nghề').rows[0][5],'Số quyết định');
  assert.equal(c.tables.get('Hồ sơ học nghề').rows[0][6],'Năm quyết định');
  c.global.chuyenSangTiengViet();
  assert.equal(c.backups.length,1,'không tạo sao lưu thừa khi chạy lại');
  assert.deepEqual(c.tables.get('Hồ sơ học nghề').rows[1],before);
});

test('Nếu trùng 2 tên tab cũ/mới, dừng TRƯỚC khi sao lưu/sửa bất kỳ tab nào',()=>{
  const c=makeEnv(),old=new c.Sheet('HO_SO_HOC_NGHE'),modern=new c.Sheet('Hồ sơ học nghề');
  old.rows.push([...c.global.APP.lists.HO_SO_HOC_NGHE]);
  modern.rows.push([...c.global.APP.headersVi.HO_SO_HOC_NGHE]);
  c.tables.set(old.name,old);c.tables.set(modern.name,modern);
  assert.throws(()=>c.global.chuyenSangTiengViet(),e=>e.code==='SHEET_CONFLICT');
  assert.equal(c.backups.length,0);
  assert.equal(c.tables.size,2);
});

test('Từ chối schema bất thường trước khi sửa/đổi tên tab, bảo toàn hàng dữ liệu',()=>{
  const c=makeEnv(), sh=new c.Sheet('HO_SO_HOC_NGHE');sh.rows.push(['TEN_COT_BI_SAI']);sh.rows.push(['GIU_NGUYEN']);c.tables.set(sh.name,sh);
  assert.throws(()=>c.global.chuyenSangTiengViet(),e=>e.code==='SCHEMA_MISMATCH');
  assert.equal(c.backups.length,0);
  assert.equal(c.tables.get('HO_SO_HOC_NGHE').rows[1][0],'GIU_NGUYEN');
});

test('Vẫn truy cập được tab tiếng Anh khi deployment mới chưa kịp chuyển đổi',()=>{
  const c=makeEnv(),sh=new c.Sheet('TAI_KHOAN');sh.rows.push([...c.global.APP.lists.TAI_KHOAN]);c.tables.set(sh.name,sh);
  assert.equal(c.global.getSheet_('TAI_KHOAN'),sh);
});

test('Sheet mới sử dụng toàn bộ tên tiếng Việt và 94 tiêu đề đúng vị trí',()=>{
  const c=makeEnv();c.global.setupDatabase();
  assert.equal(c.tables.get('Hồ sơ học nghề').rows[0][24],'Phiên bản hồ sơ');
  assert.equal(c.tables.get('Cấu hình hệ thống').rows[0][0],'Khóa cấu hình');
  assert.ok(!c.tables.has('HO_SO_HOC_NGHE'));
  assert.equal([...c.tables.values()].reduce((n,x)=>n+x.rows[0].length,0),94);
});

test('Danh mục tạo trên web tự sinh mã, bảo vệ mã cũ và chặn trùng tên',()=>{
 const c=setupLive();
 const created=c.send('catalog_save',{type:'nghe',title:'Nghề hàn',status:'ACTIVE'});
 assert.equal(created.ok,true,JSON.stringify(created.error));
 assert.match(created.data.item.MA_NGHE,/^NG\d{5}$/);
 const id=created.data.item.NGHE_ID;
 assert.equal(c.send('catalog_save',{type:'nghe',id,code:'TỰ_ĐỔI',title:'Nghề hàn'},'catalog_edit_code0001').error.code,'VALIDATION');
 assert.equal(c.send('catalog_save',{type:'nghe',title:'Nghe han'},'catalog_duplicate0001').error.code,'DUPLICATE');
});

test('Nhập danh mục hàng loạt kiểm tra trước, bỏ qua trùng và có thể chạy lại an toàn',()=>{
 const c=setupLive();
 const names=['May công nghiệp','Cơ khí','May cong nghiep','Nghề may'];
 const check=c.send('catalog_bulk_check',{type:'nghe',names});
 assert.equal(check.ok,true);assert.equal(check.data.valid,2);assert.equal(check.data.duplicate,2);
 const first=c.send('catalog_bulk_import',{type:'nghe',names},'import_catalog_0000001');
 assert.equal(first.ok,true,JSON.stringify(first.error));assert.equal(first.data.added,2);
 const replay=c.send('catalog_bulk_import',{type:'nghe',names},'import_catalog_0000001');
 assert.equal(replay.data.added,2);
 const second=c.send('catalog_bulk_import',{type:'nghe',names},'import_catalog_0000002');
 assert.equal(second.data.added,0);
 assert.equal(c.send('catalog_list',{type:'nghe'}).data.items.length,3);
});

function sendAs(c,identity,action,payload={},id){const env=c.signed(action,payload,id||'as_'+crypto.randomUUID().replace(/-/g,''),identity);return JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(env)}}).getContent());}

// YC-HN-027 V2 replaces old staff-owned create/delete policy with view-all, status-only.
test('YC027: Nhân viên không tạo, sửa hoặc xóa kể cả hồ sơ từng do mình tạo; ADMIN vẫn giữ quyền',()=>{
 const c=setupLive();
 for(const email of ['staff1@example.com','staff2@example.com'])assert.equal(c.send('account_save',{email,name:email,role:'NHAN_VIEN',status:'ACTIVE',permissions:'*'}).ok,true);
 const B={sub:'22345678901234567890',aud:audience,email:'staff1@example.com'};
 const D={sub:'32345678901234567890',aud:audience,email:'staff2@example.com'};
 const row=c.send('record_save',record(c,'22','2026-05-01')).data.record;
 for(const staff of [B,D]){
  const create=sendAs(c,staff,'record_save',record(c,'25','2026-06-01'));
  const edit=sendAs(c,staff,'record_save',{...record(c,'22','2026-05-01'),HO_SO_ID:row.HO_SO_ID,PHIEN_BAN:1,HO_TEN:'Trái phép'});
  const del=sendAs(c,staff,'record_delete',{HO_SO_ID:row.HO_SO_ID,PHIEN_BAN:1});
  for(const res of [create,edit,del])assert.equal(res.error.code,'NO_PERMISSION');
 }
 assert.equal(c.send('records_list',{}).data.total,1);
 assert.equal(c.send('record_delete',{HO_SO_ID:row.HO_SO_ID,PHIEN_BAN:1}).ok,true);
 assert.equal(c.send('records_list',{}).data.total,0);
});

test('YC027: Nhân viên mang cột QUYEN lịch sử=* vẫn chỉ được xem và cập nhật tình trạng',()=>{
 const c=setupLive(),user=c.send('account_save',{email:'viewer@example.com',name:'Nhân viên',role:'NHAN_VIEN',status:'ACTIVE'}).data.item;
 const staff={sub:'42345678901234567890',aud:audience,email:'viewer@example.com'};
 const sh=c.tables.get('Tài khoản người dùng'),row=sh.rows.find(x=>x[1]==='viewer@example.com');row[5]='*';c.global.bump_('USERS');
 const source=c.send('record_save',record(c,'25','2026-05-03')).data.record;
 assert.equal(sendAs(c,staff,'records_list',{}).data.total,1);
 assert.equal(sendAs(c,staff,'record_save',record(c,'26','2026-05-05')).error.code,'NO_PERMISSION');
 assert.equal(sendAs(c,staff,'record_delete',{HO_SO_ID:source.HO_SO_ID,PHIEN_BAN:1}).error.code,'NO_PERMISSION');
 assert.equal(sendAs(c,staff,'file_remove',{HO_SO_ID:source.HO_SO_ID,PHIEN_BAN:1}).error.code,'NO_PERMISSION');
 const status=sendAs(c,staff,'record_status',{HO_SO_ID:source.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 assert.equal(status.ok,true,JSON.stringify(status.error));assert.equal(status.data.record.CAP_NHAT_BOI,staff.email);
 const fresh=c.send('accounts_list').data.items.find(x=>x.EMAIL==='viewer@example.com');
 assert.match(fresh.QUYEN,/RECORD_STATUS/);assert.doesNotMatch(fresh.QUYEN,/RECORD_(CREATE|EDIT|DELETE)|FILE_UPLOAD/);
 assert.equal(user.VAI_TRO,'NHAN_VIEN');
});

test('Kiểm tra tải tệp tối đa 10 MB; truyền nhiều phần và đọc theo Range',()=>{
 const c=setupLive(),recordId=c.send('record_save',record(c,'30','2026-08-08')).data.record.HO_SO_ID;
 const mime='application/pdf',size=10485760;
 let buffer=Buffer.alloc(0), fileId='MOCK_FILE_1', trashed=false;
 c.global.ScriptApp={getOAuthToken(){return 'TEST_OAUTH_TOKEN';}};
 c.global.DriveApp.getFolderById=id=>({getId(){assert.equal(id,'TEST_FOLDER');return id;}});
 const originalFileById=c.global.DriveApp.getFileById;
 c.global.DriveApp.getFileById=id=>id==='TEST_SPREADSHEET'?originalFileById(id):({
    getSize(){return buffer.length;},getName(){return 'quyet-dinh.pdf';},getMimeType(){return mime;},setTrashed(){trashed=true;}
 });
 c.global.UrlFetchApp={fetch(url,opt){
   const reqHeaders=opt.headers||{};
   if(opt.method==='post')return {getResponseCode(){return 200;},getHeaders(){return {Location:'https://www.googleapis.com/upload/drive/v3/files?upload_id=FAKE'};}};
   if(opt.method==='put'){
     buffer=Buffer.concat([buffer,Buffer.from(opt.payload)]);
     if(buffer.length<size)return {getResponseCode(){return 308;},getHeaders(){return {Range:'bytes=0-'+(buffer.length-1)};}};
     return {getResponseCode(){return 200;},getContentText(){return JSON.stringify({id:fileId});}};
   }
   if(opt.method==='get'){
      const [,start,end]=/bytes=(\d+)-(\d+)/.exec(reqHeaders.Range);
      const part=buffer.subarray(Number(start),Number(end)+1);
      return {getResponseCode(){return 206;},getContent(){return Array.from(part);}};
   }
   throw Error('Unexpected mock request '+url);
 }};
 const begin=c.send('file_upload_begin',{HO_SO_ID:recordId,PHIEN_BAN:'1',name:'quyet-dinh.pdf',mime,size});
 assert.equal(begin.ok,true,JSON.stringify(begin.error));
 const uploadId=begin.data.uploadId;
 const sourceData=Buffer.alloc(size);sourceData.write('%PDF-1.7');
 for(let i=8;i<size;i++)sourceData[i]=i%251;
 for(let offset=0;offset<size;offset+=262144){
   const part=sourceData.subarray(offset,Math.min(size,offset+262144));
   const answer=c.send('file_upload_chunk',{uploadId,offset,base64:part.toString('base64')});
   assert.equal(answer.ok,true,JSON.stringify(answer.error));
 }
 assert.equal(Buffer.compare(buffer,sourceData),0);
 assert.equal(c.send('file_info',{HO_SO_ID:recordId}).data.size,size);
 const portions=[];for(let off=0;off<size;off+=262144){const reply=c.send('file_chunk',{HO_SO_ID:recordId,offset:off});assert.equal(reply.ok,true,JSON.stringify(reply.error));portions.push(Buffer.from(reply.data.base64,'base64'));}
 assert.equal(Buffer.compare(Buffer.concat(portions),sourceData),0);
 const overflow=c.send('file_upload_begin',{HO_SO_ID:recordId,PHIEN_BAN:'2',name:'quyet-dinh.pdf',mime,size:10485761});
 assert.equal(overflow.error.code,'FILE_TOO_LARGE');assert.equal(trashed,false);
});

test('YC007: 3 trạng thái nghiệp vụ tách bạch Bỏ học và Không tham gia',()=>{
 const c=setupLive();
 let a=c.send('record_save',record(c,'70','2026-03-01',{TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA',DA_BO_HOC:false}));
 assert.equal(a.ok,true,JSON.stringify(a.error));
 let b=c.send('record_save',record(c,'71','2026-03-02',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
 assert.equal(b.ok,true,JSON.stringify(b.error));
 const k=c.send('overview').data.kpi;
 assert.equal(k.notParticipating,1);assert.equal(k.dropout,1);assert.equal(k.participated,1);assert.equal(k.learning,0);
});

test('YC013: không được khai báo kỳ bỏ học bằng ngày lịch sử trên hồ sơ mới',()=>{
 const c=setupLive();
 const r=c.send('record_save',record(c,'72','2026-04-01',{NGAY_BAT_DAU:'2026-04-10',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-04-09',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
 assert.equal(r.error.code,'VALIDATION');
});

test('YC007: nhập CSV nhiều cột giữ địa chỉ và tên viết tắt trường',()=>{
 const c=setupLive();
 const rows=[{title:'Cao đẳng Hoa Sen',shortName:'HS',address:'12 Đường B',note:'Đối tác mới'}];
 const check=c.send('catalog_bulk_check',{type:'truong',rows});assert.equal(check.data.valid,1);
 const imported=c.send('catalog_bulk_import',{type:'truong',rows});assert.equal(imported.ok,true,JSON.stringify(imported.error));assert.equal(imported.data.added,1);
 const row=c.send('catalog_list',{type:'truong'}).data.items.find(x=>x.TEN_TRUONG==='Cao đẳng Hoa Sen');
 assert.equal(row.TEN_VIET_TAT,'HS');assert.equal(row.DIA_CHI,'12 Đường B');assert.equal(row.GHI_CHU,'Đối tác mới');
});

test('YC007: import nghề giữ thứ tự và kiểm tra tên trùng',()=>{
 const c=setupLive();const rows=[{title:'Kỹ thuật in',order:'5',note:'Nghề mới'},{title:'Nghề may',order:'6'}];
 const check=c.send('catalog_bulk_check',{type:'nghe',rows});assert.equal(check.data.valid,1);assert.equal(check.data.duplicate,1);
 const out=c.send('catalog_bulk_import',{type:'nghe',rows});assert.equal(out.data.added,1);
 const newRow=c.send('catalog_list',{type:'nghe'}).data.items.find(x=>x.TEN_NGHE==='Kỹ thuật in');assert.equal(newRow.THU_TU,'5');assert.equal(newRow.GHI_CHU,'Nghề mới');
});

test('YC007: không nhận thứ tự sai hoặc số cột nhiều làm ghi trùng',()=>{
 const c=setupLive();
 const bad=c.send('catalog_bulk_check',{type:'lydo',rows:[{title:'Không phù hợp sức khỏe',order:'abc'}]});assert.equal(bad.data.invalid,1);
 const before=c.send('catalog_list',{type:'lydo'}).data.items.length;
 const result=c.send('catalog_bulk_import',{type:'lydo',rows:[{title:'Không phù hợp sức khỏe',order:'abc'}]});assert.equal(result.error.code,'VALIDATION');
 assert.equal(c.send('catalog_list',{type:'lydo'}).data.items.length,before);
});

test('YC007: nhân viên không thể tự thêm tài khoản hoặc quản lý danh mục dù cột QUYEN cũ có quyền',()=>{
 const c=setupLive();
 const staff=c.send('account_save',{email:'staffyc7@example.com',name:'Nhân viên Y',role:'NHAN_VIEN',status:'ACTIVE'});
 assert.equal(staff.ok,true);
 const sh=c.tables.get('Tài khoản người dùng');const row=sh.rows.find(r=>r[1]==='staffyc7@example.com');row[5]='*';
 c.props.set('REV_USERS','forcednew');
 const identity={sub:'86345678901234567890',aud:audience,email:'staffyc7@example.com'};
 const x=sendAs(c,identity,'catalog_save',{type:'truong',title:'Trường bị cấm',status:'ACTIVE'});
 assert.equal(x.error.code,'NO_PERMISSION');
 const y=sendAs(c,identity,'account_save',{email:'another@example.com',name:'Mạo danh',role:'ADMIN',status:'ACTIVE'});
 assert.equal(y.error.code,'NO_PERMISSION');
});

test('YC007: tài khoản nhân viên mới tự nhận ma trận quyền cố định',()=>{
 const c=setupLive();
 const out=c.send('account_save',{email:'personnew@example.com',name:'Mới',role:'NHAN_VIEN',status:'ACTIVE'});
 assert.equal(out.ok,true,JSON.stringify(out.error));
 const u=c.send('accounts_list').data.items.find(x=>x.EMAIL==='personnew@example.com');
 assert.match(u.QUYEN,/RECORD_STATUS/);assert.doesNotMatch(u.QUYEN,/RECORD_(CREATE|EDIT|DELETE)|FILE_UPLOAD|ACCOUNT_MANAGE|CATALOG_MANAGE/);
});

test('YC027: Nhân viên xem toàn Trung tâm (người tạo khác), tra cứu, báo cáo; chỉ cập nhật tình trạng',()=>{
 const c=setupLive(),school2=catalog(c,'truong','CS002','Trung tâm nghề số 2');
 for(const email of ['a@example.com','b@example.com'])assert.equal(c.send('account_save',{email,name:email,role:'NHAN_VIEN',status:'ACTIVE'}).ok,true);
 const A={sub:'22345678901234567890',aud:audience,email:'a@example.com'};
 const B={sub:'32345678901234567890',aud:audience,email:'b@example.com'};
 const one=c.send('record_save',record(c,'18','2026-03-15',{HO_TEN:'Người học trường C'})).data.record;
 const two=c.send('record_save',record(c,'19','2026-03-16',{TRUONG_ID:school2.TRUONG_ID,HO_TEN:'Người học trường D'})).data.record;
 for(const who of [A,B]){
  assert.equal(sendAs(c,who,'records_list',{}).data.total,2);
  assert.equal(sendAs(c,who,'overview',{}).data.kpi.total,2);
  assert.equal(sendAs(c,who,'report_export',{}).data.items.length,2);
  assert.equal(sendAs(c,who,'report_matrix',{groupBy:'truong'}).data.total,2);
  assert.equal(sendAs(c,who,'person_lookup',{query:'Người học trường D'}).data.items.length,1);
  for(const action of ['catalog_list','accounts_list','audit_list'])assert.equal(sendAs(c,who,action,{type:'truong'}).error.code,'NO_PERMISSION');
 }
 const s1=sendAs(c,B,'record_status',{HO_SO_ID:one.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 const s2=sendAs(c,B,'record_status',{HO_SO_ID:two.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 for(const res of [s1,s2]){assert.equal(res.ok,true,JSON.stringify(res.error));assert.equal(res.data.record.CAP_NHAT_BOI,B.email);}
 const logs=c.send('audit_list',{page:1,pageSize:100}).data.items;
 assert.equal(logs.filter(x=>x.HANH_DONG==='CAP_NHAT_TRANG_THAI'&&x.EMAIL===B.email).length,2);
 for(const who of [A,B])for(const action of ['record_bulk_check','record_bulk_import','record_delete','file_upload_begin','file_upload_cancel','file_remove','catalog_save','account_save']){
   const res=sendAs(c,who,action,{});assert.equal(res.error.code,'NO_PERMISSION',action);
 }
});

test('YC008: xóa mềm tài khoản, không mất hồ sơ và không xóa Admin cuối cùng',()=>{
 const c=setupLive();
 const row=c.send('account_save',{email:'vanphong@example.com',name:'Nhân viên',role:'NHAN_VIEN',status:'ACTIVE'}).data.item;
 assert.equal(c.send('account_delete',{id:row.TAI_KHOAN_ID}).ok,true);
 assert.equal(c.send('accounts_list',{}).data.items.some(x=>x.TAI_KHOAN_ID===row.TAI_KHOAN_ID),false);
 assert.equal(c.tables.get('Tài khoản người dùng').getLastRow(),3);
 const identity={sub:'32345678901234567890',aud:audience,email:'vanphong@example.com'};
 assert.equal(sendAs(c,identity,'bootstrap',{}).error.code,'NOT_AUTHORIZED');
 const admin=c.send('accounts_list',{}).data.items.find(x=>x.VAI_TRO==='ADMIN');
 assert.equal(c.send('account_delete',{id:admin.TAI_KHOAN_ID}).error.code,'CANNOT_DELETE_SELF');
 const created=c.send('account_save',{email:'vanphong@example.com',name:'Nhân viên tạo lại',role:'NHAN_VIEN',status:'ACTIVE'});
 assert.equal(created.ok,true);assert.notEqual(created.data.item.TAI_KHOAN_ID,row.TAI_KHOAN_ID);
 assert.equal(sendAs(c,identity,'bootstrap',{}).ok,true);
});

test('YC008: xóa danh mục chưa liên kết, chặn danh mục có liên kết và giữ ID',()=>{
 const c=setupLive();
 const unused=c.send('catalog_save',{type:'truong',title:'Cơ sở thử nghiệm mới'}).data.item;
 assert.equal(c.send('catalog_delete',{type:'truong',id:unused.TRUONG_ID}).ok,true);
 assert.equal(c.send('catalog_list',{type:'truong'}).data.items.some(x=>x.TRUONG_ID===unused.TRUONG_ID),false);
 assert.equal(c.send('record_save',record(c,'22','2026-03-10')).ok,true);
 assert.equal(c.send('catalog_delete',{type:'truong',id:c.school.TRUONG_ID}).error.code,'CATALOG_IN_USE');
 assert.equal(c.send('catalog_delete',{type:'nghe',id:c.trade.NGHE_ID}).error.code,'CATALOG_IN_USE');
 assert.equal(c.send('catalog_delete',{type:'lydo',id:c.reason.LY_DO_ID}).ok,true);
 const schoolRows=c.tables.get('Danh mục cơ sở đào tạo').rows;
 assert.ok(schoolRows.length>=3);
});

// YC-HN-009: Nhập hồ sơ Excel theo từng đợt, không phá vỡ 7 tab/79 cột.
function bulkRows(ctx,count,begin=1){return Array.from({length:count},(_,i)=>({
  line:i+2,name:'Nguyễn Văn '+String(begin+i),birthDate:'1990-01-02',sex:'Nam',
  decision:String(begin+i).padStart(3,'0'),decisionDate:'2026-01-15',
  school:ctx.school.TEN_TRUONG,trade:ctx.trade.TEN_NGHE,startDate:'2026-03-01',endDate:'2026-05-31'
}));}
test('YC009: Kiểm tra 1.000 quyết định trước nhập không ghi dữ liệu',()=>{
 const c=setupLive(),rows=bulkRows(c,1000);const before=c.tables.get('Hồ sơ học nghề').getLastRow();
 const out=c.send('record_bulk_check',{rows});assert.equal(out.ok,true,JSON.stringify(out.error));
 assert.equal(out.data.valid,1000);assert.equal(out.data.invalid,0);assert.equal(out.data.duplicate,0);
 assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),before);
});
test('YC009: 1.000 quyết định lưu theo 25 lượt, nhập lại không ghi trùng và giữ 94 cột',()=>{
 const c=setupLive(),rows=bulkRows(c,1000);let added=0;
 for(let i=0;i<rows.length;i+=40){const out=c.send('record_bulk_import',{rows:rows.slice(i,i+40),batchId:'test-batch'});assert.equal(out.ok,true,JSON.stringify(out.error));added+=out.data.added;}
 assert.equal(added,1000);assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),1001);
 assert.equal(c.tables.get('Hồ sơ học nghề').rows[1].length,40);
 const again=c.send('record_bulk_import',{rows:rows.slice(0,40),batchId:'again'});
 assert.equal(again.ok,true);assert.equal(again.data.added,0);assert.equal(again.data.duplicate,40);
 const overview=c.send('overview',{});assert.equal(overview.data.kpi.total,1000);assert.equal(overview.data.kpi.pending,1000);
});
test('YC009: Không gộp người trùng họ tên; cùng số khác năm hợp lệ',()=>{
 const c=setupLive(),rows=bulkRows(c,2);rows[0].name=rows[1].name='Nguyễn Văn A';
 rows[1].decision=rows[0].decision;rows[1].decisionDate='2027-01-15';
 const result=c.send('record_bulk_import',{rows});assert.equal(result.ok,true);assert.equal(result.data.added,2);
 const data=c.global.sheetRows_('HO_SO_HOC_NGHE');assert.notEqual(data[0].HO_SO_ID,data[1].HO_SO_ID);
 assert.notEqual(data[0].NGUOI_HOC_ID,data[1].NGUOI_HOC_ID);
});
test('YC009/012: quyết định trùng, danh mục mới hợp lệ và ngày sai được phân loại đúng',()=>{
 const c=setupLive(),rows=bulkRows(c,4);rows[1].decision='001';rows[2].school='Cơ sở chưa tồn tại';rows[3].decisionDate='2026-02-30';
 const out=c.send('record_bulk_check',{rows});assert.equal(out.ok,true);
 assert.equal(out.data.valid,2);assert.equal(out.data.duplicate,1);assert.equal(out.data.invalid,1);assert.deepEqual(Array.from(out.data.newCatalogs.truong),['Cơ sở chưa tồn tại']);
});
test('YC009: Nhân viên không thể kiểm tra hoặc ghi nhập hàng loạt qua API',()=>{
 const c=setupLive();const created=c.send('account_save',{email:'staff@example.com',name:'Nhân viên',role:'NHAN_VIEN',status:'ACTIVE'});
 assert.equal(created.ok,true,JSON.stringify(created.error));
 const identity={sub:'55555555555555555555',aud:audience,email:'staff@example.com',name:'Nhân viên'};
 const data={rows:bulkRows(c,1)};
 for(const action of ['record_bulk_check','record_bulk_import']){
  const signed=c.signed(action,data,'stafftest_'+action+'0123456',identity);
  const out=JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(signed)}}).getContent());
  assert.equal(out.ok,false);assert.equal(out.error.code,'NO_PERMISSION');
 }
});
test('YC009: Đợt nhập giới hạn 40 hồ sơ; kiểm tra file tối đa 3000 dòng',()=>{
 const c=setupLive();const out=c.send('record_bulk_import',{rows:bulkRows(c,41)});
 assert.equal(out.ok,false);assert.equal(out.error.code,'VALIDATION');
 const many=c.send('record_bulk_check',{rows:bulkRows(c,3001)});assert.equal(many.ok,false);
});

test('YC011: 40 cột hồ sơ, dữ liệu hỗ trợ và giấy tờ được lưu, sửa không mất dữ liệu',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'081','2026-10-02',{
    SO_SO_BHXH:'00123456789',SO_QD_TCTN:'123',NGAY_QD_TCTN:'2026-01-01',SO_THANG_HO_TRO:'3',MUC_HO_TRO_THANG:'1500000',DIA_CHI_TAM_TRU:'TP.HCM',DIA_CHI_THUONG_TRU:'Tây Ninh',SO_CMND:'0012456112',DIEN_THOAI:'0900123456'
  }));assert.equal(a.ok,true,JSON.stringify(a.error));assert.equal(a.data.record.SO_SO_BHXH,'00123456789');assert.equal(a.data.record.DIEN_THOAI,'0900123456');
  const b=c.send('record_save',{...record(c,'081','2026-10-02'),HO_SO_ID:a.data.record.HO_SO_ID,PHIEN_BAN:a.data.record.PHIEN_BAN,HO_TEN:'Nguyễn Văn C chỉnh sửa',SO_SO_BHXH:undefined,DIEN_THOAI:undefined});
  assert.equal(b.ok,true,JSON.stringify(b.error));assert.equal(b.data.record.SO_SO_BHXH,'00123456789');assert.equal(b.data.record.DIEN_THOAI,'0900123456');
  assert.equal(c.tables.get('Hồ sơ học nghề').rows[1].length,40);
  const exp=c.send('report_export',{});assert.equal(exp.ok,true,JSON.stringify(exp.error));assert.equal(exp.data.columns.length,25);assert.equal(exp.data.items[0][4],'00123456789');
});

test('YC011: 2.326 dòng được hỗ trợ trong bước kiểm tra và nhập theo đợt',()=>{
  const c=setupLive(),rows=bulkRows(c,2326);const plan=c.send('record_bulk_check',{rows});
  assert.equal(plan.ok,true,JSON.stringify(plan.error));assert.equal(plan.data.total,2326);assert.equal(plan.data.valid,2326);
});

// YC-HN-012: kiểm thử số tháng/mức hỗ trợ và tự động bổ sung danh mục (mock Sheets).
test('YC012: tháng hỗ trợ có số lẻ, được giữ nguyên khi Thêm/Sửa và không làm tròn',()=>{
 const c=setupLive();
 for(const input of ['3','3,5','2.5','6']){
  const x=c.global.normalizeSupportMonths_(input);
  assert.equal(x,input.replace(',','.'));
 }
 assert.equal(c.global.normalizeSupportMonths_(''),'');
 for(const invalid of ['3,5,5','abc','3 tháng','-3'])assert.throws(()=>c.global.normalizeSupportMonths_(invalid));
 const a=c.send('record_save',record(c,'100','2026-01-12',{SO_THANG_HO_TRO:'3,5',MUC_HO_TRO_THANG:'1.500.000'}));
 assert.equal(a.ok,true,JSON.stringify(a.error));
 assert.equal(a.data.record.SO_THANG_HO_TRO,'3.5');
 const b=c.send('record_save',{...record(c,'100','2026-01-12'),HO_SO_ID:a.data.record.HO_SO_ID,PHIEN_BAN:a.data.record.PHIEN_BAN,SO_THANG_HO_TRO:'2,5',MUC_HO_TRO_THANG:'666.666'});
 assert.equal(b.ok,true,JSON.stringify(b.error));
 assert.equal(b.data.record.SO_THANG_HO_TRO,'2.5');assert.equal(b.data.record.MUC_HO_TRO_THANG,'666666');
});
test('YC012: tiền VN đa dấu chấm và định dạng quốc tế được chuẩn hóa chính xác',()=>{
 const c=makeEnv();
 for(const [input,expected] of [['1.500.000','1500000'],['1,500,000','1500000'],['1500000','1500000'],['666.666','666666'],['1.300.000','1300000'],['1.500.000,50','1500000.50'],['1,500,000.75','1500000.75'],['0','0'],['','']]){
  assert.equal(c.global.normalizeSupportAmount_(input),expected,input);
 }
 for(const invalid of ['1.50.000','500.00.000','1,5,0','1.500.00','1.5.0','=4+3','-5'])assert.throws(()=>c.global.normalizeSupportAmount_(invalid),invalid);
});
test('YC012: nghề/cơ sở mới không còn là lỗi; server tạo một danh mục mỗi tên và liên kết đúng ID',()=>{
 const c=setupLive();const rows=bulkRows(c,4);rows.forEach((r,i)=>{
   r.school= i===3?'Trung tâm Kỹ thuật Mới':'Trung tâm Tập huấn Cơ điện';r.trade= i===3?'Kỹ thuật sửa chữa điện':'Kỹ thuật làm bánh';
   r.MUC_HO_TRO_THANG='1.500.000';r.SO_THANG_HO_TRO='3,5';
 });
 const check=c.send('record_bulk_check',{rows});assert.equal(check.ok,true,JSON.stringify(check.error));
 assert.equal(check.data.valid,4);assert.equal(check.data.invalid,0);
 assert.equal(check.data.newCatalogs.truong.length,2);assert.equal(check.data.newCatalogs.nghe.length,2);
 const result=c.send('record_bulk_import',{rows,batchId:'test_bulk_001'});
 assert.equal(result.ok,true,JSON.stringify(result.error));assert.equal(result.data.added,4);
 assert.equal(result.data.addedCatalogs.truong,2);assert.equal(result.data.addedCatalogs.nghe,2);
 const schools=c.global.catalogRows_('truong'),trades=c.global.catalogRows_('nghe'),records=c.global.sheetRows_('HO_SO_HOC_NGHE');
 assert.equal(schools.filter(x=>x.TEN_TRUONG==='Trung tâm Tập huấn Cơ điện').length,1);
 assert.equal(trades.filter(x=>x.TEN_NGHE==='Kỹ thuật làm bánh').length,1);
 assert.equal(new Set(records.slice(0,3).map(x=>x.TRUONG_ID)).size,1);
 assert.equal(new Set(records.slice(0,3).map(x=>x.NGHE_ID)).size,1);
 assert.ok(schools.some(x=>x.TRUONG_ID===records[0].TRUONG_ID));
 assert.equal(records[0].MUC_HO_TRO_THANG,'1500000');assert.equal(records[0].SO_THANG_HO_TRO,'3.5');
 const again=c.send('record_bulk_import',{rows,batchId:'test_bulk_002'});
 assert.equal(again.data.added,0);assert.equal(again.data.duplicate,4);
 assert.equal(again.data.addedCatalogs.truong,0);
 assert.equal(c.global.sheetRows_('DANH_MUC_TRUONG').length,3);
});
test('YC012: không tự tạo nghề từ hồ sơ lỗi hoặc quyết định trùng',()=>{
 const c=setupLive();const rows=bulkRows(c,2);
 rows[0].trade='Nghề mới lỗi';rows[0].decisionDate='2026-02-30';
 rows[1].trade='Nghề mới đúng';
 const out=c.send('record_bulk_import',{rows,batchId:'skip_invalid_001'});
 assert.equal(out.ok,true,JSON.stringify(out.error));assert.equal(out.data.added,1);assert.equal(out.data.invalid,1);
 assert.equal(out.data.addedCatalogs.nghe,1);
 const names=c.global.sheetRows_('DANH_MUC_NGHE').map(x=>x.TEN_NGHE);
 assert.ok(!names.includes('Nghề mới lỗi'));assert.ok(names.includes('Nghề mới đúng'));
});
test('YC012: tên khác dấu không bị tự gộp, cùng tên khác khoảng trắng/chữ hoa được dùng lại',()=>{
 const c=setupLive();const rows=bulkRows(c,3);
 rows[0].school='Trường Thẩm mỹ Hòa Bình';rows[1].school='  trường   thẩm mỹ hòa bình  ';rows[2].school='Trường Thẩm mỹ Hoa Bình';
 rows[0].trade='Nghề A';rows[1].trade='nghề a';rows[2].trade='Nghề Á';
 const res=c.send('record_bulk_import',{rows,batchId:'diacritic_distinct_01'});
 assert.equal(res.ok,true,JSON.stringify(res.error));assert.equal(res.data.added,3);
 assert.equal(res.data.addedCatalogs.truong,2);assert.equal(res.data.addedCatalogs.nghe,2);
});
test('YC012: danh mục ngừng sử dụng không được tự kích hoạt hoặc tạo bản sao',()=>{
 const c=setupLive();const other=c.send('catalog_save',{type:'nghe',title:'Nghề không dùng',status:'INACTIVE'});
 assert.equal(other.ok,true,JSON.stringify(other.error));const rows=bulkRows(c,1);rows[0].trade='Nghề không dùng';
 const check=c.send('record_bulk_check',{rows});assert.equal(check.data.valid,0);assert.equal(check.data.invalid,1);
 const out=c.send('record_bulk_import',{rows,batchId:'inactive_check_001'});
 assert.equal(out.data.added,0);assert.equal(out.data.addedCatalogs.nghe,0);
 assert.equal(c.global.sheetRows_('DANH_MUC_NGHE').filter(x=>x.TEN_NGHE==='Nghề không dùng').length,1);
});
test('YC012: nhập từng đợt dùng cùng danh mục mới, không tạo trùng ở đợt tiếp theo',()=>{
 const c=setupLive();const a=bulkRows(c,3),b=bulkRows(c,3);
 a.forEach(x=>{x.school='Cơ sở đặc biệt';x.trade='Nghề phục hồi';});
 b.forEach((x,i)=>{x.decision=String(i+100);x.school='Cơ sở đặc biệt';x.trade='Nghề phục hồi';});
 const out1=c.send('record_bulk_import',{rows:a,batchId:'manyparts_1'}),out2=c.send('record_bulk_import',{rows:b,batchId:'manyparts_2'});
 assert.equal(out1.data.added,3);assert.equal(out2.data.added,3);
 assert.equal(out1.data.addedCatalogs.nghe,1);assert.equal(out2.data.addedCatalogs.nghe,0);
 assert.equal(out2.data.addedCatalogs.truong,0);
});
test('YC012: khi file cung cấp rõ Bỏ học + ngày/lý do, lý do mới được thêm một lần và gắn đúng hồ sơ',()=>{
 const c=setupLive(),rows=bulkRows(c,2);
 rows.forEach((r,i)=>{r.importStatus='Bỏ học';r.dropoutDate='2026-08-15';r.dropoutReason=i?'  Hoàn cảnh gia đình ':'Hoàn cảnh gia đình';});
 const check=c.send('record_bulk_check',{rows});assert.equal(check.ok,true,JSON.stringify(check.error));
 assert.equal(check.data.valid,2);assert.deepEqual(Array.from(check.data.newCatalogs.lydo),['Hoàn cảnh gia đình']);
 const result=c.send('record_bulk_import',{rows,batchId:'dropoutreason_001'});
 assert.equal(result.ok,true,JSON.stringify(result.error));assert.equal(result.data.addedCatalogs.lydo,1);
 const records=c.global.sheetRows_('HO_SO_HOC_NGHE'),reasons=c.global.sheetRows_('DANH_MUC_LY_DO');
 assert.equal(records.length,2);assert.equal(records[0].DA_BO_HOC,'TRUE');
 assert.equal(records[0].LY_DO_BO_HOC_ID,records[1].LY_DO_BO_HOC_ID);
 assert.ok(reasons.some(x=>x.LY_DO_ID===records[0].LY_DO_BO_HOC_ID));
});
test('YC012: có lý do nhưng thiếu trạng thái/ngày bỏ học không được tạo danh mục vô cớ',()=>{
 const c=setupLive(),rows=bulkRows(c,1);rows[0].dropoutReason='Không đủ điều kiện';
 const plan=c.send('record_bulk_check',{rows});assert.equal(plan.data.valid,0);assert.equal(plan.data.invalid,1);
 const out=c.send('record_bulk_import',{rows,batchId:'dropoutreason_bad_001'});
 assert.equal(out.data.added,0);assert.equal(out.data.addedCatalogs.lydo,0);
});

// YC-HN-013: quy tắc mới được xác thực bằng môi trường Apps Script giả lập.
test('YC013: một Gmail thuộc đúng một cơ sở, nhiều Gmail cùng một cơ sở và không vượt quyền',()=>{
  const c=setupLive();
  const xyz=catalog(c,'truong','CS002','Trường XYZ');
  const a=c.send('record_save',record(c,'67','2026-10-13')).data.record;
  const b=c.send('record_save',record(c,'68','2026-10-13',{TRUONG_ID:xyz.TRUONG_ID})).data.record;
  for(const email of ['abc1@example.com','abc2@example.com']){
    const out=c.send('account_save',{email,name:email,role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
    assert.equal(out.ok,true,JSON.stringify(out.error));
  }
  const A={sub:'42345678901234567890',aud:audience,email:'abc1@example.com'};
  const B={sub:'52345678901234567890',aud:audience,email:'abc2@example.com'};
  for(const user of [A,B]){
    const boot=sendAs(c,user,'bootstrap');assert.equal(boot.ok,true,JSON.stringify(boot.error));
    assert.equal(boot.data.user.TRUONG_ID,c.school.TRUONG_ID);
    assert.equal(boot.data.catalogs.truong.length,1);
    assert.equal(sendAs(c,user,'records_list',{}).data.total,1);
    assert.equal(sendAs(c,user,'records_list',{truong:xyz.TRUONG_ID}).data.total,0);
    assert.equal(sendAs(c,user,'overview',{}).data.kpi.total,1);
    const scopedExport=sendAs(c,user,'report_export',{});assert.equal(scopedExport.ok,true);assert.equal(scopedExport.data.items.length,1,'Xuất đúng một hồ sơ của trường');
    assert.equal(sendAs(c,user,'record_bulk_import',{rows:[{}]}).error.code,'NO_PERMISSION');
    assert.equal(sendAs(c,user,'record_delete',{HO_SO_ID:b.HO_SO_ID,PHIEN_BAN:b.PHIEN_BAN}).error.code,'NO_PERMISSION');
    assert.equal(sendAs(c,user,'record_status',{HO_SO_ID:b.HO_SO_ID,PHIEN_BAN:b.PHIEN_BAN,TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'}).error.code,'NO_PERMISSION');
  }
  const valid=sendAs(c,A,'record_status',{HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:a.PHIEN_BAN,TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'});
  assert.equal(valid.ok,true,JSON.stringify(valid.error));
  const list=c.send('accounts_list').data.items.filter(x=>x.VAI_TRO==='CO_SO_DAO_TAO');
  assert.equal(list.length,2);assert.ok(list.every(x=>x.TRUONG_ID===c.school.TRUONG_ID));
  const change=c.send('account_save',{id:list[0].TAI_KHOAN_ID,email:'abc1@example.com',name:'A',role:'CO_SO_DAO_TAO',schoolId:xyz.TRUONG_ID,status:'ACTIVE'});
  assert.equal(change.ok,true,JSON.stringify(change.error));
  assert.equal(sendAs(c,A,'records_list',{}).data.total,1);
  assert.equal(sendAs(c,A,'records_list',{truong:c.school.TRUONG_ID}).data.total,0);
  assert.equal(sendAs(c,B,'records_list',{}).data.total,1);
});

test('YC013: số quyết định tìm chính xác, không khớp chuỗi chứa số',()=>{
  const c=setupLive();
  for(const [decision,date] of [['67','2026-01-01'],['167','2026-01-02'],['670','2026-01-03'],['6267','2026-01-04'],['067','2027-01-01']]){
    assert.equal(c.send('record_save',record(c,decision,date)).ok,true);
  }
  const d=c.send('records_list',{query:'67'});
  assert.equal(d.ok,true);assert.equal(d.data.total,2);
  assert.deepEqual(d.data.items.map(x=>x.SO_QUYET_DINH).sort(),['067','67']);
  assert.equal(c.send('records_list',{query:'0067',year:'2026'}).data.total,1);
});

test('YC013: tháng bỏ học là kỳ N, lưu KY:2, không sửa lịch sử ngày cũ',()=>{
  const c=setupLive();
  const a=c.send('record_save',record(c,'41','2026-07-01',{SO_THANG_HO_TRO:'3',NGAY_BAT_DAU:'2026-07-01',NGAY_KET_THUC_DU_KIEN:'2026-10-01',TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}));
  assert.equal(a.ok,true);
  const res=c.send('record_status',{HO_SO_ID:a.data.record.HO_SO_ID,PHIEN_BAN:a.data.record.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(res.ok,true,JSON.stringify(res.error));assert.equal(res.data.record.NGAY_BO_HOC,'KY:2');
  assert.equal(c.send('overview',{}).data.kpi.dropout,1);
  const legacyInput=c.send('record_save',record(c,'42','2026-07-01',{SO_THANG_HO_TRO:'3',NGAY_BAT_DAU:'2026-07-01',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-07-17',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
  assert.equal(legacyInput.ok,false); // Dữ liệu mới bắt buộc theo kỳ; dữ liệu cũ vẫn bảo tồn.
  const legacy=c.send('record_save',record(c,'42','2026-07-01',{SO_THANG_HO_TRO:'3',NGAY_BAT_DAU:'2026-07-01',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
  assert.equal(legacy.ok,true);
  const hs=c.tables.get('Hồ sơ học nghề'),cols=c.global.APP.lists.HO_SO_HOC_NGHE,last=hs.rows.at(-1);
  last[cols.indexOf('NGAY_BO_HOC')]='2026-07-17'; // giả lập dòng lịch sử tồn tại từ trước.
  assert.equal(c.global.sheetRows_('HO_SO_HOC_NGHE').at(-1).NGAY_BO_HOC,'2026-07-17');
  const bad=c.send('record_status',{HO_SO_ID:res.data.record.HO_SO_ID,PHIEN_BAN:res.data.record.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:4',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(bad.ok,true,JSON.stringify(bad.error));
});

test('YC013: Không nhận quyết định, trạng thái Khác và báo cáo ma trận phân nhóm đúng',()=>{
  const c=setupLive();
  c.send('record_save',record(c,'51','2026-01-02',{TRANG_THAI_THAM_GIA:'KHONG_NHAN_QUYET_DINH'}));
  const another=c.send('record_save',record(c,'52','2026-01-03',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}));
  const custom=c.send('record_status',{HO_SO_ID:another.data.record.HO_SO_ID,PHIEN_BAN:another.data.record.PHIEN_BAN,customStatusName:'  thôi   việc ',DA_BO_HOC:false});
  assert.equal(custom.ok,true,JSON.stringify(custom.error));
  const boot=c.send('bootstrap');assert.equal(boot.ok,true);assert.ok(boot.data.statuses.some(x=>x.label==='Thôi việc'));
  const overview=c.send('overview').data;
  assert.equal(overview.kpi.pending,0);assert.equal(overview.statusCounts.notReceived,1);assert.equal(overview.statusCounts.other,1);
  const matrix=c.send('report_matrix',{groupBy:'truong',year:'2026'});
  assert.equal(matrix.ok,true,JSON.stringify(matrix.error));assert.equal(matrix.data.items.length,1);
  const row=matrix.data.items[0];assert.equal(row.total,2);assert.equal(row.notReceived,1);assert.equal(row.other,1);
  const trades=c.send('report_matrix',{groupBy:'nghe'});assert.equal(trades.data.items[0].total,2);
  assert.equal(c.send('report_matrix',{groupBy:'bogus'}).error.code,'VALIDATION');
});

test('YC014: lọc báo cáo Đã tham gia bao gồm cả bỏ học, Đang học không bao gồm bỏ học',()=>{
 const c=setupLive();
 const r=[record(c,'67','2026-01-01',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}),record(c,'68','2026-01-02',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,SO_THANG_HO_TRO:'3',NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}),record(c,'69','2026-01-03',{TRANG_THAI_THAM_GIA:'KHONG_NHAN_QUYET_DINH'}),record(c,'70','2026-01-04',{TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN'})];
 for(const p of r) assert.equal(c.send('record_save',p).ok,true);
 const full=c.send('overview',{}).data;
 assert.equal(full.kpi.total,4);assert.equal(full.kpi.participated,2);assert.equal(full.statusCounts.notReceived,1);
 const part=c.send('overview',{status:'REPORT_PARTICIPATED_ALL'}).data.kpi;
 assert.deepEqual(JSON.parse(JSON.stringify([part.total,part.participated,part.learning,part.dropout])),[2,2,1,1]);
 assert.equal(c.send('overview',{status:'DA_THAM_GIA'}).data.kpi.total,1);
 assert.equal(c.send('overview',{status:'BO_HOC'}).data.kpi.total,1);
 assert.equal(c.send('overview',{status:'KHONG_NHAN_QUYET_DINH'}).data.kpi.total,1);
 assert.equal(c.send('overview',{status:'CHO_XAC_NHAN'}).data.kpi.total,1);
 assert.equal(c.send('report_matrix',{groupBy:'truong',status:'REPORT_PARTICIPATED_ALL'}).data.total,2);
 assert.equal(c.send('report_matrix',{groupBy:'nghe',status:'BO_HOC'}).data.items[0].dropout,1);
 assert.equal(c.send('report_export',{status:'BO_HOC'}).data.items.length,1);
 assert.equal(c.send('overview',{status:'WRONG_CODE'}).error.code,'VALIDATION');
});

test('YC014: tìm số quyết định trực tiếp theo cột, năm và quyền, không khớp chữ số con',()=>{
 const c=setupLive();
 for(const [n,d] of [['67','2025-01-01'],['067','2026-01-01'],['167','2026-01-02'],['670','2026-01-03']]) assert.equal(c.send('record_save',record(c,n,d)).ok,true);
 for(const q of ['67','067','0067'])assert.equal(c.send('records_list',{query:q}).data.total,2);
 assert.equal(c.send('records_list',{query:'67',year:'2025'}).data.total,1);
 assert.equal(c.send('records_list',{query:'67',year:'2026'}).data.total,1);
 assert.equal(c.send('records_list',{query:'67',year:'2024'}).data.total,0);
});

test('YC014: cache overview có phân quyền trường và bản sửa quyền; chuyển ABC sang XYZ không rò số liệu',()=>{
 const c=setupLive(),xyz=catalog(c,'truong','XYZ','Trường XYZ');
 c.send('record_save',record(c,'67','2026-01-01'));
 c.send('record_save',record(c,'68','2026-01-02',{TRUONG_ID:xyz.TRUONG_ID}));
 const a=c.send('account_save',{email:'school014@example.com',name:'School',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});assert.equal(a.ok,true);
 const u={sub:'63345678901234567890',aud:audience,email:'school014@example.com'};
 assert.equal(sendAs(c,u,'overview',{}).data.kpi.total,1);
 const initialRevision=sendAs(c,u,'bootstrap').data.permissionRevision;
 const move=c.send('account_save',{id:a.data.item.TAI_KHOAN_ID,email:'school014@example.com',name:'School',role:'CO_SO_DAO_TAO',schoolId:xyz.TRUONG_ID,status:'ACTIVE'});
 assert.equal(move.ok,true,JSON.stringify(move.error));
 assert.notEqual(sendAs(c,u,'bootstrap').data.permissionRevision,initialRevision);
 assert.equal(sendAs(c,u,'overview',{}).data.kpi.total,1);
 assert.equal(sendAs(c,u,'overview',{truong:c.school.TRUONG_ID}).data.kpi.total,0);
 assert.equal(sendAs(c,u,'overview',{truong:xyz.TRUONG_ID}).data.kpi.total,1);
});

test('YC014: tra cứu QĐ 3.000 dòng không đọc toàn bảng 40 cột trên cache miss',()=>{
 const c=setupLive(),sh=c.tables.get('Hồ sơ học nghề'),hdr=c.global.APP.lists.HO_SO_HOC_NGHE;
 const field=k=>hdr.indexOf(k);
 for(let i=0;i<3000;i++){
   const r=Array(hdr.length).fill('');
   r[field('HO_SO_ID')]='H_'+i;r[field('SO_QUYET_DINH')]=i===1234?'67':String(i+10000);
   r[field('NAM_QUYET_DINH')]='2026';r[field('NGAY_QUYET_DINH')]='2026-01-01';
   r[field('TRUONG_ID')]=c.school.TRUONG_ID;r[field('NGHE_ID')]=c.trade.NGHE_ID;
   r[field('TRANG_THAI_HO_SO')]='ACTIVE';r[field('TRANG_THAI_THAM_GIA')]='CHO_XAC_NHAN';r[field('TAO_BOI')]='admin@example.com';
   sh.rows.push(r);
 }
 const reads=[];const old=sh.getRange.bind(sh);
 sh.getRange=(row,col,height=1,width=1)=>{reads.push({row,col,height,width});return old(row,col,height,width);};
 const found=c.send('records_list',{query:'67'});
 assert.equal(found.ok,true,JSON.stringify(found.error));assert.equal(found.data.total,1);
 assert.ok(reads.some(x=>x.col===6&&x.width===1&&x.height===3000),'Quyết định phải được đọc một cột');
 assert.ok(!reads.some(x=>x.width===40&&x.height>40),'Không đọc 120.000 ô khi chỉ tìm một số quyết định');
});

test('YC015 cập nhật tình trạng chỉ đọc toàn hàng đích, không nạp toàn bộ bảng 40 cột',()=>{
  const c=setupLive();
  const a=c.send('record_save',record(c,'6273','2026-10-13'));
  assert.equal(a.ok,true);
  // Tạo thêm hồ sơ để phát hiện code cũ quét cả bảng khi cập nhật.
  for(let i=0;i<6;i++)assert.equal(c.send('record_save',record(c,String(7000+i),'2026-10-12')).ok,true);
  const sheet=c.tables.get('Hồ sơ học nghề'),orig=sheet.getRange.bind(sheet),reads=[];
  sheet.getRange=function(row,col,height=1,width=1){const range=orig(row,col,height,width),read=range.getDisplayValues.bind(range);
    range.getDisplayValues=function(){reads.push({row,col,height,width});return read();};return range;};
  const old=a.data.record;
  const saved=c.send('record_status',{HO_SO_ID:old.HO_SO_ID,PHIEN_BAN:old.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
  assert.equal(saved.ok,true,JSON.stringify(saved.error));
  assert.equal(saved.data.record.TRANG_THAI_THAM_GIA,'DA_THAM_GIA');
  assert.ok(reads.some(x=>x.height>=7&&x.width===1),'chỉ quét cột mã hồ sơ');
  assert.ok(reads.some(x=>x.height===1&&x.width===40),'chỉ đọc đầy đủ một hàng');
  assert.ok(!reads.some(x=>x.height>=7&&x.width===40),'không quét toàn bộ dữ liệu 40 cột');
  const stale=c.send('record_status',{HO_SO_ID:old.HO_SO_ID,PHIEN_BAN:old.PHIEN_BAN,TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'});
  assert.equal(stale.error.code,'VERSION_CONFLICT');
});

// YC-HN-016: only CHO_XAC_NHAN can be changed by bulk Excel, with backend revalidation.
const statusInput=(ctx,decision='6273',date='2026-10-13',name='Nguyễn Văn A')=>({line:3,decision,decisionDate:date,name,school:ctx.school.TEN_TRUONG,bhxh:''});
test('YC016: xem trước + ghi một hồ sơ chưa xác nhận, giữ nguyên hồ sơ gốc',()=>{
  const c=setupLive();const first=c.send('record_save',record(c,'6273','2026-10-13')).data.record;
  const src=statusInput(c),check=c.send('record_status_bulk_check',{status:'DA_THAM_GIA',rows:[src]});
  assert.equal(check.ok,true,JSON.stringify(check.error));assert.equal(check.data.items[0].kind,'eligible');
  const row=check.data.items[0],write=c.send('record_status_bulk_apply',{status:'DA_THAM_GIA',batchId:'batch16',rows:[{...src,hoSoId:row.hoSoId,version:row.version}]},'yc016_write_req_00001');
  assert.equal(write.ok,true,JSON.stringify(write.error));assert.equal(write.data.updated,1);
  const detail=c.send('records_list',{query:'6273'}).data.items[0];
  assert.equal(detail.TRANG_THAI_THAM_GIA,'DA_THAM_GIA');assert.equal(detail.HO_TEN,first.HO_TEN);
  assert.equal(detail.PHIEN_BAN,'2');
  assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),2);
  const logs=c.tables.get('Nhật ký thay đổi').rows;
  assert.ok(logs.some(r=>r.includes('CAP_NHAT_TINH_TRANG_HANG_LOAT')));
});
test('YC016: hai lần import cùng QĐ không được ghi đè hay tăng phiên bản lần hai',()=>{
  const c=setupLive();c.send('record_save',record(c,'67','2026-10-13'));
  const src=statusInput(c,'067'),check=c.send('record_status_bulk_check',{status:'DA_THAM_GIA',rows:[src]}).data.items[0];
  assert.equal(check.kind,'eligible');
  const row={...src,hoSoId:check.hoSoId,version:check.version};
  const x=c.send('record_status_bulk_apply',{status:'DA_THAM_GIA',rows:[row],batchId:'one'},'yc016_dedupe_key_01');
  assert.equal(x.data.updated,1);
  const retry=c.send('record_status_bulk_apply',{status:'DA_THAM_GIA',rows:[row],batchId:'one'},'yc016_dedupe_key_01');
  assert.equal(retry.data.updated,1);
  const twice=c.send('record_status_bulk_apply',{status:'DA_THAM_GIA',rows:[row],batchId:'two'},'yc016_dedupe_key_02');
  assert.equal(twice.data.updated,0);assert.equal(twice.data.results[0].kind,'same');
  assert.equal(c.send('records_list',{query:'67'}).data.items[0].PHIEN_BAN,'2');
});
test('YC016: hồ sơ đang bỏ học không thể bị ghi đè kể cả trùng số và họ tên',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'6280','2026-10-13',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID})).data.record;
  const src=statusInput(c,'6280'),check=c.send('record_status_bulk_check',{status:'DA_THAM_GIA',rows:[src]});
  assert.equal(check.data.items[0].kind,'protected');
  const out=c.send('record_status_bulk_apply',{status:'DA_THAM_GIA',rows:[{...src,hoSoId:a.HO_SO_ID,version:a.PHIEN_BAN}]});
  assert.equal(out.data.updated,0);
  const after=c.send('records_list',{query:'6280'}).data.items[0];assert.equal(after.DA_BO_HOC,'TRUE');assert.equal(after.NGAY_BO_HOC,'KY:2');assert.equal(after.LY_DO_BO_HOC_ID,c.reason.LY_DO_ID);
});
test('YC016: thay đổi đồng thời sau xem trước không cho ghi đè',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'6273','2026-10-13')).data.record;
  const src=statusInput(c);const check=c.send('record_status_bulk_check',{status:'KHONG_THAM_GIA',rows:[src]}).data.items[0];
  const update=c.send('record_status',{HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:'1',TRANG_THAI_THAM_GIA:'KHONG_NHAN_QUYET_DINH'});
  assert.equal(update.ok,true,JSON.stringify(update.error));
  const apply=c.send('record_status_bulk_apply',{status:'KHONG_THAM_GIA',rows:[{...src,hoSoId:check.hoSoId,version:check.version}]});
  assert.equal(apply.data.updated,0);assert.equal(apply.data.results[0].kind,'protected');
  assert.equal(c.send('records_list',{query:'6273'}).data.items[0].TRANG_THAI_THAM_GIA,'KHONG_NHAN_QUYET_DINH');
});
test('YC016: sai họ tên/trường, trùng và thiếu quyết định được liệt kê, không ghi',()=>{
  const c=setupLive();c.send('record_save',record(c,'6273','2026-10-13'));
  const p={status:'DA_THAM_GIA',rows:[statusInput(c,'6273','2026-10-13','Khác tên'),{...statusInput(c),line:4,school:'Trường XYZ'},statusInput(c,'99'),{...statusInput(c,'6273'),line:6}]};
  const x=c.send('record_status_bulk_check',p);assert.equal(x.ok,true);
  assert.equal(x.data.items[0].kind,'invalid');assert.equal(x.data.items[1].kind,'duplicate');assert.equal(x.data.items[2].kind,'missing');assert.equal(x.data.items[3].kind,'duplicate');
  assert.equal(c.send('records_list',{query:'6273'}).data.items[0].TRANG_THAI_THAM_GIA,'CHO_XAC_NHAN');
});
test('YC016: Bỏ học bắt buộc kỳ hợp lệ, lý do hợp lệ',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'6273','2026-10-13',{SO_THANG_HO_TRO:'3'})).data.record;
  const src=statusInput(c),row={...src,hoSoId:a.HO_SO_ID,version:a.PHIEN_BAN};
  assert.equal(c.send('record_status_bulk_check',{status:'BO_HOC',rows:[src]}).data.items[0].kind,'invalid');
  assert.equal(c.send('record_status_bulk_apply',{status:'BO_HOC',rows:[row]}).data.updated,0);
  const good=c.send('record_status_bulk_check',{status:'BO_HOC',dropoutPeriod:'KY:2',dropoutReason:c.reason.LY_DO_ID,rows:[src]});
  assert.equal(good.data.items[0].kind,'eligible');
  const out=c.send('record_status_bulk_apply',{status:'BO_HOC',dropoutPeriod:'KY:2',dropoutReason:c.reason.LY_DO_ID,rows:[row]});
  assert.equal(out.data.updated,1);
  const after=c.send('records_list',{query:'6273'}).data.items[0];assert.equal(after.DA_BO_HOC,'TRUE');assert.equal(after.NGAY_BO_HOC,'KY:2');
});
test('YC016: NHAN_VIEN không được phép kiểm tra/ghi hàng loạt',()=>{
  const c=setupLive();c.send('account_save',{email:'staff016@example.com',name:'Nhân viên',role:'NHAN_VIEN',status:'ACTIVE'});
  const identity={sub:'82345678901234567890',aud:audience,email:'staff016@example.com'};
  const res=c.signed('record_status_bulk_check',{status:'DA_THAM_GIA',rows:[statusInput(c)]},'yc016_denied_request_01',identity);
  const out=JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(res)}}).getContent());
  assert.equal(out.ok,false);assert.equal(out.error.code,'NO_PERMISSION');
});

// YC-HN-017: kiểm thử đường cache và tối ưu đúng, không giảm kiểm tra quyền.
test('YC017: permission_check trả revision nhưng không tải danh mục/bootstrap',()=>{
  const c=setupLive();
  const res=c.send('permission_check');
  assert.equal(res.ok,true,JSON.stringify(res.error));
  assert.equal(res.data.user.VAI_TRO,'ADMIN');
  assert.equal(res.data.permissionRevision,c.global.version_('USERS'));
  assert.equal(res.data.dataRevision,c.global.version_('DATA'));
  assert.ok(!Object.hasOwn(res.data,'catalogs'));
});

test('YC017: snapshot đọc cache getAll trọn vẹn khi không đọc được bảng nguồn',()=>{
  const c=setupLive();
  assert.equal(c.send('record_save',record(c,'067','2026-10-01')).ok,true);
  const first=c.global.cachedRecordSnapshot_();
  assert.equal(first.length,1);
  const original=c.global.sheetRows_;
  c.global.sheetRows_=()=>{throw Error('Đường cache nóng không được đọc Sheets');};
  const warm=c.global.cachedRecordSnapshot_();
  assert.equal(warm.length,1);
  assert.equal(warm[0].SO_QUYET_DINH,'067');
  c.global.sheetRows_=original;
});

test('YC017: index số quyết định tự quét lại khi dòng bị sắp xếp thủ công',()=>{
  const c=setupLive();
  assert.equal(c.send('record_save',record(c,'067','2026-10-01')).ok,true);
  assert.equal(c.send('record_save',record(c,'6204','2026-10-02')).ok,true);
  const user=c.global.authorize_({email:'admin@example.com',sub:'12345678901234567890'},'records_list');
  const result=c.global.exactDecisionRecords_({query:'67'},user);
  assert.equal(result.length,1);assert.equal(result[0].SO_QUYET_DINH,'067');
  const sh=c.tables.get('Hồ sơ học nghề');
  [sh.rows[1],sh.rows[2]]=[sh.rows[2],sh.rows[1]];
  const again=c.global.exactDecisionRecords_({query:'67'},user);
  assert.equal(again.length,1);assert.equal(again[0].SO_QUYET_DINH,'067');
});

test('YC017: phân trang nhật ký đọc đúng trang đầu và trang cuối khi có hơn 30 dòng',()=>{
  const c=setupLive();
  const sh=c.tables.get('Nhật ký thay đổi');
  for(let i=0;i<65;i++)sh.rows.push(['LOG_'+i,'2026-10-20','ADMIN','admin@example.com','ACT_'+i,'RECORD','R_'+i,'','THANH_CONG','request_'+i]);
  const first=c.send('audit_list',{page:1}),third=c.send('audit_list',{page:3});
  assert.equal(first.ok,true,JSON.stringify(first.error));
  assert.equal(first.data.total>=65,true);
  assert.equal(first.data.items.length,30);
  assert.equal(first.data.items[0].NHAT_KY_ID,'LOG_64');
  assert.equal(third.data.items.length>=5,true);
});

test('YC017: thu hồi tài khoản có hiệu lực ngay khi USERS revision đổi',()=>{
  const c=setupLive();
  const created=c.send('account_save',{email:'school@example.com',name:'Trường ABC',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
  assert.equal(created.ok,true,JSON.stringify(created.error));
  const who={email:'school@example.com',sub:'92345678901234567890',aud:audience};
  function asSchool(){const signed=c.signed('permission_check',{},'school_permission_00001',who);return JSON.parse(c.global.doPost({postData:{contents:JSON.stringify(signed)}}).getContent());}
  const before=asSchool();assert.equal(before.ok,true,JSON.stringify(before.error));
  const deleted=c.send('account_delete',{id:created.data.item.TAI_KHOAN_ID});
  assert.equal(deleted.ok,true,JSON.stringify(deleted.error));
  const after=asSchool();assert.equal(after.ok,false);assert.equal(after.error.code,'NOT_AUTHORIZED');
});

test('YC017: getAll đọc toàn bộ các mảnh snapshot trong một lượt dịch vụ',()=>{
  const c=setupLive(),sh=c.tables.get('Hồ sơ học nghề');
  const hdr=c.global.APP.lists.HO_SO_HOC_NGHE;
  for(let i=0;i<300;i++)sh.rows.push(hdr.map((key,j)=>j===0?'ID_'+i:key==='HO_TEN'?'Người học số '+i:key==='SO_QUYET_DINH'?String(1000+i):key==='NAM_QUYET_DINH'?'2026':key==='TRANG_THAI_HO_SO'?'ACTIVE':''));
  let batchReads=0,batchWrites=0;
  const cache=c.global.cache_(),oldGetAll=cache.getAll,oldPutAll=cache.putAll;
  // Stub CacheService wrappers preserve same in-memory backing Map between instances.
  c.global.cache_=()=>({
    ...cache,
    getAll(keys){batchReads++;return oldGetAll(keys);},
    putAll(map,ttl){batchWrites++;return oldPutAll(map,ttl);}
  });
  const first=c.global.cachedRecordSnapshot_();assert.equal(first.length,300);
  const second=c.global.cachedRecordSnapshot_();assert.equal(second.length,300);
  assert.equal(batchWrites,1);
  assert.equal(batchReads,1);
});

test('YC017: auth cache chỉ tránh đọc lại tab tài khoản trong phạm vi cùng phiên bản quyền',()=>{
  const c=setupLive();let reads=0;
  const original=c.global.sheetRows_;
  c.global.sheetRows_=(name)=>{if(name==='TAI_KHOAN')reads++;return original(name);};
  const identity={email:'admin@example.com',sub:'12345678901234567890'};
  c.global.authorize_(identity,'records_list');
  const afterFirst=reads;
  c.global.authorize_(identity,'records_list');
  assert.equal(reads,afterFirst,'Lần hai không phải đọc toàn bộ TAI_KHOAN');
  c.global.bump_('USERS');
  c.global.authorize_(identity,'records_list');
  assert.ok(reads>afterFirst,'Sau khi đổi USERS revision bắt buộc kiểm tra bảng quyền mới');
});

// YC-HN-030: kỳ bỏ học chỉ được tạo mới từ tháng 1–6 và không vượt số tháng hỗ trợ.
test('YC033: tháng 1–6 hợp lệ, không giới hạn bởi thời gian hỗ trợ 3 tháng',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'8101','2026-10-19',{SO_THANG_HO_TRO:'3'})).data.record;
  const payload={HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:a.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,LY_DO_BO_HOC_ID:c.reason.LY_DO_ID};
  const fourth=c.send('record_status',{...payload,NGAY_BO_HOC:'KY:4'});
  assert.equal(fourth.ok,true,JSON.stringify(fourth.error));
  // Các lần cập nhật cùng hồ sơ phải dùng phiên bản mới nhất (tránh ghi đè).
  payload.PHIEN_BAN=fourth.data.record.PHIEN_BAN;
  const first=c.send('record_status',{...payload,NGAY_BO_HOC:'KY:1'});assert.equal(first.ok,true,JSON.stringify(first.error));
  assert.equal(first.data.record.NGAY_BO_HOC,'KY:1');assert.equal(c.send('overview',{}).data.kpi.dropout,1);
  for(const n of [2,3]){
    const x=c.send('record_save',record(c,'8101'+n,'2026-10-19',{SO_THANG_HO_TRO:'3'})).data.record;
    assert.equal(c.send('record_status',{...payload,HO_SO_ID:x.HO_SO_ID,PHIEN_BAN:x.PHIEN_BAN,NGAY_BO_HOC:'KY:'+n}).ok,true);
  }
});
test('YC033: tối đa tháng 6, tháng hỗ trợ 1 hoặc 2,5 không khóa tháng bỏ học',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'8102','2026-10-19',{SO_THANG_HO_TRO:'12'})).data.record;
  const payload={HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:a.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,LY_DO_BO_HOC_ID:c.reason.LY_DO_ID};
  assert.equal(c.send('record_status',{...payload,NGAY_BO_HOC:'KY:7'}).error.code,'VALIDATION');
  assert.equal(c.send('record_status',{...payload,NGAY_BO_HOC:'KY:12'}).error.code,'VALIDATION');
  assert.equal(c.send('record_status',{...payload,NGAY_BO_HOC:'KY:6'}).ok,true);
  const part=c.send('record_save',record(c,'8103','2026-10-19',{SO_THANG_HO_TRO:'2,5'})).data.record;
  const half=c.send('record_status',{HO_SO_ID:part.HO_SO_ID,PHIEN_BAN:part.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:6',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(half.ok,true,JSON.stringify(half.error));
  const one=c.send('record_save',record(c,'8104','2026-10-19',{SO_THANG_HO_TRO:'1'})).data.record;
  const more=c.send('record_status',{HO_SO_ID:one.HO_SO_ID,PHIEN_BAN:one.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(more.ok,true,JSON.stringify(more.error));
  assert.equal(c.send('record_status',{HO_SO_ID:one.HO_SO_ID,PHIEN_BAN:more.data.record.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:1',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}).ok,true);
});
test('YC018: ngày bỏ học lịch sử giữ nguyên khi ghi lại trạng thái và không cho tự tạo ngày mới',()=>{
  const c=setupLive();const r=c.send('record_save',record(c,'8105','2026-10-19',{SO_THANG_HO_TRO:'3',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID})).data.record;
  const sh=c.tables.get('Hồ sơ học nghề'),col=c.global.APP.lists.HO_SO_HOC_NGHE.indexOf('NGAY_BO_HOC');sh.rows[1][col]='2026-10-20';
  const preserved=c.send('record_status',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-10-20',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(preserved.ok,true,JSON.stringify(preserved.error));assert.equal(preserved.data.record.NGAY_BO_HOC,'2026-10-20');
  const fresh=c.send('record_save',record(c,'8106','2026-10-19',{SO_THANG_HO_TRO:'3',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-10-20',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
  assert.equal(fresh.error.code,'VALIDATION');
});
test('YC030: kỳ 7-12 hoặc 13+ cũ được giữ nguyên, không tạo mới',()=>{
  const c=setupLive();const r=c.send('record_save',record(c,'8107','2026-10-19',{SO_THANG_HO_TRO:'15',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:6',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID})).data.record;
  const sh=c.tables.get('Hồ sơ học nghề'),col=c.global.APP.lists.HO_SO_HOC_NGHE.indexOf('NGAY_BO_HOC');sh.rows[1][col]='KY:8';
  const next=c.send('record_status',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:8',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(next.ok,true,JSON.stringify(next.error));
  const other=c.send('record_save',record(c,'8108','2026-10-19',{SO_THANG_HO_TRO:'15'})).data.record;
  assert.equal(c.send('record_status',{HO_SO_ID:other.HO_SO_ID,PHIEN_BAN:other.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:13',LY_DO_BO_HOC_ID:c.reason.LY_DO_BO_HOC_ID||c.reason.LY_DO_ID}).error.code,'VALIDATION');
});

// YC-HN-019 — lọc theo ngày ban hành quyết định: giao của các bộ lọc và ranh giới ngày.
test('YC019: lọc đủ tháng, ngày cuối, một ngày và tổng chính xác ở các trang',()=>{
  const c=setupLive();
  for(const [i,date] of ['2026-06-30','2026-07-01','2026-07-15','2026-07-30','2026-07-31','2026-08-01'].entries()){
    const out=c.send('record_save',record(c,String(600+i),date));assert.equal(out.ok,true,JSON.stringify(out.error));
  }
  const july=c.send('records_list',{from:'2026-07-01',to:'2026-07-31',pageSize:2,page:1});
  assert.equal(july.ok,true);assert.equal(july.data.total,4);assert.equal(july.data.items.length,2);
  const second=c.send('records_list',{from:'2026-07-01',to:'2026-07-31',pageSize:2,page:2});
  assert.equal(second.data.total,4);assert.equal(second.data.items.length,2);
  assert.equal(c.send('records_list',{from:'2026-07-01',to:'2026-07-30'}).data.total,3);
  assert.equal(c.send('records_list',{from:'2026-07-31',to:'2026-07-31'}).data.total,1);
  assert.equal(c.send('records_list',{from:'2026-07-31'}).data.total,2);
  assert.equal(c.send('records_list',{to:'2026-07-01'}).data.total,2);
  assert.equal(c.send('records_list',{}).data.total,6);
  assert.equal(c.send('records_list',{year:'2025',from:'2026-07-01',to:'2026-07-31'}).data.total,0);
});

test('YC019: báo cáo, Excel ma trận và Excel chi tiết dùng chung khoảng ngày',()=>{
  const c=setupLive();
  const entries=[
    ['701','2026-07-01','CHO_XAC_NHAN'],
    ['702','2026-07-15','DA_THAM_GIA'],
    ['703','2026-07-30','KHONG_THAM_GIA'],
    ['704','2026-07-31','DA_THAM_GIA'],
    ['705','2026-08-01','CHO_XAC_NHAN']
  ];
  for(const [no,date,status] of entries){const x=c.send('record_save',record(c,no,date,{TRANG_THAI_THAM_GIA:status}));assert.equal(x.ok,true,JSON.stringify(x.error));}
  const range={from:'2026-07-01',to:'2026-07-30'},full={from:'2026-07-01',to:'2026-07-31'};
  assert.equal(c.send('overview',range).data.kpi.total,3);
  assert.equal(c.send('overview',full).data.kpi.total,4,'Cache khác khoảng ngày không được trộn');
  assert.equal(c.send('overview',range).data.kpi.participated,1);
  assert.equal(c.send('overview',{...full,status:'DA_THAM_GIA'}).data.kpi.total,2);
  assert.equal(c.send('overview',{...range,status:'REPORT_PARTICIPATED_ALL'}).data.kpi.total,1);
  assert.equal(c.send('report_matrix',{...range,groupBy:'truong'}).data.total,3);
  assert.equal(c.send('report_matrix',{...range,groupBy:'nghe'}).data.items[0].total,3);
  const exp=c.send('report_export',range).data;
  assert.equal(exp.items.length,3);
  assert.deepEqual(exp.items.map(r=>r[6]).sort(),['2026-07-01','2026-07-15','2026-07-30']);
});

test('YC019: API từ chối ngày không hợp lệ và Từ ngày sau Đến ngày',()=>{
  const c=setupLive();
  for(const pair of [
    {from:'2026-02-30'}, {to:'2025-02-29'}, {from:'31/07/2026'}, {from:'2026-7-01'},
    {from:'2026-08-01',to:'2026-07-31'}, {to:'ngay'}, {from:'2026-13-01'}
  ])for(const action of ['records_list','overview','report_matrix','report_export']){
    const payload=action==='report_matrix'?{...pair,groupBy:'truong'}:pair;
    const out=c.send(action,payload);assert.equal(out.ok,false,action+JSON.stringify(pair));assert.equal(out.error.code,'VALIDATION');
  }
  assert.equal(c.send('records_list',{from:'2024-02-29',to:'2024-02-29'}).ok,true);
});

test('YC019: tài khoản trường chỉ được xem thống kê và hồ sơ đúng cơ sở trong khoảng lọc',()=>{
  const c=setupLive(),xyz=catalog(c,'truong','CS002','Trường XYZ');
  c.send('record_save',record(c,'801','2026-07-15'));
  c.send('record_save',record(c,'802','2026-07-16',{TRUONG_ID:xyz.TRUONG_ID}));
  const acc=c.send('account_save',{email:'school019@example.com',name:'Người dùng trường',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
  assert.equal(acc.ok,true);
  const user={sub:'92345678901234567890',aud:audience,email:'school019@example.com'};
  assert.equal(sendAs(c,user,'records_list',{from:'2026-07-01',to:'2026-07-31'}).data.total,1);
  assert.equal(sendAs(c,user,'overview',{from:'2026-07-01',to:'2026-07-31'}).data.kpi.total,1);
  assert.equal(sendAs(c,user,'records_list',{from:'2026-07-01',to:'2026-07-31',truong:xyz.TRUONG_ID}).data.total,0);
  assert.equal(sendAs(c,user,'report_export',{from:'2026-07-01',to:'2026-07-31'}).data.items.length,1);
});

// YC-HN-023: ngày kết thúc đào tạo dự kiến là chế độ lọc ảo, không phải tình trạng được lưu.
test('YC023 lọc theo ngày QĐ đối với tình trạng thực tế và lọc theo ngày kết thúc dự kiến khi chọn chế độ mới',()=>{
  const c=setupLive();
  const entries=[
    ['101','2026-10-13','2027-07-14','DA_THAM_GIA'],
    ['102','2026-07-01','2027-01-14','DA_THAM_GIA'],
    ['103','2026-08-03','2027-07-01','CHO_XAC_NHAN'],
    ['104','2026-09-10','2027-07-31','KHONG_THAM_GIA'],
    ['105','2026-07-31','2027-08-01','DA_THAM_GIA'],
    ['106','2026-08-15','','DA_THAM_GIA'],
  ];
  for(const [no,decision,end,status] of entries){
    const res=c.send('record_save',record(c,no,decision,{NGAY_BAT_DAU:'2026-06-01',NGAY_KET_THUC_DU_KIEN:end,TRANG_THAI_THAM_GIA:status}));
    assert.equal(res.ok,true,JSON.stringify(res.error));
  }
  const range={from:'2027-07-01',to:'2027-07-31'};
  const course={...range,status:'FILTER_COURSE_END_DATE'};
  assert.equal(c.send('records_list',range).data.total,0,'Các quyết định phát hành 2026 không thuộc tháng 7/2027');
  const list=c.send('records_list',course);
  assert.equal(list.ok,true,JSON.stringify(list.error));
  assert.deepEqual(Array.from(list.data.items,x=>x.SO_QUYET_DINH),['101'],'Chỉ Đã tham gia, không bỏ học, có ngày kết thúc trong kỳ');
  assert.equal(list.data.total,1);
  assert.equal(c.send('records_list',{status:'FILTER_COURSE_END_DATE',from:'2027-07-14',to:'2027-07-14'}).data.total,1);
  assert.equal(c.send('records_list',{status:'FILTER_COURSE_END_DATE',to:'2027-07-01'}).data.total,1,'Đến ngày một đầu mút, chỉ đếm hồ sơ DA_THAM_GIA đủ điều kiện');
  assert.equal(c.send('records_list',{status:'FILTER_COURSE_END_DATE'}).data.total,3,'Không có ngày chỉ lọc những hồ sơ có ngày kết thúc hợp lệ');
  assert.equal(c.send('records_list',{...course,year:'2027'}).data.total,0,'Năm quyết định không đổi thành năm kết thúc');
  assert.equal(c.send('records_list',{...course,year:'2026',query:'101'}).data.total,1);
  assert.equal(c.send('records_list',{...course,status:'DA_THAM_GIA'}).data.total,0,'Trạng thái thực tế vẫn lọc theo ngày QĐ');
  assert.equal(c.send('records_list',{from:'2026-07-01',to:'2026-07-31',status:'DA_THAM_GIA'}).data.total,2);
  assert.equal(c.send('records_list',{from:'2026-07-01',to:'2026-07-31',status:'CHO_XAC_NHAN'}).data.total,0);
  const exported=c.send('report_export',{...course,source:'records'});
  assert.equal(exported.ok,true,JSON.stringify(exported.error));
  assert.equal(exported.data.columns.length,25);
  assert.deepEqual(Array.from(exported.data.items,x=>x[5]),['101'],'Excel lọc cùng tập hồ sơ, cùng thứ tự');
  assert.equal(exported.data.items[0][13],'2027-07-14','Excel cột N là ngày kết thúc đào tạo');
  assert.equal(c.send('report_export',{...course,source:'records',query:'101'}).data.items.length,1,'Excel giữ từ khóa');
  assert.equal(c.send('report_export',{...course,source:'records',year:'2027'}).data.items.length,0);
  assert.equal(c.send('report_export',{...course}).data.items.length,1,'YC024 đồng bộ xuất Excel Báo cáo theo ngày kết thúc dự kiến');
  assert.equal(c.send('overview',course).data.kpi.total,1,'YC024 tổng hợp đúng tập hồ sơ kết thúc dự kiến trong kỳ');
  assert.equal(c.send('report_matrix',{...course,groupBy:'truong'}).data.total,1,'YC024 ma trận cùng tập kết thúc dự kiến');
  assert.equal(c.send('records_list',{status:'FILTER_COURSE_END_DATE',from:'2027-07-32'}).error.code,'VALIDATION');
  assert.equal(c.send('records_list',{status:'FILTER_COURSE_END_DATE',from:'2027-08-01',to:'2027-07-31'}).error.code,'VALIDATION');
  const rawRows=c.tables.get('Hồ sơ học nghề').rows;
  for(const row of rawRows.slice(1))assert.notEqual(row[13],'FILTER_COURSE_END_DATE','Không ghi tình trạng ảo vào Sheets');
});

test('YC023 phân trang, quyền trường và xuất Excel với lọc theo ngày kết thúc không rò dữ liệu',()=>{
  const c=setupLive(),school2=catalog(c,'truong','CS023','Cơ sở thứ hai');
  for(let n=1;n<=23;n++){
    const day=String(n).padStart(2,'0');
    const res=c.send('record_save',record(c,String(700+n),'2026-10-13',{NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'2027-07-'+day,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',TRUONG_ID:n%2?c.school.TRUONG_ID:school2.TRUONG_ID}));
    assert.equal(res.ok,true,JSON.stringify(res.error));
  }
  const range={status:'FILTER_COURSE_END_DATE',from:'2027-07-01',to:'2027-07-31'};
  assert.equal(c.send('records_list',{...range,pageSize:20,page:1}).data.items.length,20);
  assert.equal(c.send('records_list',{...range,pageSize:20,page:2}).data.items.length,3);
  assert.equal(c.send('report_export',{...range,source:'records'}).data.items.length,23);
  const acc=c.send('account_save',{email:'yc023school@example.com',name:'Trường YC023',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
  assert.equal(acc.ok,true,JSON.stringify(acc.error));
  const user={sub:'82345678901234567890',aud:audience,email:'yc023school@example.com'};
  const scoped=sendAs(c,user,'records_list',range);
  assert.equal(scoped.ok,true,JSON.stringify(scoped.error));
  assert.equal(scoped.data.total,12);
  assert.ok(scoped.data.items.every(r=>r.TRUONG_ID===c.school.TRUONG_ID));
  assert.equal(sendAs(c,user,'report_export',{...range,source:'records'}).data.items.length,12);
});

// YC-HN-024: tổng hợp, ma trận và Excel báo cáo phải dùng cùng trường ngày kết thúc dự kiến.
test('YC024 báo cáo lọc ngày kết thúc dự kiến, gồm cả hai đầu mút và mọi trạng thái học viên',()=>{
 const c=setupLive();
 const rows=[
   ['801','2026-10-13','2027-07-01','DA_THAM_GIA'],
   ['802','2026-10-14','2027-07-14','CHO_XAC_NHAN'],
   ['803','2026-10-15','2027-07-31','KHONG_THAM_GIA'],
   ['804','2026-07-12','2027-06-30','DA_THAM_GIA'],
   ['805','2026-07-13','2027-08-01','DA_THAM_GIA'],
   ['806','2026-07-14','','DA_THAM_GIA'],
 ];
 for(const [number,decision,end,status] of rows){
   const result=c.send('record_save',record(c,number,decision,{NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:end,TRANG_THAI_THAM_GIA:status}));
   assert.equal(result.ok,true,JSON.stringify(result.error));
 }
 const params={status:'FILTER_COURSE_END_DATE',from:'2027-07-01',to:'2027-07-31'};
 const overview=c.send('overview',params);assert.equal(overview.ok,true,JSON.stringify(overview.error));
 assert.equal(overview.data.kpi.total,1);
 assert.equal(overview.data.kpi.courseEndScheduled,1,'YC024 V2: lọc theo lịch kết thúc: số lịch kết thúc bằng tập hồ sơ');
 assert.equal(overview.data.kpi.participated,1);
 assert.equal(overview.data.kpi.courseEndParticipated,1,'Chỉ người Đã tham gia, không bỏ học được tính Hoàn thành');
 assert.equal(overview.data.kpi.pending,0);
 assert.equal(overview.data.kpi.notParticipating,0);
 const report=c.send('report_export',params);assert.equal(report.ok,true,JSON.stringify(report.error));
 assert.equal(report.data.columns.length,25);
 assert.deepEqual(Array.from(report.data.items,row=>row[5]),['801']);
 assert.deepEqual(Array.from(report.data.items,row=>row[13]),['2027-07-01']);
 for(const groupBy of ['truong','nghe']){
   const matrix=c.send('report_matrix',{...params,groupBy});assert.equal(matrix.ok,true,JSON.stringify(matrix.error));
   assert.equal(matrix.data.total,1);
   assert.equal(matrix.data.items.reduce((sum,x)=>sum+x.total,0),1);
 }
 const allOverview=c.send('overview',{}).data.kpi;
 assert.equal(allOverview.total,6);
 assert.equal(allOverview.courseEndScheduled,5,'Ngày kết thúc rỗng không tính, không cộng trùng vào tổng quyết định');
 assert.equal(allOverview.courseEndParticipated,3,'Tập con người đã tham gia: 801, 804, 805');
 assert.equal(c.send('overview',{status:'DA_THAM_GIA',from:'2026-07-01',to:'2026-07-31'}).data.kpi.courseEndScheduled,2,'Bộ lọc cũ lấy ngày QĐ nhưng hàng lịch kết thúc chỉ đếm ngày dự kiến hợp lệ trong tập');
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE',from:'2027-07-01',to:'2027-07-01'}).data.kpi.courseEndScheduled,1,'Đầu mút ngày 01 được tính');
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE',from:'2027-07-31',to:'2027-07-31'}).data.kpi.courseEndScheduled,0,'Đầu mút ngày 31 được tính');
 assert.equal(c.send('overview',{from:'2027-07-01',to:'2027-07-31'}).data.kpi.total,0,'Tất cả tình trạng tiếp tục dùng ngày QĐ');
 assert.equal(c.send('overview',{status:'DA_THAM_GIA',from:'2026-07-01',to:'2026-07-31'}).data.kpi.total,3,'Tình trạng cũ tiếp tục dùng ngày QĐ');
 assert.equal(c.send('overview',{...params,year:'2026'}).data.kpi.total,1,'Năm QĐ 2026 vẫn là năm QĐ');
 assert.equal(c.send('overview',{...params,year:'2027'}).data.kpi.total,0);
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE'}).data.kpi.total,3,'Không ngày vẫn đòi ngày kết thúc hợp lệ');
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE',to:'2027-07-01'}).data.kpi.total,2);
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE',from:'2027-07-31'}).data.kpi.total,1);
 assert.equal(c.send('overview',{...params,from:'2027-07-32'}).error.code,'VALIDATION');
 assert.equal(c.send('overview',{...params,from:'2027-08-01'}).error.code,'VALIDATION');
 const raw=c.tables.get('Hồ sơ học nghề').rows;for(const row of raw.slice(1))assert.ok(!row.includes('FILTER_COURSE_END_DATE'));
});

test('YC024 lọc trường và quyền khi thống kê, không cấp thêm quyền Excel',()=>{
 const c=setupLive(),other=catalog(c,'truong','CS024','Trường 2');
 for(const [number,school] of [['911',c.school.TRUONG_ID],['912',other.TRUONG_ID]]){
   assert.equal(c.send('record_save',record(c,number,'2026-10-13',{NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'2027-07-14',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',TRUONG_ID:school})).ok,true);
 }
 const params={status:'FILTER_COURSE_END_DATE',from:'2027-07-01',to:'2027-07-31'};
 assert.equal(c.send('overview',params).data.kpi.total,2);
 assert.equal(c.send('overview',{...params,truong:other.TRUONG_ID}).data.kpi.total,1);
 assert.equal(c.send('report_matrix',{...params,groupBy:'truong'}).data.items.length,2);
 const acc=c.send('account_save',{email:'school024@example.com',name:'Trường kiểm thử',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
 assert.equal(acc.ok,true,JSON.stringify(acc.error));
 const actor={sub:'82345678901234567890',aud:audience,email:'school024@example.com'};
 assert.equal(sendAs(c,actor,'overview',params).data.kpi.total,1);
 assert.equal(sendAs(c,actor,'overview',params).data.kpi.courseEndScheduled,1,'Không đếm dữ liệu của trường ngoài quyền');
 assert.equal(sendAs(c,actor,'overview',{...params,truong:other.TRUONG_ID}).data.kpi.total,0);
 assert.equal(sendAs(c,actor,'report_export',params).data.items.length,1);
 assert.equal(sendAs(c,actor,'report_matrix',{...params,groupBy:'truong'}).data.items.length,1);
});

test('YC024 V2 không tính ngày kết thúc dự kiến sai lịch trong thống kê thông thường',()=>{
 const c=setupLive();
 for(const [number,end] of [['2101','2027-07-15'],['2102','2027-02-30'],['2103','']]){
   const res=c.send('record_save',record(c,number,'2026-10-23',{NGAY_BAT_DAU:'2026-10-25',NGAY_KET_THUC_DU_KIEN:end==='2027-02-30'?'2027-02-28':end,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}));
   assert.equal(res.ok,true,JSON.stringify(res.error));
 }
 // Mô phỏng một hàng bị sửa thủ công ngoài ứng dụng thành ngày lịch không tồn tại.
 const sheet=c.tables.get('Hồ sơ học nghề');
 const dateColumn=c.global.APP.lists.HO_SO_HOC_NGHE.indexOf('NGAY_KET_THUC_DU_KIEN');
 assert.ok(dateColumn>=0);
 sheet.rows[2][dateColumn]='2027-02-30';
 const k=c.send('overview',{}).data.kpi;
 assert.equal(k.total,3);
 assert.equal(k.courseEndScheduled,1,'Chỉ một hồ sơ có ngày ISO hợp lệ');
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE'}).data.kpi.total,1,'Bộ lọc đặc biệt cũng loại ngày sai');
});

test('YC025: lọc ảo Tổng số Quyết định đã ban hành không phải trạng thái thật, giữ khoảng ngày/năm và xuất Excel',()=>{
 const c=setupLive();
 for(const [n,date] of [['201','2026-07-01'],['202','2026-07-31'],['203','2026-08-01']]){
   const status=n==='202'?'DA_THAM_GIA':'CHO_XAC_NHAN';
   const response=c.send('record_save',record(c,n,date,{TRANG_THAI_THAM_GIA:status}));
   assert.equal(response.ok,true,JSON.stringify(response.error));
 }
 const range={status:'FILTER_ALL_DECISIONS',year:'2026',from:'2026-07-01',to:'2026-07-31'};
 const over=c.send('overview',range);assert.equal(over.ok,true,JSON.stringify(over.error));
 assert.equal(over.data.kpi.total,2);
 assert.equal(c.send('records_list',{...range,page:1,pageSize:20}).data.total,2);
 const excel=c.send('report_export',{...range,source:'records'});assert.equal(excel.ok,true,JSON.stringify(excel.error));
 assert.equal(excel.data.items.length,2);
 const matrix=c.send('report_matrix',{...range,groupBy:'nghe'});assert.equal(matrix.ok,true,JSON.stringify(matrix.error));assert.equal(matrix.data.total,2);
 const reportExcel=c.send('report_export',range);assert.equal(reportExcel.ok,true,JSON.stringify(reportExcel.error));assert.equal(reportExcel.data.items.length,2);
 assert.equal(c.send('overview',{status:'FILTER_ALL_DECISIONS',from:'2026-08-01',to:'2026-08-31'}).data.kpi.total,1);
 const all=c.send('overview',{}).data.kpi;assert.equal(all.total,3);
 assert.equal(c.send('overview',{status:'FILTER_ALL_DECISIONS',year:'2027'}).data.kpi.total,0);
});

test('YC025: bộ lọc tổng quyết định không rò dữ liệu sang cơ sở khác và không cấp quyền xuất Excel',()=>{
 const c=setupLive(),other=catalog(c,'truong','SCHOOL25','Trường khác');
 for(const [n,school] of [['301',c.school.TRUONG_ID],['302',other.TRUONG_ID]]){
   assert.equal(c.send('record_save',record(c,n,'2026-07-14',{TRUONG_ID:school})).ok,true);
 }
 const a=c.send('account_save',{email:'yc025school@example.com',name:'Trường YC025',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
 assert.equal(a.ok,true,JSON.stringify(a.error));
 const actor={sub:'96345678901234567890',aud:audience,email:'yc025school@example.com'};
 const f={status:'FILTER_ALL_DECISIONS',from:'2026-07-01',to:'2026-07-31'};
 assert.equal(sendAs(c,actor,'overview',f).data.kpi.total,1);
 const list=sendAs(c,actor,'records_list',{...f,page:1,pageSize:20});
 assert.equal(list.ok,true,JSON.stringify(list.error));assert.equal(list.data.total,1);
 assert.equal(list.data.items[0].TRUONG_ID,c.school.TRUONG_ID);
 assert.equal(sendAs(c,actor,'overview',{...f,truong:other.TRUONG_ID}).data.kpi.total,0);
 assert.equal(sendAs(c,actor,'report_export',f).data.items.length,1);
});

// YC-HN-025 V2: ví dụ 10 quyết định và chỉ 1 đã tham gia còn học đến ngày kết thúc.
test('YC025 V2 mười QĐ chỉ một người Đã tham gia không bỏ học được tính Hoàn thành khóa học',()=>{
 const c=setupLive();
 for(let i=1;i<=10;i++){
   const status=i===1||i===2?'DA_THAM_GIA':i===3?'KHONG_THAM_GIA':i===4?'KHONG_NHAN_QUYET_DINH':'CHO_XAC_NHAN';
   const dropout=i===2;
   const payload={NGAY_BAT_DAU:'2026-04-01',NGAY_KET_THUC_DU_KIEN:'2026-06-10',TRANG_THAI_THAM_GIA:status,
    ...(dropout?{DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}:{})};
   const result=c.send('record_save',record(c,String(5000+i),'2026-02-02',payload));
   assert.equal(result.ok,true,JSON.stringify(result.error));
 }
 const range={status:'FILTER_COURSE_END_DATE',from:'2026-06-01',to:'2026-06-30'};
 const list=c.send('records_list',range).data;
 assert.equal(list.total,1,'Chỉ một người đủ điều kiện');
 assert.equal(list.items[0].SO_QUYET_DINH,'5001');
 assert.equal(c.send('records_list',{...range,to:'2026-06-09'}).data.total,0,'Trước ngày kết thúc không tính');
 assert.equal(c.send('records_list',{...range,from:'2026-06-10',to:'2026-06-10'}).data.total,1,'Tính ngày kết thúc gồm đầu mút');
 const report=c.send('overview',range).data.kpi;
 assert.equal(report.total,1);assert.equal(report.courseEndParticipated,1);assert.equal(report.participated,1);
 assert.equal(c.send('report_export',range).data.items.length,1);
 assert.equal(c.send('report_export',{...range,source:'records'}).data.items.length,1);
 assert.equal(c.send('report_matrix',{...range,groupBy:'truong'}).data.total,1);
 const overall=c.send('overview',{}).data.kpi;
 assert.equal(overall.total,10);
 assert.equal(overall.participated,2,'Đã tham gia cũ bao gồm 1 hồ sơ bỏ học');
 assert.equal(overall.dropout,1);
 assert.equal(overall.courseEndScheduled,10,'Giữ metric cũ cho tương thích');
 assert.equal(overall.courseEndParticipated,1,'Metric hoàn thành mới không tính bỏ học/chưa xác nhận');
 assert.equal(c.send('overview',{status:'FILTER_COURSE_END_DATE'}).data.kpi.courseEndParticipated,1);
 assert.equal(c.send('records_list',{status:'FILTER_ALL_DECISIONS'}).data.total,10);
 const raw=c.tables.get('Hồ sơ học nghề').rows;
 assert.equal(raw.length,11,'Không thay đổi số lượng bản ghi/không thêm trạng thái vật lý');
 assert.equal(raw.slice(1).filter(row=>row.includes('FILTER_COURSE_END_DATE')).length,0);
});


// YC-HN-025 V3: ngày áp dụng cho một hàng Hoàn thành độc lập với ngày QĐ ở các KPI khác.
test('YC025 V3 Tất cả và Hoàn thành luôn cùng số theo ngày kết thúc, dùng một snapshot theo quyền',()=>{
 const c=setupLive(), other=catalog(c,'truong','C025V3','Cơ sở V3 thứ hai');
 const entries=[
  ['7101','2025-12-15','2026-01-01','DA_THAM_GIA',false,c.school.TRUONG_ID],
  ['7102','2026-02-15','2026-06-15','DA_THAM_GIA',false,c.school.TRUONG_ID],
  ['7103','2026-01-14','2026-04-30','DA_THAM_GIA',false,c.school.TRUONG_ID],
  ['7104','2026-03-08','2026-03-20','DA_THAM_GIA',true,c.school.TRUONG_ID],
  ['7105','2026-02-08','2026-03-10','CHO_XAC_NHAN',false,c.school.TRUONG_ID],
  ['7106','2026-02-10','','DA_THAM_GIA',false,c.school.TRUONG_ID],
  ['7107','2026-01-20','2026-03-25','DA_THAM_GIA',false,other.TRUONG_ID]
 ];
 for(const [number,decision,end,status,dropout,school] of entries){
  const extras={TRUONG_ID:school,TRANG_THAI_THAM_GIA:status,
   NGAY_BAT_DAU:end?(decision<'2026-01-01'?'2025-12-20':'2026-01-01'):'',NGAY_KET_THUC_DU_KIEN:end,
   ...(dropout?{DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}:{})};
  const result=c.send('record_save',record(c,number,decision,extras));
  assert.equal(result.ok,true,JSON.stringify(result.error));
 }
 const range={from:'2026-01-01',to:'2026-04-30'};
 const oldVisible=c.global.visibleRecords_;
 let sourceReads=0;
 c.global.visibleRecords_=function(u){sourceReads++;return oldVisible(u);};
 const all=c.send('overview',range);assert.equal(all.ok,true,JSON.stringify(all.error));
 assert.equal(sourceReads,1,'Một snapshot đã kiểm quyền cho hai kiểu lọc ngày');
 assert.equal(all.data.kpi.total,6,'Chỉ tổng số quyết định trong khoảng Ngày QĐ');
 assert.equal(all.data.kpi.participated,5,'Nhóm Đã tham gia gồm Bỏ học');
 assert.equal(all.data.kpi.dropout,1);
 assert.equal(all.data.kpi.pending,1);
 assert.equal(all.data.kpi.courseEndParticipated,3,'Tính theo Ngày kết thúc, gồm cả hồ sơ QĐ 2025');
 const completed=c.send('overview',{...range,status:'FILTER_COURSE_END_DATE'});
 assert.equal(completed.ok,true,JSON.stringify(completed.error));
 assert.equal(completed.data.kpi.total,3);
 assert.equal(completed.data.kpi.courseEndParticipated,all.data.kpi.courseEndParticipated);
 assert.deepEqual(Array.from(c.send('report_export',{...range,status:'FILTER_COURSE_END_DATE'}).data.items,r=>r[5]).sort(),['7101','7103','7107']);
 const scopedRange={...range,truong:c.school.TRUONG_ID};
 assert.equal(c.send('overview',scopedRange).data.kpi.courseEndParticipated,2);
 assert.equal(c.send('overview',{...scopedRange,status:'FILTER_COURSE_END_DATE'}).data.kpi.courseEndParticipated,2);
 assert.equal(c.send('overview',{...range,year:'2025'}).data.kpi.total,0);
 assert.equal(c.send('overview',{...range,year:'2025'}).data.kpi.courseEndParticipated,1,'Năm QĐ giữ nghĩa của nó, độc lập kỳ kết thúc');
 assert.equal(c.send('overview',{...range,year:'2026'}).data.kpi.courseEndParticipated,2);
 for(const partial of [{from:'2026-01-01'}, {to:'2026-04-30'}, {}]){
  const a=c.send('overview',partial).data.kpi.courseEndParticipated;
  const b=c.send('overview',{...partial,status:'FILTER_COURSE_END_DATE'}).data.kpi.courseEndParticipated;
  assert.equal(a,b,'Hai chế độ vẫn đồng nhất khi chỉ một hoặc không có đầu mút');
 }
 assert.equal(c.send('overview',{...range,from:'2026-02-30'}).error.code,'VALIDATION');
 assert.equal(c.send('overview',{...range,from:'2026-05-01'}).error.code,'VALIDATION');
 const acc=c.send('account_save',{email:'yc025v3school@example.com',name:'V3 trường 1',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
 assert.equal(acc.ok,true);
 const actor={sub:'82345678901234567890',aud:audience,email:'yc025v3school@example.com'};
 const schoolAll=sendAs(c,actor,'overview',range);assert.equal(schoolAll.ok,true);
 const schoolEnd=sendAs(c,actor,'overview',{...range,status:'FILTER_COURSE_END_DATE'});assert.equal(schoolEnd.ok,true);
 assert.equal(schoolAll.data.kpi.courseEndParticipated,2);
 assert.equal(schoolEnd.data.kpi.courseEndParticipated,2);
 assert.equal(sendAs(c,actor,'report_export',{...range,status:'FILTER_COURSE_END_DATE'}).data.items.length,2);
});

// YC-HN-026: cấp quyền xuất chỉ cho dữ liệu thuộc trường; giữ quyền ghi không đổi.
test('YC026 tài khoản trường xuất cả danh sách và ma trận, chỉ lấy dữ liệu thuộc trường dù giả mạo tham số',()=>{
 const c=setupLive(),b=catalog(c,'truong','TR026','Trường khác');
 for(const [n,tr] of [['2601',c.school.TRUONG_ID],['2602',b.TRUONG_ID]]){
   assert.equal(c.send('record_save',record(c,n,'2026-10-01',{TRUONG_ID:tr})).ok,true);
 }
 const acc=c.send('account_save',{email:'export026@example.com',name:'Cơ sở xuất báo cáo',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
 assert.equal(acc.ok,true,JSON.stringify(acc.error));
 const user={sub:'92345678901234567890',aud:audience,email:'export026@example.com'};
 const boot=sendAs(c,user,'bootstrap');assert.equal(boot.ok,true,JSON.stringify(boot.error));
 assert.match(boot.data.user.QUYEN,/REPORT_EXPORT/);
 const file=sendAs(c,user,'report_export',{source:'records'});
 assert.equal(file.ok,true,JSON.stringify(file.error));assert.equal(file.data.items.length,1);assert.equal(file.data.items[0][5],'2601');
 assert.equal(sendAs(c,user,'report_export',{source:'records',truong:b.TRUONG_ID}).data.items.length,0);
 for(const mode of ['truong','nghe']){
  const matrix=sendAs(c,user,'report_matrix',{groupBy:mode});assert.equal(matrix.ok,true,JSON.stringify(matrix.error));
  assert.equal(matrix.data.total,1);assert.equal(matrix.data.items.length,1);
  assert.equal(matrix.data.items[0].total,1);
  assert.equal(sendAs(c,user,'report_matrix',{groupBy:mode,truong:b.TRUONG_ID}).data.total,0);
 }
 const staff=c.send('report_matrix',{groupBy:'truong'});assert.equal(staff.data.total,2,'Admin không đổi quyền');
 for(const [action,payload] of [['accounts_list',{}],['record_bulk_import',{rows:[]}],['record_delete',{}],['catalog_save',{type:'nghe'}],['record_save',record(c,'2603','2026-10-03')]]){
  assert.equal(sendAs(c,user,action,payload).error.code,'NO_PERMISSION',action);
 }
});

test('YC026 ma trận dùng hai căn cứ ngày, giữ trường/nghề chỉ có hoàn thành trong kỳ và tổng khớp overview',()=>{
 const c=setupLive(),b=catalog(c,'truong','S026','Trường B'),ngheB=catalog(c,'nghe','N026','Nghề B');
 const dataset=[
  ['2701','2026-10-13','2027-07-15',c.school.TRUONG_ID,c.trade.NGHE_ID,'DA_THAM_GIA'],
  ['2702','2027-07-02','2027-08-15',b.TRUONG_ID,ngheB.NGHE_ID,'CHO_XAC_NHAN'],
  ['2703','2027-07-31','2027-08-15',b.TRUONG_ID,ngheB.NGHE_ID,'KHONG_THAM_GIA']
 ];
 for(const [n,decision,end,school,trade,status] of dataset){
  const x=c.send('record_save',record(c,n,decision,{TRUONG_ID:school,NGHE_ID:trade,TRANG_THAI_THAM_GIA:status,NGAY_BAT_DAU:'2026-10-20',NGAY_KET_THUC_DU_KIEN:end}));
  assert.equal(x.ok,true,JSON.stringify(x.error));
 }
 const f={from:'2027-07-01',to:'2027-07-31'};
 const ov=c.send('overview',f).data.kpi;
 assert.equal(ov.total,2);assert.equal(ov.courseEndParticipated,1);
 for(const groupBy of ['truong','nghe']){
   const response=c.send('report_matrix',{...f,groupBy});assert.equal(response.ok,true,JSON.stringify(response.error));
   const m=response.data;assert.equal(m.total,2);assert.equal(m.items.length,2);
   assert.equal(m.items.reduce((sum,r)=>sum+r.total,0),2);
   assert.equal(m.items.reduce((sum,r)=>sum+r.courseEndParticipated,0),1);
   const onlyCompleted=m.items.find(x=>x.courseEndParticipated===1);assert.equal(onlyCompleted.total,0,'Giữ dòng chỉ hoàn thành trong kỳ');
   const selected=c.send('report_matrix',{...f,status:'FILTER_COURSE_END_DATE',groupBy}).data;
   assert.equal(selected.total,1);assert.equal(selected.items[0].total,1);assert.equal(selected.items[0].courseEndParticipated,1);
 }
});

test('YC026 ma trận tách các tình trạng tùy chỉnh, không cộng trùng vào cột Khác và giới hạn quyền',()=>{
 const c=setupLive();
 const a=c.send('record_save',{...record(c,'2801','2026-04-01'),customStatusName:'Tạm hoãn vì lý do riêng'});
 const b=c.send('record_save',{...record(c,'2802','2026-04-02'),customStatusName:'Chờ bổ sung hồ sơ'});
 assert.equal(a.ok,true,JSON.stringify(a.error));assert.equal(b.ok,true,JSON.stringify(b.error));
 const m=c.send('report_matrix',{groupBy:'truong'});
 assert.equal(m.ok,true,JSON.stringify(m.error));
 assert.equal(m.data.items[0].other,2);assert.equal(m.data.customStatuses.length,2);
 const stats=m.data.items[0].customStatusCounts;
 assert.equal(Object.values(stats).reduce((sum,n)=>sum+n,0),2);
 assert.equal(m.data.items[0].other-Object.values(stats).reduce((sum,n)=>sum+n,0),0);
});


// YC-HN-026 V2 — không được dùng learning (chưa bỏ học) thay cho participated (gồm bỏ học).
test('YC026 V2 ma trận trường/nghề Đã tham gia gồm Bỏ học và khớp overview trong mọi bộ lọc',()=>{
 const c=setupLive(),other=catalog(c,'truong','SCHOOL026V2','Trường thứ hai'),otherTrade=catalog(c,'nghe','TRADE026V2','Nghề thứ hai');
 const schoolA=c.school.TRUONG_ID,schoolB=other.TRUONG_ID,tradeA=c.trade.NGHE_ID,tradeB=otherTrade.NGHE_ID;
 const lines=[
  ['DA_THAM_GIA',false,schoolA,tradeA],
  ['DA_THAM_GIA',false,schoolA,tradeA],
  ['DA_THAM_GIA',true,schoolA,tradeB],
  ['CHO_XAC_NHAN',false,schoolA,tradeB],
  ['KHONG_THAM_GIA',false,schoolA,tradeA],
  ['DA_THAM_GIA',false,schoolB,tradeA],
  ['DA_THAM_GIA',true,schoolB,tradeA],
  ['CHO_XAC_NHAN',false,schoolB,tradeB],
  ['DA_THAM_GIA',false,schoolB,tradeB],
  ['KHONG_NHAN_QUYET_DINH',false,schoolB,tradeB]
 ];
 lines.forEach(([st,dropout,school,trade],i)=>{
  const payload=record(c,String(8501+i),'2026-03-'+String(i+1).padStart(2,'0'),{
   TRUONG_ID:school,NGHE_ID:trade,TRANG_THAI_THAM_GIA:st,
   NGAY_BAT_DAU:'2026-04-01',NGAY_KET_THUC_DU_KIEN:'2026-06-30',
   ...(dropout?{DA_BO_HOC:true,SO_THANG_HO_TRO:'3',NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}:{})
  });
  const result=c.send('record_save',payload);
  assert.equal(result.ok,true,JSON.stringify(result.error));
 });
 const f={from:'2026-03-01',to:'2026-03-31'},overview=c.send('overview',f).data.kpi;
 assert.deepEqual([overview.total,overview.participated,overview.dropout,overview.learning],[10,6,2,4]);
 for(const groupBy of ['truong','nghe']){
  const r=c.send('report_matrix',{...f,groupBy});assert.equal(r.ok,true,JSON.stringify(r.error));
  const groups=r.data.items;
  assert.equal(groups.length,2);
  assert.equal(groups.reduce((sum,g)=>sum+g.participated,0),overview.participated);
  assert.equal(groups.reduce((sum,g)=>sum+g.dropout,0),overview.dropout);
  assert.equal(groups.reduce((sum,g)=>sum+g.learning,0),overview.learning);
  assert.ok(groups.every(g=>g.participated===g.learning+g.dropout));
  const dropoutOnly=c.send('report_matrix',{...f,status:'BO_HOC',groupBy});
  assert.equal(dropoutOnly.ok,true);
  assert.equal(dropoutOnly.data.items.reduce((sum,g)=>sum+g.participated,0),2);
  assert.equal(dropoutOnly.data.items.reduce((sum,g)=>sum+g.dropout,0),2);
  const partOnly=c.send('report_matrix',{...f,status:'REPORT_PARTICIPATED_ALL',groupBy});
  assert.equal(partOnly.ok,true);
  assert.equal(partOnly.data.items.reduce((sum,g)=>sum+g.participated,0),6);
  assert.equal(partOnly.data.items.reduce((sum,g)=>sum+g.dropout,0),2);
 }
 for(const [key,expected] of [[schoolA,3],[schoolB,3]]){
  const r=c.send('report_matrix',{...f,truong:key,groupBy:'truong'}).data.items;
  assert.equal(r.length,1);assert.equal(r[0].participated,expected);assert.equal(r[0].dropout,1);
  assert.equal(c.send('overview',{...f,truong:key}).data.kpi.participated,expected);
 }
 const created=c.send('account_save',{email:'school026v2@example.com',name:'Trường thử nghiệm',role:'CO_SO_DAO_TAO',schoolId:schoolA,status:'ACTIVE'});
 assert.equal(created.ok,true,JSON.stringify(created.error));
 const actor={sub:'99645678901234567890',aud:audience,email:'school026v2@example.com'};
 for(const groupBy of ['truong','nghe']){
  const scoped=sendAs(c,actor,'report_matrix',{...f,groupBy});assert.equal(scoped.ok,true,JSON.stringify(scoped.error));
  assert.equal(scoped.data.items.reduce((sum,g)=>sum+g.participated,0),3);
  assert.equal(scoped.data.items.reduce((sum,g)=>sum+g.dropout,0),1);
  const forged=sendAs(c,actor,'report_matrix',{...f,groupBy,truong:schoolB});
  assert.equal(forged.ok,true);assert.equal(forged.data.items.length,0);
 }
 assert.equal(sendAs(c,actor,'overview',f).data.kpi.participated,3);
});

// YC-HN-027 V2 — kiểm thử quyền nhiều cơ sở, role change và cạnh tranh phiên bản.
test('YC027: A/B/C, hai cơ sở, B cập nhật mọi cơ sở; C chỉ trường mình; nhật ký đúng người',()=>{
 const c=setupLive(),school2=catalog(c,'truong','CS002','Trường thứ hai');
 const A=c.send('record_save',record(c,'271','2026-09-01')).data.record;
 const D=c.send('record_save',record(c,'272','2026-09-02',{TRUONG_ID:school2.TRUONG_ID})).data.record;
 c.send('account_save',{email:'staff027@example.com',name:'Nhân viên B',role:'NHAN_VIEN',status:'ACTIVE'});
 c.send('account_save',{email:'school027@example.com',name:'Trường C',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'});
 const B={sub:'72345678901234567890',aud:audience,email:'staff027@example.com'};
 const C={sub:'82345678901234567890',aud:audience,email:'school027@example.com'};
 assert.equal(sendAs(c,B,'records_list',{}).data.total,2);
 assert.equal(sendAs(c,B,'records_list',{truong:school2.TRUONG_ID}).data.total,1);
 assert.equal(sendAs(c,B,'records_list',{query:'272'}).data.total,1);
 assert.equal(sendAs(c,C,'records_list',{truong:school2.TRUONG_ID}).data.total,0);
 assert.equal(sendAs(c,C,'records_list',{}).data.total,1);
 assert.equal(sendAs(c,C,'report_export',{truong:school2.TRUONG_ID}).data.items.length,0);
 assert.equal(sendAs(c,C,'report_matrix',{groupBy:'truong'}).data.total,1);
 assert.equal(sendAs(c,C,'record_status',{HO_SO_ID:D.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}).error.code,'NO_PERMISSION');
 const bSave=sendAs(c,B,'record_status',{HO_SO_ID:A.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 assert.equal(bSave.ok,true,JSON.stringify(bSave.error));
 assert.equal(bSave.data.record.CAP_NHAT_BOI,B.email);
 // C dùng bản PHIEN_BAN cũ phải thất bại, không ghi đè thay đổi của B.
 const stale=sendAs(c,C,'record_status',{HO_SO_ID:A.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'});
 assert.equal(stale.error.code,'VERSION_CONFLICT');
 const cSave=sendAs(c,C,'record_status',{HO_SO_ID:A.HO_SO_ID,PHIEN_BAN:2,TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'});
 assert.equal(cSave.ok,true,JSON.stringify(cSave.error));assert.equal(cSave.data.record.CAP_NHAT_BOI,C.email);
 const bOther=sendAs(c,B,'record_status',{HO_SO_ID:D.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 assert.equal(bOther.ok,true,JSON.stringify(bOther.error));
 const log=c.send('audit_list',{page:1,pageSize:100}).data.items.filter(x=>x.HANH_DONG==='CAP_NHAT_TRANG_THAI');
 assert.equal(log.filter(x=>x.EMAIL===B.email).length,2);
 assert.equal(log.filter(x=>x.EMAIL===C.email).length,1);
});

test('YC027: khóa/chuyển vai trò B thu hồi quyền ở yêu cầu kế tiếp, không tin QUYEN lịch sử',()=>{
 const c=setupLive(),row=c.send('record_save',record(c,'280','2026-09-15')).data.record;
 const created=c.send('account_save',{email:'staff280@example.com',name:'B',role:'NHAN_VIEN',status:'ACTIVE'}).data.item;
 const B={sub:'92345678901234567890',aud:audience,email:'staff280@example.com'};
 assert.equal(sendAs(c,B,'records_list',{}).data.total,1);
 assert.equal(c.send('account_save',{id:created.TAI_KHOAN_ID,email:B.email,name:'B',role:'NHAN_VIEN',status:'DISABLED'}).ok,true);
 assert.equal(sendAs(c,B,'record_status',{HO_SO_ID:row.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}).error.code,'NOT_AUTHORIZED');
 assert.equal(c.send('account_save',{id:created.TAI_KHOAN_ID,email:B.email,name:'B',role:'CO_SO_DAO_TAO',schoolId:c.school.TRUONG_ID,status:'ACTIVE'}).ok,true);
 assert.equal(sendAs(c,B,'records_list',{}).data.total,1);
 const secondSchool=catalog(c,'truong','CS002','Trường 2');
 const outside=c.send('record_save',record(c,'281','2026-09-15',{TRUONG_ID:secondSchool.TRUONG_ID})).data.record;
 assert.equal(sendAs(c,B,'records_list',{}).data.total,1);
 assert.equal(sendAs(c,B,'record_status',{HO_SO_ID:outside.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}).error.code,'NO_PERMISSION');
});


test('YC028: lưu chức danh theo ID trên CAU_HINH, danh sách và bootstrap trả đúng nhãn, không tăng quyền',()=>{
 const c=setupLive();
 const response=c.send('account_save',{email:'display028@example.com',name:'Nguyễn Văn A',role:'NHAN_VIEN',displayTitle:'  Nhân viên   Phòng A  ',status:'ACTIVE'});
 assert.equal(response.ok,true,JSON.stringify(response.error));
 const id=response.data.item.TAI_KHOAN_ID;
 assert.equal(response.data.item.CHUC_DANH_HIEN_THI,'Nhân viên Phòng A');
 const user=c.send('accounts_list').data.items.find(x=>x.TAI_KHOAN_ID===id);
 assert.equal(user.VAI_TRO,'NHAN_VIEN');assert.equal(user.CHUC_DANH_HIEN_THI,'Nhân viên Phòng A');
 const saved=c.tables.get('Cấu hình hệ thống').rows.filter(r=>r[0]==='HN_STAFF_DISPLAY_'+id);
 assert.equal(saved.length,1);assert.equal(saved[0][1],'Nhân viên Phòng A');
 assert.equal(c.tables.get('Tài khoản người dùng').rows[0].length,12);
 const who={sub:'77234567890123456789',aud:audience,email:'display028@example.com'};
 const boot=sendAs(c,who,'bootstrap',{});assert.equal(boot.ok,true,JSON.stringify(boot.error));
 assert.equal(boot.data.user.CHUC_DANH_HIEN_THI,'Nhân viên Phòng A');
 assert.doesNotMatch(boot.data.user.QUYEN,/RECORD_CREATE|RECORD_EDIT|RECORD_DELETE|ACCOUNT_MANAGE/);
 assert.equal(sendAs(c,who,'report_export',{}).ok,true);
 assert.equal(sendAs(c,who,'account_save',{role:'ADMIN',email:'bad@example.com',status:'ACTIVE'}).error.code,'NO_PERMISSION');
});

test('YC028: sửa rồi xóa trắng chức danh, đổi vai trò vẫn không có nhãn cũ',()=>{
 const c=setupLive();const email='change028@example.com';
 const item=c.send('account_save',{email,name:'B',role:'NHAN_VIEN',status:'ACTIVE',displayTitle:'Trưởng phòng A'}).data.item;
 const who={sub:'88234567890123456789',aud:audience,email};
 assert.equal(sendAs(c,who,'permission_check',{}).data.user.CHUC_DANH_HIEN_THI,'Trưởng phòng A');
 const before=c.props.get('REV_USERS');
 const updated=c.send('account_save',{id:item.TAI_KHOAN_ID,email,name:'B',role:'NHAN_VIEN',status:'ACTIVE',displayTitle:'Trưởng phòng B'});
 assert.equal(updated.ok,true,JSON.stringify(updated.error));assert.notEqual(c.props.get('REV_USERS'),before);
 assert.equal(sendAs(c,who,'permission_check',{}).data.user.CHUC_DANH_HIEN_THI,'Trưởng phòng B');
 assert.equal(sendAs(c,who,'report_matrix',{groupBy:'truong'}).ok,true);
 assert.equal(c.send('account_save',{id:item.TAI_KHOAN_ID,email,name:'B',role:'NHAN_VIEN',status:'ACTIVE',displayTitle:'  '}).ok,true);
 assert.equal(sendAs(c,who,'permission_check',{}).data.user.CHUC_DANH_HIEN_THI,'');
 const changed=c.send('account_save',{id:item.TAI_KHOAN_ID,email,name:'B',role:'ADMIN',status:'ACTIVE',displayTitle:'Chức danh cũ'});
 assert.equal(changed.ok,true);
 const ret=c.send('account_save',{id:item.TAI_KHOAN_ID,email,name:'B',role:'NHAN_VIEN',status:'ACTIVE'});
 assert.equal(ret.ok,true);assert.equal(ret.data.item.CHUC_DANH_HIEN_THI,'');
});

test('YC028: ngăn chức danh công thức/ký tự điều khiển/quá 100; không tạo quyền quản trị',()=>{
 const c=setupLive();
 for(const title of ['a'.repeat(101),'=IMPORTXML(1)','Nhãn\nquản lý']){
  const result=c.send('account_save',{email:'invalid028@example.com',name:'B',role:'NHAN_VIEN',status:'ACTIVE',displayTitle:title});
  assert.equal(result.error.code,'VALIDATION',JSON.stringify(result));
 }
 const item=c.send('account_save',{email:'safe028@example.com',name:'B',role:'NHAN_VIEN',status:'ACTIVE',displayTitle:'Quản trị viên <script>alert(1)</script>'}).data.item;
 assert.match(item.CHUC_DANH_HIEN_THI,/Quản trị viên/);
 const who={sub:'99234567890123456789',aud:audience,email:'safe028@example.com'};
 assert.equal(sendAs(c,who,'record_delete',{HO_SO_ID:'UNKNOWN'}).error.code,'NO_PERMISSION');
 assert.equal(sendAs(c,who,'audit_list',{}).error.code,'NO_PERMISSION');
});

test('YC029 V5: xem lại một hồ sơ với quyền backend, không lộ ID tệp và giảm quét 40 cột',()=>{
 const c=setupLive();
 const created=c.send('record_save',record(c,'902','2026-08-08')).data.record;
 const admin=c.send('record_fresh',{HO_SO_ID:created.HO_SO_ID});
 assert.equal(admin.ok,true,JSON.stringify(admin.error));
 assert.equal(admin.data.record.SO_QUYET_DINH,'902');
 assert.equal(admin.data.record.PHIEN_BAN,'1');
 assert.equal(admin.data.record.TEP_DRIVE_ID,undefined);
 const missing=c.send('record_fresh',{HO_SO_ID:'HS_WRONG'});
 assert.equal(missing.error.code,'NOT_FOUND');
 const staffUser=c.send('account_save',{email:'staff029@example.com',name:'Nhân viên',role:'NHAN_VIEN',status:'ACTIVE'}).data.item;
 const staff={sub:'22345678901234567891',aud:audience,email:'staff029@example.com'};
 assert.equal(sendAs(c,staff,'record_fresh',{HO_SO_ID:created.HO_SO_ID}).ok,true);
 const before=sendAs(c,staff,'record_fresh',{HO_SO_ID:created.HO_SO_ID}).data.record;
 const first=c.send('record_status',{HO_SO_ID:created.HO_SO_ID,PHIEN_BAN:before.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 assert.equal(first.ok,true);
 const stale=sendAs(c,staff,'record_status',{HO_SO_ID:created.HO_SO_ID,PHIEN_BAN:before.PHIEN_BAN,TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'});
 assert.equal(stale.error.code,'VERSION_CONFLICT');
 assert.equal(c.send('record_fresh',{HO_SO_ID:created.HO_SO_ID}).data.record.TRANG_THAI_THAM_GIA,'DA_THAM_GIA');
 assert.ok(staffUser.TAI_KHOAN_ID);
});

test('YC029 V5: sửa một hồ sơ giữ chống trùng quyết định và người học có mã đang dùng',()=>{
 const c=setupLive(),a=c.send('record_save',record(c,'903','2026-09-01')).data.record;
 const b=c.send('record_save',record(c,'904','2026-09-01')).data.record;
 const edit=c.send('record_save',{...record(c,'904','2026-09-01'),HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:1});
 assert.equal(edit.error.code,'DECISION_DUPLICATE');
 const revise=c.send('record_save',{...record(c,'905','2026-09-01'),HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:1});
 assert.equal(revise.ok,true,JSON.stringify(revise.error));
 assert.equal(revise.data.record.PHIEN_BAN,'2');
 assert.equal(c.send('records_list',{query:'905'}).data.total,1);
 assert.equal(c.send('records_list',{query:'904'}).data.total,1);
 assert.equal(b.PHIEN_BAN,'1');
});

test('YC029 V5: lượt đọc một hồ sơ không quét 40 cột của toàn bảng',()=>{
 const c=setupLive();
 for(let i=0;i<12;i++)assert.equal(c.send('record_save',record(c,String(930+i),'2026-01-20')).ok,true);
 const sh=c.tables.get('Hồ sơ học nghề');
 const calls=[];const original=sh.getRange.bind(sh);
 sh.getRange=(row,col,height,width)=>{calls.push({row,col,height,width});return original(row,col,height,width);};
 const result=c.send('record_fresh',{HO_SO_ID:sh.rows[1][0]});
 assert.equal(result.ok,true,JSON.stringify(result.error));
 assert.ok(calls.some(x=>x.width===1&&x.height>=12),'ID scan is one column');
 assert.ok(calls.some(x=>x.height===1&&x.width===40),'read exact record');
 assert.ok(!calls.some(x=>x.width===40&&x.height>1),'not full sheet');
});

test('YC029 V5: lưu sửa chỉ đọc cột khóa trùng + một dòng khi không ghép mã người học',()=>{
 const c=setupLive();
 for(let i=0;i<8;i++)assert.equal(c.send('record_save',record(c,String(950+i),'2026-01-20')).ok,true);
 const sh=c.tables.get('Hồ sơ học nghề');
 const calls=[];const original=sh.getRange.bind(sh);
 sh.getRange=(row,col,height,width)=>{calls.push({row,col,height,width});return original(row,col,height,width);};
 const first=c.send('records_list',{query:'950'}).data.items[0];
 calls.length=0;
 const edit=c.send('record_save',{...record(c,'950','2026-01-20',{GHI_CHU:'Thử nghiệm tối ưu'}),HO_SO_ID:first.HO_SO_ID,PHIEN_BAN:first.PHIEN_BAN});
 assert.equal(edit.ok,true,JSON.stringify(edit.error));
 assert.ok(calls.some(x=>x.width===1&&x.col===8),'Decision key column read');
 assert.ok(!calls.some(x=>x.width===40&&x.height>1),'Avoid full 40-column sheet read');
});

test('YC033: Quyết định 761 hỗ trợ 3,5 và dữ liệu ngày bất kỳ vẫn nhận KY:1–6',()=>{
 const c=setupLive();
 for(let month=1;month<=6;month++){
  const r=c.send('record_save',record(c,'761'+month,'2026-03-10',{SO_THANG_HO_TRO:'3,5',NGAY_BAT_DAU:'2026-03-21',NGAY_KET_THUC_DU_KIEN:'2026-06-30'}));
  assert.equal(r.ok,true,JSON.stringify(r.error));
  const after=c.send('record_status',{HO_SO_ID:r.data.record.HO_SO_ID,PHIEN_BAN:r.data.record.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:'+month,LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(after.ok,true,JSON.stringify(after.error));
  assert.equal(after.data.record.NGAY_BO_HOC,'KY:'+month);
 }
 assert.equal(c.send('overview',{}).data.kpi.dropout,6);
});
test('YC033: nhập cập nhật tình trạng Excel Bỏ học không khóa kỳ 6 dù hỗ trợ 3,5',()=>{
 const c=setupLive();const r=c.send('record_save',record(c,'761','2026-03-10',{SO_THANG_HO_TRO:'3,5'}));assert.equal(r.ok,true);
 const source=statusInput(c,'761','2026-03-10');
 const q={status:'BO_HOC',dropoutPeriod:'KY:6',dropoutReason:c.reason.LY_DO_ID,rows:[source]};
 const check=c.send('record_status_bulk_check',q);
 assert.equal(check.ok,true,JSON.stringify(check.error));
 assert.equal(check.data.items[0].kind,'eligible');
 const apply=c.send('record_status_bulk_apply',{...q,rows:[{...source,hoSoId:r.data.record.HO_SO_ID,version:r.data.record.PHIEN_BAN}]});
 assert.equal(apply.ok,true,JSON.stringify(apply.error));
 assert.equal(apply.data.updated,1);
 assert.equal(c.send('records_list',{query:'761'}).data.items[0].NGAY_BO_HOC,'KY:6');
 const retry=c.send('record_status_bulk_check',q);
 assert.equal(retry.data.items[0].kind,'same'); // đã bỏ học không được ghi lần nữa
});

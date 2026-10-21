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
test('Dashboard sáu KPI nhất quán với bỏ học và không tham gia',()=>{const c=setupLive();c.send('record_save',record(c,'01','2026-01-01',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}));c.send('record_save',record(c,'02','2026-01-02',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',SO_THANG_HO_TRO:'3',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));c.send('record_save',record(c,'03','2026-01-03',{TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'}));c.send('record_save',record(c,'04','2027-01-03',{TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN'}));const all=c.send('overview',{}).data.kpi;assert.deepEqual(JSON.parse(JSON.stringify(all)),{total:4,participated:2,learning:1,dropout:1,notParticipating:1,pending:1});const y=c.send('overview',{year:'2026'}).data.kpi;assert.equal(y.total,3);});
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

test('Xóa mềm Phương án A: nhân viên xóa đúng hồ sơ mình tạo, Admin xóa mọi hồ sơ',()=>{
 const c=setupLive();
 c.send('account_save',{email:'staff1@example.com',name:'Staff 1',role:'NHAN_VIEN',status:'ACTIVE',permissions:'RECORD_VIEW,RECORD_CREATE,RECORD_EDIT,RECORD_DELETE'});
 c.send('account_save',{email:'staff2@example.com',name:'Staff 2',role:'NHAN_VIEN',status:'ACTIVE',permissions:'RECORD_VIEW,RECORD_CREATE,RECORD_DELETE'});
 const staff1={sub:'22345678901234567890',aud:audience,email:'staff1@example.com'};
 const staff2={sub:'32345678901234567890',aud:audience,email:'staff2@example.com'};
 const a=sendAs(c,staff1,'record_save',record(c,'22','2026-05-01'));
 assert.equal(a.ok,true,JSON.stringify(a.error));
 const id=a.data.record.HO_SO_ID;
 const bad=sendAs(c,staff2,'record_delete',{HO_SO_ID:id,PHIEN_BAN:'1'});
 assert.equal(bad.error.code,'NO_PERMISSION');
 const mine=sendAs(c,staff1,'record_delete',{HO_SO_ID:id,PHIEN_BAN:'1'});
 assert.equal(mine.ok,true,JSON.stringify(mine.error));
 assert.equal(c.send('records_list',{}).data.total,0);
 assert.equal(c.send('overview',{}).data.kpi.total,0);
 assert.equal(c.send('report_export',{}).data.items.length,0);
 assert.equal(c.send('record_save',record(c,'0022','2026-07-01')).error.code,'DECISION_DUPLICATE');
 const redo=sendAs(c,staff1,'record_delete',{HO_SO_ID:id,PHIEN_BAN:'2'});
 assert.equal(redo.error.code,'ALREADY_DELETED');
 const b=sendAs(c,staff2,'record_save',record(c,'23','2026-05-02'));
 assert.equal(c.send('record_delete',{HO_SO_ID:b.data.record.HO_SO_ID,PHIEN_BAN:'1'}).ok,true);
});

test('YC007: nhân viên được xóa hồ sơ tự tạo bất kể quyền cũ trong Sheets',()=>{
 const c=setupLive();
 c.send('account_save',{email:'viewer@example.com',name:'Nhân viên',role:'NHAN_VIEN',status:'ACTIVE',permissions:''});
 const staff={sub:'42345678901234567890',aud:audience,email:'viewer@example.com'};
 const a=sendAs(c,staff,'record_save',record(c,'25','2026-05-03'));
 assert.equal(a.ok,true,JSON.stringify(a.error));
 const del=sendAs(c,staff,'record_delete',{HO_SO_ID:a.data.record.HO_SO_ID,PHIEN_BAN:'1'});
 assert.equal(del.ok,true,JSON.stringify(del.error));
 const fresh=c.send('accounts_list').data.items.find(x=>x.EMAIL==='viewer@example.com');
 assert.match(fresh.QUYEN,/RECORD_DELETE/);
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
 assert.match(u.QUYEN,/RECORD_DELETE/);assert.doesNotMatch(u.QUYEN,/ACCOUNT_MANAGE|CATALOG_MANAGE/);
});

test('YC008: hồ sơ, Tổng quan, xuất CSV và tra cứu giới hạn theo người tạo ở backend',()=>{
 const c=setupLive();
 for(const email of ['a@example.com','b@example.com'])assert.equal(c.send('account_save',{email,name:email,role:'NHAN_VIEN',status:'ACTIVE'}).ok,true);
 const A={sub:'22345678901234567890',aud:audience,email:'a@example.com'};
 const B={sub:'32345678901234567890',aud:audience,email:'b@example.com'};
 const a=sendAs(c,A,'record_save',record(c,'18','2026-03-15',{HO_TEN:'Người học của A'}));
 const b=sendAs(c,B,'record_save',record(c,'19','2026-03-16',{HO_TEN:'Người học của B'}));
 assert.equal(a.ok,true);assert.equal(b.ok,true);
 assert.equal(c.send('records_list',{}).data.total,2);
 assert.equal(sendAs(c,A,'records_list',{}).data.total,1);
 assert.equal(sendAs(c,B,'records_list',{}).data.total,1);
 assert.equal(sendAs(c,A,'overview',{}).data.kpi.total,1);
 assert.equal(sendAs(c,B,'overview',{}).data.kpi.total,1);
 assert.equal(c.send('overview',{}).data.kpi.total,2);
 assert.equal(sendAs(c,A,'report_export',{}).data.items.length,1);
 assert.equal(sendAs(c,B,'report_export',{}).data.items.length,1);
 assert.equal(sendAs(c,A,'person_lookup',{query:'Người học của B'}).data.items.length,0);
 assert.equal(sendAs(c,A,'person_lookup',{query:'Người học của A'}).data.items.length,1);
 let other=sendAs(c,A,'record_status',{HO_SO_ID:b.data.record.HO_SO_ID,PHIEN_BAN:1,TRANG_THAI_THAM_GIA:'DA_THAM_GIA'});
 assert.equal(other.error.code,'NO_PERMISSION');
 other=sendAs(c,A,'record_delete',{HO_SO_ID:b.data.record.HO_SO_ID,PHIEN_BAN:1});assert.equal(other.error.code,'NO_PERMISSION');
 other=sendAs(c,A,'record_save',{...record(c,'19','2026-03-16'),HO_SO_ID:b.data.record.HO_SO_ID,PHIEN_BAN:1});assert.equal(other.error.code,'NO_PERMISSION');
 other=sendAs(c,A,'file_info',{HO_SO_ID:b.data.record.HO_SO_ID});assert.equal(other.error.code,'NO_PERMISSION');
 other=sendAs(c,A,'file_remove',{HO_SO_ID:b.data.record.HO_SO_ID,PHIEN_BAN:1});assert.equal(other.error.code,'NO_PERMISSION');
 other=sendAs(c,A,'record_save',{...record(c,'20','2026-03-17'),NGUOI_HOC_ID:b.data.record.NGUOI_HOC_ID});assert.equal(other.error.code,'VALIDATION');
 assert.equal(sendAs(c,A,'catalog_list',{type:'truong'}).error.code,'NO_PERMISSION');
 assert.equal(sendAs(c,A,'accounts_list',{}).error.code,'NO_PERMISSION');
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
    const deny=sendAs(c,user,'report_export',{});assert.equal(deny.error.code,'NO_PERMISSION');
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
  assert.equal(bad.error.code,'VALIDATION');
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

// YC-HN-018: backend chặn KY:1 và các kỳ quá thời gian hỗ trợ, không sửa nhầm.
test('YC018: kỳ 1 luôn bị từ chối, kỳ 2-3 hợp lệ với khóa 3 tháng, kỳ 4 bị từ chối',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'8101','2026-10-19',{SO_THANG_HO_TRO:'3'})).data.record;
  function update(period){return c.send('record_status',{HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:a.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:period,LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});}
  assert.equal(update('KY:1').error.code,'VALIDATION');assert.equal(update('KY:4').error.code,'VALIDATION');
  const okay=update('KY:3');assert.equal(okay.ok,true,JSON.stringify(okay.error));
  assert.equal(okay.data.record.NGAY_BO_HOC,'KY:3');assert.equal(c.send('overview',{}).data.kpi.dropout,1);
});
test('YC018: 12 tháng có thể chọn kỳ 12 nhưng không quá 12, hỗ trợ lẻ không được làm tròn',()=>{
  const c=setupLive();const a=c.send('record_save',record(c,'8102','2026-10-19',{SO_THANG_HO_TRO:'12'})).data.record;
  const payload={HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:a.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,LY_DO_BO_HOC_ID:c.reason.LY_DO_ID};
  assert.equal(c.send('record_status',{...payload,NGAY_BO_HOC:'KY:13'}).error.code,'VALIDATION');
  assert.equal(c.send('record_status',{...payload,NGAY_BO_HOC:'KY:12'}).ok,true);
  const part=c.send('record_save',record(c,'8103','2026-10-19',{SO_THANG_HO_TRO:'2,5'})).data.record;
  const bad=c.send('record_status',{HO_SO_ID:part.HO_SO_ID,PHIEN_BAN:part.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(bad.error.code,'VALIDATION');
  const one=c.send('record_save',record(c,'8104','2026-10-19',{SO_THANG_HO_TRO:'1'})).data.record;
  assert.equal(c.send('record_status',{HO_SO_ID:one.HO_SO_ID,PHIEN_BAN:one.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}).error.code,'VALIDATION');
});
test('YC018: ngày bỏ học lịch sử giữ nguyên khi ghi lại trạng thái và không cho tự tạo ngày mới',()=>{
  const c=setupLive();const r=c.send('record_save',record(c,'8105','2026-10-19',{SO_THANG_HO_TRO:'3',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:2',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID})).data.record;
  const sh=c.tables.get('Hồ sơ học nghề'),col=c.global.APP.lists.HO_SO_HOC_NGHE.indexOf('NGAY_BO_HOC');sh.rows[1][col]='2026-10-20';
  const preserved=c.send('record_status',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-10-20',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
  assert.equal(preserved.ok,true,JSON.stringify(preserved.error));assert.equal(preserved.data.record.NGAY_BO_HOC,'2026-10-20');
  const fresh=c.send('record_save',record(c,'8106','2026-10-19',{SO_THANG_HO_TRO:'3',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-10-20',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
  assert.equal(fresh.error.code,'VALIDATION');
});
test('YC018: kỳ lịch sử ngoài 12 được đọc và giữ nguyên, không được chọn cho hồ sơ khác',()=>{
  const c=setupLive();const r=c.send('record_save',record(c,'8107','2026-10-19',{SO_THANG_HO_TRO:'15',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:12',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID})).data.record;
  const sh=c.tables.get('Hồ sơ học nghề'),col=c.global.APP.lists.HO_SO_HOC_NGHE.indexOf('NGAY_BO_HOC');sh.rows[1][col]='KY:13';
  const next=c.send('record_status',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN,TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'KY:13',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID});
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
  assert.equal(sendAs(c,user,'report_export',{from:'2026-07-01',to:'2026-07-31'}).error.code,'NO_PERMISSION');
});

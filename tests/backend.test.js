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
    CacheService:{getScriptCache(){return {get(k){return cache.get(k)||null;},put(k,v){cache.set(k,v);}};}},
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

test('7 tab, 79 cột, khởi tạo idempotent và không xóa dữ liệu',()=>{const c=makeEnv();c.init();assert.equal([...c.tables.keys()].length,7);assert.equal([...c.tables.values()].reduce((a,s)=>a+s.rows[0].length,0),79);const old=c.tables.get('Tài khoản người dùng').rows[1].slice();c.global.setupDatabase();assert.deepEqual(c.tables.get('Tài khoản người dùng').rows[1],old);});
test('Dừng khi schema hiện có sai, không tự ghi đè',()=>{const c=makeEnv();const sh=new c.Sheet('Hồ sơ học nghề');sh.rows.push(['WRONG']);c.tables.set(sh.name,sh);assert.throws(()=>c.global.setupDatabase(),e=>e.code==='SCHEMA_MISMATCH');});
test('Khóa quyết định: 2, 02, 002 cùng năm là một; khác năm hợp lệ',()=>{const c=makeEnv();assert.equal(c.global.decisionKey_('02','2026-01-08'),'2026|2');assert.equal(c.global.decisionKey_('002','2027-01-08'),'2027|2');assert.equal(c.global.decisionKey_('2','2026-01-01'),'2026|2');});
test('Không nhận số 0 hoặc ngày không hợp lệ',()=>{const c=makeEnv();assert.throws(()=>c.global.decisionKey_('00','2026-01-01'));assert.throws(()=>c.global.decisionKey_('02','2026-02-30'));});
test('Tạo hồ sơ theo quyết định; từ chối quyết định trùng cùng năm',()=>{const c=setupLive();const first=c.send('record_save',record(c,'02','2026-02-15'));assert.equal(first.ok,true,JSON.stringify(first.error));const second=c.send('record_save',record(c,'002','2026-12-20',{HO_TEN:'Trần Văn C'}));assert.equal(second.ok,false);assert.equal(second.error.code,'DECISION_DUPLICATE');});
test('Cùng số quyết định được dùng ở năm tiếp theo, không tái sử dụng cùng năm',()=>{const c=setupLive();assert.equal(c.send('record_save',record(c,'02','2026-02-15')).ok,true);const other=c.send('record_save',record(c,'02','2027-02-15',{HO_TEN:'Trần Văn C'}));assert.equal(other.ok,true);assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),3);});
test('Một người có nhiều hồ sơ nếu dùng cùng NGUOI_HOC_ID',()=>{const c=setupLive();const a=c.send('record_save',record(c,'01','2026-03-01'));const id=a.data.record.NGUOI_HOC_ID;const b=c.send('record_save',record(c,'03','2026-04-01',{NGUOI_HOC_ID:id}));assert.equal(b.ok,true);assert.equal(a.data.record.NGUOI_HOC_ID,b.data.record.NGUOI_HOC_ID);assert.notEqual(a.data.record.HO_SO_ID,b.data.record.HO_SO_ID);});
test('Không được liên kết NGUOI_HOC_ID với họ tên không trùng',()=>{const c=setupLive();const a=c.send('record_save',record(c,'01','2026-03-01'));const b=c.send('record_save',record(c,'02','2026-03-02',{NGUOI_HOC_ID:a.data.record.NGUOI_HOC_ID,HO_TEN:'Tên hoàn toàn khác'}));assert.equal(b.ok,false);assert.equal(b.error.code,'VALIDATION');});
test('Bỏ học cần đã tham gia, ngày và lý do',()=>{const c=setupLive();const r=c.send('record_save',record(c,'01','2026-01-01',{DA_BO_HOC:true}));assert.equal(r.ok,false);const yes=c.send('record_save',record(c,'01','2026-01-01',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-02-10',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));assert.equal(yes.ok,true);});
test('VERSION_CONFLICT ngăn ghi đè sửa từ phiên cũ',()=>{const c=setupLive();const a=c.send('record_save',record(c,'01','2026-01-01')).data.record;const b=c.send('record_save',{...record(c,'01','2026-01-01'),HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:'1',GHI_CHU:'Thay đổi'});assert.equal(b.ok,true);const stale=c.send('record_save',{...record(c,'01','2026-01-01'),HO_SO_ID:a.HO_SO_ID,PHIEN_BAN:'1',GHI_CHU:'Ghi đè'});assert.equal(stale.ok,false);assert.equal(stale.error.code,'VERSION_CONFLICT');});
test('Dedupe theo requestId giúp chống ghi trùng cùng giao dịch',()=>{const c=setupLive();const payload=record(c,'01','2026-01-01');const first=c.send('record_save',payload,'same_transaction_00001');const second=c.send('record_save',payload,'same_transaction_00001');assert.equal(first.ok,true);assert.equal(second.ok,true);assert.equal(first.data.record.HO_SO_ID,second.data.record.HO_SO_ID);assert.equal(c.tables.get('Hồ sơ học nghề').getLastRow(),2);});
test('Dashboard sáu KPI nhất quán với bỏ học và không tham gia',()=>{const c=setupLive();c.send('record_save',record(c,'01','2026-01-01',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA'}));c.send('record_save',record(c,'02','2026-01-02',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-01-05',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));c.send('record_save',record(c,'03','2026-01-03',{TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA'}));c.send('record_save',record(c,'04','2027-01-03',{TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN'}));const all=c.send('overview',{}).data.kpi;assert.deepEqual(JSON.parse(JSON.stringify(all)),{total:4,participated:2,learning:1,dropout:1,notParticipating:1,pending:1});const y=c.send('overview',{year:'2026'}).data.kpi;assert.equal(y.total,3);});
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

test('Sheet mới sử dụng toàn bộ tên tiếng Việt và 79 tiêu đề đúng vị trí',()=>{
  const c=makeEnv();c.global.setupDatabase();
  assert.equal(c.tables.get('Hồ sơ học nghề').rows[0][24],'Phiên bản hồ sơ');
  assert.equal(c.tables.get('Cấu hình hệ thống').rows[0][0],'Khóa cấu hình');
  assert.ok(!c.tables.has('HO_SO_HOC_NGHE'));
  assert.equal([...c.tables.values()].reduce((n,x)=>n+x.rows[0].length,0),79);
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
 let b=c.send('record_save',record(c,'71','2026-03-02',{TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:true,NGAY_BO_HOC:'2026-03-20',LY_DO_BO_HOC_ID:c.reason.LY_DO_ID}));
 assert.equal(b.ok,true,JSON.stringify(b.error));
 const k=c.send('overview').data.kpi;
 assert.equal(k.notParticipating,1);assert.equal(k.dropout,1);assert.equal(k.participated,1);assert.equal(k.learning,0);
});

test('YC007: Bỏ học phải không trước ngày bắt đầu học',()=>{
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

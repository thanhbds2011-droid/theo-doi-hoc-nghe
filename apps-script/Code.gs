/**
 * THEO_DOI_HOC_NGHE_API — v1.0.1-RC
 * Dự án độc lập: Google Sheets + Apps Script, không sử dụng Firebase hoặc Work.
 * Đặt API_SHARED_SECRET / SPREADSHEET_ID / GOOGLE_CLIENT_ID trong Script Properties.
 * Không phát hành Web App khi chưa triển khai proxy có xác minh Google ID Token.
 */
var APP = {
  version: '1.0.1-RC',
  tz: 'Asia/Ho_Chi_Minh',
  maxFileBytes: 1200000,
  cacheSeconds: 45,
  lists: {
    'HO_SO_HOC_NGHE': 'HO_SO_ID NGUOI_HOC_ID HO_TEN NGAY_SINH GIOI_TINH SO_QUYET_DINH NAM_QUYET_DINH SO_QUYET_DINH_KEY NGAY_QUYET_DINH TRUONG_ID NGHE_ID NGAY_BAT_DAU NGAY_KET_THUC_DU_KIEN TRANG_THAI_THAM_GIA DA_BO_HOC NGAY_BO_HOC LY_DO_BO_HOC_ID GHI_CHU TEP_DRIVE_ID TRANG_THAI_HO_SO TAO_LUC TAO_BOI CAP_NHAT_LUC CAP_NHAT_BOI PHIEN_BAN'.split(' '),
    'DANH_MUC_TRUONG': 'TRUONG_ID MA_TRUONG TEN_TRUONG TEN_VIET_TAT DIA_CHI TRANG_THAI GHI_CHU TAO_LUC CAP_NHAT_LUC'.split(' '),
    'DANH_MUC_NGHE': 'NGHE_ID MA_NGHE TEN_NGHE TRANG_THAI THU_TU GHI_CHU TAO_LUC CAP_NHAT_LUC'.split(' '),
    'DANH_MUC_LY_DO': 'LY_DO_ID MA_LY_DO NOI_DUNG TRANG_THAI THU_TU GHI_CHU TAO_LUC CAP_NHAT_LUC'.split(' '),
    'TAI_KHOAN': 'TAI_KHOAN_ID EMAIL GOOGLE_SUB HO_TEN VAI_TRO QUYEN TRANG_THAI TAO_LUC TAO_BOI CAP_NHAT_LUC CAP_NHAT_BOI DANG_NHAP_CUOI'.split(' '),
    'NHAT_KY': 'NHAT_KY_ID THOI_GIAN TAI_KHOAN_ID EMAIL HANH_DONG LOAI_DOI_TUONG BAN_GHI_ID NOI_DUNG_THAY_DOI KET_QUA REQUEST_ID'.split(' '),
    'CAU_HINH': 'KHOA GIA_TRI LOAI_DU_LIEU NHOM MO_TA CAP_NHAT_LUC CAP_NHAT_BOI'.split(' ')
  },
  catalog: {
    truong: { sheet: 'DANH_MUC_TRUONG', id: 'TRUONG_ID', code: 'MA_TRUONG', title: 'TEN_TRUONG' },
    nghe: { sheet: 'DANH_MUC_NGHE', id: 'NGHE_ID', code: 'MA_NGHE', title: 'TEN_NGHE' },
    lydo: { sheet: 'DANH_MUC_LY_DO', id: 'LY_DO_ID', code: 'MA_LY_DO', title: 'NOI_DUNG' }
  }
};


/**
 * Các khóa APP.lists và APP.catalog là khóa kỹ thuật nội bộ, KHÔNG đổi tên.
 * Sheet vật lý và tiêu đề dành cho người sử dụng đều bằng tiếng Việt.
 * Các trường được ánh xạ theo THỨ TỰ cột để giữ nguyên dữ liệu.
 */
APP.sheetNames = {
  'HO_SO_HOC_NGHE': 'Hồ sơ học nghề',
  'DANH_MUC_TRUONG': 'Danh mục cơ sở đào tạo',
  'DANH_MUC_NGHE': 'Danh mục nghề',
  'DANH_MUC_LY_DO': 'Danh mục lý do bỏ học',
  'TAI_KHOAN': 'Tài khoản người dùng',
  'NHAT_KY': 'Nhật ký thay đổi',
  'CAU_HINH': 'Cấu hình hệ thống',
};
APP.headersVi = {
  'HO_SO_HOC_NGHE': 'Mã hồ sơ|Mã người học|Họ và tên|Ngày sinh|Giới tính|Số quyết định|Năm quyết định|Khóa kiểm tra trùng|Ngày quyết định|Mã cơ sở đào tạo|Mã nghề|Ngày bắt đầu|Ngày kết thúc dự kiến|Tình trạng tham gia|Đã bỏ học|Ngày bỏ học|Mã lý do bỏ học|Ghi chú|Mã tệp Google Drive|Trạng thái hồ sơ|Thời gian tạo|Người tạo|Thời gian cập nhật|Người cập nhật|Phiên bản hồ sơ'.split('|'),
  'DANH_MUC_TRUONG': 'Mã định danh cơ sở|Mã cơ sở|Tên cơ sở đào tạo|Tên viết tắt|Địa chỉ|Trạng thái sử dụng|Ghi chú|Thời gian tạo|Thời gian cập nhật'.split('|'),
  'DANH_MUC_NGHE': 'Mã định danh nghề|Mã nghề|Tên nghề|Trạng thái sử dụng|Thứ tự hiển thị|Ghi chú|Thời gian tạo|Thời gian cập nhật'.split('|'),
  'DANH_MUC_LY_DO': 'Mã định danh lý do|Mã lý do|Nội dung lý do bỏ học|Trạng thái sử dụng|Thứ tự hiển thị|Ghi chú|Thời gian tạo|Thời gian cập nhật'.split('|'),
  'TAI_KHOAN': 'Mã tài khoản|Email Google|Định danh Google|Họ và tên|Vai trò|Quyền được cấp|Trạng thái tài khoản|Thời gian tạo|Người tạo|Thời gian cập nhật|Người cập nhật|Đăng nhập gần nhất'.split('|'),
  'NHAT_KY': 'Mã nhật ký|Thời gian thao tác|Mã tài khoản|Email người thao tác|Hành động|Loại dữ liệu|Mã bản ghi|Nội dung thay đổi|Kết quả|Mã yêu cầu'.split('|'),
  'CAU_HINH': 'Khóa cấu hình|Giá trị cấu hình|Kiểu dữ liệu|Nhóm cấu hình|Mô tả|Thời gian cập nhật|Người cập nhật'.split('|'),
};

/**
 * HÀM CẦN CHẠY 1 LẦN SAU KHI CẬP NHẬT CODE.
 * Chuyển 7 tab + 79 tiêu đề sang tiếng Việt mà không thay đổi giá trị các dòng dữ liệu.
 * Tạo bản sao lưu toàn bộ Spreadsheet trên Google Drive TRƯỚC KHI sửa.
 * Nếu gặp tên tab bị trùng hoặc tiêu đề không đúng mẫu, dừng toàn bộ trước khi sửa.
 * Có thể chạy lại an toàn (idempotent), không tạo bản sao lưu nếu không cần chuyển.
 */
function chuyenSangTiengViet() {
  return setupDatabase();
}

/** Dùng cho khởi tạo mới hoặc chuyển từ 7 tab tiếng Anh trước đây. */
function setupDatabase() {
  var lock = LockService.getScriptLock();
  must_(lock.tryLock(30000), 'BUSY', 'Google Sheets đang được cập nhật. Vui lòng thử lại.');
  try {
    var ss = getSpreadsheet_();
    var plans = [], names = Object.keys(APP.lists);
    // PREFLIGHT tất cả tab trước khi ghi; KHÔNG sửa dữ liệu nếu phát hiện xung đột.
    names.forEach(function(code) {
      var target = APP.sheetNames[code], legacy = ss.getSheetByName(code), modern = ss.getSheetByName(target);
      if (legacy && modern && legacy !== modern) {
        throw err_('SHEET_CONFLICT', 'Đang có đồng thời 2 tab: ' + code + ' và ' + target + '. Hãy đối chiếu dữ liệu trước, không tự xóa tab nào.');
      }
      var sh = modern || legacy, keyHeader = APP.lists[code], viHeader = APP.headersVi[code];
      must_(keyHeader.length === viHeader.length, 'SCHEMA_INVALID', 'Số cột ánh xạ không khớp tại ' + target);
      var kind = 'EMPTY';
      if (sh && sh.getLastRow() > 0) {
        var actual = sh.getRange(1, 1, 1, keyHeader.length).getDisplayValues()[0];
        if (actual.join('\u001f') === viHeader.join('\u001f')) kind = 'VI';
        else if (actual.join('\u001f') === keyHeader.join('\u001f')) kind = 'OLD';
        else throw err_('SCHEMA_MISMATCH', 'Tiêu đề tab ' + sh.getName() + ' không đúng mẫu cũ hoặc mới. Chưa thay đổi dữ liệu.');
      }
      plans.push({code:code,name:target,sh:sh,kind:kind,headers:viHeader,
        change: !sh || !modern || kind !== 'VI'});
    });
    var changes = plans.filter(function(p){return p.change;});
    if (changes.length) {
      // Backup trước khi đổi tên/tiêu đề. Nếu thiếu quyền Drive, dừng an toàn.
      var stamp = Utilities.formatDate(new Date(), APP.tz, 'yyyyMMdd_HHmmss');
      var file = DriveApp.getFileById(ss.getId());
      var backup = file.makeCopy('SAO_LUU_TRUOC_VIET_HOA_HOC_NGHE_' + stamp);
      console.log('Bản sao lưu: ' + backup.getUrl());
    }
    plans.forEach(function(p) {
      var sh = p.sh || ss.insertSheet(p.name);
      if (sh.getName() !== p.name) sh.setName(p.name);
      if (p.kind !== 'VI') sh.getRange(1,1,1,p.headers.length).setValues([p.headers]);
      sh.setFrozenRows(1);
      var head = sh.getRange(1,1,1,p.headers.length);
      head.setBackground('#12305a').setFontColor('#ffffff').setFontWeight('bold');
      // Lần chuyển đổi đầu tiên: giãn cột và ngắt dòng tiêu đề tiếng Việt để đọc đủ nội dung.
      // Không ghi đè kích thước cột tùy chỉnh khi chạy lại.
      if (p.kind !== 'VI') {
        head.setWrap(true).setVerticalAlignment('middle');
        sh.setRowHeight(1, 48);
        sh.setColumnWidths(1, p.headers.length, 175);
      }
      // Với Sheet MỚI hoàn toàn, định dạng cột là văn bản để bảo toàn '02', ID và ngày ISO.
      // Không áp dụng lại định dạng cho dữ liệu cũ khi chuyển đổi.
      if (!p.sh && sh.getMaxRows() > 1) {
        sh.getRange(2,1,sh.getMaxRows()-1,p.headers.length).setNumberFormat('@');
      }
    });
    var cfg = getSheet_('CAU_HINH');
    if (cfg.getLastRow() === 1) {
      cfg.getRange(2,1,6,7).setValues([
        ['APP_NAME', 'Theo dõi học nghề', 'TEXT', 'SYSTEM', 'Tên phần mềm', '', ''],
        ['APP_VERSION', APP.version, 'TEXT', 'SYSTEM', 'Phiên bản triển khai', '', ''],
        ['SCHEMA_VERSION', '1', 'NUMBER', 'SYSTEM', 'Phiên bản cấu trúc bảng dữ liệu', '', ''],
        ['TIMEZONE', APP.tz, 'TEXT', 'SYSTEM', 'Múi giờ', '', ''],
        ['DEFAULT_PAGE_SIZE', '20', 'NUMBER', 'LIST', 'Số hồ sơ mỗi trang', '', ''],
        ['MAX_PAGE_SIZE', '100', 'NUMBER', 'LIST', 'Giới hạn mỗi trang', '', '']
      ]);
    }
    var msg = changes.length ? 'Đã Việt hóa ' + changes.length + ' tab; dữ liệu hồ sơ/tài khoản đã được giữ nguyên. Đã sao lưu trên Drive.'
                             : '7 tab và 79 tiêu đề đã là tiếng Việt, không cần chuyển đổi.';
    console.log(msg);
    return msg;
  } finally { lock.releaseLock(); }
}

/** Chỉ sử dụng qua Vercel proxy, nơi đã verify Google ID token theo GOOGLE_CLIENT_ID. */
function doPost(e) {
  SS_CACHE_ = null;
  try {
    if (!e || !e.postData || !e.postData.contents || e.postData.contents.length > 3500000) throw err_('BAD_REQUEST', 'Yêu cầu không hợp lệ.');
    var transport = JSON.parse(e.postData.contents);
    var raw = String(transport.raw || '');
    var sig = String(transport.signature || '');
    var secret = PropertiesService.getScriptProperties().getProperty('API_SHARED_SECRET') || '';
    if (secret.length < 32 || !raw || raw.length > 3400000 || !sig) throw err_('NOT_AUTHORIZED', 'Gateway chưa cấu hình hoặc chữ ký thiếu.');
    var expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(raw, secret, Utilities.Charset.UTF_8)).replace(/=+$/,'');
    if (!constantTimeEqual_(expected, sig)) throw err_('NOT_AUTHORIZED', 'Chữ ký máy chủ không hợp lệ.');
    var body = JSON.parse(raw);
    if (body.v !== 1 || !Number.isFinite(Number(body.ts)) || Math.abs(Date.now() - Number(body.ts)) > 120000) {
      throw err_('NOT_AUTHORIZED', 'Yêu cầu đã hết hạn.');
    }
    if (!/^[a-zA-Z0-9_-]{12,80}$/.test(String(body.requestId || ''))) throw err_('BAD_REQUEST', 'Mã yêu cầu không hợp lệ.');
    if (!/^[a-z][a-z0-9_]{1,40}$/.test(String(body.action || ''))) throw err_('BAD_REQUEST', 'Thao tác không hợp lệ.');
    var who = body.identity || {};
    must_(Boolean(cfg_().getProperty('GOOGLE_CLIENT_ID')) && who.aud === cfg_().getProperty('GOOGLE_CLIENT_ID'), 'NOT_AUTHORIZED', 'Định danh Google không đúng Client ID của dự án.');
    var permittedOrigin = cfg_().getProperty('APP_ORIGIN');
    if (permittedOrigin) must_(who.appOrigin === permittedOrigin, 'NOT_AUTHORIZED', 'Website không đúng APP_ORIGIN đã cấu hình.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(who.email || '')) || !/^[0-9]{5,30}$/.test(String(who.sub || ''))) {
      throw err_('NOT_AUTHORIZED', 'Thiếu danh tính được xác minh.');
    }
    var user = authorize_(who, body.action);
    var action = body.action;
    var payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    var data;
    switch (action) {
      case 'bootstrap': data = bootstrap_(user); break;
      case 'overview': data = overview_(user, payload); break;
      case 'records_list': data = listRecords_(payload); break;
      case 'person_lookup': data = personLookup_(payload); break;
      case 'record_save': data = withLock_(function(){return saveRecord_(user, payload, body.requestId);}); break;
      case 'record_status': data = withLock_(function(){return statusRecord_(user, payload, body.requestId);}); break;
      case 'report_export': data = exportRecords_(payload); break;
      case 'catalog_list': data = catalogList_(payload); break;
      case 'catalog_save': data = withLock_(function(){return catalogSave_(user,payload,body.requestId);}); break;
      case 'accounts_list': data = accountsList_(); break;
      case 'account_save': data = withLock_(function(){return accountSave_(user,payload,body.requestId);}); break;
      case 'audit_list': data = listAudit_(payload); break;
      case 'file_upload': data = withLock_(function(){return fileUpload_(user,payload,body.requestId);}); break;
      case 'file_get': data = fileGet_(payload); break;
      case 'file_remove': data = withLock_(function(){return fileRemove_(user,payload,body.requestId);}); break;
      default: throw err_('BAD_REQUEST', 'Thao tác không được hỗ trợ.');
    }
    return json_({ok: true, data: data, requestId: body.requestId, version: APP.version});
  } catch (ex) {
    return json_({ok: false, error: {code: ex.code || 'SERVER_ERROR', message: ex.code ? ex.message : 'Máy chủ chưa xử lý được yêu cầu.'}});
  }
}
function doGet() { return json_({ok: false, error: {code:'POST_ONLY', message:'Chỉ cho phép yêu cầu đã ký qua Vercel.'}}); }
function json_(x) { return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON); }
function err_(code, message) { var e = new Error(message); e.code = code; return e; }
function must_(condition, code, message) { if (!condition) throw err_(code,message); }
function constantTimeEqual_(a,b) { if(a.length !== b.length) return false; var d=0; for(var i=0;i<a.length;i++) d |= a.charCodeAt(i)^b.charCodeAt(i); return d === 0; }
function cfg_() { return PropertiesService.getScriptProperties(); }
var SS_CACHE_ = null;
function getSpreadsheet_() { if (SS_CACHE_) return SS_CACHE_; var id=cfg_().getProperty('SPREADSHEET_ID'); must_(Boolean(id),'SERVER_NOT_CONFIGURED','Thiếu SPREADSHEET_ID.'); SS_CACHE_ = SpreadsheetApp.openById(id); return SS_CACHE_; }
function getSheet_(name) { var ss=getSpreadsheet_(),vi=APP.sheetNames[name]||name;var sh=ss.getSheetByName(vi)||ss.getSheetByName(name);must_(Boolean(sh),'SCHEMA_MISSING','Thiếu tab '+vi+'. Chạy chuyenSangTiengViet.');return sh; }
function now_() { return Utilities.formatDate(new Date(),APP.tz,"yyyy-MM-dd'T'HH:mm:ss"); }
function str_(x,max) { return String(x===undefined||x===null?'':x).trim().slice(0,max||500); }
function norm_(x) { return str_(x,300).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim(); }
function bool_(x) { return x === true || x === 'TRUE' || x === 'true'; }
function indexOfRow_(records,key,val) { for(var i=0;i<records.length;i++) if(String(records[i][key])===String(val)) return i; return -1; }
function randomId_(prefix) { return prefix + '_' + Utilities.getUuid().replace(/-/g,'').slice(0,20).toUpperCase(); }
function sheetRows_(name) {
  var sh=getSheet_(name), hdr=APP.lists[name], last=sh.getLastRow();
  if(last<2) return [];
  var all=sh.getRange(2,1,last-1,hdr.length).getDisplayValues();
  return all.filter(function(v){return v[0]!=='';}).map(function(v){var out={};hdr.forEach(function(k,i){out[k]=v[i];});return out;});
}
function writeRecord_(name,rowNumber,obj) {
  var hdr=APP.lists[name], values=hdr.map(function(k){return obj[k]===undefined?'':String(obj[k]);});
  getSheet_(name).getRange(rowNumber,1,1,hdr.length).setValues([values]);
}
function appendRecord_(name,obj) { var sh=getSheet_(name);writeRecord_(name,sh.getLastRow()+1,obj); }
function findRowNumber_(name,idKey,id) {
  var sh=getSheet_(name),last=sh.getLastRow(); if(last<2) return -1;
  var col=APP.lists[name].indexOf(idKey)+1, ids=sh.getRange(2,col,last-1,1).getDisplayValues();
  for(var i=0;i<ids.length;i++) if(String(ids[i][0])===String(id))return i+2;
  return -1;
}
function withLock_(fn) {
  var lock=LockService.getScriptLock();must_(lock.tryLock(25000),'BUSY','Hệ thống đang xử lý giao dịch khác. Vui lòng thử lại.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function cache_() {return CacheService.getScriptCache();}
function cacheKey_(prefix,x){ var b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(x));return prefix+'_'+Utilities.base64EncodeWebSafe(b).replace(/=+$/,'').slice(0,40); }
function version_(type){return cfg_().getProperty('REV_'+type)||'0';}
function bump_(type){cfg_().setProperty('REV_'+type, Utilities.getUuid().slice(0,12));}
function cached_(prefix,key,seconds,fn){var k=cacheKey_(prefix,key), value=cache_().get(k);if(value){try{return JSON.parse(value);}catch(e){}}var data=fn(); var txt=JSON.stringify(data);if(txt.length<65000){try{cache_().put(k,txt,seconds||45);}catch(e){console.warn('Cache bypass',e.message);}}return data;}
function dedupeWrite_(id,fn){var key=cacheKey_('DONE',id),v=cache_().get(key);if(v){try{return JSON.parse(v);}catch(e){}}var result=fn();var s=JSON.stringify(result);if(s.length<65000){try{cache_().put(key,s,21600);}catch(e){console.warn('Dedupe cache bypass',e.message);}}return result;}
function authorize_(identity,action){
  var email=norm_(identity.email);
  var users=cached_('USERS',version_('USERS'),15,function(){return sheetRows_('TAI_KHOAN');});
  var row=users.filter(function(u){return norm_(u.EMAIL)===email;})[0];
  must_(row && row.TRANG_THAI==='ACTIVE','NOT_AUTHORIZED','Tài khoản chưa được cấp quyền hoặc đã khóa.');
  if(row.GOOGLE_SUB && row.GOOGLE_SUB!==identity.sub)throw err_('NOT_AUTHORIZED','Tài khoản Google không trùng định danh đã đăng ký.');
  if(!row.GOOGLE_SUB){
    var lock=LockService.getScriptLock();must_(lock.tryLock(15000),'BUSY','Đang xác nhận tài khoản, vui lòng thử lại.');
    try {
      var current=sheetRows_('TAI_KHOAN').filter(function(u){return norm_(u.EMAIL)===email;})[0];
      must_(current && current.TRANG_THAI==='ACTIVE','NOT_AUTHORIZED','Tài khoản chưa được cấp quyền.');
      must_(!current.GOOGLE_SUB || current.GOOGLE_SUB===identity.sub,'NOT_AUTHORIZED','Định danh Google không đúng.');
      if(!current.GOOGLE_SUB){current.GOOGLE_SUB=identity.sub;current.CAP_NHAT_LUC=now_();writeRecord_('TAI_KHOAN',findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',current.TAI_KHOAN_ID),current);bump_('USERS');}
      row=current;
    } finally {lock.releaseLock();}
  }
  var needs={
    bootstrap:'RECORD_VIEW', overview:'RECORD_VIEW', records_list:'RECORD_VIEW', person_lookup:'RECORD_VIEW',
    record_save:'RECORD_CREATE', record_status:'RECORD_STATUS', report_export:'REPORT_VIEW',
    catalog_list:'RECORD_VIEW', catalog_save:'CATALOG_MANAGE', accounts_list:'ACCOUNT_MANAGE', account_save:'ACCOUNT_MANAGE',
    audit_list:'AUDIT_VIEW', file_upload:'FILE_UPLOAD', file_get:'FILE_VIEW', file_remove:'FILE_UPLOAD'
  };
  must_(Boolean(needs[action]),'BAD_REQUEST','Thao tác không cho phép.');
  var perms=String(row.QUYEN||'').split(',').map(function(p){return p.trim();});
  function has(p){return row.VAI_TRO==='ADMIN'||perms.indexOf('*')>=0||perms.indexOf(p)>=0;}
  // record_save tự quyết định quyền tạo/sửa phía dưới, không cấp quyền sửa chỉ vì được tạo.
  if(action==='record_save')must_(has('RECORD_CREATE')||has('RECORD_EDIT'),'NO_PERMISSION','Không được tạo hoặc sửa hồ sơ.');
  else must_(has(needs[action]),'NO_PERMISSION','Không có quyền thực hiện thao tác này.');
  row._permissions=perms;row._has=has;return row;
}
function safeUser_(u) {return {TAI_KHOAN_ID:u.TAI_KHOAN_ID,EMAIL:u.EMAIL,HO_TEN:u.HO_TEN,VAI_TRO:u.VAI_TRO,QUYEN:u.QUYEN,TRANG_THAI:u.TRANG_THAI};}
function bootstrap_(user){
  // Cập nhật lần đăng nhập gần nhất tối đa một lần/ngày để hạn chế lượt ghi.
  if (String(user.DANG_NHAP_CUOI || '').slice(0,10) !== now_().slice(0,10)) {
    try { withLock_(function(){
      var rows=sheetRows_('TAI_KHOAN');
      var index=indexOfRow_(rows,'TAI_KHOAN_ID',user.TAI_KHOAN_ID);
      if (index>=0 && String(rows[index].DANG_NHAP_CUOI||'').slice(0,10)!==now_().slice(0,10)) {
        var rowNumber=findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',user.TAI_KHOAN_ID);
        getSheet_('TAI_KHOAN').getRange(rowNumber,12,1,1).setValues([[now_()]]);
      }
    }); } catch(ex){console.warn('Last-login update failed',ex.message);}
  }
  return {user:safeUser_(user), catalogs:{truong:catalogRows_('truong'),nghe:catalogRows_('nghe'),lydo:catalogRows_('lydo')},version:APP.version};
}
function catalogRows_(type){var def=APP.catalog[type];must_(Boolean(def),'BAD_REQUEST','Danh mục không tồn tại.');return cached_('CAT',type+'_'+version_('CAT'),300,function(){return sheetRows_(def.sheet);});}
function catalogList_(p){return {items:catalogRows_(str_(p.type,20)),type:str_(p.type,20)};}
function audit_(user,action,type,id,content,requestId){appendRecord_('NHAT_KY',{NHAT_KY_ID:randomId_('LOG'),THOI_GIAN:now_(),TAI_KHOAN_ID:user.TAI_KHOAN_ID,EMAIL:user.EMAIL,HANH_DONG:action,LOAI_DOI_TUONG:type,BAN_GHI_ID:id,NOI_DUNG_THAY_DOI:JSON.stringify(content).slice(0,6000),KET_QUA:'THANH_CONG',REQUEST_ID:requestId});}

// Kiểm tra số: 2, 02, 002 là cùng số trong một năm; không tái sử dụng quyết định lưu trữ.
function decisionKey_(number,date){
  var n=str_(number,20);must_(/^\d{1,9}$/.test(n)&&Number(n)>0,'VALIDATION','Số quyết định phải là số nguyên dương (ví dụ 02).');
  must_(validDate_(date),'VALIDATION','Ngày quyết định không hợp lệ.');
  return date.slice(0,4)+'|'+String(Number(n));
}
function validDate_(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))return false;var d=new Date(s+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
function validateOptionalDate_(d,title){if(d)must_(validDate_(d),'VALIDATION',title+' không hợp lệ.');}
function allowedRecord_(p,original){
  var o={};
  ['HO_TEN','NGAY_SINH','GIOI_TINH','SO_QUYET_DINH','NGAY_QUYET_DINH','TRUONG_ID','NGHE_ID','NGAY_BAT_DAU','NGAY_KET_THUC_DU_KIEN','TRANG_THAI_THAM_GIA','NGAY_BO_HOC','LY_DO_BO_HOC_ID','GHI_CHU'].forEach(function(k){o[k]=str_(p[k],k==='GHI_CHU'?1500:250);});
  o.DA_BO_HOC=bool_(p.DA_BO_HOC)?'TRUE':'FALSE';
  must_(o.HO_TEN.length>=2,'VALIDATION','Cần nhập họ và tên người học.');
  validateOptionalDate_(o.NGAY_SINH,'Ngày sinh');
  must_(['','NAM','NU','KHAC'].indexOf(o.GIOI_TINH)>=0,'VALIDATION','Giới tính không hợp lệ.');
  must_(validDate_(o.NGAY_QUYET_DINH),'VALIDATION','Ngày quyết định không hợp lệ.');
  o.SO_QUYET_DINH_KEY=decisionKey_(o.SO_QUYET_DINH,o.NGAY_QUYET_DINH);
  o.NAM_QUYET_DINH=o.NGAY_QUYET_DINH.slice(0,4);
  validateOptionalDate_(o.NGAY_BAT_DAU,'Ngày bắt đầu');validateOptionalDate_(o.NGAY_KET_THUC_DU_KIEN,'Ngày kết thúc dự kiến');
  must_(['CHO_XAC_NHAN','DA_THAM_GIA','KHONG_THAM_GIA'].indexOf(o.TRANG_THAI_THAM_GIA)>=0,'VALIDATION','Tình trạng tham gia không hợp lệ.');
  must_(Boolean(o.TRUONG_ID)&&Boolean(o.NGHE_ID),'VALIDATION','Cần chọn cơ sở và nghề.');
  function lookup(type,id){var def=APP.catalog[type], r=catalogRows_(type).filter(function(x){return x[def.id]===id;})[0];return r;}
  var school=lookup('truong',o.TRUONG_ID), trade=lookup('nghe',o.NGHE_ID);
  must_(school&&trade,'VALIDATION','Cơ sở hoặc nghề không tồn tại.');
  must_(school.TRANG_THAI==='ACTIVE'||original&&original.TRUONG_ID===school.TRUONG_ID,'VALIDATION','Cơ sở đã ngừng sử dụng.');
  must_(trade.TRANG_THAI==='ACTIVE'||original&&original.NGHE_ID===trade.NGHE_ID,'VALIDATION','Nghề đã ngừng sử dụng.');
  if(o.DA_BO_HOC==='TRUE') {
    must_(o.TRANG_THAI_THAM_GIA==='DA_THAM_GIA','VALIDATION','Bỏ học chỉ áp dụng cho người đã tham gia.');
    must_(validDate_(o.NGAY_BO_HOC),'VALIDATION','Phải nhập ngày bỏ học.');
    must_(Boolean(o.LY_DO_BO_HOC_ID),'VALIDATION','Phải chọn lý do bỏ học.');
    must_(Boolean(lookup('lydo',o.LY_DO_BO_HOC_ID)),'VALIDATION','Lý do bỏ học không tồn tại.');
  } else {o.NGAY_BO_HOC='';o.LY_DO_BO_HOC_ID='';}
  return o;
}
function recordMatches_(r,p){
  if(p.year && String(r.NAM_QUYET_DINH)!==String(p.year))return false;
  if(p.truong && r.TRUONG_ID!==p.truong)return false;
  if(p.nghe && r.NGHE_ID!==p.nghe)return false;
  if(p.status && r.TRANG_THAI_THAM_GIA!==p.status)return false;
  if(p.dropout==='yes' && !bool_(r.DA_BO_HOC))return false;
  if(p.dropout==='no' && bool_(r.DA_BO_HOC))return false;
  if(p.from && r.NGAY_QUYET_DINH<p.from)return false;
  if(p.to && r.NGAY_QUYET_DINH>p.to)return false;
  if(p.query){var h=norm_([r.HO_TEN,r.SO_QUYET_DINH,r.NGUOI_HOC_ID,r.HO_SO_ID].join(' '));if(h.indexOf(norm_(p.query))<0)return false;}
  return true;
}
function filteredRecords_(p){
  return sheetRows_('HO_SO_HOC_NGHE').filter(function(r){return recordMatches_(r,p);}).sort(function(a,b){return b.NGAY_QUYET_DINH.localeCompare(a.NGAY_QUYET_DINH)||b.TAO_LUC.localeCompare(a.TAO_LUC);});
}
function safeRecord_(r){var x=Object.assign({},r);delete x.TEP_DRIVE_ID; x.HAS_FILE=Boolean(r.TEP_DRIVE_ID);return x;}
function listRecords_(p){
  var filters={year:str_(p.year,4),truong:str_(p.truong,80),nghe:str_(p.nghe,80),status:str_(p.status,40),dropout:str_(p.dropout,4),from:str_(p.from,10),to:str_(p.to,10),query:str_(p.query,140)};
  var page=Math.min(Math.max(Number(p.page)||1,1),100000),size=Math.min(Math.max(Number(p.pageSize)||20,1),100);
  return cached_('RECORDS',[version_('DATA'),filters,page,size],APP.cacheSeconds,function(){var all=filteredRecords_(filters);return {items:all.slice((page-1)*size,page*size).map(safeRecord_),total:all.length,page:page,pageSize:size};});
}
function personLookup_(p){var q=norm_(p.query);must_(q.length>=2,'VALIDATION','Nhập ít nhất 2 ký tự để tìm người học.');var r=sheetRows_('HO_SO_HOC_NGHE'), seen={}, out=[];r.forEach(function(x){var k=x.NGUOI_HOC_ID;if(k&&!seen[k] && norm_(x.HO_TEN+' '+k).indexOf(q)>=0){seen[k]=1;out.push({NGUOI_HOC_ID:k,HO_TEN:x.HO_TEN,NGAY_SINH:x.NGAY_SINH,GIOI_TINH:x.GIOI_TINH});}});return {items:out.slice(0,20)};}
function saveRecord_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.HO_SO_ID,60), records=sheetRows_('HO_SO_HOC_NGHE'), idx=id?indexOfRow_(records,'HO_SO_ID',id):-1, old=idx>=0?records[idx]:null;
  if(id&&!old)throw err_('NOT_FOUND','Hồ sơ cần sửa không tồn tại.');
  must_(user._has(old?'RECORD_EDIT':'RECORD_CREATE'),'NO_PERMISSION','Tài khoản không có quyền '+(old?'sửa':'tạo')+' hồ sơ.');
  var obj=allowedRecord_(p,old);
  must_(!records.some(function(x){return x.SO_QUYET_DINH_KEY===obj.SO_QUYET_DINH_KEY&&x.HO_SO_ID!==id;}),'DECISION_DUPLICATE','Số quyết định '+obj.SO_QUYET_DINH+' đã được sử dụng trong năm '+obj.NAM_QUYET_DINH+'.');
  if(old){must_(Number(p.PHIEN_BAN)===Number(old.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã thay đổi ở phiên khác. Hãy tải lại trước khi sửa.');}
  var personId=str_(p.NGUOI_HOC_ID,60);
  if(!old && personId){var persons=records.filter(function(x){return x.NGUOI_HOC_ID===personId;});must_(persons.length>0,'VALIDATION','Mã người học đã chọn không tồn tại.');must_(norm_(persons[0].HO_TEN)===norm_(obj.HO_TEN),'VALIDATION','Họ tên không trùng người học được chọn.');}
  if(old) personId=old.NGUOI_HOC_ID;
  var ts=now_(), data=Object.assign({},old||{},obj,{
    HO_SO_ID:old?old.HO_SO_ID:randomId_('HS'),NGUOI_HOC_ID:personId||randomId_('NH'),
    TRANG_THAI_HO_SO:old?old.TRANG_THAI_HO_SO:'ACTIVE',
    TEP_DRIVE_ID:old?old.TEP_DRIVE_ID:'',
    TAO_LUC:old?old.TAO_LUC:ts,TAO_BOI:old?old.TAO_BOI:user.EMAIL,
    CAP_NHAT_LUC:ts,CAP_NHAT_BOI:user.EMAIL,PHIEN_BAN:String(old?Number(old.PHIEN_BAN)+1:1)
  });
  if(old) writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),data);
  else appendRecord_('HO_SO_HOC_NGHE',data);
  bump_('DATA');
  try{audit_(user,old?'SUA_HO_SO':'TAO_HO_SO','HO_SO',data.HO_SO_ID,{so:data.SO_QUYET_DINH,nam:data.NAM_QUYET_DINH,cacTruongThayDoi:old?Object.keys(obj).filter(function(k){return String(obj[k])!==String(old[k]);}):Object.keys(obj)},requestId);}catch(e){/* Giao dịch đã ghi; lưu lỗi trong execution log để đối soát */console.error('Audit failed',e);}
  return {record:safeRecord_(data)};
});}
function statusRecord_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.HO_SO_ID,60),rows=sheetRows_('HO_SO_HOC_NGHE'),ix=indexOfRow_(rows,'HO_SO_ID',id);
  must_(ix>=0,'NOT_FOUND','Không tìm thấy hồ sơ.');var old=rows[ix];must_(Number(p.PHIEN_BAN)===Number(old.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ vừa được người khác thay đổi.');
  var data=Object.assign({},old,{TRANG_THAI_THAM_GIA:str_(p.TRANG_THAI_THAM_GIA,40),DA_BO_HOC:bool_(p.DA_BO_HOC)?'TRUE':'FALSE',NGAY_BO_HOC:str_(p.NGAY_BO_HOC,10),LY_DO_BO_HOC_ID:str_(p.LY_DO_BO_HOC_ID,80)});
  must_(['CHO_XAC_NHAN','DA_THAM_GIA','KHONG_THAM_GIA'].indexOf(data.TRANG_THAI_THAM_GIA)>=0,'VALIDATION','Tình trạng không hợp lệ.');
  if(data.DA_BO_HOC==='TRUE'){
    must_(data.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'&&validDate_(data.NGAY_BO_HOC),'VALIDATION','Bỏ học cần trạng thái đã tham gia và ngày bỏ học.');
    must_(catalogRows_('lydo').some(function(x){return x.LY_DO_ID===data.LY_DO_BO_HOC_ID;}),'VALIDATION','Cần chọn lý do bỏ học.');
  } else {data.NGAY_BO_HOC='';data.LY_DO_BO_HOC_ID='';}
  data.PHIEN_BAN=String(Number(old.PHIEN_BAN)+1);data.CAP_NHAT_LUC=now_();data.CAP_NHAT_BOI=user.EMAIL;
  writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),data);bump_('DATA');
  try{audit_(user,'CAP_NHAT_TRANG_THAI','HO_SO',id,{trangThai:data.TRANG_THAI_THAM_GIA,boHoc:data.DA_BO_HOC},requestId);}catch(e){console.error('Audit failed',e);}
  return {record:safeRecord_(data)};
});}
function overview_(user,p){
  var year=str_(p.year,4),truong=str_(p.truong,80),nghe=str_(p.nghe,80);
  return cached_('OVERVIEW',[version_('DATA'),year,truong,nghe],90,function(){
    var all=filteredRecords_({year:year,truong:truong,nghe:nghe});
    var k={total:all.length,participated:0,learning:0,dropout:0,notParticipating:0,pending:0}, schools={},trades={};
    all.forEach(function(r){
      if(r.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'){k.participated++; if(bool_(r.DA_BO_HOC))k.dropout++;else k.learning++;}
      else if(r.TRANG_THAI_THAM_GIA==='KHONG_THAM_GIA')k.notParticipating++;
      else k.pending++;
      schools[r.TRUONG_ID]=(schools[r.TRUONG_ID]||0)+1;trades[r.NGHE_ID]=(trades[r.NGHE_ID]||0)+1;
    });
    return {kpi:k,schoolCounts:schools,tradeCounts:trades};
  });
}
function exportRecords_(p){
  var all=filteredRecords_(p);must_(all.length<=5000,'EXPORT_TOO_LARGE','Tối đa 5.000 hồ sơ cho mỗi lần xuất. Hãy thu hẹp bộ lọc.');
  var schools={},trades={};catalogRows_('truong').forEach(function(x){schools[x.TRUONG_ID]=x.TEN_TRUONG;});catalogRows_('nghe').forEach(function(x){trades[x.NGHE_ID]=x.TEN_NGHE;});
  return {columns:['Số QĐ','Năm','Ngày QĐ','Họ tên','Ngày sinh','Cơ sở','Nghề','Tình trạng','Bỏ học','Ngày bỏ học','Ghi chú'],items:all.map(function(x){return [x.SO_QUYET_DINH,x.NAM_QUYET_DINH,x.NGAY_QUYET_DINH,x.HO_TEN,x.NGAY_SINH,schools[x.TRUONG_ID]||x.TRUONG_ID,trades[x.NGHE_ID]||x.NGHE_ID,x.TRANG_THAI_THAM_GIA,x.DA_BO_HOC,x.NGAY_BO_HOC,x.GHI_CHU];})};
}
function catalogSave_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var type=str_(p.type,20),def=APP.catalog[type];must_(Boolean(def),'BAD_REQUEST','Không có danh mục này.');
  var id=str_(p.id,60),list=sheetRows_(def.sheet),idx=id?indexOfRow_(list,def.id,id):-1;
  if(id&&idx<0)throw err_('NOT_FOUND','Danh mục không tồn tại.');
  var old=idx>=0?list[idx]:null;
  var code=str_(p.code,60).toUpperCase(),title=str_(p.title,250),state=str_(p.status,15)||'ACTIVE';
  must_(/^[A-Z0-9_-]{2,60}$/.test(code),'VALIDATION','Mã danh mục từ 2 đến 60 ký tự A-Z, 0-9, _ hoặc -.');
  must_(title.length>=2,'VALIDATION','Tên danh mục tối thiểu 2 ký tự.');
  must_(['ACTIVE','INACTIVE'].indexOf(state)>=0,'VALIDATION','Trạng thái danh mục không hợp lệ.');
  must_(!list.some(function(x){return x[def.id]!==id&&(x[def.code]===code||norm_(x[def.title])===norm_(title));}),'DUPLICATE','Trùng mã hoặc tên danh mục.');
  var item=Object.assign({},old||{});
  item[def.id]=old?old[def.id]:randomId_(type.toUpperCase());item[def.code]=code;item[def.title]=title;
  item.TRANG_THAI=state;item.GHI_CHU=str_(p.note,400);item.THU_TU=str_(p.order,5)||'0';
  if(type==='truong'){item.TEN_VIET_TAT=str_(p.shortName,100);item.DIA_CHI=str_(p.address,300);}
  item.TAO_LUC=old?old.TAO_LUC:now_();item.CAP_NHAT_LUC=now_();
  if(old)writeRecord_(def.sheet,findRowNumber_(def.sheet,def.id,id),item);else appendRecord_(def.sheet,item);
  bump_('CAT');
  try{audit_(user,old?'SUA_DANH_MUC':'TAO_DANH_MUC',type,item[def.id],{ma:code,ten:title,trangThai:state},requestId);}catch(e){console.error('Audit failed',e);}
  return {item:item};
});}
function accountsList_(){return {items:sheetRows_('TAI_KHOAN').map(safeUser_)};}
function accountSave_(admin,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.id,60),email=str_(p.email,200).toLowerCase(),role=str_(p.role,20),status=str_(p.status,10),permissions=str_(p.permissions,600);
  must_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'VALIDATION','Email không hợp lệ.');
  must_(['ADMIN','NHAN_VIEN'].indexOf(role)>=0,'VALIDATION','Vai trò không hợp lệ.');
  must_(['ACTIVE','DISABLED'].indexOf(status)>=0,'VALIDATION','Trạng thái tài khoản không hợp lệ.');
  var accepted=['RECORD_VIEW','RECORD_CREATE','RECORD_EDIT','RECORD_STATUS','REPORT_VIEW','CATALOG_MANAGE','ACCOUNT_MANAGE','AUDIT_VIEW','FILE_VIEW','FILE_UPLOAD'];
  var rights=permissions.split(',').map(function(x){return x.trim();}).filter(Boolean);
  must_(rights.every(function(x){return accepted.indexOf(x)>=0;}),'VALIDATION','Danh sách quyền không hợp lệ.');
  var all=sheetRows_('TAI_KHOAN'),ix=id?indexOfRow_(all,'TAI_KHOAN_ID',id):-1,old=ix>=0?all[ix]:null;
  if(id&&!old)throw err_('NOT_FOUND','Tài khoản không tồn tại.');
  must_(!all.some(function(u){return u.EMAIL.toLowerCase()===email&&u.TAI_KHOAN_ID!==id;}),'DUPLICATE','Email đã được cấp quyền.');
  var newAccounts=all.filter(function(u){return u.TAI_KHOAN_ID!==id;}).concat([{VAI_TRO:role,TRANG_THAI:status}]);
  must_(newAccounts.some(function(u){return u.VAI_TRO==='ADMIN'&&u.TRANG_THAI==='ACTIVE';}),'VALIDATION','Hệ thống phải có ít nhất một Admin đang hoạt động.');
  // Tài khoản thay email thì định danh Google phải reset có chủ đích, thay đổi được ghi audit.
  var item=Object.assign({},old||{}, {TAI_KHOAN_ID:old?old.TAI_KHOAN_ID:randomId_('TK'),EMAIL:email,HO_TEN:str_(p.name,150),VAI_TRO:role,QUYEN:role==='ADMIN'?'*':rights.join(','),TRANG_THAI:status,GOOGLE_SUB:old&&old.EMAIL.toLowerCase()===email?old.GOOGLE_SUB:'',TAO_LUC:old?old.TAO_LUC:now_(),TAO_BOI:old?old.TAO_BOI:admin.EMAIL,CAP_NHAT_LUC:now_(),CAP_NHAT_BOI:admin.EMAIL,DANG_NHAP_CUOI:old?old.DANG_NHAP_CUOI:''});
  if(old)writeRecord_('TAI_KHOAN',findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',id),item);else appendRecord_('TAI_KHOAN',item);
  bump_('USERS');
  try{audit_(admin,old?'SUA_TAI_KHOAN':'TAO_TAI_KHOAN','TAI_KHOAN',item.TAI_KHOAN_ID,{email:email,role:role,status:status},requestId);}catch(e){console.error('Audit failed',e);}
  return {item:safeUser_(item)};
});}
function listAudit_(p){var page=Math.min(Math.max(Number(p.page)||1,1),10000),size=30,all=sheetRows_('NHAT_KY').reverse();return {items:all.slice((page-1)*size,page*size),total:all.length,page:page,pageSize:size};}
function findRecord_(id){var rows=sheetRows_('HO_SO_HOC_NGHE'),i=indexOfRow_(rows,'HO_SO_ID',id);must_(i>=0,'NOT_FOUND','Không tìm thấy hồ sơ.');return rows[i];}
function folder_(){var id=cfg_().getProperty('DRIVE_FOLDER_ID');must_(Boolean(id),'SERVER_NOT_CONFIGURED','Thiếu DRIVE_FOLDER_ID.');return DriveApp.getFolderById(id);}
function fileUpload_(user,p,requestId){return dedupeWrite_(requestId,function(){
  must_(user._has('RECORD_EDIT')||user._has('FILE_UPLOAD'),'NO_PERMISSION','Không có quyền tải tệp.');
  var id=str_(p.HO_SO_ID,70),record=findRecord_(id);
  must_(Number(p.PHIEN_BAN)===Number(record.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã được cập nhật. Tải lại để tiếp tục.');
  var name=str_(p.name,130).replace(/[\\/<>:"|?*\x00-\x1f]/g,'_');var mime=str_(p.mime,70);
  must_(['application/pdf','image/jpeg','image/png'].indexOf(mime)>=0,'VALIDATION','Chỉ chấp nhận PDF, JPG hoặc PNG.');
  var content=str_(p.base64,1800000);must_(content.length>0&&content.length<1700000&&/^[A-Za-z0-9+/=]+$/.test(content),'VALIDATION','Tệp vượt giới hạn hoặc không hợp lệ.');
  var bytes=Utilities.base64Decode(content);must_(bytes.length<=APP.maxFileBytes,'VALIDATION','Tệp vượt 1,2 MB.');
  var folder=folder_(),file=folder.createFile(Utilities.newBlob(bytes,mime,id+'_'+name));
  var oldFile=record.TEP_DRIVE_ID;
  try{
    record.TEP_DRIVE_ID=file.getId();record.PHIEN_BAN=String(Number(record.PHIEN_BAN)+1);record.CAP_NHAT_LUC=now_();record.CAP_NHAT_BOI=user.EMAIL;
    writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),record);bump_('DATA');
  } catch(e){file.setTrashed(true);throw e;}
  if(oldFile){try{var old=DriveApp.getFileById(oldFile);if(old.getParents().hasNext())old.setTrashed(true);}catch(e){console.error('Old file cleanup',e);}}
  try{audit_(user,'DINH_KEM_TEP','HO_SO',id,{tenTapTin:name},requestId);}catch(e){console.error('Audit failed',e);}
  return {name:name,record:safeRecord_(record)};
});}
function fileGet_(p){var id=str_(p.HO_SO_ID,60),record=findRecord_(id);must_(Boolean(record.TEP_DRIVE_ID),'NOT_FOUND','Hồ sơ không có tệp đính kèm.');var file=DriveApp.getFileById(record.TEP_DRIVE_ID),blob=file.getBlob();must_(blob.getBytes().length<=APP.maxFileBytes,'FILE_TOO_LARGE','Tệp vượt giới hạn tải xuống qua ứng dụng.');return {name:file.getName(),mime:blob.getContentType(),base64:Utilities.base64Encode(blob.getBytes())};}
function fileRemove_(user,p,requestId){return dedupeWrite_(requestId,function(){
  must_(user._has('RECORD_EDIT')||user._has('FILE_UPLOAD'),'NO_PERMISSION','Không có quyền xóa tệp.');
  var id=str_(p.HO_SO_ID,60),r=findRecord_(id);must_(Number(p.PHIEN_BAN)===Number(r.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã thay đổi.');
  var oldFile=r.TEP_DRIVE_ID;must_(Boolean(oldFile),'NOT_FOUND','Không có tệp.');r.TEP_DRIVE_ID='';r.PHIEN_BAN=String(Number(r.PHIEN_BAN)+1);r.CAP_NHAT_LUC=now_();r.CAP_NHAT_BOI=user.EMAIL;
  writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),r);bump_('DATA');
  try{DriveApp.getFileById(oldFile).setTrashed(true);}catch(e){console.error('File cleanup',e);}
  try{audit_(user,'GO_TEP','HO_SO',id,{removed:true},requestId);}catch(e){console.error('Audit failed',e);}
  return {record:safeRecord_(r)};
});}

/**
 * THEO_DOI_HOC_NGHE_API — v1.1.6-RC
 * Dự án độc lập: Google Sheets + Apps Script, không sử dụng Firebase hoặc Work.
 * Đặt API_SHARED_SECRET / SPREADSHEET_ID / GOOGLE_CLIENT_ID trong Script Properties.
 * Không phát hành Web App khi chưa triển khai proxy có xác minh Google ID Token.
 */
var APP = {
  version: '1.1.6-RC',
  tz: 'Asia/Ho_Chi_Minh',
  maxFileBytes: 10485760,
  chunkBytes: 262144,
  cacheSeconds: 45,
  lists: {
    'HO_SO_HOC_NGHE': 'HO_SO_ID NGUOI_HOC_ID HO_TEN NGAY_SINH GIOI_TINH SO_QUYET_DINH NAM_QUYET_DINH SO_QUYET_DINH_KEY NGAY_QUYET_DINH TRUONG_ID NGHE_ID NGAY_BAT_DAU NGAY_KET_THUC_DU_KIEN TRANG_THAI_THAM_GIA DA_BO_HOC NGAY_BO_HOC LY_DO_BO_HOC_ID GHI_CHU TEP_DRIVE_ID TRANG_THAI_HO_SO TAO_LUC TAO_BOI CAP_NHAT_LUC CAP_NHAT_BOI PHIEN_BAN SO_SO_BHXH SO_QD_TCTN NGAY_QD_TCTN SO_THANG_HO_TRO MUC_HO_TRO_THANG NGAY_KET_THUC_TCTN NGAY_KET_THUC_HO_TRO DIA_CHI_TAM_TRU DIA_CHI_THUONG_TRU SO_CMND NGAY_CAP_CMND NOI_CAP_CMND DIA_CHI_CO_SO CHI_NHANH_BHTN DIEN_THOAI'.split(' '),
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
  'HO_SO_HOC_NGHE': 'Mã hồ sơ|Mã người học|Họ và tên|Ngày sinh|Giới tính|Số quyết định|Năm quyết định|Khóa kiểm tra trùng|Ngày quyết định|Mã cơ sở đào tạo|Mã nghề|Ngày bắt đầu|Ngày kết thúc dự kiến|Tình trạng tham gia|Đã bỏ học|Ngày bỏ học|Mã lý do bỏ học|Ghi chú|Mã tệp Google Drive|Trạng thái hồ sơ|Thời gian tạo|Người tạo|Thời gian cập nhật|Người cập nhật|Phiên bản hồ sơ|Số sổ BHXH|Số QĐ TCTN|Ngày ban hành QĐ TCTN|Số tháng hỗ trợ|Mức hỗ trợ/tháng|Ngày kết thúc hưởng TCTN|Ngày kết thúc hỗ trợ học nghề|Địa chỉ tạm trú|Địa chỉ thường trú|Số CMND|Ngày cấp CMND|Nơi cấp CMND|Địa chỉ cơ sở đào tạo|Chi nhánh BHTN|Điện thoại'.split('|'),
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

/** YC-HN-011: Sao lưu trước và bổ sung duy nhất các cột ở cuối, chạy lại an toàn. */
function nangCapDuLieuHocNgheYC011() {
  return withLock_(function(){
    var sh=getSheet_('HO_SO_HOC_NGHE'), expected=APP.headersVi.HO_SO_HOC_NGHE;
    var old=expected.slice(0,25), actual=sh.getRange(1,1,1,Math.min(sh.getLastColumn(),expected.length)).getDisplayValues()[0];
    must_(old.every(function(h,i){return actual[i]===h;}),'SCHEMA_MISMATCH','25 cột hồ sơ hiện tại chưa đúng cấu trúc. Không tự cập nhật.');
    var present=actual.slice(25).filter(function(x){return x!=='';});
    must_(expected.slice(25).slice(0,present.length).every(function(h,i){return present[i]===h;}),'SCHEMA_MISMATCH','Các cột bổ sung chưa đúng thứ tự; không thể nâng cấp tự động.');
    if(present.length===15)return {updated:false,totalColumns:40};
    var source=getSpreadsheet_();
    var backup=DriveApp.getFileById(source.getId()).makeCopy('SAO_LUU_TRUOC_YC011_'+Utilities.formatDate(new Date(),APP.tz,'yyyyMMdd_HHmmss'));
    console.log('Sao lưu YC011: '+backup.getUrl());
    var missing=15-present.length;
    if(sh.getMaxColumns()<40)sh.insertColumnsAfter(sh.getMaxColumns(),40-sh.getMaxColumns());
    sh.getRange(1,26+present.length,1,missing).setValues([expected.slice(25+present.length)]);
    sh.getRange(1,26+present.length,1,missing).setBackground('#12305a').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    sh.getRange(2,26+present.length,Math.max(1,sh.getMaxRows()-1),missing).setNumberFormat('@');
    sh.setColumnWidths(26+present.length,missing,165);
    return {updated:true,totalColumns:40,backup:backup.getUrl()};
  });
}
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
      case 'records_list': data = listRecords_(user,payload); break;
      case 'person_lookup': data = personLookup_(user,payload); break;
      case 'record_bulk_check': data = recordBulkCheck_(user,payload); break;
      case 'record_bulk_import': data = withLock_(function(){return recordBulkImport_(user,payload,body.requestId);}); break;
      case 'record_save': data = withLock_(function(){return saveRecord_(user, payload, body.requestId);}); break;
      case 'record_status': data = withLock_(function(){return statusRecord_(user, payload, body.requestId);}); break;
       case 'record_delete': data = withLock_(function(){return deleteRecord_(user, payload, body.requestId);}); break;
      case 'report_export': data = exportRecords_(user,payload); break;
      case 'catalog_list': data = catalogList_(payload); break;
      case 'catalog_save': data = withLock_(function(){return catalogSave_(user,payload,body.requestId);}); break;
      case 'catalog_delete': data = withLock_(function(){return catalogDelete_(user,payload,body.requestId);}); break;
       case 'catalog_bulk_check': data = catalogBulkCheck_(payload); break;
       case 'catalog_bulk_import': data = withLock_(function(){return catalogBulkImport_(user,payload,body.requestId);}); break;
      case 'accounts_list': data = accountsList_(); break;
      case 'account_save': data = withLock_(function(){return accountSave_(user,payload,body.requestId);}); break;
      case 'account_delete': data = withLock_(function(){return accountDelete_(user,payload,body.requestId);}); break;
      case 'audit_list': data = listAudit_(payload); break;
      case 'file_upload': data = withLock_(function(){return fileUpload_(user,payload,body.requestId);}); break;
      case 'file_get': data = fileGet_(user,payload); break;
       case 'file_info': data = fileInfo_(user,payload); break;
       case 'file_chunk': data = fileChunk_(user,payload); break;
       case 'file_upload_begin': data = withLock_(function(){return fileUploadBegin_(user,payload);}); break;
       case 'file_upload_chunk': data = withLock_(function(){return fileUploadChunk_(user,payload);}); break;
       case 'file_upload_cancel': data = withLock_(function(){return fileUploadCancel_(user,payload);}); break;
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
function safeSheetCell_(x){var value=String(x===undefined||x===null?'':x);return /^[=+@-]/.test(value)?"'"+value:value;}
function writeRecord_(name,rowNumber,obj) {
  if(name==='HO_SO_HOC_NGHE')must_(getSheet_(name).getRange(1,40,1,1).getDisplayValues()[0][0]===APP.headersVi.HO_SO_HOC_NGHE[39],'SCHEMA_MISSING','Cần chạy nangCapDuLieuHocNgheYC011 trước khi ghi hồ sơ.');
  var hdr=APP.lists[name], values=hdr.map(function(k){return safeSheetCell_(obj[k]);});
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
  var row=users.filter(function(u){return norm_(u.EMAIL)===email&&u.TRANG_THAI==='ACTIVE';})[0];
  must_(row && row.TRANG_THAI==='ACTIVE','NOT_AUTHORIZED','Tài khoản chưa được cấp quyền hoặc đã khóa.');
  if(row.GOOGLE_SUB && row.GOOGLE_SUB!==identity.sub)throw err_('NOT_AUTHORIZED','Tài khoản Google không trùng định danh đã đăng ký.');
  if(!row.GOOGLE_SUB){
    var lock=LockService.getScriptLock();must_(lock.tryLock(15000),'BUSY','Đang xác nhận tài khoản, vui lòng thử lại.');
    try {
      var current=sheetRows_('TAI_KHOAN').filter(function(u){return norm_(u.EMAIL)===email&&u.TRANG_THAI==='ACTIVE';})[0];
      must_(current && current.TRANG_THAI==='ACTIVE','NOT_AUTHORIZED','Tài khoản chưa được cấp quyền.');
      must_(!current.GOOGLE_SUB || current.GOOGLE_SUB===identity.sub,'NOT_AUTHORIZED','Định danh Google không đúng.');
      if(!current.GOOGLE_SUB){current.GOOGLE_SUB=identity.sub;current.CAP_NHAT_LUC=now_();writeRecord_('TAI_KHOAN',findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',current.TAI_KHOAN_ID),current);bump_('USERS');}
      row=current;
    } finally {lock.releaseLock();}
  }
  var needs={
    bootstrap:'RECORD_VIEW', overview:'RECORD_VIEW', records_list:'RECORD_VIEW', person_lookup:'RECORD_VIEW',
    record_bulk_check:'ACCOUNT_MANAGE', record_bulk_import:'ACCOUNT_MANAGE', record_save:'RECORD_CREATE', record_status:'RECORD_STATUS', record_delete:'RECORD_DELETE', report_export:'REPORT_VIEW',
    catalog_list:'CATALOG_MANAGE', catalog_save:'CATALOG_MANAGE', catalog_delete:'CATALOG_MANAGE', catalog_bulk_check:'CATALOG_MANAGE', catalog_bulk_import:'CATALOG_MANAGE', accounts_list:'ACCOUNT_MANAGE', account_save:'ACCOUNT_MANAGE', account_delete:'ACCOUNT_MANAGE',
    audit_list:'AUDIT_VIEW', file_upload:'FILE_UPLOAD', file_get:'FILE_VIEW', file_info:'FILE_VIEW', file_chunk:'FILE_VIEW', file_upload_begin:'FILE_UPLOAD', file_upload_chunk:'FILE_UPLOAD', file_upload_cancel:'FILE_UPLOAD', file_remove:'FILE_UPLOAD'
  };
  must_(Boolean(needs[action]),'BAD_REQUEST','Thao tác không cho phép.');
  // YC-HN-007: các quyền nghiệp vụ được xác định theo VAI_TRO, không còn tin cột QUYEN lịch sử.
  var staffRights=['RECORD_VIEW','RECORD_CREATE','RECORD_EDIT','RECORD_DELETE','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','FILE_UPLOAD'];
  must_(row.VAI_TRO==='ADMIN'||row.VAI_TRO==='NHAN_VIEN','NOT_AUTHORIZED','Vai trò tài khoản chưa hợp lệ.');
  var perms=row.VAI_TRO==='ADMIN'?['*']:staffRights;
  function has(p){return row.VAI_TRO==='ADMIN'||(row.VAI_TRO==='NHAN_VIEN'&&staffRights.indexOf(p)>=0);}
  // record_save tự quyết định quyền tạo/sửa phía dưới, không cấp quyền sửa chỉ vì được tạo.
  if(action==='record_save')must_(has('RECORD_CREATE')||has('RECORD_EDIT'),'NO_PERMISSION','Không được tạo hoặc sửa hồ sơ.');
  else must_(has(needs[action]),'NO_PERMISSION','Không có quyền thực hiện thao tác này.');
  row._permissions=perms;row._has=has;row._googleSub=identity.sub;return row;
}
function safeUser_(u) {return {TAI_KHOAN_ID:u.TAI_KHOAN_ID,EMAIL:u.EMAIL,HO_TEN:u.HO_TEN,VAI_TRO:u.VAI_TRO,QUYEN:u.VAI_TRO==='ADMIN'?'*':'RECORD_VIEW,RECORD_CREATE,RECORD_EDIT,RECORD_DELETE,RECORD_STATUS,REPORT_VIEW,FILE_VIEW,FILE_UPLOAD',TRANG_THAI:u.TRANG_THAI};}
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
  return {user:safeUser_(user), catalogs:{truong:catalogRows_('truong').filter(catalogVisible_),nghe:catalogRows_('nghe').filter(catalogVisible_),lydo:catalogRows_('lydo').filter(catalogVisible_)},version:APP.version};
}
function catalogRows_(type){var def=APP.catalog[type];must_(Boolean(def),'BAD_REQUEST','Danh mục không tồn tại.');return cached_('CAT',type+'_'+version_('CAT'),300,function(){return sheetRows_(def.sheet);});}
function catalogVisible_(r){return r.TRANG_THAI!=='DELETED';}
function catalogList_(p){return {items:catalogRows_(str_(p.type,20)).filter(catalogVisible_),type:str_(p.type,20)};}
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
  // YC-HN-011: trường thông tin gốc Excel, giữ nguyên khi cập nhật từng phần.
  APP.lists.HO_SO_HOC_NGHE.slice(25).forEach(function(k){
    o[k]=p[k]===undefined && original ? str_(original[k],1000) : str_(p[k],1000);
  });
  ['NGAY_QD_TCTN','NGAY_KET_THUC_TCTN','NGAY_KET_THUC_HO_TRO','NGAY_CAP_CMND'].forEach(function(k){validateOptionalDate_(o[k],APP.headersVi.HO_SO_HOC_NGHE[APP.lists.HO_SO_HOC_NGHE.indexOf(k)]);});
  ['SO_THANG_HO_TRO','MUC_HO_TRO_THANG'].forEach(function(k){
    if(o[k])must_(/^\d+(?:[.,]\d+)?$/.test(o[k]),'VALIDATION','Số tháng hoặc mức hỗ trợ chưa hợp lệ.');
  });
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
    if(o.NGAY_BAT_DAU)must_(o.NGAY_BO_HOC>=o.NGAY_BAT_DAU,'VALIDATION','Ngày bỏ học không được trước ngày bắt đầu học.');
  } else {o.NGAY_BO_HOC='';o.LY_DO_BO_HOC_ID='';}
  return o;
}
function ownsRecord_(user,r){return user.VAI_TRO==='ADMIN' || (Boolean(r.TAO_BOI) && norm_(r.TAO_BOI)===norm_(user.EMAIL));}
function requireRecordOwner_(user,r){must_(ownsRecord_(user,r),'NO_PERMISSION','Bạn chỉ được truy cập hồ sơ do chính mình tạo.');return r;}
function visibleRecords_(user){return sheetRows_('HO_SO_HOC_NGHE').filter(function(r){return r.TRANG_THAI_HO_SO!=='DELETED' && ownsRecord_(user,r);});}
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
function filteredRecords_(p,user){
  must_(Boolean(user&&user.VAI_TRO),'NOT_AUTHORIZED','Thiếu thông tin tài khoản.');
  return visibleRecords_(user).filter(function(r){return recordMatches_(r,p);}).sort(function(a,b){return b.NGAY_QUYET_DINH.localeCompare(a.NGAY_QUYET_DINH)||b.TAO_LUC.localeCompare(a.TAO_LUC);});
}
function safeRecord_(r){var x=Object.assign({},r);delete x.TEP_DRIVE_ID; x.HAS_FILE=Boolean(r.TEP_DRIVE_ID);return x;}
function listRecords_(user,p){
  var filters={year:str_(p.year,4),truong:str_(p.truong,80),nghe:str_(p.nghe,80),status:str_(p.status,40),dropout:str_(p.dropout,4),from:str_(p.from,10),to:str_(p.to,10),query:str_(p.query,140)};
  var page=Math.min(Math.max(Number(p.page)||1,1),100000),size=Math.min(Math.max(Number(p.pageSize)||20,1),100);
  return cached_('RECORDS',[version_('DATA'),user.TAI_KHOAN_ID,user.EMAIL,user.VAI_TRO,filters,page,size],APP.cacheSeconds,function(){var all=filteredRecords_(filters,user);return {items:all.slice((page-1)*size,page*size).map(safeRecord_),total:all.length,page:page,pageSize:size};});
}
function personLookup_(user,p){
  var q=norm_(p.query);must_(q.length>=2,'VALIDATION','Nhập ít nhất 2 ký tự để tìm người học.');
  var r=visibleRecords_(user),seen={},out=[];
  r.forEach(function(x){var k=x.NGUOI_HOC_ID;if(k&&!seen[k]&&norm_(x.HO_TEN+' '+k).indexOf(q)>=0){seen[k]=1;out.push({NGUOI_HOC_ID:k,HO_TEN:x.HO_TEN,NGAY_SINH:x.NGAY_SINH,GIOI_TINH:x.GIOI_TINH});}});
  return {items:out.slice(0,20)};
}
function saveRecord_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.HO_SO_ID,60), records=sheetRows_('HO_SO_HOC_NGHE'), idx=id?indexOfRow_(records,'HO_SO_ID',id):-1, old=idx>=0?records[idx]:null;
  if(id&&!old)throw err_('NOT_FOUND','Hồ sơ cần sửa không tồn tại.');
   if(old){must_(old.TRANG_THAI_HO_SO!=='DELETED','NOT_FOUND','Hồ sơ đã được xóa.');requireRecordOwner_(user,old);}
  must_(user._has(old?'RECORD_EDIT':'RECORD_CREATE'),'NO_PERMISSION','Tài khoản không có quyền '+(old?'sửa':'tạo')+' hồ sơ.');
  var obj=allowedRecord_(p,old);
  must_(!records.some(function(x){return x.SO_QUYET_DINH_KEY===obj.SO_QUYET_DINH_KEY&&x.HO_SO_ID!==id;}),'DECISION_DUPLICATE','Số quyết định '+obj.SO_QUYET_DINH+' đã được sử dụng trong năm '+obj.NAM_QUYET_DINH+'.');
  if(old){must_(Number(p.PHIEN_BAN)===Number(old.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã thay đổi ở phiên khác. Hãy tải lại trước khi sửa.');}
  var personId=str_(p.NGUOI_HOC_ID,60);
  if(!old && personId){var persons=records.filter(function(x){return x.NGUOI_HOC_ID===personId && x.TRANG_THAI_HO_SO!=='DELETED' && ownsRecord_(user,x);});must_(persons.length>0,'VALIDATION','Mã người học đã chọn không tồn tại.');must_(norm_(persons[0].HO_TEN)===norm_(obj.HO_TEN),'VALIDATION','Họ tên không trùng người học được chọn.');}
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
  must_(ix>=0,'NOT_FOUND','Không tìm thấy hồ sơ.');var old=requireRecordOwner_(user,rows[ix]);must_(old.TRANG_THAI_HO_SO!=='DELETED','NOT_FOUND','Hồ sơ đã được xóa.');must_(Number(p.PHIEN_BAN)===Number(old.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ vừa được người khác thay đổi.');
  var data=Object.assign({},old,{TRANG_THAI_THAM_GIA:str_(p.TRANG_THAI_THAM_GIA,40),DA_BO_HOC:bool_(p.DA_BO_HOC)?'TRUE':'FALSE',NGAY_BO_HOC:str_(p.NGAY_BO_HOC,10),LY_DO_BO_HOC_ID:str_(p.LY_DO_BO_HOC_ID,80)});
  must_(['CHO_XAC_NHAN','DA_THAM_GIA','KHONG_THAM_GIA'].indexOf(data.TRANG_THAI_THAM_GIA)>=0,'VALIDATION','Tình trạng không hợp lệ.');
  if(data.DA_BO_HOC==='TRUE'){
    must_(data.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'&&validDate_(data.NGAY_BO_HOC),'VALIDATION','Bỏ học cần trạng thái đã tham gia và ngày bỏ học.');
    must_(catalogRows_('lydo').some(function(x){return x.LY_DO_ID===data.LY_DO_BO_HOC_ID;}),'VALIDATION','Cần chọn lý do bỏ học.');
    if(old.NGAY_BAT_DAU)must_(data.NGAY_BO_HOC>=old.NGAY_BAT_DAU,'VALIDATION','Ngày bỏ học không được trước ngày bắt đầu học.');
  } else {data.NGAY_BO_HOC='';data.LY_DO_BO_HOC_ID='';}
  data.PHIEN_BAN=String(Number(old.PHIEN_BAN)+1);data.CAP_NHAT_LUC=now_();data.CAP_NHAT_BOI=user.EMAIL;
  writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),data);bump_('DATA');
  try{audit_(user,'CAP_NHAT_TRANG_THAI','HO_SO',id,{trangThai:data.TRANG_THAI_THAM_GIA,boHoc:data.DA_BO_HOC},requestId);}catch(e){console.error('Audit failed',e);}
  return {record:safeRecord_(data)};
});}
/** YC-HN-009: Nhập hồ sơ theo từng đợt, chỉ ADMIN. Không làm thay đổi 7 tab / 79 cột. */
function recordBulkPlan_(user,p){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được nhập hồ sơ hàng loạt.');
  var rows=p.rows;
  must_(Array.isArray(rows)&&rows.length>0&&rows.length<=3000,'VALIDATION','Mỗi file cần từ 1 đến 3.000 hồ sơ.');
  var taken={};
  // Chỉ kiểm tra danh sách khóa số quyết định; cache theo phiên bản dữ liệu để tránh đọc toàn bộ Sheet mỗi lần xem trước.
  cached_('BULK_DECISIONS',version_('DATA'),180,function(){return sheetRows_('HO_SO_HOC_NGHE').map(function(r){return r.SO_QUYET_DINH_KEY;}).filter(Boolean);}).forEach(function(key){taken[key]='EXISTING';});
  var schools={},trades={};
  catalogRows_('truong').filter(function(c){return c.TRANG_THAI==='ACTIVE';}).forEach(function(c){
    var k=norm_(c.TEN_TRUONG);if(schools[k])schools[k]='AMBIGUOUS';else schools[k]=c.TRUONG_ID;
  });
  catalogRows_('nghe').filter(function(c){return c.TRANG_THAI==='ACTIVE';}).forEach(function(c){
    var k=norm_(c.TEN_NGHE);if(trades[k])trades[k]='AMBIGUOUS';else trades[k]=c.NGHE_ID;
  });
  var result={valid:[],duplicate:[],invalid:[]},within={};
  rows.forEach(function(raw,i){
    var line=Number(raw&&raw.line)||i+2;
    try{
      must_(raw&&typeof raw==='object'&&!Array.isArray(raw),'VALIDATION','Dòng dữ liệu không hợp lệ.');
      var name=str_(raw.name,250),number=str_(raw.decision,20),date=str_(raw.decisionDate,10);
      must_(Boolean(name),'VALIDATION','Thiếu họ và tên.');
      var key=decisionKey_(number,date);
      var schoolName=str_(raw.school,250),tradeName=str_(raw.trade,250);
      var schoolId=schools[norm_(schoolName)],tradeId=trades[norm_(tradeName)];
      must_(schoolId&&schoolId!=='AMBIGUOUS','VALIDATION','Cơ sở đào tạo chưa có trong Danh mục hoặc trùng tên: '+schoolName);
      must_(tradeId&&tradeId!=='AMBIGUOUS','VALIDATION','Nghề đào tạo chưa có trong Danh mục hoặc trùng tên: '+tradeName);
      var sex=norm_(raw.sex),gender=(sex==='nam'?'NAM':sex==='nu'?'NU':sex==='khac'||!sex?'KHAC':'UNKNOWN');
      must_(gender!=='UNKNOWN','VALIDATION','Giới tính không hợp lệ.');
      var data=allowedRecord_({HO_TEN:name,NGAY_SINH:str_(raw.birthDate,10),GIOI_TINH:gender,
        SO_QUYET_DINH:number,NGAY_QUYET_DINH:date,TRUONG_ID:schoolId,NGHE_ID:tradeId,
        NGAY_BAT_DAU:str_(raw.startDate,10),NGAY_KET_THUC_DU_KIEN:str_(raw.endDate,10),
        TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:false,GHI_CHU:'',SO_SO_BHXH:raw.SO_SO_BHXH,SO_QD_TCTN:raw.SO_QD_TCTN,NGAY_QD_TCTN:raw.NGAY_QD_TCTN,SO_THANG_HO_TRO:raw.SO_THANG_HO_TRO,MUC_HO_TRO_THANG:raw.MUC_HO_TRO_THANG,NGAY_KET_THUC_TCTN:raw.NGAY_KET_THUC_TCTN,NGAY_KET_THUC_HO_TRO:raw.NGAY_KET_THUC_HO_TRO,DIA_CHI_TAM_TRU:raw.DIA_CHI_TAM_TRU,DIA_CHI_THUONG_TRU:raw.DIA_CHI_THUONG_TRU,SO_CMND:raw.SO_CMND,NGAY_CAP_CMND:raw.NGAY_CAP_CMND,NOI_CAP_CMND:raw.NOI_CAP_CMND,DIA_CHI_CO_SO:raw.DIA_CHI_CO_SO,CHI_NHANH_BHTN:raw.CHI_NHANH_BHTN,DIEN_THOAI:raw.DIEN_THOAI},null);
      must_(!data.NGAY_BAT_DAU||!data.NGAY_KET_THUC_DU_KIEN||data.NGAY_KET_THUC_DU_KIEN>=data.NGAY_BAT_DAU,'VALIDATION','Ngày kết thúc dự kiến trước ngày bắt đầu.');
      if(taken[key]||within[key])result.duplicate.push({line:line,reason:'Số quyết định đã có trong '+date.slice(0,4)+' hoặc trùng trong file.'});
      else{within[key]=true;result.valid.push({line:line,record:data});}
    }catch(ex){result.invalid.push({line:line,reason:ex.code==='VALIDATION'?ex.message:'Dòng dữ liệu chưa hợp lệ.'});}
  });
  return result;
}
function recordBulkCheck_(user,p){
  var plan=recordBulkPlan_(user,p);
  return {total:p.rows.length,valid:plan.valid.length,duplicate:plan.duplicate.length,invalid:plan.invalid.length,
    issues:plan.invalid.concat(plan.duplicate).sort(function(a,b){return a.line-b.line;}).slice(0,1200)};
}
function recordBulkImport_(user,p,requestId){return dedupeWrite_(requestId,function(){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được nhập hồ sơ hàng loạt.');
  must_(Array.isArray(p.rows)&&p.rows.length<=40&&p.rows.length>0,'VALIDATION','Mỗi đợt tối đa 40 hồ sơ.');
  var plan=recordBulkPlan_(user,p),ts=now_(),headers=APP.lists.HO_SO_HOC_NGHE;
  // Chỉ một lần setValues theo đợt, hạn chế hạn mức Sheets và tránh nhập nửa dòng.
  var values=plan.valid.map(function(item){
    var data=Object.assign({},item.record,{HO_SO_ID:randomId_('HS'),NGUOI_HOC_ID:randomId_('NH'),
      TRANG_THAI_HO_SO:'ACTIVE',TEP_DRIVE_ID:'',TAO_LUC:ts,TAO_BOI:user.EMAIL,
      CAP_NHAT_LUC:ts,CAP_NHAT_BOI:user.EMAIL,PHIEN_BAN:'1'});
    return headers.map(function(k){return safeSheetCell_(data[k]);});
  });
  if(values.length){
    var sh=getSheet_('HO_SO_HOC_NGHE');sh.getRange(sh.getLastRow()+1,1,values.length,headers.length).setValues(values);
    bump_('DATA');
    try{audit_(user,'NHAP_HO_SO_HANG_LOAT','HO_SO','BATCH',{
      imported:values.length,duplicate:plan.duplicate.length,invalid:plan.invalid.length,
      batchId:str_(p.batchId,80),lines:plan.valid.map(function(x){return x.line;}).slice(0,40)
    },requestId);}catch(e){console.error('Audit failed',e);}
  }
  return {added:values.length,duplicate:plan.duplicate.length,invalid:plan.invalid.length,
    issues:plan.duplicate.concat(plan.invalid).slice(0,40)};
});}

function overview_(user,p){
  var year=str_(p.year,4),truong=str_(p.truong,80),nghe=str_(p.nghe,80);
  return cached_('OVERVIEW',[version_('DATA'),user.TAI_KHOAN_ID,user.EMAIL,user.VAI_TRO,year,truong,nghe],90,function(){
    var all=filteredRecords_({year:year,truong:truong,nghe:nghe},user);
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
function exportRecords_(user,p){
  var all=filteredRecords_(p,user);must_(all.length<=5000,'EXPORT_TOO_LARGE','Tối đa 5.000 hồ sơ cho mỗi lần xuất. Hãy thu hẹp bộ lọc.');
  var schools={},trades={};catalogRows_('truong').forEach(function(x){schools[x.TRUONG_ID]=x.TEN_TRUONG;});catalogRows_('nghe').forEach(function(x){trades[x.NGHE_ID]=x.TEN_NGHE;});
  return {columns:['STT', 'Họ và tên', 'Năm sinh', 'Giới tính', 'Số sổ BHXH', 'Số QĐ HTHN', 'Ngày ban hành QĐHN', 'Số QĐ TCTN', 'Ngày ban hành QĐ TCTN', 'Nghề đăng ký', 'Số tháng hỗ trợ', 'Mức hỗ trợ/tháng', 'Thời gian đào tạo - Từ ngày', 'Thời gian đào tạo - Đến ngày', 'Cơ sở đào tạo nghề', 'Ngày kết thúc hưởng TCTN', 'Ngày kết thúc hỗ trợ học nghề', 'Địa chỉ tạm trú', 'Địa chỉ thường trú', 'Số CMND', 'Ngày cấp CMND', 'Nơi cấp CMND', 'Địa chỉ cơ sở đào tạo', 'Chi nhánh BHTN', 'Điện thoại'],items:all.map(function(x,i){return [i+1,x.HO_TEN,x.NGAY_SINH,x.GIOI_TINH,x.SO_SO_BHXH,x.SO_QUYET_DINH,x.NGAY_QUYET_DINH,x.SO_QD_TCTN,x.NGAY_QD_TCTN,trades[x.NGHE_ID]||x.NGHE_ID,x.SO_THANG_HO_TRO,x.MUC_HO_TRO_THANG,x.NGAY_BAT_DAU,x.NGAY_KET_THUC_DU_KIEN,schools[x.TRUONG_ID]||x.TRUONG_ID,x.NGAY_KET_THUC_TCTN,x.NGAY_KET_THUC_HO_TRO,x.DIA_CHI_TAM_TRU,x.DIA_CHI_THUONG_TRU,x.SO_CMND,x.NGAY_CAP_CMND,x.NOI_CAP_CMND,x.DIA_CHI_CO_SO,x.CHI_NHANH_BHTN,x.DIEN_THOAI];})};
}
function catalogSave_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var type=str_(p.type,20),def=APP.catalog[type];must_(Boolean(def),'BAD_REQUEST','Không có danh mục này.');
  var id=str_(p.id,60),list=sheetRows_(def.sheet),idx=id?indexOfRow_(list,def.id,id):-1;
  if(id&&idx<0)throw err_('NOT_FOUND','Danh mục không tồn tại.');
  var old=idx>=0?list[idx]:null;
  if(old)must_(old.TRANG_THAI!=='DELETED','NOT_FOUND','Danh mục đã được xóa.');
  var code=str_(p.code,60).toUpperCase(),title=str_(p.title,250),state=str_(p.status,15)||'ACTIVE';
  if(old && !code) code=old[def.code];
   if(old)must_(code===old[def.code],'VALIDATION','Không được thay đổi mã đã được cấp.');
   if(!old && !code)code=nextCatalogCode_(type,list);
   must_(/^[A-Z0-9_-]{2,60}$/.test(code),'VALIDATION','Mã danh mục từ 2 đến 60 ký tự A-Z, 0-9, _ hoặc -.');
  must_(title.length>=2,'VALIDATION','Tên danh mục tối thiểu 2 ký tự.');
  must_(['ACTIVE','INACTIVE'].indexOf(state)>=0,'VALIDATION','Trạng thái danh mục không hợp lệ.');
  must_(!list.some(function(x){return x.TRANG_THAI!=='DELETED'&&x[def.id]!==id&&(x[def.code]===code||norm_(x[def.title])===norm_(title));}),'DUPLICATE','Trùng mã hoặc tên danh mục.');
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

/** Xóa mềm danh mục chưa từng liên kết hồ sơ. Dữ liệu lịch sử và mã được giữ nguyên. */
function catalogDelete_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var type=str_(p.type,20),def=APP.catalog[type];must_(Boolean(def),'VALIDATION','Danh mục chưa hợp lệ.');
  var id=str_(p.id,80),list=sheetRows_(def.sheet),index=indexOfRow_(list,def.id,id);
  must_(index>=0,'NOT_FOUND','Không tìm thấy danh mục.');var item=list[index];
  must_(item.TRANG_THAI!=='DELETED','ALREADY_DELETED','Danh mục này đã được xóa.');
  var referenced=sheetRows_('HO_SO_HOC_NGHE').some(function(r){return r[{truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_BO_HOC_ID'}[type]]===id;});
  must_(!referenced,'CATALOG_IN_USE','Danh mục đã được sử dụng trong hồ sơ. Vui lòng chọn Ngừng sử dụng.');
  item.TRANG_THAI='DELETED';item.CAP_NHAT_LUC=now_();
  writeRecord_(def.sheet,findRowNumber_(def.sheet,def.id,id),item);bump_('CAT');
  try{audit_(user,'XOA_MEM_DANH_MUC',type,id,{ma:item[def.code],ten:item[def.title]},requestId);}catch(e){console.error('Audit error',e);}
  return {deleted:true,id:id};
});}

function accountsList_(){return {items:sheetRows_('TAI_KHOAN').filter(function(u){return u.TRANG_THAI!=='DELETED';}).map(safeUser_)};}
function accountSave_(admin,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.id,60),email=str_(p.email,200).toLowerCase(),role=str_(p.role,20),status=str_(p.status,10);
  must_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'VALIDATION','Email không hợp lệ.');
  must_(['ADMIN','NHAN_VIEN'].indexOf(role)>=0,'VALIDATION','Vai trò không hợp lệ.');
  must_(['ACTIVE','DISABLED'].indexOf(status)>=0,'VALIDATION','Trạng thái tài khoản không hợp lệ.');
  var rights=['RECORD_VIEW','RECORD_CREATE','RECORD_EDIT','RECORD_DELETE','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','FILE_UPLOAD'];
  var all=sheetRows_('TAI_KHOAN'),ix=id?indexOfRow_(all,'TAI_KHOAN_ID',id):-1,old=ix>=0?all[ix]:null;
  if(id&&!old)throw err_('NOT_FOUND','Tài khoản không tồn tại.');
  if(old)must_(old.TRANG_THAI!=='DELETED','NOT_FOUND','Tài khoản đã được xóa.');
  must_(!all.some(function(u){return u.TRANG_THAI!=='DELETED'&&u.EMAIL.toLowerCase()===email&&u.TAI_KHOAN_ID!==id;}),'DUPLICATE','Email đã được cấp quyền.');
  var newAccounts=all.filter(function(u){return u.TAI_KHOAN_ID!==id;}).concat([{VAI_TRO:role,TRANG_THAI:status}]);
  must_(newAccounts.some(function(u){return u.VAI_TRO==='ADMIN'&&u.TRANG_THAI==='ACTIVE';}),'VALIDATION','Hệ thống phải có ít nhất một Admin đang hoạt động.');
  // Tài khoản thay email thì định danh Google phải reset có chủ đích, thay đổi được ghi audit.
  var item=Object.assign({},old||{}, {TAI_KHOAN_ID:old?old.TAI_KHOAN_ID:randomId_('TK'),EMAIL:email,HO_TEN:str_(p.name,150),VAI_TRO:role,QUYEN:role==='ADMIN'?'*':rights.join(','),TRANG_THAI:status,GOOGLE_SUB:old&&old.EMAIL.toLowerCase()===email?old.GOOGLE_SUB:'',TAO_LUC:old?old.TAO_LUC:now_(),TAO_BOI:old?old.TAO_BOI:admin.EMAIL,CAP_NHAT_LUC:now_(),CAP_NHAT_BOI:admin.EMAIL,DANG_NHAP_CUOI:old?old.DANG_NHAP_CUOI:''});
  if(old)writeRecord_('TAI_KHOAN',findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',id),item);else appendRecord_('TAI_KHOAN',item);
  bump_('USERS');
  try{audit_(admin,old?'SUA_TAI_KHOAN':'TAO_TAI_KHOAN','TAI_KHOAN',item.TAI_KHOAN_ID,{email:email,role:role,status:status},requestId);}catch(e){console.error('Audit failed',e);}
  return {item:safeUser_(item)};
});}

/** Xóa mềm tài khoản, giữ người tạo và mọi lịch sử hồ sơ. */
function accountDelete_(admin,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.id,80),all=sheetRows_('TAI_KHOAN'),index=indexOfRow_(all,'TAI_KHOAN_ID',id);
  must_(index>=0,'NOT_FOUND','Không tìm thấy tài khoản.');var item=all[index];
  must_(item.TRANG_THAI!=='DELETED','ALREADY_DELETED','Tài khoản đã được xóa trước đó.');
  must_(item.TAI_KHOAN_ID!==admin.TAI_KHOAN_ID,'CANNOT_DELETE_SELF','Không thể xóa tài khoản đang đăng nhập.');
  var activeAdmins=all.filter(function(u){return u.VAI_TRO==='ADMIN'&&u.TRANG_THAI==='ACTIVE';});
  must_(item.VAI_TRO!=='ADMIN'||item.TRANG_THAI!=='ACTIVE'||activeAdmins.length>1,'LAST_ADMIN','Phải có ít nhất một Quản trị viên đang hoạt động.');
  item.TRANG_THAI='DELETED';item.CAP_NHAT_LUC=now_();item.CAP_NHAT_BOI=admin.EMAIL;
  writeRecord_('TAI_KHOAN',findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',id),item);bump_('USERS');
  try{audit_(admin,'XOA_MEM_TAI_KHOAN','TAI_KHOAN',id,{email:item.EMAIL},requestId);}catch(e){console.error('Audit error',e);}
  return {deleted:true,id:id};
});}

function listAudit_(p){var page=Math.min(Math.max(Number(p.page)||1,1),10000),size=30,all=sheetRows_('NHAT_KY').reverse();return {items:all.slice((page-1)*size,page*size),total:all.length,page:page,pageSize:size};}
function findRecord_(id){var rows=sheetRows_('HO_SO_HOC_NGHE'),i=indexOfRow_(rows,'HO_SO_ID',id);must_(i>=0,'NOT_FOUND','Không tìm thấy hồ sơ.');must_(rows[i].TRANG_THAI_HO_SO!=='DELETED','NOT_FOUND','Hồ sơ đã được xóa.');return rows[i];}
function findRecordForUser_(user,id){return requireRecordOwner_(user,findRecord_(id));}
function folder_(){var id=cfg_().getProperty('DRIVE_FOLDER_ID');must_(Boolean(id),'SERVER_NOT_CONFIGURED','Thiếu DRIVE_FOLDER_ID.');return DriveApp.getFolderById(id);}
function fileUpload_(user,p,requestId){throw err_('USE_CHUNK_UPLOAD','Vui lòng tải lại trang và sử dụng chức năng đính kèm mới.');}
function fileGet_(user,p){var id=str_(p.HO_SO_ID,60),record=findRecordForUser_(user,id);must_(Boolean(record.TEP_DRIVE_ID),'NOT_FOUND','Hồ sơ không có tệp đính kèm.');var file=DriveApp.getFileById(record.TEP_DRIVE_ID),blob=file.getBlob();must_(blob.getBytes().length<=1200000,'FILE_TOO_LARGE','Tệp vượt giới hạn tải xuống qua ứng dụng.');return {name:file.getName(),mime:blob.getContentType(),base64:Utilities.base64Encode(blob.getBytes())};}
function fileRemove_(user,p,requestId){return dedupeWrite_(requestId,function(){
  must_(user._has('RECORD_EDIT')||user._has('FILE_UPLOAD'),'NO_PERMISSION','Không có quyền xóa tệp.');
  var id=str_(p.HO_SO_ID,60),r=findRecordForUser_(user,id);must_(Number(p.PHIEN_BAN)===Number(r.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã thay đổi.');
  var oldFile=r.TEP_DRIVE_ID;must_(Boolean(oldFile),'NOT_FOUND','Không có tệp.');r.TEP_DRIVE_ID='';r.PHIEN_BAN=String(Number(r.PHIEN_BAN)+1);r.CAP_NHAT_LUC=now_();r.CAP_NHAT_BOI=user.EMAIL;
  writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),r);bump_('DATA');
  try{DriveApp.getFileById(oldFile).setTrashed(true);}catch(e){console.error('File cleanup',e);}
  try{audit_(user,'GO_TEP','HO_SO',id,{removed:true},requestId);}catch(e){console.error('Audit failed',e);}
  return {record:safeRecord_(r)};
});}



/** Xóa mềm; nhân viên chỉ xóa hồ sơ do chính mình tạo và phải có quyền Xóa. */
function deleteRecord_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.HO_SO_ID,80),rows=sheetRows_('HO_SO_HOC_NGHE'),ix=indexOfRow_(rows,'HO_SO_ID',id);
  must_(ix>=0,'NOT_FOUND','Không tìm thấy hồ sơ.');
  var r=requireRecordOwner_(user,rows[ix]); must_(r.TRANG_THAI_HO_SO!=='DELETED','ALREADY_DELETED','Hồ sơ này đã được xóa trước đó.');
  must_(user._has('RECORD_DELETE'),'NO_PERMISSION','Bạn chưa được cấp quyền xóa hồ sơ.');
  if(user.VAI_TRO!=='ADMIN'){
    must_(Boolean(r.TAO_BOI) && norm_(r.TAO_BOI)===norm_(user.EMAIL),'NOT_OWNER','Bạn chỉ được xóa hồ sơ do chính mình tạo.');
  }
  must_(Number(p.PHIEN_BAN)===Number(r.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã được cập nhật ở nơi khác.');
  r.TRANG_THAI_HO_SO='DELETED';r.PHIEN_BAN=String(Number(r.PHIEN_BAN)+1);
  r.CAP_NHAT_LUC=now_();r.CAP_NHAT_BOI=user.EMAIL;
  writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id),r);
  bump_('DATA');
  try{audit_(user,'XOA_MEM_HO_SO','HO_SO',id,{so:r.SO_QUYET_DINH,nam:r.NAM_QUYET_DINH,nguoiTao:r.TAO_BOI},requestId);}catch(e){console.error('Audit delete failed',e);}
  return {HO_SO_ID:id,TRANG_THAI_HO_SO:'DELETED'};
});}

function nextCatalogCode_(type,list){
  var prefix={truong:'CS',nghe:'NG',lydo:'LD'}[type],field=APP.catalog[type].code,num=0,used={};
  list.forEach(function(r){var code=String(r[field]||'').toUpperCase();used[code]=true;
    var m=new RegExp('^'+prefix+'([0-9]+)$').exec(code);
    if(m)num=Math.max(num,Number(m[1]));
  });
  var code;do{num++;code=prefix+String(num).padStart(5,'0');}while(used[code]);return code;
}
/** Kiểm tra sơ bộ; khi nhập luôn kiểm tra lại trên máy chủ trong khóa ghi. */
function catalogBulkPlan_(p){
  var type=str_(p.type,20),def=APP.catalog[type];must_(Boolean(def),'VALIDATION','Loại danh mục chưa hợp lệ.');
  var values=Array.isArray(p.rows)?p.rows:(Array.isArray(p.names)?p.names.map(function(v){return {title:v};}):null);
  must_(Array.isArray(values)&&values.length>0&&values.length<=2000,'VALIDATION','Mỗi lượt kiểm tra hỗ trợ tối đa 2.000 mục.');
  var existing=sheetRows_(def.sheet),seen={};
  existing.forEach(function(r){if(r.TRANG_THAI!=='DELETED')seen[norm_(r[def.title])]='EXISTING';});
  var valid=[],duplicates=[],invalid=[];
  values.forEach(function(value,i){
    var v=value && typeof value==='object' && !Array.isArray(value)?value:{title:value};
    var row={title:str_(v.title,251),shortName:str_(v.shortName,101),address:str_(v.address,301),note:str_(v.note,401),order:String(v.order===undefined||v.order===null?'':v.order).trim()};
    var key=norm_(row.title),bad=row.title.length<2||row.title.length>250||/^[=+@]/.test(row.title)||
      row.shortName.length>100||row.address.length>300||row.note.length>400||
      (type!=='truong'&&row.order!==''&&!/^(0|[1-9][0-9]{0,4})$/.test(row.order));
    if(bad)invalid.push({line:i+2,title:row.title.slice(0,80)});
    else if(seen[key])duplicates.push({line:i+2,title:row.title.slice(0,80)});
    else{seen[key]='NEW';valid.push(row);}
  });
  return {type:type,valid:valid,duplicates:duplicates,invalid:invalid};
}
function catalogBulkCheck_(p){var plan=catalogBulkPlan_(p);return {valid:plan.valid.length,duplicate:plan.duplicates.length,invalid:plan.invalid.length,duplicates:plan.duplicates.slice(0,25),invalidItems:plan.invalid.slice(0,25)};}
function catalogBulkImport_(user,p,requestId){return dedupeWrite_(requestId,function(){
  var values=Array.isArray(p.rows)?p.rows:p.names;
  must_(Array.isArray(values)&&values.length<=100,'VALIDATION','Mỗi lần lưu tối đa 100 mục.');
  var plan=catalogBulkPlan_(p);must_(plan.invalid.length===0,'VALIDATION','Danh sách có dữ liệu không hợp lệ. Vui lòng kiểm tra trước khi nhập.');
  var type=plan.type,def=APP.catalog[type],list=sheetRows_(def.sheet),added=0,now=now_(),prefix={truong:'CS',nghe:'NG',lydo:'LD'}[type],used={},num=0;
  list.forEach(function(r){var code=String(r[def.code]||'').toUpperCase();used[code]=true;var m=new RegExp('^'+prefix+'([0-9]+)$').exec(code);if(m)num=Math.max(num,Number(m[1]));});
  var seen={};list.forEach(function(r){if(r.TRANG_THAI!=='DELETED')seen[norm_(r[def.title])]=true;});
  var rows=[];
  plan.valid.forEach(function(row){if(seen[norm_(row.title)])return;seen[norm_(row.title)]=true;
    var code;do{num++;code=prefix+String(num).padStart(5,'0');}while(used[code]);used[code]=true;
    var item={TRANG_THAI:'ACTIVE',TAO_LUC:now,CAP_NHAT_LUC:now,THU_TU:row.order||String(list.length+rows.length+1),GHI_CHU:row.note};
    item[def.id]=randomId_(type.toUpperCase());item[def.code]=code;item[def.title]=row.title;
    if(type==='truong'){item.TEN_VIET_TAT=row.shortName;item.DIA_CHI=row.address;}
    rows.push(APP.lists[def.sheet].map(function(k){return safeSheetCell_(item[k]);}));
  });
  if(rows.length){var sh=getSheet_(def.sheet);sh.getRange(sh.getLastRow()+1,1,rows.length,APP.lists[def.sheet].length).setValues(rows);bump_('CAT');added=rows.length;
    try{audit_(user,'NHAP_DANH_MUC_HANG_LOAT',type,'NHAP_WEB',{them:added,trung:plan.duplicates.length},requestId);}catch(e){console.error('Catalog audit failed',e);}
  }
  return {added:added,skipped:plan.duplicates.length,errors:0};
});}

/** Google Drive resumable upload. Mỗi phần đúng 256 KiB, riêng phần cuối có thể nhỏ hơn. */
function uploadProp_(id){return 'UPLOAD_'+id;}
function loadUpload_(id,user){
  must_(/^[A-Za-z0-9_-]{12,80}$/.test(String(id||'')),'BAD_REQUEST','Mã lượt tải không hợp lệ.');
  var raw=cfg_().getProperty(uploadProp_(id));must_(Boolean(raw),'NOT_FOUND','Lượt tải không còn hiệu lực. Vui lòng chọn lại tệp.');
  var m=JSON.parse(raw);must_(m.owner===user._googleSub,'NOT_AUTHORIZED','Không được tiếp tục tải tệp của tài khoản khác.');
  must_(Date.now()<m.exp,'UPLOAD_EXPIRED','Lượt tải đã hết hạn. Vui lòng chọn lại tệp.');return m;
}
function fileUploadBegin_(user,p){
  var record=findRecordForUser_(user,str_(p.HO_SO_ID,70));
  must_(user._has('FILE_UPLOAD'),'NO_PERMISSION','Bạn không có quyền tải tệp.');
  must_(Number(p.PHIEN_BAN)===Number(record.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã thay đổi. Vui lòng tải lại.');
  var size=Number(p.size),name=str_(p.name,130).replace(/[\\/<>:"|?*\x00-\x1f]/g,'_'),mime=str_(p.mime,100);
  must_(Number.isSafeInteger(size)&&size>0&&size<=APP.maxFileBytes,'FILE_TOO_LARGE','Tệp phải có dung lượng không quá 10 MB.');
  must_(['application/pdf','image/jpeg','image/png'].indexOf(mime)>=0,'VALIDATION','Chỉ chấp nhận PDF, JPG hoặc PNG.');
  must_((mime==='application/pdf'&&/\.pdf$/i.test(name))||(mime==='image/png'&&/\.png$/i.test(name))||(mime==='image/jpeg'&&/\.(jpg|jpeg)$/i.test(name)),'VALIDATION','Tên và định dạng tệp không khớp.');
  var token=ScriptApp.getOAuthToken(),url='https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',metadata={name:name,parents:[folder_().getId()],description:'Tệp đính kèm hồ sơ học nghề'};
  var response=UrlFetchApp.fetch(url,{method:'post',headers:{Authorization:'Bearer '+token,'X-Upload-Content-Type':mime,'X-Upload-Content-Length':String(size)},contentType:'application/json',payload:JSON.stringify(metadata),muteHttpExceptions:true,followRedirects:false});
  must_(response.getResponseCode()===200,'UPLOAD_UNAVAILABLE','Chưa thể bắt đầu tải tệp. Vui lòng thử lại.');
  var session=response.getHeaders().Location||response.getHeaders().location;
  must_(typeof session==='string' && /^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files[?]/.test(session),'UPLOAD_UNAVAILABLE','Chưa thể khởi tạo lượt tải.');
  var id=Utilities.getUuid().replace(/-/g,''),meta={owner:user._googleSub,recordId:record.HO_SO_ID,version:record.PHIEN_BAN,name:name,mime:mime,size:size,offset:0,session:session,exp:Date.now()+3600000};
  cfg_().setProperty(uploadProp_(id),JSON.stringify(meta));
  return {uploadId:id,chunkBytes:APP.chunkBytes,size:size};
}
function fileUploadChunk_(user,p){
  must_(user._has('FILE_UPLOAD'),'NO_PERMISSION','Bạn không có quyền tải tệp.');
  var id=str_(p.uploadId,80),m=loadUpload_(id,user);
  if(m.finished)return m.result;
  var offset=Number(p.offset);must_(Number.isSafeInteger(offset) && offset===m.offset,'UPLOAD_OFFSET','Tệp đã được tải đến vị trí khác. Hãy thử lại thao tác.');
  var b64=str_(p.base64,360000),bytes=Utilities.base64Decode(b64);
  must_(bytes.length>0 && bytes.length<=APP.chunkBytes && offset+bytes.length<=m.size,'VALIDATION','Phần dữ liệu tệp không hợp lệ.');
  must_(bytes.length===APP.chunkBytes || offset+bytes.length===m.size,'VALIDATION','Dung lượng phần tải chưa hợp lệ.');
  // Kiểm tra chữ ký định dạng ngay tại các byte đầu tiên của tệp.
  if(offset===0){
    var valid=m.mime==='application/pdf'?bytes.length>=5&&bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45:
      m.mime==='image/png'?bytes.length>=8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:
      bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    must_(valid,'VALIDATION','Nội dung tệp không đúng định dạng đã chọn.');
  }
  var reply=UrlFetchApp.fetch(m.session,{method:'put',headers:{'Content-Range':'bytes '+offset+'-'+(offset+bytes.length-1)+'/'+m.size,'Content-Type':m.mime},payload:bytes,muteHttpExceptions:true,followRedirects:false});
  var status=reply.getResponseCode();
  must_(status===308||status===200||status===201,'UPLOAD_UNAVAILABLE','Tải tệp bị gián đoạn. Vui lòng thử lại.');
  if(status===308){
    var h=reply.getHeaders(),range=h.Range||h.range||'',last=/bytes=0-([0-9]+)/.exec(range);
    must_(Boolean(last)&&Number(last[1])+1===offset+bytes.length,'UPLOAD_OFFSET','Không xác nhận được phần tệp đã tải.');
    m.offset=offset+bytes.length;cfg_().setProperty(uploadProp_(id),JSON.stringify(m));
    return {uploaded:m.offset,total:m.size,finished:false};
  }
  var driveResult;try{driveResult=JSON.parse(reply.getContentText());}catch(e){throw err_('UPLOAD_UNAVAILABLE','Không xác nhận được tệp đã tải.');}
  must_(Boolean(driveResult.id) && offset+bytes.length===m.size,'UPLOAD_UNAVAILABLE','Tệp chưa được tải đủ.');
  must_(DriveApp.getFileById(driveResult.id).getSize()===m.size,'UPLOAD_UNAVAILABLE','Dung lượng tệp lưu chưa khớp.');
  var r=findRecordForUser_(user,m.recordId);
  if(Number(r.PHIEN_BAN)!==Number(m.version)){
    try{DriveApp.getFileById(driveResult.id).setTrashed(true);}catch(e){console.error('Orphan cleanup failed',e);}
    cfg_().deleteProperty(uploadProp_(id));throw err_('VERSION_CONFLICT','Hồ sơ đã thay đổi trong khi tải tệp. Vui lòng tải lại hồ sơ.');
  }
  var oldFile=r.TEP_DRIVE_ID;
  r.TEP_DRIVE_ID=driveResult.id;r.PHIEN_BAN=String(Number(r.PHIEN_BAN)+1);r.CAP_NHAT_LUC=now_();r.CAP_NHAT_BOI=user.EMAIL;
  try{writeRecord_('HO_SO_HOC_NGHE',findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',r.HO_SO_ID),r);}catch(e){try{DriveApp.getFileById(driveResult.id).setTrashed(true);}catch(x){}throw e;}
  bump_('DATA');
  if(oldFile)try{DriveApp.getFileById(oldFile).setTrashed(true);}catch(e){console.error('Old file cleanup',e);}
  try{audit_(user,'DINH_KEM_TEP','HO_SO',r.HO_SO_ID,{tenTapTin:m.name,bytes:m.size},id);}catch(e){console.error('Upload audit failed',e);}
  m.offset=m.size;m.finished=true;m.result={uploaded:m.size,total:m.size,finished:true,record:safeRecord_(r)};delete m.session;
  cfg_().setProperty(uploadProp_(id),JSON.stringify(m));return m.result;
}
function fileUploadCancel_(user,p){
  var id=str_(p.uploadId,80),m=loadUpload_(id,user);
  if(!m.finished)cfg_().deleteProperty(uploadProp_(id));
  return {cancelled:true};
}
function fileInfo_(user,p){var r=findRecordForUser_(user,str_(p.HO_SO_ID,80));must_(Boolean(r.TEP_DRIVE_ID),'NOT_FOUND','Hồ sơ chưa có tệp đính kèm.');var f=DriveApp.getFileById(r.TEP_DRIVE_ID),size=f.getSize();
  must_(size>0&&size<=APP.maxFileBytes,'FILE_TOO_LARGE','Tệp có dung lượng vượt giới hạn.');
  var filename=f.getName();if(filename.indexOf(r.HO_SO_ID+'_')===0)filename=filename.slice(r.HO_SO_ID.length+1);return {name:filename,size:size,mime:f.getMimeType(),chunkBytes:APP.chunkBytes};
}
function fileChunk_(user,p){
  var r=findRecordForUser_(user,str_(p.HO_SO_ID,80));must_(Boolean(r.TEP_DRIVE_ID),'NOT_FOUND','Hồ sơ chưa có tệp.');
  var f=DriveApp.getFileById(r.TEP_DRIVE_ID),size=f.getSize(),offset=Number(p.offset);
  must_(Number.isSafeInteger(offset)&&offset>=0&&offset<size&&size<=APP.maxFileBytes,'VALIDATION','Vị trí tải tệp không hợp lệ.');
  var end=Math.min(offset+APP.chunkBytes,size)-1;
  var url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(r.TEP_DRIVE_ID)+'?alt=media';
  var res=UrlFetchApp.fetch(url,{method:'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken(),Range:'bytes='+offset+'-'+end},muteHttpExceptions:true});
  must_(res.getResponseCode()===206,'DOWNLOAD_UNAVAILABLE','Chưa thể tải tệp. Vui lòng thử lại.');
  var bytes=res.getContent();must_(bytes.length===end-offset+1,'DOWNLOAD_UNAVAILABLE','Dữ liệu tải về chưa đầy đủ.');
  return {offset:offset,size:size,base64:Utilities.base64Encode(bytes)};
}
/**
 * VIET HOA – NHAP DANH MUC HANG LOAT (v1.1.0-RC)
 * Hướng dẫn nhập: DÁN GIÁ TRỊ tên danh mục tại cột C, từ hàng 2.
 * Cơ sở: cột C là Tên cơ sở; có thể dán thêm D Tên viết tắt, E Địa chỉ.
 * Nghề: cột C là Tên nghề. Lý do: cột C là Nội dung lý do bỏ học.
 * Tuyệt đối không xóa/đổi vị trí cột A (ID) hoặc B (Mã).
 * Hai hàm sau chỉ cho chủ sở hữu chạy TRỰC TIẾP từ Apps Script Editor;
 * không xuất hiện dưới dạng public API/doPost.
 */
var NHAP_DM_TYPES_ = [
  {type:'truong',idPrefix:'COSO',codePrefix:'CS',codeColumn:2,titleColumn:3,statusColumn:6,noteColumn:7,createdColumn:8,updatedColumn:9,orderColumn:0},
  {type:'nghe',idPrefix:'NGHE',codePrefix:'NG',codeColumn:2,titleColumn:3,statusColumn:4,noteColumn:6,createdColumn:7,updatedColumn:8,orderColumn:5},
  {type:'lydo',idPrefix:'LYDO',codePrefix:'LD',codeColumn:2,titleColumn:3,statusColumn:4,noteColumn:6,createdColumn:7,updatedColumn:8,orderColumn:5}
];

/** Hàm đọc thử, TUYỆT ĐỐI KHÔNG ghi dữ liệu. */
function kiemTraDanhMucTuSheet() {
  var report = keHoachNhapDanhMuc_();
  var message = thongBaoNhapDanhMuc_(report, false);
  console.log(message);
  return message;
}

/** Nhập hàng loạt, kiểm tra toàn bộ + sao lưu Google Sheets TRƯỚC KHI ghi. */
function dongBoDanhMucTuSheet() {
  var lock = LockService.getScriptLock();
  must_(lock.tryLock(30000), 'BUSY', 'Dữ liệu đang được cập nhật, vui lòng thử lại sau.');
  try {
    var report=keHoachNhapDanhMuc_();
    var changed=report.plans.some(function(p){return p.changedRows.length>0;});
    if(!changed) {
      // Tối ưu hiển thị: cột A/B là khóa kỹ thuật, không xóa khỏi cơ sở dữ liệu.
      report.plans.forEach(function(p){anCotKyThuatDanhMuc_(p.sheet,p.def);});
      var noChange='Danh mục đã đầy đủ mã và trạng thái. Không phát sinh bản ghi mới hoặc sao lưu.';
      console.log(noChange);
      return noChange;
    }
    var ss=getSpreadsheet_();
    var filename='SAO_LUU_TRUOC_NHAP_DANH_MUC_HOC_NGHE_'+Utilities.formatDate(new Date(),APP.tz,'yyyyMMdd_HHmmss');
    var backup=DriveApp.getFileById(ss.getId()).makeCopy(filename);
    console.log('Đã sao lưu bảng tính trước khi ghi: '+backup.getUrl());
    report.plans.forEach(function(p){
      var updated=p.rows;
      // Gom các hàng liền nhau thành một lượt ghi, không đụng đến hàng không thay đổi.
      var groups=nhomHangLienTiep_(p.changedRows);
      groups.forEach(function(g){
        p.sheet.getRange(g.start+2,1,g.count,p.schema.length).setValues(updated.slice(g.start,g.start+g.count));
      });
    });
    // Làm mới cache Apps Script: các bản danh mục được đọc bằng REV_CAT.
    bump_('CAT');
    report.plans.forEach(function(p){anCotKyThuatDanhMuc_(p.sheet,p.def);});
    // Ghi nhật ký tổng hợp thay vì log mọi dòng để giảm số lượt ghi và không lặp dữ liệu người học.
    report.plans.forEach(function(p){
      if(!p.changedRows.length)return;
      appendRecord_('NHAT_KY',{
        NHAT_KY_ID:randomId_('LOG'),THOI_GIAN:now_(),TAI_KHOAN_ID:'APPS_SCRIPT',
        EMAIL:Session.getEffectiveUser().getEmail()||'NGUOI_QUAN_TRI_SHEET',
        HANH_DONG:'NHAP_DANH_MUC_HANG_LOAT',LOAI_DOI_TUONG:p.def.type,
        BAN_GHI_ID:'NHAP_SHEET',
        NOI_DUNG_THAY_DOI:JSON.stringify({soDong:p.changedRows.length,soDongMoi:p.created}),
        KET_QUA:'THANH_CONG',REQUEST_ID:randomId_('IMPORT')
      });
    });
    var message=thongBaoNhapDanhMuc_(report, true)+'\nBản sao lưu: '+backup.getUrl()+'\nTrên website: đăng xuất, đăng nhập lại để nạp danh mục mới.';
    console.log(message);
    return message;
  } finally {lock.releaseLock();}
}

/** Kiểm tra hoàn chỉnh ba tab trước khi ghi, không bỏ qua dòng có tên nhưng thiếu ID. */
function keHoachNhapDanhMuc_() {
  var plans=[];
  NHAP_DM_TYPES_.forEach(function(def){
    var cat=APP.catalog[def.type], sh=getSheet_(cat.sheet), schema=APP.lists[cat.sheet];
    var n=sh.getLastRow(), header=sh.getRange(1,1,1,schema.length).getDisplayValues()[0];
    must_(header.join('\u001f')===APP.headersVi[cat.sheet].join('\u001f'),'SCHEMA_MISMATCH',
      'Tiêu đề tab '+sh.getName()+' không đúng cấu trúc Việt hóa. Không nhập dữ liệu.');
    var rows=n<2?[]:sh.getRange(2,1,n-1,schema.length).getDisplayValues();
    var seenTitles={},seenCodes={},seenIds={},changedRows=[],created=0;
    var currentNum=0;
    // Quét mã tồn tại trước khi phát sinh mã mới (không phụ thuộc thứ tự dòng).
    rows.forEach(function(row,i){
      var code=String(row[1]||'').trim().toUpperCase();
      var hit=new RegExp('^'+def.codePrefix+'([0-9]+)$').exec(code);
      if(hit)currentNum=Math.max(currentNum,Number(hit[1]));
    });
    rows.forEach(function(row,i){
      var newRow=row.slice();
      var id=String(newRow[0]||'').trim(),code=String(newRow[1]||'').trim().toUpperCase();
      var title=String(newRow[2]||'').trim();
      var hasData=newRow.some(function(v){return String(v||'').trim()!=='';});
      if(!hasData)return;
      must_(title.length>=2&&title.length<=250,'VALIDATION',
        'Tab '+sh.getName()+', hàng '+(i+2)+': cần tên danh mục từ 2 đến 250 ký tự tại cột C.');
      // Tên lấy từ sheet người dùng; chống việc ghi công thức ẩn trong ô tên danh mục.
      must_(!/^[=+@]/.test(title),'VALIDATION',
        'Tab '+sh.getName()+', hàng '+(i+2)+': tên không được bắt đầu bằng ký tự công thức.');
      var titleKey=norm_(title);
      must_(!seenTitles[titleKey],'DUPLICATE',
        'Tab '+sh.getName()+': tên danh mục bị trùng ở hàng '+seenTitles[titleKey]+' và '+(i+2)+': '+title);
      seenTitles[titleKey]=i+2;
      if(id){
        must_(!seenIds[id],'DUPLICATE','Tab '+sh.getName()+': trùng mã định danh ở hàng '+seenIds[id]+' và '+(i+2));
        seenIds[id]=i+2;
      }
      if(code){
        if(old && !code) code=old[def.code];
   if(old)must_(code===old[def.code],'VALIDATION','Không được thay đổi mã đã được cấp.');
   if(!old && !code)code=nextCatalogCode_(type,list);
   must_(/^[A-Z0-9_-]{2,60}$/.test(code),'VALIDATION',
          'Tab '+sh.getName()+', hàng '+(i+2)+': mã danh mục chỉ gồm A-Z, 0-9, _ hoặc - (2-60 ký tự).');
        must_(!seenCodes[code],'DUPLICATE',
          'Tab '+sh.getName()+': mã danh mục bị trùng ở hàng '+seenCodes[code]+' và '+(i+2));
        seenCodes[code]=i+2;
      }
      // Chỉ coi là bản ghi mới khi chưa có ID; tuyệt đối giữ các ID đã cấp trước.
      if(!id){
        newRow[0]=randomId_(def.idPrefix);
        created++;
      }
      if(!code){
        do{currentNum++;code=def.codePrefix+String(currentNum).padStart(5,'0');}while(seenCodes[code]);
        newRow[1]=code;
        seenCodes[code]=i+2;
      }
      var stateRaw=String(newRow[def.statusColumn-1]||'').trim();
      var normal=norm_(stateRaw);
      var state='';
      if(!stateRaw || normal==='dang su dung'||normal==='hoat dong')state='ACTIVE';
      else if(normal==='ngung su dung'||normal==='ngung hoat dong')state='INACTIVE';
      else state=stateRaw.toUpperCase();
      must_(state==='ACTIVE'||state==='INACTIVE','VALIDATION',
        'Tab '+sh.getName()+', hàng '+(i+2)+': trạng thái phải là ACTIVE hoặc INACTIVE.');
      newRow[def.statusColumn-1]=state;
      if(def.orderColumn && !String(newRow[def.orderColumn-1]||'').trim())newRow[def.orderColumn-1]=String(i+1);
      if(!String(newRow[def.createdColumn-1]||'').trim())newRow[def.createdColumn-1]=now_();
      if(newRow.join('\u001f')!==row.join('\u001f')){
        newRow[def.updatedColumn-1]=now_();
        changedRows.push(i);
      }
      rows[i]=newRow;
    });
    plans.push({sheet:sh,def:def,schema:schema,rows:rows,changedRows:changedRows,created:created});
  });
  return {plans:plans};
}

function nhomHangLienTiep_(indexes){
  if(!indexes.length)return [];
  var groups=[],start=indexes[0],end=start;
  for(var i=1;i<indexes.length;i++){
    if(indexes[i]===end+1){end=indexes[i];continue;}
    groups.push({start:start,count:end-start+1});start=end=indexes[i];
  }
  groups.push({start:start,count:end-start+1});
  return groups;
}
function anCotKyThuatDanhMuc_(sheet,def){
  // Cột A/B cần cho liên kết hồ sơ; ẩn chứ KHÔNG xóa.
  sheet.hideColumns(1,2);
  sheet.setColumnWidth(3,320);
  sheet.setFrozenRows(1);
}
function thongBaoNhapDanhMuc_(report,done){
  var name={truong:'Cơ sở đào tạo',nghe:'Nghề đào tạo',lydo:'Lý do bỏ học'};
  return (done?'ĐÃ ĐỒNG BỘ DANH MỤC:':'KIỂM TRA TRƯỚC KHI ĐỒNG BỘ:')+'\n'+report.plans.map(function(p){
    return name[p.def.type]+': '+p.rows.filter(function(r){return String(r[2]||'').trim();}).length+
      ' danh mục, '+p.created+' mã định danh cần tạo, '+p.changedRows.length+' hàng cần cập nhật.';
  }).join('\n');
}

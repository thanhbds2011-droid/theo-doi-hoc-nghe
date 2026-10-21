/**
 * THEO_DOI_HOC_NGHE_API — v1.2.9-RC
 * Dự án độc lập: Google Sheets + Apps Script, không sử dụng Firebase hoặc Work.
 * Đặt API_SHARED_SECRET / SPREADSHEET_ID / GOOGLE_CLIENT_ID trong Script Properties.
 * Không phát hành Web App khi chưa triển khai proxy có xác minh Google ID Token.
 */
var APP = {
  version: '1.2.9-RC',
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
  SS_CACHE_ = null;HN_PERF_=null;
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
    if(cfg_().getProperty('HN_PERF_TEST')==='1')
      HN_PERF_={started:Date.now(),action:body.action,authMs:0,lockWaitMs:0,sheetReads:0,cells:0};
    var authStarted=Date.now();
    var user = authorize_(who, body.action);
    if(HN_PERF_)HN_PERF_.authMs=Date.now()-authStarted;
    var action = body.action;
    var payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    var data;
    switch (action) {
      case 'bootstrap': data = bootstrap_(user); break;
      case 'permission_check': data = permissionCheck_(user); break;
      case 'overview': data = overview_(user, payload); break;
      case 'report_matrix': data = reportMatrix_(user,payload); break;
      case 'records_list': data = listRecords_(user,payload); break;
      case 'person_lookup': data = personLookup_(user,payload); break;
      case 'record_bulk_check': data = recordBulkCheck_(user,payload); break;
      case 'record_status_bulk_check': data = statusBulkCheck_(user,payload); break;
      case 'record_status_bulk_apply': data = withLock_(function(){return statusBulkApply_(user,payload,body.requestId);}); break;
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
    perfEmit_(true);
    return json_({ok: true, data: data, requestId: body.requestId, version: APP.version});
  } catch (ex) {
    perfEmit_(false);
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
// Chỉ đo trên staging khi Script Properties HN_PERF_TEST = 1, không log danh tính/PII.
var HN_PERF_ = null;
function perfRead_(name,rows,cols){
  if(HN_PERF_){HN_PERF_.sheetReads++;HN_PERF_.cells+=rows*cols;}
}
function perfEmit_(ok){
  if(HN_PERF_){
    HN_PERF_.totalMs=Date.now()-HN_PERF_.started;HN_PERF_.ok=ok;
    var out={name:'YC017',action:HN_PERF_.action,ok:ok,totalMs:HN_PERF_.totalMs,
      authMs:HN_PERF_.authMs||0,lockWaitMs:HN_PERF_.lockWaitMs,
      sheetReads:HN_PERF_.sheetReads,cells:HN_PERF_.cells,
      rowLookupMs:HN_PERF_.rowLookupMs||0,rowReadMs:HN_PERF_.rowReadMs||0,
      validationMs:HN_PERF_.validationMs||0,writeMs:HN_PERF_.writeMs||0,
      revisionMs:HN_PERF_.revisionMs||0,auditMs:HN_PERF_.auditMs||0};
    console.info(JSON.stringify(out));
  }
}

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
  perfRead_(name,last-1,hdr.length);
  var all=sh.getRange(2,1,last-1,hdr.length).getDisplayValues();
  return all.filter(function(v){return v[0]!=='';}).map(function(v){var out={};hdr.forEach(function(k,i){out[k]=v[i];});return out;});
}
function safeSheetCell_(x){var value=String(x===undefined||x===null?'':x);return /^[=+@-]/.test(value)?"'"+value:value;}
function writeRecord_(name,rowNumber,obj,existingSheet) {
  var sh=existingSheet||getSheet_(name);
  if(name==='HO_SO_HOC_NGHE')must_(sh.getRange(1,40,1,1).getDisplayValues()[0][0]===APP.headersVi.HO_SO_HOC_NGHE[39],'SCHEMA_MISSING','Cần chạy nangCapDuLieuHocNgheYC011 trước khi ghi hồ sơ.');
  var hdr=APP.lists[name], values=hdr.map(function(k){return safeSheetCell_(obj[k]);});
  sh.getRange(rowNumber,1,1,hdr.length).setValues([values]);
}
function appendRecord_(name,obj) { var sh=getSheet_(name);writeRecord_(name,sh.getLastRow()+1,obj); }
function findRowNumber_(name,idKey,id,existingSheet) {
  var sh=existingSheet||getSheet_(name),last=sh.getLastRow(); if(last<2) return -1;
  var col=APP.lists[name].indexOf(idKey)+1;
  perfRead_(name,last-1,1);
  var ids=sh.getRange(2,col,last-1,1).getDisplayValues();
  for(var i=0;i<ids.length;i++) if(String(ids[i][0])===String(id))return i+2;
  return -1;
}
function withLock_(fn) {
  var lock=LockService.getScriptLock(),started=Date.now();
  var locked=lock.tryLock(25000);
  if(HN_PERF_)HN_PERF_.lockWaitMs+=Date.now()-started;
  must_(locked,'BUSY','Hệ thống đang xử lý giao dịch khác. Vui lòng thử lại.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function cache_() {return CacheService.getScriptCache();}
function cacheKey_(prefix,x){ var b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(x));return prefix+'_'+Utilities.base64EncodeWebSafe(b).replace(/=+$/,'').slice(0,40); }
function version_(type){return cfg_().getProperty('REV_'+type)||'0';}
function bump_(type){cfg_().setProperty('REV_'+type, Utilities.getUuid().slice(0,12));}
function cached_(prefix,key,seconds,fn){var k=cacheKey_(prefix,key), value=cache_().get(k);if(value){try{return JSON.parse(value);}catch(e){}}var data=fn(); var txt=JSON.stringify(data);if(txt.length<65000){try{cache_().put(k,txt,seconds||45);}catch(e){console.warn('Cache bypass',e.message);}}return data;}
function dedupeWrite_(id,fn){var key=cacheKey_('DONE',id),v=cache_().get(key);if(v){try{return JSON.parse(v);}catch(e){}}var result=fn();var s=JSON.stringify(result);if(s.length<65000){try{cache_().put(key,s,21600);}catch(e){console.warn('Dedupe cache bypass',e.message);}}return result;}
/** YC-HN-013: Gán một tài khoản cho đúng một trường, sử dụng tab CAU_HINH hiện hữu. */
function configRow_(key){return sheetRows_('CAU_HINH').filter(function(r){return r.KHOA===key;});}
function schoolBinding_(accountId){
  var rows=configRow_('HN_SCHOOL_'+accountId);
  must_(rows.length===1 && !!rows[0].GIA_TRI,'NO_PERMISSION','Tài khoản chưa được gán đúng một cơ sở đào tạo.');
  var id=rows[0].GIA_TRI;
  must_(catalogRows_('truong').some(function(x){return x.TRUONG_ID===id && x.TRANG_THAI==='ACTIVE';}),'NO_PERMISSION','Cơ sở đào tạo được phân công không còn hợp lệ.');
  return id;
}
function setSchoolBinding_(accountId,schoolId,admin){
  var key='HN_SCHOOL_'+accountId, rows=sheetRows_('CAU_HINH'), hits=[];
  rows.forEach(function(r,i){if(r.KHOA===key)hits.push(i);});
  must_(hits.length<=1,'VALIDATION','Phân công cơ sở bị trùng, cần kiểm tra dữ liệu cấu hình.');
  var obj={KHOA:key,GIA_TRI:schoolId,LOAI_DU_LIEU:'STRING',NHOM:'HN_SCHOOL',MO_TA:'Một Gmail - một cơ sở đào tạo',CAP_NHAT_LUC:now_(),CAP_NHAT_BOI:admin.EMAIL};
  if(hits.length)writeRecord_('CAU_HINH',hits[0]+2,obj);else appendRecord_('CAU_HINH',obj);
  bump_('USERS');
}
function statusNameKey_(label){return str_(label,80).normalize('NFC').toLocaleLowerCase().replace(/\s+/g,' ').trim();}
function customStatusList_(){
  return cached_('HN_STATUS',version_('STATUS'),45,function(){return sheetRows_('CAU_HINH').filter(function(r){return /^HN_STATUS_CUS_/.test(r.KHOA);}).map(function(r){return {id:r.KHOA.slice(10),label:r.GIA_TRI};});});
}
function customStatusLabel_(id){var item=customStatusList_().filter(function(x){return x.id===id;})[0];return item?item.label:'';}
function normalizeCustomStatus_(value){
  var raw=str_(value,80).normalize('NFC').replace(/\s+/g,' ').trim();
  must_(raw.length>=2 && raw.length<=60 && !/[\x00-\x1f\x7f]/.test(raw),'VALIDATION','Tên tình trạng khác phải từ 2 đến 60 ký tự.');
  var label=raw.charAt(0).toLocaleUpperCase()+raw.slice(1);
  var reserved=['Đã tham gia học','Đã tham gia – Đang học','Đang học','Không tham gia','Bỏ học','Không nhận quyết định','Chưa xác nhận','Khác'];
  must_(!reserved.some(function(x){return statusNameKey_(x)===statusNameKey_(label);}), 'VALIDATION','Tình trạng đã có. Vui lòng chọn trong danh sách.');
  must_(!/^[=+@\-]/.test(label),'VALIDATION','Tên tình trạng không hợp lệ.');
  return label;
}
function registerCustomStatus_(label,user){
  label=normalizeCustomStatus_(label);
  var existing=customStatusList_().filter(function(x){return statusNameKey_(x.label)===statusNameKey_(label);})[0];
  if(existing)return existing.id;
  var hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,statusNameKey_(label),Utilities.Charset.UTF_8).slice(0,10).map(function(n){return ('0'+(n&255).toString(16)).slice(-2);}).join('').toUpperCase();
  var id='CUS_'+hash, key='HN_STATUS_'+id, matches=configRow_(key);
  must_(!matches.length || statusNameKey_(matches[0].GIA_TRI)===statusNameKey_(label),'VALIDATION','Tên tình trạng bị trùng mã.');
  if(!matches.length){appendRecord_('CAU_HINH',{KHOA:key,GIA_TRI:label,LOAI_DU_LIEU:'STRING',NHOM:'HN_STATUS',MO_TA:'Tình trạng học nghề phát sinh',CAP_NHAT_LUC:now_(),CAP_NHAT_BOI:user.EMAIL});bump_('STATUS');}
  return id;
}
function isValidStatus_(s){return ['CHO_XAC_NHAN','DA_THAM_GIA','KHONG_THAM_GIA','KHONG_NHAN_QUYET_DINH'].indexOf(s)>=0 || !!customStatusLabel_(s);}
function dropoutPeriod_(raw,months,allowLegacy){
  var value=str_(raw,24);
  if(allowLegacy && (validDate_(value)||/^KY:(?:1[3-9]|[2-9][0-9]+)$/.test(value)))return value;
  var m=/^KY:([1-9][0-9]*)$/.exec(value), n=Number(m&&m[1]);
  must_(!!m && n>=2,'VALIDATION','Hãy chọn tháng bắt đầu bỏ học sau tháng đã tham gia.');
  var N=Number(months);
  must_(Number.isInteger(N)&&N>0,'VALIDATION','Khóa học cần số tháng hỗ trợ nguyên để xác định tháng bỏ học. Vui lòng kiểm tra hồ sơ.');
  must_(n<=12,'VALIDATION','Chỉ được chọn tháng bỏ học từ thứ 2 đến thứ 12. Kỳ ngoài phạm vi này cần được xem xét riêng.');
  must_(n<=N,'VALIDATION','Tháng bỏ học vượt số tháng của khóa học.');
  return value;
}
function authorize_(identity,action){
  var email=norm_(identity.email);
  // Revision thay đổi ngay khi cấp/thu hồi/chuyển trường thông qua ứng dụng.
  // Cache ngắn trong Apps Script chỉ là tối ưu; mỗi request vẫn xác minh identity + quyền.
  var authKey=cacheKey_('HNAUTH',[version_('USERS'),version_('CAT'),email,identity.sub]);
  var hit=cache_().get(authKey),row=null;
  if(hit){try{row=JSON.parse(hit);}catch(ex){row=null;}}
  if(!row){
    var users=sheetRows_('TAI_KHOAN');
    row=users.filter(function(u){return norm_(u.EMAIL)===email&&u.TRANG_THAI==='ACTIVE';})[0];
  }
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
    bootstrap:'RECORD_VIEW', permission_check:'RECORD_VIEW', overview:'RECORD_VIEW', records_list:'RECORD_VIEW', person_lookup:'RECORD_VIEW',
    report_matrix:'REPORT_EXPORT', record_bulk_check:'ACCOUNT_MANAGE', record_bulk_import:'ACCOUNT_MANAGE', record_status_bulk_check:'ACCOUNT_MANAGE', record_status_bulk_apply:'ACCOUNT_MANAGE', record_save:'RECORD_CREATE', record_status:'RECORD_STATUS', record_delete:'RECORD_DELETE', report_export:'REPORT_EXPORT',
    catalog_list:'CATALOG_MANAGE', catalog_save:'CATALOG_MANAGE', catalog_delete:'CATALOG_MANAGE', catalog_bulk_check:'CATALOG_MANAGE', catalog_bulk_import:'CATALOG_MANAGE', accounts_list:'ACCOUNT_MANAGE', account_save:'ACCOUNT_MANAGE', account_delete:'ACCOUNT_MANAGE',
    audit_list:'AUDIT_VIEW', file_upload:'FILE_UPLOAD', file_get:'FILE_VIEW', file_info:'FILE_VIEW', file_chunk:'FILE_VIEW', file_upload_begin:'FILE_UPLOAD', file_upload_chunk:'FILE_UPLOAD', file_upload_cancel:'FILE_UPLOAD', file_remove:'FILE_UPLOAD'
  };
  must_(Boolean(needs[action]),'BAD_REQUEST','Thao tác không cho phép.');
  // YC-HN-007: các quyền nghiệp vụ được xác định theo VAI_TRO, không còn tin cột QUYEN lịch sử.
  var staffRights=['RECORD_VIEW','RECORD_CREATE','RECORD_EDIT','RECORD_DELETE','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','FILE_UPLOAD','REPORT_EXPORT'];
  must_(['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO'].indexOf(row.VAI_TRO)>=0,'NOT_AUTHORIZED','Vai trò tài khoản chưa hợp lệ.');
  if(row.VAI_TRO==='CO_SO_DAO_TAO' && !hit)row.TRUONG_ID=schoolBinding_(row.TAI_KHOAN_ID);
  // Hết hạn trong 25s và cacheKey theo revision; thay đổi quyền qua UI được thu hồi ngay.
  if(!hit && row.GOOGLE_SUB){
    try{cache_().put(cacheKey_('HNAUTH',[version_('USERS'),version_('CAT'),email,identity.sub]),JSON.stringify(row),25);}catch(e){}
  }
  var schoolRights=['RECORD_VIEW','RECORD_STATUS','REPORT_VIEW','FILE_VIEW'];
  var perms=row.VAI_TRO==='ADMIN'?['*']:row.VAI_TRO==='CO_SO_DAO_TAO'?schoolRights:staffRights;
  function has(p){return row.VAI_TRO==='ADMIN'||(row.VAI_TRO==='NHAN_VIEN'&&staffRights.indexOf(p)>=0)||(row.VAI_TRO==='CO_SO_DAO_TAO'&&schoolRights.indexOf(p)>=0);}
  // record_save tự quyết định quyền tạo/sửa phía dưới, không cấp quyền sửa chỉ vì được tạo.
  if(action==='record_save')must_(has('RECORD_CREATE')||has('RECORD_EDIT'),'NO_PERMISSION','Không được tạo hoặc sửa hồ sơ.');
  else must_(has(needs[action]),'NO_PERMISSION','Không có quyền thực hiện thao tác này.');
  row._permissions=perms;row._has=has;row._googleSub=identity.sub;return row;
}
function safeUser_(u) {return {TAI_KHOAN_ID:u.TAI_KHOAN_ID,EMAIL:u.EMAIL,HO_TEN:u.HO_TEN,VAI_TRO:u.VAI_TRO,TRUONG_ID:u.TRUONG_ID||'',QUYEN:u.VAI_TRO==='ADMIN'?'*':u.VAI_TRO==='CO_SO_DAO_TAO'?'RECORD_VIEW,RECORD_STATUS,REPORT_VIEW,FILE_VIEW':'RECORD_VIEW,RECORD_CREATE,RECORD_EDIT,RECORD_DELETE,RECORD_STATUS,REPORT_VIEW,FILE_VIEW,FILE_UPLOAD',TRANG_THAI:u.TRANG_THAI};}
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
  return {user:safeUser_(user), statuses:customStatusList_(), catalogs:{truong:catalogRows_('truong').filter(function(x){return catalogVisible_(x) && (user.VAI_TRO!=='CO_SO_DAO_TAO'||x.TRUONG_ID===user.TRUONG_ID);}),nghe:catalogRows_('nghe').filter(catalogVisible_),lydo:catalogRows_('lydo').filter(catalogVisible_)},version:APP.version,permissionRevision:version_('USERS'),dataRevision:version_('DATA'),catalogRevision:version_('CAT'),statusRevision:version_('STATUS')};
}
/** YC-HN-017: nhẹ hơn bootstrap; authorize_ vẫn kiểm tra mọi quyền ở máy chủ. */
function permissionCheck_(user){
  return {user:safeUser_(user),permissionRevision:version_('USERS'),
    dataRevision:version_('DATA'),catalogRevision:version_('CAT'),statusRevision:version_('STATUS')};
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
/** Tháng hỗ trợ có thể là 2,5 / 3,5; lưu ở dạng thập phân chính xác (chuỗi). */
function normalizeSupportMonths_(value){
  var s=str_(value,100).replace(/\s+/g,'');
  if(!s)return '';
  must_(/^\d+(?:[.,]\d+)?$/.test(s),'VALIDATION','Số tháng hỗ trợ chưa đúng định dạng. Ví dụ: 3 hoặc 3,5.');
  var n=s.replace(',','.');
  must_(Number.isFinite(Number(n))&&Number(n)>=0,'VALIDATION','Số tháng hỗ trợ chưa hợp lệ.');
  return n.replace(/^0+(?=\d)/,'');
}
/** Giá trị tiền từ quyết định: chấp nhận nhóm nghìn của Việt Nam/quốc tế, không làm tròn. */
function normalizeSupportAmount_(value){
  var s=str_(value,100).replace(/[\s\u00a0\u202f]/g,'');
  if(!s)return '';
  var normalized='';
  if(/^\d+$/.test(s))normalized=s;
  else if(/^\d{1,3}(?:\.\d{3})+$/.test(s)||/^\d{1,3}(?:,\d{3})+$/.test(s))normalized=s.replace(/[.,]/g,'');
  else if(/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(s))normalized=s.replace(/\./g,'').replace(',','.');
  else if(/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(s))normalized=s.replace(/,/g,'');
  else if(/^\d+[.,]\d{1,2}$/.test(s))normalized=s.replace(',','.');
  else throw err_('VALIDATION','Mức hỗ trợ/tháng chưa đúng định dạng. Ví dụ: 1.500.000 hoặc 1500000.');
  must_(Number.isFinite(Number(normalized))&&Number(normalized)>=0,'VALIDATION','Mức hỗ trợ/tháng chưa hợp lệ.');
  // Không làm tròn; lưu số dưới dạng chuỗi để bảo toàn số 0 và phần thập phân (nếu có).
  return normalized.replace(/^0+(?=\d)/,'');
}
/** Định dạng báo cáo/xuất Excel theo cách ghi số của người Việt. */
function supportMonthsVN_(value){return str_(value,100).replace('.',',');}
function supportAmountVN_(value){
  var original=str_(value,100);if(!original)return '';
  var n;try{n=normalizeSupportAmount_(original);}catch(ex){return original;}
  var pieces=n.split('.');
  return pieces[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(pieces.length>1?','+pieces[1]:'');
}
/** Chỉ chuẩn hóa khoảng trắng/chữ hoa; giữ dấu tiếng Việt để tránh gộp sai hai tên khác nhau. */
function catalogNameKey_(x){return str_(x,250).normalize('NFC').toLocaleLowerCase().replace(/\s+/g,' ').trim();}
function allowedRecord_(p,original,bulkCatalogs,allowLegacyImport){
  var o={};
  ['HO_TEN','NGAY_SINH','GIOI_TINH','SO_QUYET_DINH','NGAY_QUYET_DINH','TRUONG_ID','NGHE_ID','NGAY_BAT_DAU','NGAY_KET_THUC_DU_KIEN','TRANG_THAI_THAM_GIA','NGAY_BO_HOC','LY_DO_BO_HOC_ID','GHI_CHU'].forEach(function(k){o[k]=str_(p[k],k==='GHI_CHU'?1500:250);});
  // YC-HN-011: trường thông tin gốc Excel, giữ nguyên khi cập nhật từng phần.
  APP.lists.HO_SO_HOC_NGHE.slice(25).forEach(function(k){
    o[k]=p[k]===undefined && original ? str_(original[k],1000) : str_(p[k],1000);
  });
  ['NGAY_QD_TCTN','NGAY_KET_THUC_TCTN','NGAY_KET_THUC_HO_TRO','NGAY_CAP_CMND'].forEach(function(k){validateOptionalDate_(o[k],APP.headersVi.HO_SO_HOC_NGHE[APP.lists.HO_SO_HOC_NGHE.indexOf(k)]);});
  // YC-HN-012: không áp mức hưởng cố định; chuẩn hóa tháng và tiền theo hai quy tắc riêng.
  o.SO_THANG_HO_TRO=normalizeSupportMonths_(o.SO_THANG_HO_TRO);
  o.MUC_HO_TRO_THANG=normalizeSupportAmount_(o.MUC_HO_TRO_THANG);
  o.DA_BO_HOC=bool_(p.DA_BO_HOC)?'TRUE':'FALSE';
  must_(o.HO_TEN.length>=2,'VALIDATION','Cần nhập họ và tên người học.');
  validateOptionalDate_(o.NGAY_SINH,'Ngày sinh');
  must_(['','NAM','NU','KHAC'].indexOf(o.GIOI_TINH)>=0,'VALIDATION','Giới tính không hợp lệ.');
  must_(validDate_(o.NGAY_QUYET_DINH),'VALIDATION','Ngày quyết định không hợp lệ.');
  o.SO_QUYET_DINH_KEY=decisionKey_(o.SO_QUYET_DINH,o.NGAY_QUYET_DINH);
  o.NAM_QUYET_DINH=o.NGAY_QUYET_DINH.slice(0,4);
  validateOptionalDate_(o.NGAY_BAT_DAU,'Ngày bắt đầu');validateOptionalDate_(o.NGAY_KET_THUC_DU_KIEN,'Ngày kết thúc dự kiến');
  must_(isValidStatus_(o.TRANG_THAI_THAM_GIA),'VALIDATION','Tình trạng tham gia không hợp lệ.');
  must_(Boolean(o.TRUONG_ID)&&Boolean(o.NGHE_ID),'VALIDATION','Cần chọn cơ sở và nghề.');
  function lookup(type,id){var def=APP.catalog[type];return (bulkCatalogs&&bulkCatalogs[type]&&bulkCatalogs[type][id]) || catalogRows_(type).filter(function(x){return x[def.id]===id;})[0];}
  var school=lookup('truong',o.TRUONG_ID), trade=lookup('nghe',o.NGHE_ID);
  must_(school&&trade,'VALIDATION','Cơ sở hoặc nghề không tồn tại.');
  must_(school.TRANG_THAI==='ACTIVE'||original&&original.TRUONG_ID===school.TRUONG_ID,'VALIDATION','Cơ sở đã ngừng sử dụng.');
  must_(trade.TRANG_THAI==='ACTIVE'||original&&original.NGHE_ID===trade.NGHE_ID,'VALIDATION','Nghề đã ngừng sử dụng.');
  if(o.DA_BO_HOC==='TRUE') {
    must_(o.TRANG_THAI_THAM_GIA==='DA_THAM_GIA','VALIDATION','Bỏ học chỉ áp dụng cho người đã tham gia.');
    o.NGAY_BO_HOC=dropoutPeriod_(o.NGAY_BO_HOC,o.SO_THANG_HO_TRO,Boolean(allowLegacyImport && validDate_(o.NGAY_BO_HOC) || (original && o.NGAY_BO_HOC===original.NGAY_BO_HOC && (validDate_(o.NGAY_BO_HOC)||/^KY:(?:1[3-9]|[2-9][0-9]+)$/.test(o.NGAY_BO_HOC)))));
    must_(Boolean(o.LY_DO_BO_HOC_ID),'VALIDATION','Phải chọn lý do bỏ học.');
    must_(Boolean(lookup('lydo',o.LY_DO_BO_HOC_ID)),'VALIDATION','Lý do bỏ học không tồn tại.');
    if(validDate_(o.NGAY_BO_HOC) && o.NGAY_BAT_DAU)must_(o.NGAY_BO_HOC>=o.NGAY_BAT_DAU,'VALIDATION','Ngày bỏ học không được trước ngày bắt đầu học.');
  } else {o.NGAY_BO_HOC='';o.LY_DO_BO_HOC_ID='';}
  return o;
}
function ownsRecord_(user,r){return user.VAI_TRO==='ADMIN' || (user.VAI_TRO==='CO_SO_DAO_TAO' && !!user.TRUONG_ID && r.TRUONG_ID===user.TRUONG_ID) || (user.VAI_TRO==='NHAN_VIEN' && Boolean(r.TAO_BOI) && norm_(r.TAO_BOI)===norm_(user.EMAIL));}
function requireRecordOwner_(user,r){must_(ownsRecord_(user,r),'NO_PERMISSION','Bạn không có quyền với hồ sơ của cơ sở này.');return r;}
/** Snapshot đã phân mảnh theo revision; chỉ là cache nội bộ, không phải quyền truy cập. */
function cachedRecordSnapshot_(){
  var rev=version_('DATA'),stamp=cacheKey_('HNSNAP',[rev,'meta']),meta=cache_().get(stamp),i,part,rows=[],chunks=[];
  if(meta){
    try{var count=Number(meta);if(count>0&&count<=180){
      var keys=[];
      for(i=0;i<count;i++)keys.push(cacheKey_('HNSNAP',[rev,i]));
      // YC-HN-017: một lượt getAll thay cho N lượt get() nối tiếp.
      var blocks=cache_().getAll(keys);
      for(i=0;i<count;i++){
        part=blocks[keys[i]];
        if(!part)throw new Error('Snapshot chunk expired');
        rows=rows.concat(JSON.parse(part));
      }
      return rows;
    }}catch(e){/* Miss một phần: đọc lại nguồn Sheet, tuyệt đối không trả dữ liệu thiếu */}
  }
  rows=sheetRows_('HO_SO_HOC_NGHE');
  if(!rows.length||rows.length>7000)return rows;
  var batch=[],chars=0;
  rows.forEach(function(r){
    var part=JSON.stringify(r),len=part.length+2;
    if(batch.length&&chars+len>22000){chunks.push(JSON.stringify(batch));batch=[];chars=0;}
    batch.push(r);chars+=len;
  });
  if(batch.length)chunks.push(JSON.stringify(batch));
  if(chunks.length<=180){
    try{
      var chunkMap={};chunks.forEach(function(chunk,index){chunkMap[cacheKey_('HNSNAP',[rev,index])]=chunk;});
      cache_().putAll(chunkMap,90);
      cache_().put(stamp,String(chunks.length),90);
    }catch(ex){console.warn('Snapshot cache skipped',ex.message);}
  }
  return rows;
}
function visibleRecords_(user){return cachedRecordSnapshot_().filter(function(r){return r.TRANG_THAI_HO_SO!=='DELETED' && ownsRecord_(user,r);});}
// YC-HN-019: Chỉ chấp nhận ngày ISO hợp lệ, đầu mút có bao gồm ngày.
function decisionRange_(p){
  var from=str_(p.from,40).trim(),to=str_(p.to,40).trim();
  if(from)must_(validDate_(from),'VALIDATION','Từ ngày ban hành quyết định không hợp lệ.');
  if(to)must_(validDate_(to),'VALIDATION','Đến ngày ban hành quyết định không hợp lệ.');
  must_(!from||!to||from<=to,'VALIDATION','Từ ngày không được sau Đến ngày.');
  return {from:from,to:to};
}
function recordMatches_(r,p){
  if(p.year && String(r.NAM_QUYET_DINH)!==String(p.year))return false;
  if(p.truong && r.TRUONG_ID!==p.truong)return false;
  if(p.nghe && r.NGHE_ID!==p.nghe)return false;
  if(p.status==='BO_HOC' && !bool_(r.DA_BO_HOC))return false;
  if(p.status==='DA_THAM_GIA' && (r.TRANG_THAI_THAM_GIA!=='DA_THAM_GIA'||bool_(r.DA_BO_HOC)))return false;
  if(p.status && p.status!=='BO_HOC' && p.status!=='DA_THAM_GIA' && r.TRANG_THAI_THAM_GIA!==p.status)return false;
  if(p.dropout==='yes' && !bool_(r.DA_BO_HOC))return false;
  if(p.dropout==='no' && bool_(r.DA_BO_HOC))return false;
  if(p.from||p.to){var issued=String(r.NGAY_QUYET_DINH||'').slice(0,10);if(!validDate_(issued))return false;if(p.from && issued<p.from)return false;if(p.to && issued>p.to)return false;}
  if(p.query){var query=str_(p.query,140);if(/^\d+$/.test(query)){if(String(r.SO_QUYET_DINH).replace(/^0+(?=\d)/,'')!==query.replace(/^0+(?=\d)/,''))return false;}else if(norm_([r.HO_TEN,r.SO_QUYET_DINH,r.NGUOI_HOC_ID,r.HO_SO_ID].join(' ')).indexOf(norm_(query))<0)return false;}
  return true;
}
function filteredRecords_(p,user){
  must_(Boolean(user&&user.VAI_TRO),'NOT_AUTHORIZED','Thiếu thông tin tài khoản.');
  return visibleRecords_(user).filter(function(r){return recordMatches_(r,p);}).sort(function(a,b){return b.NGAY_QUYET_DINH.localeCompare(a.NGAY_QUYET_DINH)||b.TAO_LUC.localeCompare(a.TAO_LUC);});
}
function safeRecord_(r){var x=Object.assign({},r);delete x.TEP_DRIVE_ID; x.HAS_FILE=Boolean(r.TEP_DRIVE_ID);return x;}
/** Tra cứu QĐ chính xác chỉ đọc 1 cột số QĐ và các hàng trùng. CacheService không là nguồn sự thật. */
function exactDecisionRecords_(filters,user){
  var q=str_(filters.query,140).replace(/^0+(?=\d)/,''),sh=getSheet_('HO_SO_HOC_NGHE'),last=sh.getLastRow();
  if(last<2)return [];
  var index=APP.lists.HO_SO_HOC_NGHE.indexOf('SO_QUYET_DINH')+1;
  // Index QĐ trong CacheService: không lưu PII, TTL ngắn; luôn xác minh ô QĐ tại row.
  var key=cacheKey_('HNDEC',[version_('DATA'),last]),cached=cache_().get(key),indexData=null;
  try{if(cached)indexData=JSON.parse(cached);}catch(ex){indexData=null;}
  function scanDecisions(){
    perfRead_('HO_SO_HOC_NGHE',last-1,1);
    var values=sh.getRange(2,index,last-1,1).getDisplayValues(),map={};
    for(var i=0;i<values.length;i++){
      var raw=String(values[i][0]).trim().replace(/^0+(?=\d)/,'');
      if(/^\d+$/.test(raw))(map[raw]||(map[raw]=[])).push(i+2);
    }
    var txt=JSON.stringify(map);
    if(txt.length<75000)try{cache_().put(key,txt,60);}catch(e){}
    return map;
  }
  if(!indexData)indexData=scanDecisions();
  var hits=indexData[q]||[];
  if(hits.length>40)return filteredRecords_(filters,user);
  var hdr=APP.lists.HO_SO_HOC_NGHE,matching=[];
  function readHits(numbers){
    var result=[],valid=true;
    numbers.forEach(function(rowNumber){
      if(rowNumber>last){valid=false;return;}
      perfRead_('HO_SO_HOC_NGHE',1,hdr.length);
      var values=sh.getRange(rowNumber,1,1,hdr.length).getDisplayValues()[0],r={};
      hdr.forEach(function(k,i){r[k]=values[i];});
      // Tránh dùng row cache sai khi ai đó sắp xếp/di chuyển dòng trực tiếp trong Sheets.
      if(String(r.SO_QUYET_DINH).trim().replace(/^0+(?=\d)/,'')!==q){valid=false;return;}
      if(r.HO_SO_ID&&r.TRANG_THAI_HO_SO!=='DELETED'&&ownsRecord_(user,r)&&recordMatches_(r,filters))result.push(r);
    });
    return {items:result,valid:valid};
  }
  var checked=readHits(hits);
  if(!checked.valid){
    cache_().remove(key);
    indexData=scanDecisions();hits=indexData[q]||[];
    if(hits.length>40)return filteredRecords_(filters,user);
    checked=readHits(hits);
  }
  matching=checked.items;
  return matching.sort(function(a,b){return b.NGAY_QUYET_DINH.localeCompare(a.NGAY_QUYET_DINH)||b.TAO_LUC.localeCompare(a.TAO_LUC);});
}
/** Lọc báo cáo: tham gia toàn bộ bao gồm bỏ học; trạng thái cập nhật không đổi. */
function reportStatusValid_(status){
  if(!status)return true;
  if(['REPORT_PARTICIPATED_ALL','DA_THAM_GIA','BO_HOC','KHONG_THAM_GIA','KHONG_NHAN_QUYET_DINH','CHO_XAC_NHAN'].indexOf(status)>=0)return true;
  return customStatusList_().some(function(x){return x.id===status;});
}
function reportFilters_(p){
  var status=str_(p.status,80);
  must_(reportStatusValid_(status),'VALIDATION','Tình trạng báo cáo không hợp lệ.');
  var period=decisionRange_(p);
  return {year:str_(p.year,4),truong:str_(p.truong,80),nghe:str_(p.nghe,80),status:status,from:period.from,to:period.to};
}
function reportMatches_(r,p){
  if(p.status==='REPORT_PARTICIPATED_ALL')return r.TRANG_THAI_THAM_GIA==='DA_THAM_GIA';
  return recordMatches_(r,p);
}
function reportRecords_(p,user,sorted){
  var f=reportFilters_(p),basic={year:f.year,truong:f.truong,nghe:f.nghe,from:f.from,to:f.to};
  // Aggregates do not need a 3,000-row sort. Exports retain the established sort.
  var source=sorted===false?visibleRecords_(user).filter(function(r){return recordMatches_(r,basic);}):filteredRecords_(basic,user);
  return source.filter(function(r){return reportMatches_(r,f);});
}
function listRecords_(user,p){
  var period=decisionRange_(p);
  var filters={year:str_(p.year,4),truong:str_(p.truong,80),nghe:str_(p.nghe,80),status:str_(p.status,40),dropout:str_(p.dropout,4),from:period.from,to:period.to,query:str_(p.query,140)};
  var page=Math.min(Math.max(Number(p.page)||1,1),100000),size=Math.min(Math.max(Number(p.pageSize)||20,1),100);
  return cached_('RECORDS',[version_('DATA'),user.TAI_KHOAN_ID,user.EMAIL,user.VAI_TRO,user.TRUONG_ID||'',version_('USERS'),filters,page,size],APP.cacheSeconds,function(){var all=/^\d+$/.test(filters.query)?exactDecisionRecords_(filters,user):filteredRecords_(filters,user);return {items:all.slice((page-1)*size,page*size).map(safeRecord_),total:all.length,page:page,pageSize:size};});
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
  var isNewStatus=Boolean(p.customStatusName);
  var obj=allowedRecord_(isNewStatus?Object.assign({},p,{TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN'}):p,old);
  must_(!records.some(function(x){return x.SO_QUYET_DINH_KEY===obj.SO_QUYET_DINH_KEY&&x.HO_SO_ID!==id;}),'DECISION_DUPLICATE','Số quyết định '+obj.SO_QUYET_DINH+' đã được sử dụng trong năm '+obj.NAM_QUYET_DINH+'.');
  if(old){must_(Number(p.PHIEN_BAN)===Number(old.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ đã thay đổi ở phiên khác. Hãy tải lại trước khi sửa.');}
  var personId=str_(p.NGUOI_HOC_ID,60);
  if(!old && personId){var persons=records.filter(function(x){return x.NGUOI_HOC_ID===personId && x.TRANG_THAI_HO_SO!=='DELETED' && ownsRecord_(user,x);});must_(persons.length>0,'VALIDATION','Mã người học đã chọn không tồn tại.');must_(norm_(persons[0].HO_TEN)===norm_(obj.HO_TEN),'VALIDATION','Họ tên không trùng người học được chọn.');}
  if(old) personId=old.NGUOI_HOC_ID;
  if(isNewStatus)obj.TRANG_THAI_THAM_GIA=registerCustomStatus_(p.customStatusName,user);
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
  // Chỉ đọc cột ID để xác định hàng, rồi lấy 40 ô của một hồ sơ dưới lock.
  // Không quét 40 cột × hàng nghìn hồ sơ cho thao tác cập nhật một trạng thái.
  var perfStart=Date.now();
  var id=str_(p.HO_SO_ID,60),sh=getSheet_('HO_SO_HOC_NGHE'),rowNumber=findRowNumber_('HO_SO_HOC_NGHE','HO_SO_ID',id,sh);
  if(HN_PERF_)HN_PERF_.rowLookupMs=Date.now()-perfStart;
  must_(rowNumber>=2,'NOT_FOUND','Không tìm thấy hồ sơ.');
  var hdr=APP.lists.HO_SO_HOC_NGHE;
  perfRead_('HO_SO_HOC_NGHE',1,hdr.length);
  var cells=sh.getRange(rowNumber,1,1,hdr.length).getDisplayValues()[0],old={};
  hdr.forEach(function(key,i){old[key]=cells[i];});
  if(HN_PERF_)HN_PERF_.rowReadMs=Date.now()-perfStart-(HN_PERF_.rowLookupMs||0);
  must_(old.HO_SO_ID===id,'NOT_FOUND','Hồ sơ đã thay đổi vị trí. Vui lòng tải lại.');
  old=requireRecordOwner_(user,old);
  must_(old.TRANG_THAI_HO_SO!=='DELETED','NOT_FOUND','Hồ sơ đã được xóa.');
  must_(Number(p.PHIEN_BAN)===Number(old.PHIEN_BAN),'VERSION_CONFLICT','Hồ sơ vừa được người khác thay đổi.');
  var status=p.customStatusName?registerCustomStatus_(p.customStatusName,user):str_(p.TRANG_THAI_THAM_GIA,40);
  var data=Object.assign({},old,{TRANG_THAI_THAM_GIA:status,DA_BO_HOC:bool_(p.DA_BO_HOC)?'TRUE':'FALSE',NGAY_BO_HOC:str_(p.NGAY_BO_HOC,24),LY_DO_BO_HOC_ID:str_(p.LY_DO_BO_HOC_ID,80)});
  must_(isValidStatus_(data.TRANG_THAI_THAM_GIA),'VALIDATION','Tình trạng không hợp lệ.');
  if(data.DA_BO_HOC==='TRUE'){
    must_(data.TRANG_THAI_THAM_GIA==='DA_THAM_GIA','VALIDATION','Bỏ học chỉ dành cho người đã tham gia.');
    data.NGAY_BO_HOC=dropoutPeriod_(data.NGAY_BO_HOC,old.SO_THANG_HO_TRO,data.NGAY_BO_HOC===old.NGAY_BO_HOC && (validDate_(data.NGAY_BO_HOC)||/^KY:(?:1[3-9]|[2-9][0-9]+)$/.test(data.NGAY_BO_HOC)));
    must_(catalogRows_('lydo').some(function(x){return x.LY_DO_ID===data.LY_DO_BO_HOC_ID;}),'VALIDATION','Cần chọn lý do bỏ học.');
    if(validDate_(data.NGAY_BO_HOC) && old.NGAY_BAT_DAU)must_(data.NGAY_BO_HOC>=old.NGAY_BAT_DAU,'VALIDATION','Ngày bỏ học không được trước ngày bắt đầu học.');
  } else {data.NGAY_BO_HOC='';data.LY_DO_BO_HOC_ID='';}
  data.PHIEN_BAN=String(Number(old.PHIEN_BAN)+1);data.CAP_NHAT_LUC=now_();data.CAP_NHAT_BOI=user.EMAIL;
  // Giữ nguyên ghi 40 cột trong một lần (ít lệnh ghi Sheets, bảo toàn schema).
  if(HN_PERF_)HN_PERF_.validationMs=Date.now()-perfStart-(HN_PERF_.rowLookupMs||0)-(HN_PERF_.rowReadMs||0);
  var tWrite=Date.now();
  writeRecord_('HO_SO_HOC_NGHE',rowNumber,data,sh);
  if(HN_PERF_)HN_PERF_.writeMs=Date.now()-tWrite;
  var tRevision=Date.now();bump_('DATA');
  if(HN_PERF_)HN_PERF_.revisionMs=Date.now()-tRevision;
  var tAudit=Date.now();
  try{audit_(user,'CAP_NHAT_TRANG_THAI','HO_SO',id,{trangThai:data.TRANG_THAI_THAM_GIA,boHoc:data.DA_BO_HOC},requestId);}catch(e){console.error('Audit failed',e);}
  if(HN_PERF_)HN_PERF_.auditMs=Date.now()-tAudit;
  return {record:safeRecord_(data)};
});}
/** YC-HN-016: Không ghi đè: nhập trạng thái hàng loạt chỉ dành cho hồ sơ CHO_XAC_NHAN. */
function statusBulkTarget_(p){
  var status=str_(p.status,70),code=status==='BO_HOC'?'DA_THAM_GIA':status;
  must_(status==='BO_HOC'||isValidStatus_(status),'VALIDATION','Tình trạng đích không hợp lệ.');
  return {selected:status,code:code};
}
function statusBulkSource_(raw){
  must_(raw && typeof raw==='object' && !Array.isArray(raw),'VALIDATION','Dòng không hợp lệ.');
  var row={line:Number(raw.line),decision:str_(raw.decision,20),decisionDate:str_(raw.decisionDate,10),name:str_(raw.name,250),school:str_(raw.school,250),bhxh:str_(raw.bhxh,45),dropoutPeriod:str_(raw.dropoutPeriod,25),dropoutReason:str_(raw.dropoutReason,250)};
  must_(Number.isInteger(row.line)&&row.line>=2&&row.line<10000,'VALIDATION','Số dòng Excel không hợp lệ.');
  must_(!!row.name&&!!row.school,'VALIDATION','Thiếu họ tên hoặc cơ sở đào tạo.');
  row.key=decisionKey_(row.decision,row.decisionDate);
  return row;
}
function statusBulkFind_(source,r,schools){
  must_(r.TRANG_THAI_HO_SO!=='DELETED','VALIDATION','Hồ sơ đã xóa hoặc ngừng hoạt động.');
  must_(norm_(source.name)===norm_(r.HO_TEN),'VALIDATION','Họ tên không khớp với hồ sơ.');
  var school=schools[r.TRUONG_ID];
  must_(school && norm_(source.school)===norm_(school),'VALIDATION','Cơ sở đào tạo không khớp với hồ sơ.');
  // Khi hai bên đều có số BHXH phải chính xác: không bỏ qua sai lệch.
  if(source.bhxh&&r.SO_SO_BHXH)must_(source.bhxh.replace(/\s/g,'')===String(r.SO_SO_BHXH).replace(/\s/g,''),'VALIDATION','Số sổ BHXH không trùng hồ sơ.');
  must_(source.key===decisionKey_(r.SO_QUYET_DINH,r.NGAY_QUYET_DINH),'VALIDATION','Số hoặc năm quyết định đã thay đổi.');
}
function statusBulkEligible_(r,target,source,reasons,p){
  if(r.TRANG_THAI_THAM_GIA==='DA_THAM_GIA' && bool_(r.DA_BO_HOC))return {kind:target.selected==='BO_HOC'?'same':'protected',reason:'Đã bỏ học — giữ nguyên tháng và lý do.'};
  if(r.TRANG_THAI_THAM_GIA!=='CHO_XAC_NHAN')return {kind:r.TRANG_THAI_THAM_GIA===target.code?'same':'protected',reason:r.TRANG_THAI_THAM_GIA===target.code?'Đã ở đúng tình trạng.':'Đã có tình trạng khác — giữ nguyên.'};
  if(target.selected==='CHO_XAC_NHAN')return {kind:'same',reason:'Đã ở tình trạng Chưa xác nhận.'};
  if(target.selected==='BO_HOC'){
    var period=source.dropoutPeriod||str_(p.dropoutPeriod,24);
    dropoutPeriod_(period,r.SO_THANG_HO_TRO,false);
    var reasonName=source.dropoutReason||str_(p.dropoutReason,250);
    var possible=reasons.filter(function(x){return x.TRANG_THAI==='ACTIVE' && (x.LY_DO_ID===reasonName||norm_(x.NOI_DUNG)===norm_(reasonName));});
    must_(possible.length===1,'VALIDATION','Cần một lý do bỏ học hợp lệ, duy nhất.');
    return {kind:'eligible',reason:'Chưa xác nhận — được cập nhật.',period:period,reasonId:possible[0].LY_DO_ID};
  }
  return {kind:'eligible',reason:'Chưa xác nhận — được cập nhật.'};
}
function statusBulkSchoolMap_(){var m={};catalogRows_('truong').forEach(function(x){m[x.TRUONG_ID]=x.TEN_TRUONG;});return m;}
function statusBulkCheck_(user,p){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được cập nhật tình trạng hàng loạt.');
  must_(Array.isArray(p.rows)&&p.rows.length>0&&p.rows.length<=120,'VALIDATION','Kiểm tra tối đa 120 dòng mỗi đợt.');
  var target=statusBulkTarget_(p),schools=statusBulkSchoolMap_(),reasons=target.selected==='BO_HOC'?catalogRows_('lydo'):[];
  var byKey={};cachedRecordSnapshot_().forEach(function(r){if(r.SO_QUYET_DINH_KEY){(byKey[r.SO_QUYET_DINH_KEY]||(byKey[r.SO_QUYET_DINH_KEY]=[])).push(r);}});
  var seen={},items=p.rows.map(function(raw){
    var item={line:Number(raw&&raw.line)||0,kind:'invalid',reason:'Dữ liệu không hợp lệ.'};
    try{
      var source=statusBulkSource_(raw);item.line=source.line;
      if(seen[source.key]){item.kind='duplicate';item.reason='Trùng quyết định/năm trong file.';return item;}
      seen[source.key]=true;
      var matches=byKey[source.key]||[];
      if(!matches.length){item.kind='missing';item.reason='Không tìm thấy số quyết định/năm.';return item;}
      if(matches.length!==1){item.kind='duplicate';item.reason='Số quyết định/năm không duy nhất trong dữ liệu hệ thống.';return item;}
      var r=matches[0];statusBulkFind_(source,r,schools);
      var check=statusBulkEligible_(r,target,source,reasons,p);
      return {line:source.line,kind:check.kind,reason:check.reason,hoSoId:check.kind==='eligible'?r.HO_SO_ID:'',version:check.kind==='eligible'?r.PHIEN_BAN:'',currentStatus:r.TRANG_THAI_THAM_GIA,recordName:r.HO_TEN};
    }catch(ex){item.reason=ex.code==='VALIDATION'?ex.message:'Dòng dữ liệu chưa hợp lệ.';return item;}
  });
  return {items:items,total:items.length};
}
function statusBulkApply_(user,p,requestId){return dedupeWrite_(requestId,function(){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được cập nhật tình trạng hàng loạt.');
  must_(Array.isArray(p.rows)&&p.rows.length>0&&p.rows.length<=10,'VALIDATION','Mỗi đợt ghi tối đa 10 hồ sơ.');
  var target=statusBulkTarget_(p),schools=statusBulkSchoolMap_(),reasons=target.selected==='BO_HOC'?catalogRows_('lydo'):[];
  var sh=getSheet_('HO_SO_HOC_NGHE'),last=sh.getLastRow(),hdr=APP.lists.HO_SO_HOC_NGHE;
  must_(sh.getRange(1,40,1,1).getDisplayValues()[0][0]===APP.headersVi.HO_SO_HOC_NGHE[39],'SCHEMA_MISSING','Cấu trúc hồ sơ không hợp lệ.');
  var positions={};if(last>=2){sh.getRange(2,1,last-1,1).getDisplayValues().forEach(function(c,i){if(c[0])positions[c[0]]=i+2;});}
  var seen={},changed=[],results=p.rows.map(function(raw){
    var item={line:Number(raw&&raw.line)||0,kind:'invalid',reason:'Dòng không hợp lệ.'};
    try{
      var source=statusBulkSource_(raw),id=str_(raw.hoSoId,70),expectedVersion=Number(raw.version);item.line=source.line;
      if(seen[source.key]){item.kind='duplicate';item.reason='Trùng quyết định/năm trong đợt.';return item;}seen[source.key]=true;
      if(!id||!positions[id]){item.kind='missing';item.reason='Hồ sơ không còn tồn tại.';return item;}
      var rowNumber=positions[id],cells=sh.getRange(rowNumber,1,1,hdr.length).getDisplayValues()[0],r={};
      hdr.forEach(function(key,i){r[key]=cells[i];});
      must_(r.HO_SO_ID===id,'VALIDATION','Hồ sơ đã thay đổi vị trí.');
      statusBulkFind_(source,r,schools);
      var check=statusBulkEligible_(r,target,source,reasons,p);
      if(check.kind!=='eligible'){item.kind=check.kind;item.reason=check.reason;return item;}
      if(!Number.isInteger(expectedVersion)||expectedVersion!==Number(r.PHIEN_BAN)){
        item.kind='changed';item.reason='Hồ sơ đã thay đổi sau bước kiểm tra, vui lòng kiểm tra lại.';return item;
      }
      var next=Object.assign({},r,{TRANG_THAI_THAM_GIA:target.code,DA_BO_HOC:target.selected==='BO_HOC'?'TRUE':'FALSE',NGAY_BO_HOC:check.period||'',LY_DO_BO_HOC_ID:check.reasonId||'',PHIEN_BAN:String(Number(r.PHIEN_BAN)+1),CAP_NHAT_LUC:now_(),CAP_NHAT_BOI:user.EMAIL});
      sh.getRange(rowNumber,1,1,hdr.length).setValues([hdr.map(function(k){return safeSheetCell_(next[k]);})]);
      changed.push({line:source.line,id:id,before:r.TRANG_THAI_THAM_GIA,after:target.selected});
      return {line:source.line,kind:'updated',reason:'Đã cập nhật.'};
    }catch(ex){item.reason=ex.code==='VALIDATION'?ex.message:'Dòng chưa đủ điều kiện hoặc ghi không thành công.';return item;}
  });
  if(changed.length){
    bump_('DATA');
    try{
      var logs=changed.map(function(x){var o={NHAT_KY_ID:randomId_('LOG'),THOI_GIAN:now_(),TAI_KHOAN_ID:user.TAI_KHOAN_ID,EMAIL:user.EMAIL,HANH_DONG:'CAP_NHAT_TINH_TRANG_HANG_LOAT',LOAI_DOI_TUONG:'HO_SO',BAN_GHI_ID:x.id,NOI_DUNG_THAY_DOI:JSON.stringify({from:x.before,to:x.after,line:x.line,batchId:str_(p.batchId,80)}),KET_QUA:'THANH_CONG',REQUEST_ID:requestId};return APP.lists.NHAT_KY.map(function(k){return safeSheetCell_(o[k]);});});
      var auditSheet=getSheet_('NHAT_KY');auditSheet.getRange(auditSheet.getLastRow()+1,1,logs.length,APP.lists.NHAT_KY.length).setValues(logs);
    }catch(e){console.error('Bulk status audit needs reconciliation',e);}
  }
  return {results:results,updated:changed.length};
});}

/** YC-HN-009: Nhập hồ sơ theo từng đợt, chỉ ADMIN. Không làm thay đổi 7 tab / 79 cột. */
/** YC-HN-012: kiểm tra danh mục mới không ghi dữ liệu; map placeholder chỉ dùng trong lượt nhập. */
function recordBulkPlan_(user,p){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được nhập hồ sơ hàng loạt.');
  var rows=p.rows;
  must_(Array.isArray(rows)&&rows.length>0&&rows.length<=3000,'VALIDATION','Mỗi file cần từ 1 đến 3.000 hồ sơ.');
  var taken={};
  cached_('BULK_DECISIONS',version_('DATA'),180,function(){return sheetRows_('HO_SO_HOC_NGHE').map(function(r){return r.SO_QUYET_DINH_KEY;}).filter(Boolean);}).forEach(function(key){taken[key]=true;});
  var catalogs={truong:{},nghe:{},lydo:{}},newCatalogs={truong:[],nghe:[],lydo:[]},pendingByName={truong:{},nghe:{},lydo:{}},lookups={truong:{},nghe:{},lydo:{}};
  ['truong','nghe','lydo'].forEach(function(type){
    var def=APP.catalog[type];
    catalogRows_(type).forEach(function(c){
      var key=catalogNameKey_(c[def.title]);if(!key)return;
      if(lookups[type][key]){lookups[type][key]={state:'AMBIGUOUS'};return;}
      lookups[type][key]={state:c.TRANG_THAI,id:c[def.id]};
    });
  });
  function resolve(type,name){
    name=str_(name,250);must_(name.length>0,'VALIDATION',type==='truong'?'Thiếu cơ sở đào tạo.':type==='nghe'?'Thiếu nghề đào tạo.':'Thiếu lý do bỏ học.');
    var key=catalogNameKey_(name),match=lookups[type][key];
    if(match){
      must_(match.state!=='AMBIGUOUS','VALIDATION','Có nhiều danh mục trùng tên: '+name+'. Vui lòng kiểm tra Danh mục.');
      must_(match.state==='ACTIVE','VALIDATION','Danh mục đã ngừng sử dụng hoặc lưu trữ: '+name+'. Vui lòng kiểm tra Danh mục.');
      return match.id;
    }
    if(pendingByName[type][key])return pendingByName[type][key];
    var id='PENDING_'+type.toUpperCase()+'_'+String(newCatalogs[type].length+1);
    pendingByName[type][key]=id;
    catalogs[type][id]={TRANG_THAI:'ACTIVE'};
    catalogs[type][id][APP.catalog[type].id]=id;
    newCatalogs[type].push({id:id,name:name});
    return id;
  }
  var result={valid:[],duplicate:[],invalid:[],newCatalogs:newCatalogs},within={};
  rows.forEach(function(raw,i){
    var line=Number(raw&&raw.line)||i+2;
    try{
      must_(raw&&typeof raw==='object'&&!Array.isArray(raw),'VALIDATION','Dòng dữ liệu không hợp lệ.');
      var name=str_(raw.name,250),number=str_(raw.decision,20),date=str_(raw.decisionDate,10);
      must_(Boolean(name),'VALIDATION','Thiếu họ và tên.');
      var key=decisionKey_(number,date);
      if(taken[key]||within[key]){result.duplicate.push({line:line,reason:'Số quyết định đã có trong '+date.slice(0,4)+' hoặc trùng trong file.'});return;}
      var schoolId=resolve('truong',raw.school),tradeId=resolve('nghe',raw.trade);
      var sex=norm_(raw.sex),gender=(sex==='nam'?'NAM':sex==='nu'?'NU':sex==='khac'||!sex?'KHAC':'UNKNOWN');
      must_(gender!=='UNKNOWN','VALIDATION','Giới tính không hợp lệ.');
      var st=norm_(raw.importStatus),status='CHO_XAC_NHAN',dropout=false;
      if(st==='bo hoc'){status='DA_THAM_GIA';dropout=true;}
      else if(st==='dang hoc'||st==='da tham gia'||st==='da tham gia hoc')status='DA_THAM_GIA';
      else if(st==='khong nhan quyet dinh')status='KHONG_NHAN_QUYET_DINH';
      else if(st && customStatusList_().some(function(x){return norm_(x.label)===st})){status=customStatusList_().filter(function(x){return norm_(x.label)===st})[0].id;}
      else if(st==='khong tham gia')status='KHONG_THAM_GIA';
      else must_(!st||st==='chua xac nhan','VALIDATION','Tình trạng học nghề chưa hợp lệ.');
      must_(dropout || (!raw.dropoutReason && !raw.dropoutDate),'VALIDATION','Thông tin bỏ học chỉ dùng khi tình trạng là Bỏ học.');
      var reasonId=dropout?resolve('lydo',raw.dropoutReason):'';
      var data=allowedRecord_({HO_TEN:name,NGAY_SINH:str_(raw.birthDate,10),GIOI_TINH:gender,
        SO_QUYET_DINH:number,NGAY_QUYET_DINH:date,TRUONG_ID:schoolId,NGHE_ID:tradeId,
        NGAY_BAT_DAU:str_(raw.startDate,10),NGAY_KET_THUC_DU_KIEN:str_(raw.endDate,10),
        TRANG_THAI_THAM_GIA:status,DA_BO_HOC:dropout,NGAY_BO_HOC:str_(raw.dropoutDate,24),LY_DO_BO_HOC_ID:reasonId,GHI_CHU:'',SO_SO_BHXH:raw.SO_SO_BHXH,SO_QD_TCTN:raw.SO_QD_TCTN,NGAY_QD_TCTN:raw.NGAY_QD_TCTN,SO_THANG_HO_TRO:raw.SO_THANG_HO_TRO,MUC_HO_TRO_THANG:raw.MUC_HO_TRO_THANG,NGAY_KET_THUC_TCTN:raw.NGAY_KET_THUC_TCTN,NGAY_KET_THUC_HO_TRO:raw.NGAY_KET_THUC_HO_TRO,DIA_CHI_TAM_TRU:raw.DIA_CHI_TAM_TRU,DIA_CHI_THUONG_TRU:raw.DIA_CHI_THUONG_TRU,SO_CMND:raw.SO_CMND,NGAY_CAP_CMND:raw.NGAY_CAP_CMND,NOI_CAP_CMND:raw.NOI_CAP_CMND,DIA_CHI_CO_SO:raw.DIA_CHI_CO_SO,CHI_NHANH_BHTN:raw.CHI_NHANH_BHTN,DIEN_THOAI:raw.DIEN_THOAI},null,catalogs,validDate_(raw.dropoutDate));
      must_(!data.NGAY_BAT_DAU||!data.NGAY_KET_THUC_DU_KIEN||data.NGAY_KET_THUC_DU_KIEN>=data.NGAY_BAT_DAU,'VALIDATION','Ngày kết thúc dự kiến trước ngày bắt đầu.');
      within[key]=true;result.valid.push({line:line,record:data});
    }catch(ex){result.invalid.push({line:line,reason:ex.code==='VALIDATION'?ex.message:'Dòng dữ liệu chưa hợp lệ.'});}
  });
  // Không đưa danh mục phát sinh từ hồ sơ lỗi hoặc hồ sơ trùng vào kế hoạch tạo mới.
  ['truong','nghe','lydo'].forEach(function(type){
    var field={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_BO_HOC_ID'}[type],validIds={};
    result.valid.forEach(function(x){validIds[x.record[field]]=true;});
    newCatalogs[type]=newCatalogs[type].filter(function(x){return validIds[x.id];});
  });
  return result;
}
function recordBulkCheck_(user,p){
  var plan=recordBulkPlan_(user,p);
  return {total:p.rows.length,valid:plan.valid.length,duplicate:plan.duplicate.length,invalid:plan.invalid.length,
    newCatalogs:{truong:plan.newCatalogs.truong.map(function(x){return x.name;}),nghe:plan.newCatalogs.nghe.map(function(x){return x.name;}),lydo:plan.newCatalogs.lydo.map(function(x){return x.name;})},
    issues:plan.invalid.map(function(x){return Object.assign({kind:'invalid'},x);}).concat(plan.duplicate.map(function(x){return Object.assign({kind:'duplicate'},x);})).sort(function(a,b){return a.line-b.line;}).slice(0,1200)};
}
/** Lưu cùng một LockService, kiểm tra lại cả số quyết định lẫn danh mục ngay trước khi ghi. */
function recordBulkImport_(user,p,requestId){return dedupeWrite_(requestId,function(){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được nhập hồ sơ hàng loạt.');
  must_(Array.isArray(p.rows)&&p.rows.length<=40&&p.rows.length>0,'VALIDATION','Mỗi đợt tối đa 40 hồ sơ.');
  var plan=recordBulkPlan_(user,p),ts=now_(),headers=APP.lists.HO_SO_HOC_NGHE;
  var idMap={},catalogCreated={truong:0,nghe:0,lydo:0};
  ['truong','nghe','lydo'].forEach(function(type){
    var entries=plan.newCatalogs[type],def=APP.catalog[type];if(!entries.length)return;
    var list=sheetRows_(def.sheet),used={};list.forEach(function(c){used[c[def.code]]=true;});
    var rows=[];
    entries.forEach(function(entry){
      var code=nextCatalogCode_(type,list),item={TRANG_THAI:'ACTIVE',TAO_LUC:ts,CAP_NHAT_LUC:ts,GHI_CHU:'',THU_TU:'0'};
      item[def.id]=randomId_(type.toUpperCase());item[def.code]=code;item[def.title]=entry.name;
      if(type==='truong'){item.TEN_VIET_TAT='';item.DIA_CHI='';}
      idMap[entry.id]=item[def.id];list.push(item);
      rows.push(APP.lists[def.sheet].map(function(k){return safeSheetCell_(item[k]);}));
    });
    if(rows.length){var sh=getSheet_(def.sheet);sh.getRange(sh.getLastRow()+1,1,rows.length,APP.lists[def.sheet].length).setValues(rows);catalogCreated[type]=rows.length;bump_('CAT');}
  });
  var values=plan.valid.map(function(item){
    var data=Object.assign({},item.record,{HO_SO_ID:randomId_('HS'),NGUOI_HOC_ID:randomId_('NH'),
      TRANG_THAI_HO_SO:'ACTIVE',TEP_DRIVE_ID:'',TAO_LUC:ts,TAO_BOI:user.EMAIL,
      CAP_NHAT_LUC:ts,CAP_NHAT_BOI:user.EMAIL,PHIEN_BAN:'1'});
    data.TRUONG_ID=idMap[data.TRUONG_ID]||data.TRUONG_ID;
    data.NGHE_ID=idMap[data.NGHE_ID]||data.NGHE_ID;
    if(data.LY_DO_BO_HOC_ID)data.LY_DO_BO_HOC_ID=idMap[data.LY_DO_BO_HOC_ID]||data.LY_DO_BO_HOC_ID;
    must_(!/^PENDING_/.test(data.TRUONG_ID)&&!/^PENDING_/.test(data.NGHE_ID)&&!/^PENDING_/.test(data.LY_DO_BO_HOC_ID),'VALIDATION','Chưa thể liên kết danh mục mới.');
    return headers.map(function(k){return safeSheetCell_(data[k]);});
  });
  if(values.length){
    var sh=getSheet_('HO_SO_HOC_NGHE');sh.getRange(sh.getLastRow()+1,1,values.length,headers.length).setValues(values);
    bump_('DATA');
    try{audit_(user,'NHAP_HO_SO_HANG_LOAT','HO_SO','BATCH',{imported:values.length,duplicate:plan.duplicate.length,invalid:plan.invalid.length,batchId:str_(p.batchId,80),addedCatalogs:catalogCreated,lines:plan.valid.map(function(x){return x.line;}).slice(0,40)},requestId);}catch(e){console.error('Audit failed',e);}
  }
  return {added:values.length,duplicate:plan.duplicate.length,invalid:plan.invalid.length,
    addedCatalogs:catalogCreated,issues:plan.duplicate.concat(plan.invalid).slice(0,40)};
});}

function overview_(user,p){
  var filters=reportFilters_(p),year=filters.year,truong=filters.truong,nghe=filters.nghe;
  return cached_('OVERVIEW',[version_('DATA'),version_('USERS'),user.TAI_KHOAN_ID,user.EMAIL,user.VAI_TRO,user.TRUONG_ID||'',year,truong,nghe,filters.status,filters.from,filters.to],90,function(){
    var all=reportRecords_(filters,user,false);
    var k={total:all.length,participated:0,learning:0,dropout:0,notParticipating:0,pending:0}, extras={notReceived:0,other:0}, schools={},trades={};
    all.forEach(function(r){
      if(r.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'){k.participated++; if(bool_(r.DA_BO_HOC))k.dropout++;else k.learning++;}
      else if(r.TRANG_THAI_THAM_GIA==='KHONG_THAM_GIA')k.notParticipating++;
      else if(r.TRANG_THAI_THAM_GIA==='CHO_XAC_NHAN')k.pending++;
      else if(r.TRANG_THAI_THAM_GIA==='KHONG_NHAN_QUYET_DINH')extras.notReceived++;
      else extras.other++;
      schools[r.TRUONG_ID]=(schools[r.TRUONG_ID]||0)+1;trades[r.NGHE_ID]=(trades[r.NGHE_ID]||0)+1;
    });
    return {kpi:k,statusCounts:extras,schoolCounts:schools,tradeCounts:trades};
  });
}
/** Xuất báo cáo tham mưu theo cơ sở/nghề, chỉ trả số liệu tổng hợp. */
function reportMatrix_(user,p){
  must_(user.VAI_TRO==='ADMIN','NO_PERMISSION','Chỉ Quản trị viên được xuất Excel.');
  var by=str_(p.groupBy,20);
  must_(by==='truong'||by==='nghe','VALIDATION','Vui lòng chọn mẫu báo cáo theo cơ sở hoặc theo nghề.');
  var rows=reportRecords_(p,user,false),key=by==='truong'?'TRUONG_ID':'NGHE_ID',groups={};
  rows.forEach(function(r){
    var id=r[key]||'UNKNOWN',g=groups[id]||(groups[id]={id:id,total:0,learning:0,dropout:0,notParticipating:0,notReceived:0,pending:0,other:0});
    g.total++;
    if(r.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'){if(bool_(r.DA_BO_HOC))g.dropout++;else g.learning++;}
    else if(r.TRANG_THAI_THAM_GIA==='KHONG_THAM_GIA')g.notParticipating++;
    else if(r.TRANG_THAI_THAM_GIA==='KHONG_NHAN_QUYET_DINH')g.notReceived++;
    else if(r.TRANG_THAI_THAM_GIA==='CHO_XAC_NHAN')g.pending++;
    else g.other++;
  });
  var def=APP.catalog[by],names={};catalogRows_(by).forEach(function(c){names[c[def.id]]=c[def.title];});
  var items=Object.keys(groups).map(function(id){return Object.assign({name:names[id]||'Chưa xác định'},groups[id]);}).sort(function(a,b){return a.name.localeCompare(b.name,'vi');});
  return {groupBy:by,items:items,total:rows.length,filters:reportFilters_(p)};
}
function exportRecords_(user,p){
  var all=reportRecords_(p,user); must_(all.length<=5000,'EXPORT_TOO_LARGE','Tối đa 5.000 hồ sơ cho mỗi lần xuất. Hãy thu hẹp bộ lọc.');
  var schools={},trades={};catalogRows_('truong').forEach(function(x){schools[x.TRUONG_ID]=x.TEN_TRUONG;});catalogRows_('nghe').forEach(function(x){trades[x.NGHE_ID]=x.TEN_NGHE;});
  return {columns:['STT', 'Họ và tên', 'Năm sinh', 'Giới tính', 'Số sổ BHXH', 'Số QĐ HTHN', 'Ngày ban hành QĐHN', 'Số QĐ TCTN', 'Ngày ban hành QĐ TCTN', 'Nghề đăng ký', 'Số tháng hỗ trợ', 'Mức hỗ trợ/tháng', 'Thời gian đào tạo - Từ ngày', 'Thời gian đào tạo - Đến ngày', 'Cơ sở đào tạo nghề', 'Ngày kết thúc hưởng TCTN', 'Ngày kết thúc hỗ trợ học nghề', 'Địa chỉ tạm trú', 'Địa chỉ thường trú', 'Số CMND', 'Ngày cấp CMND', 'Nơi cấp CMND', 'Địa chỉ cơ sở đào tạo', 'Chi nhánh BHTN', 'Điện thoại'],items:all.map(function(x,i){return [i+1,x.HO_TEN,x.NGAY_SINH,x.GIOI_TINH,x.SO_SO_BHXH,x.SO_QUYET_DINH,x.NGAY_QUYET_DINH,x.SO_QD_TCTN,x.NGAY_QD_TCTN,trades[x.NGHE_ID]||x.NGHE_ID,supportMonthsVN_(x.SO_THANG_HO_TRO),supportAmountVN_(x.MUC_HO_TRO_THANG),x.NGAY_BAT_DAU,x.NGAY_KET_THUC_DU_KIEN,schools[x.TRUONG_ID]||x.TRUONG_ID,x.NGAY_KET_THUC_TCTN,x.NGAY_KET_THUC_HO_TRO,x.DIA_CHI_TAM_TRU,x.DIA_CHI_THUONG_TRU,x.SO_CMND,x.NGAY_CAP_CMND,x.NOI_CAP_CMND,x.DIA_CHI_CO_SO,x.CHI_NHANH_BHTN,x.DIEN_THOAI];})};
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

function accountsList_(){var mappings={};sheetRows_('CAU_HINH').forEach(function(r){if(r.KHOA.indexOf('HN_SCHOOL_')===0)mappings[r.KHOA.slice(10)]=r.GIA_TRI;});return {items:sheetRows_('TAI_KHOAN').filter(function(u){return u.TRANG_THAI!=='DELETED';}).map(function(u){var x=safeUser_(u);x.TRUONG_ID=mappings[u.TAI_KHOAN_ID]||'';return x;})};}
function accountSave_(admin,p,requestId){return dedupeWrite_(requestId,function(){
  var id=str_(p.id,60),email=str_(p.email,200).toLowerCase(),role=str_(p.role,20),status=str_(p.status,10);
  must_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'VALIDATION','Email không hợp lệ.');
  must_(['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO'].indexOf(role)>=0,'VALIDATION','Vai trò không hợp lệ.');
  var schoolId=str_(p.schoolId,80);
  if(role==='CO_SO_DAO_TAO')must_(!!schoolId && catalogRows_('truong').some(function(x){return x.TRUONG_ID===schoolId && x.TRANG_THAI==='ACTIVE';}),'VALIDATION','Vui lòng chọn một cơ sở đào tạo hợp lệ.');
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
  if(role==='CO_SO_DAO_TAO')setSchoolBinding_(item.TAI_KHOAN_ID,schoolId,admin);
  else if(old && old.VAI_TRO==='CO_SO_DAO_TAO')setSchoolBinding_(item.TAI_KHOAN_ID,'',admin);
  if(old)writeRecord_('TAI_KHOAN',findRowNumber_('TAI_KHOAN','TAI_KHOAN_ID',id),item);else appendRecord_('TAI_KHOAN',item);
  bump_('USERS');
  try{audit_(admin,old?'SUA_TAI_KHOAN':'TAO_TAI_KHOAN','TAI_KHOAN',item.TAI_KHOAN_ID,{email:email,role:role,status:status,schoolBefore:old&&old.VAI_TRO==='CO_SO_DAO_TAO'?'Có phân công':null,schoolAfter:role==='CO_SO_DAO_TAO'?schoolId:null},requestId);}catch(e){console.error('Audit failed',e);}
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

function listAudit_(p){
  // Nhật ký append-only: chỉ đọc 30 hàng của trang yêu cầu thay vì đọc toàn bộ tab.
  var page=Math.min(Math.max(Number(p.page)||1,1),10000),size=30,sh=getSheet_('NHAT_KY'),last=sh.getLastRow();
  var total=Math.max(0,last-1),end=last-(page-1)*size,items=[];
  if(end>=2){
    var count=Math.min(size,end-1),start=end-count+1,hdr=APP.lists.NHAT_KY;
    items=sh.getRange(start,1,count,hdr.length).getDisplayValues().reverse().filter(function(row){return row[0]!=='';}).map(function(values){var r={};hdr.forEach(function(k,i){r[k]=values[i];});return r;});
  }
  return {items:items,total:total,page:page,pageSize:size};
}
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

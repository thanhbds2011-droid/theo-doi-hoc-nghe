import {downloadReportXlsx,downloadXlsx} from './xlsx-export.js?v=1.2.24-RC';
/** THEO DÕI HỌC NGHỀ — v1.2.24-RC (YC-HN-030 V1, kế thừa YC-HN-029 V5 và giao diện chức danh V4). Không lưu token/PII vào localStorage. */
const $ = (s, root = document) => root.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dataAttr = esc;
const num = value => Number(value || 0).toLocaleString('vi-VN');
// YC-HN-012: cùng cách hiển thị tại Thêm, Sửa, Chi tiết và kết quả xuất dữ liệu.
const supportMonthsVN = value => String(value??'').trim().replace('.',',');
const supportMoneyVN = value => {
  const raw=String(value??'').trim();
  if(!/^\d+(?:\.\d{1,2})?$/.test(raw))return raw;
  const [int,fraction]=raw.split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(fraction?','+fraction:'');
};
const option = (value, label, selected = '') => `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
const dateVN = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : (d || '—');
const STATUS = { CHO_XAC_NHAN:'Chưa xác nhận', DA_THAM_GIA:'Đã tham gia học', KHONG_THAM_GIA:'Không tham gia', KHONG_NHAN_QUYET_DINH:'Không nhận quyết định' };
const COURSE_END_FILTER='FILTER_COURSE_END_DATE'; // Tra ngày kết thúc DỰ KIẾN, không xác nhận tốt nghiệp.
const ALL_DECISIONS_FILTER='FILTER_ALL_DECISIONS'; // Bộ lọc ảo, không lưu vào dữ liệu nguồn.
const BULK_KIND_VI={eligible:'Đủ điều kiện',updated:'Đã cập nhật',same:'Đã đúng tình trạng',protected:'Đã có tình trạng khác',changed:'Dữ liệu đã thay đổi',missing:'Không tìm thấy hồ sơ',duplicate:'Trùng',invalid:'Thông tin chưa hợp lệ',unselected:'Không đánh dấu',ignored:'Dòng tổng hợp',pending:'Chưa xử lý'};
const statusBulkKindVi=x=>BULK_KIND_VI[x]||'Chưa xác định';
const STATUS_FORM = { DA_THAM_GIA:'Đã tham gia học', KHONG_THAM_GIA:'Không tham gia', BO_HOC:'Bỏ học', KHONG_NHAN_QUYET_DINH:'Không nhận quyết định', CHO_XAC_NHAN:'Chưa xác nhận' };
const RIGHTS = { RECORD_VIEW:'Xem hồ sơ', RECORD_CREATE:'Thêm hồ sơ', RECORD_EDIT:'Sửa hồ sơ', RECORD_DELETE:'Xóa hồ sơ', RECORD_STATUS:'Cập nhật tình trạng', REPORT_VIEW:'Xem báo cáo', CATALOG_MANAGE:'Quản lý danh mục', ACCOUNT_MANAGE:'Quản lý tài khoản', AUDIT_VIEW:'Xem nhật ký', FILE_VIEW:'Xem tệp', FILE_UPLOAD:'Tải lên/xóa tệp' };
const NAMES = { truong:'Cơ sở đào tạo', nghe:'Nghề đào tạo', lydo:'Lý do bỏ học' };
const state = {
  token:'', session:false, clientId:'', user:null, cats:{truong:[],nghe:[],lydo:[]}, statuses:[], page:'dashboard', routeVersion:0,
  filters:{year:'',truong:'',nghe:'',status:'',dropout:'',query:'',from:'',to:''},
  dashboardFilters:{year:'',truong:'',nghe:''}, reportFilters:{year:'',truong:'',nghe:'',status:'',from:'',to:''},
  records:[], recordPage:1, recordTotal:0, accountRows:[], auditPage:1, catalogType:'truong', catalogSearch:'', bulkRows:null, importRows:null, importFile:null, importPreview:null, importSession:null, statusImport:null,
  cache:new Map(), inFlight:new Map(), pageViews:new Map(), renderedPage:null, generation:0, busy:false, usedPerson:null, permissionRevision:"", permissionChecked:0, permissionPromise:null, dataRevision:"", catalogRevision:"", statusRevision:"", pageDataAt:new Map(), scope:"", lastRecordSearchMs:0, recordLoadVersion:0, recordLoading:false, activeRecordRequestKey:"", lastPermissionFocusCheck:0, renderedDataRevision:"", needsActiveRefresh:false, lastDataRefreshAt:0, dataCheckTimer:null, pendingConflictRecord:"", routeLoading:false
};

function notify(message, error=false){ const el=$('#toast');el.textContent=String(message);el.className='toast show'+(error?' error':'');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),5500); }
const ERROR_TEXT = {
  LOGIN_EXPIRED:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', NOT_AUTHORIZED:'Tài khoản chưa được cấp quyền hoặc đã bị khóa.', NO_PERMISSION:'Bạn chưa được cấp quyền thực hiện thao tác này.', CATALOG_IN_USE:'Danh mục đã có hồ sơ sử dụng. Vui lòng chọn Ngừng sử dụng thay vì xóa.', CANNOT_DELETE_SELF:'Bạn không thể xóa tài khoản đang đăng nhập.', LAST_ADMIN:'Hệ thống phải có ít nhất một Quản trị viên đang hoạt động.', NOT_OWNER:'Bạn chỉ được xóa hồ sơ do chính mình tạo.',
  DECISION_DUPLICATE:'Số quyết định đã tồn tại trong năm được chọn. Vui lòng kiểm tra lại.', DUPLICATE:'Thông tin này đã tồn tại. Vui lòng kiểm tra lại.', VERSION_CONFLICT:'Hồ sơ vừa được người khác cập nhật. Thay đổi của bạn chưa được lưu. Vui lòng kiểm tra thông tin mới nhất.', NOT_FOUND:'Không tìm thấy thông tin cần thao tác. Vui lòng tải lại danh sách.', ALREADY_DELETED:'Hồ sơ này đã được xóa trước đó.',
  FILE_TOO_LARGE:'Tệp vượt dung lượng tối đa 10 MB.', VALIDATION:'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.', UPLOAD_EXPIRED:'Lượt tải đã hết hạn. Vui lòng chọn lại tệp.', UPLOAD_OFFSET:'Có gián đoạn trong quá trình tải tệp. Vui lòng thử lại.', UPLOAD_UNAVAILABLE:'Không tải được tệp lúc này. Vui lòng thử lại.', DOWNLOAD_UNAVAILABLE:'Không tải được tệp lúc này. Vui lòng thử lại.',
  GATEWAY_UNAVAILABLE:'Hệ thống tạm thời không phản hồi. Vui lòng thử lại sau.', SERVER_ERROR:'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', INTERNAL_ERROR:'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', BUSY:'Hệ thống đang xử lý yêu cầu khác. Vui lòng thử lại.', SCHEMA_MISMATCH:'Dữ liệu hệ thống cần được quản trị viên kiểm tra.', USE_CHUNK_UPLOAD:'Vui lòng tải lại trang và thử đính kèm tệp.'
};
function friendlyError(code,message){
  if(ERROR_TEXT[code])return ERROR_TEXT[code];
  // Chỉ hiển thị thông báo nghiệp vụ đã được phía máy chủ mã hóa phù hợp.
  if(['VALIDATION','DUPLICATE'].includes(code)&&message && !/\b[A-Z][A-Z0-9_]{2,}\b|Google|API|Script|JSON|\{|\}/.test(message))return message;
  return 'Thao tác chưa hoàn tất. Vui lòng thử lại hoặc liên hệ quản trị viên.';
}
function failure(e){notify(e?.message||'Thao tác chưa hoàn tất. Vui lòng thử lại.',true);}
const STAFF_RIGHTS=new Set(['RECORD_VIEW','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','REPORT_EXPORT']);
function allowed(p){return state.user?.VAI_TRO==='ADMIN'||(state.user?.VAI_TRO==='NHAN_VIEN'&&STAFF_RIGHTS.has(p))||(state.user?.VAI_TRO==='CO_SO_DAO_TAO'&&['RECORD_VIEW','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','REPORT_EXPORT'].includes(p));}
const allStatusOptions=()=>[...Object.entries(STATUS_FORM),...state.statuses.map(x=>[x.id,x.label])];
const isSchoolAccount=()=>state.user?.VAI_TRO==='CO_SO_DAO_TAO';
function rid(){return 'r_'+(crypto?.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(36).slice(2)));}
function permissionScope(){const u=state.user||{};return [u.TAI_KHOAN_ID||'',u.EMAIL||'',u.VAI_TRO||'',u.TRUONG_ID||'',state.permissionRevision||''].join('|');}
function cacheKey(a,p){return permissionScope()+'::'+a+'|'+JSON.stringify(p||{});}
function cacheAction(key){return key.split('::').slice(1).join('::').split('|')[0];}
function expireCacheActions(actions){for(const k of state.cache.keys())if(actions.includes(cacheAction(k)))state.cache.delete(k);}
function trimCache(){while(state.cache.size>110)state.cache.delete(state.cache.keys().next().value);}
/** YC-HN-017: kiểm tra quyền một lần cho nhiều lượt điều hướng đồng thời.
 * Dữ liệu có quyền truy cập chỉ được khôi phục sau khi bước này thành công.
 */
async function verifyPermission(force=false){
  if(!state.session||(!force&&Date.now()-state.permissionChecked<120000))return true;
  if(state.permissionPromise)return state.permissionPromise;
  state.permissionPromise=(async()=>{
    const data=await rpc('permission_check',{}, {ttl:0});
    const u=state.user||{},n=data.user||{};
    if([u.TAI_KHOAN_ID,u.EMAIL,u.VAI_TRO,u.TRUONG_ID||'',u.TRANG_THAI].join('|')!==[n.TAI_KHOAN_ID,n.EMAIL,n.VAI_TRO,n.TRUONG_ID||'',n.TRANG_THAI].join('|')){
      signOut();throw Error('Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại để nhận quyền mới.');
    }
    if(state.permissionRevision!==(data.permissionRevision||'')){
      state.cache.clear();state.pageViews.clear();state.pageDataAt.clear();state.generation++;
      state.permissionRevision=data.permissionRevision||'';
    }
    if(state.catalogRevision!==(data.catalogRevision||'')||state.statusRevision!==(data.statusRevision||'')){
      // Chỉ tải danh mục đầy đủ khi dữ liệu danh mục thay đổi, không tải mỗi 120 giây.
      const refreshed=await rpc('bootstrap',{}, {ttl:0});
      const fresh=refreshed.user||{};
      if([n.TAI_KHOAN_ID,n.EMAIL,n.VAI_TRO,n.TRUONG_ID||''].join('|')!==[fresh.TAI_KHOAN_ID,fresh.EMAIL,fresh.VAI_TRO,fresh.TRUONG_ID||''].join('|')){
        signOut();throw Error('Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.');
      }
      state.cats=refreshed.catalogs;state.statuses=refreshed.statuses||[];
      state.catalogRevision=refreshed.catalogRevision||'';state.statusRevision=refreshed.statusRevision||'';
      state.cache.clear();state.pageViews.clear();state.pageDataAt.clear();state.generation++;
    }
    if(state.dataRevision!==(data.dataRevision||'')){
      // A verified change invalidates the DOM snapshot as well as API cache.
      // Never assign the new revision to previously rendered old HTML.
      state.cache.clear();state.inFlight.clear();state.pageViews.clear();state.pageDataAt.clear();
      state.generation++;state.needsActiveRefresh=true;
      state.dataRevision=data.dataRevision||'';
    }
    // Role/school are already verified above; display-only metadata may change without logout.
    state.user={...u,CHUC_DANH_HIEN_THI:n.CHUC_DANH_HIEN_THI||''};
    renderCurrentUser();
    state.permissionChecked=Date.now();
    return true;
  })();
  try{return await state.permissionPromise;}finally{
    state.permissionPromise=null;
    if(state.needsActiveRefresh)void refreshVisibleStaleData();
  }
}

async function rpc(action,payload={},options={}) {
  if(!state.token&&!state.session) throw Error('Bạn cần đăng nhập Google.');
  const read = !options.mutate && options.ttl!==0 && action!=='bootstrap';
  const key=cacheKey(action,payload),ttl=Number(options.ttl ?? 45000);
  if(read && state.cache.has(key) && Date.now()-state.cache.get(key).at<ttl)return state.cache.get(key).value;
  if(read && state.inFlight.has(key))return state.inFlight.get(key);
  const generation=state.generation;
  const run=async()=>{
    let res;
    try {res=await fetch('/api/rpc',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'HocNgheWeb'},credentials:'same-origin',body:JSON.stringify({action,payload,...(state.token?{idToken:state.token}:{}),requestId:options.requestId||rid()}),cache:'no-store'});}
    catch(e){throw Error('Không kết nối được hệ thống. Vui lòng kiểm tra mạng và thử lại.');}
    let out;
    try{out=await res.json();}catch{throw Error('Hệ thống chưa phản hồi đầy đủ. Vui lòng kiểm tra lại thao tác trước khi thử lại.');}
    if(!out.ok){const code=out.error?.code||'SERVER_ERROR';if(code==='LOGIN_EXPIRED'){signOut();}const e=new Error(friendlyError(code,out.error?.message));e.code=code;throw e;}
    if(options.mutate){
      state.generation++;state.dataRevision='';state.renderedDataRevision='';
      if(options.preserveRecordList){expireCacheActions(['overview','report_matrix','report_export']);state.pageViews.delete('dashboard');state.pageViews.delete('reports');}
      else{state.cache.clear();state.pageViews.clear();state.renderedPage=null;}
      state.inFlight.clear();
    }
    else if(ttl>0 && generation===state.generation){state.cache.set(key,{at:Date.now(),value:out.data});trimCache();}
    return out.data;
  };
  const promise=run();
  if(read)state.inFlight.set(key,promise);
  try{return await promise;}finally{if(read && state.inFlight.get(key)===promise)state.inFlight.delete(key);}
}
// YC-HN-029 V5: light foreground-only revision polling. No third-party service.
const DATA_CHECK_INTERVAL_MS=90000; // Maximum normal foreground detection delay ~90s + network.
function startDataChecks(){
  stopDataChecks();
  state.dataCheckTimer=setInterval(()=>{
    if(state.session&&!state.busy&&document.visibilityState==='visible')
      void verifyPermission(true).catch(()=>{/* Do not interrupt a user's draft for a transient poll failure. */});
  },DATA_CHECK_INTERVAL_MS);
}
function stopDataChecks(){if(state.dataCheckTimer){clearInterval(state.dataCheckTimer);state.dataCheckTimer=null;}}
async function refreshVisibleStaleData(){
  if(!state.needsActiveRefresh||!state.session||state.permissionPromise||state.routeLoading||state.busy||document.visibilityState==='hidden')return;
  if(!$('#modal-layer')?.classList.contains('hidden')){
    const form=$('#status-form');
    if(form)void checkOpenStatusVersion(form).catch(()=>{});
    return; // Do not replace a form draft or a modal on top of it.
  }
  state.lastDataRefreshAt=Date.now();
  state.needsActiveRefresh=false;
  const page=state.page;
  if(page==='dashboard'||page==='reports'){
    await refreshCurrentAggregate(page); // preserve filters, refresh only results.
  }else if(page==='records'&&$('#records-filters')){
    await refreshRecordResults('Đang cập nhật danh sách hồ sơ…'); // keep search/page/scroll.
    state.renderedDataRevision=state.dataRevision;
  }else if(page==='audits'||page==='accounts'||page==='catalogs'){
    navigate(page,true);
  }
}
async function checkOpenStatusVersion(form){
  if(!form?.isConnected||form.dataset.conflictCheck==='yes')return;
  form.dataset.conflictCheck='yes';
  try{
    const fresh=await rpc('record_fresh',{HO_SO_ID:form.elements.HO_SO_ID.value},{ttl:0});
    if(!form.isConnected)return;
    if(Number(fresh.record.PHIEN_BAN)!==Number(form.elements.PHIEN_BAN.value)){
      renderStatusConflict(form,fresh.record);
    }
  }catch(e){if(e.code==='NO_PERMISSION'||e.code==='NOT_FOUND'){
    const area=$('#status-conflict');if(area)area.innerHTML='<p role="alert">Hồ sơ không còn khả dụng hoặc bạn không có quyền xem. Vui lòng đóng biểu mẫu và kiểm tra lại danh sách.</p>';
    const button=form.querySelector('[data-submit-btn]');if(button)button.disabled=true;
  }}finally{if(form.isConnected)form.dataset.conflictCheck='';}
}
async function initialize(){
  try{
    const res=await fetch('/api/config',{cache:'no-store'}), cfg=await res.json();
    if(!cfg.ok||!cfg.clientId)throw Error('Chức năng đăng nhập chưa sẵn sàng. Vui lòng liên hệ quản trị viên.');
    state.clientId=cfg.clientId;
    let tries=0;
    while(!window.google?.accounts?.id && tries++<80)await new Promise(r=>setTimeout(r,150));
    if(!window.google?.accounts?.id)throw Error('Không tải được trang đăng nhập. Vui lòng kiểm tra kết nối và tải lại trang.');
    google.accounts.id.initialize({client_id:state.clientId,callback:credentialResponse,auto_select:false,ux_mode:'popup'});
    $('#login-note').textContent='Đang kiểm tra phiên đăng nhập…';
    try{
      state.session=true;const result=await rpc('bootstrap',{}, {ttl:0});activateSession(result);
    }catch(e){state.session=false;state.token='';$('#login-note').textContent='Đăng nhập bằng tài khoản đã được cấp quyền.';}
    if(!state.session)google.accounts.id.renderButton($('#google-login'),{theme:'outline',size:'large',shape:'pill',text:'signin_with',width:270});

  }catch(e){$('#login-note').textContent=e.message;failure(e);}
}
async function credentialResponse(response){
  if(!response?.credential)return;
  state.token=response.credential;
  $('#login-note').textContent='Đang kiểm tra tài khoản và phân quyền…';
  try{
    const data=await rpc('bootstrap',{}, {ttl:0});
    activateSession(data);
  }catch(e){state.token='';state.session=false;$('#login-note').textContent='Không thể đăng nhập.';failure(e);}
}
/** YC-HN-029 V4: Chỉ trang trí chức danh; mọi quyền vẫn dựa vào VAI_TRO tại backend. */
function renderCurrentUser(){
  if(!state.user)return;
  const u=state.user;
  const sub=u.VAI_TRO==='ADMIN'?'Quản trị viên':u.VAI_TRO==='CO_SO_DAO_TAO'?'Cơ sở đào tạo: '+lookup('truong',u.TRUONG_ID):u.CHUC_DANH_HIEN_THI||'Nhân viên';
  const roleStyle=u.VAI_TRO==='ADMIN'?'admin':u.VAI_TRO==='CO_SO_DAO_TAO'?'school':
    /(^|\s)phó\s+(?:trưởng\s+)?phòng(?=\s|$|[,;:–-])/i.test(sub)?'deputy':
    /(^|\s)trưởng\s+phòng(?=\s|$|[,;:–-])/i.test(sub)?'manager':'staff';
  $('#current-user').innerHTML=`<b class="user-display-name" title="${esc(u.HO_TEN||u.EMAIL)}">${esc(u.HO_TEN||u.EMAIL)}</b><span class="user-role-badge user-role-badge--${roleStyle}" title="${esc(sub)}">${esc(sub)}</span>`;
}
function activateSession(data){
  state.session=true;state.user=data.user;state.cats=data.catalogs;state.statuses=data.statuses||[];state.token='';state.permissionRevision=data.permissionRevision||'';state.dataRevision=data.dataRevision||'';state.catalogRevision=data.catalogRevision||'';state.statusRevision=data.statusRevision||'';state.permissionChecked=Date.now();state.pageDataAt.clear();
  state.pageViews.clear();state.cache.clear();state.inFlight.clear();state.renderedPage=null;state.renderedDataRevision=state.dataRevision;state.needsActiveRefresh=false;startDataChecks();
  $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
  renderCurrentUser();
  navigate('dashboard');
}
function signOut(){stopDataChecks();if(state.session){fetch('/api/rpc',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'HocNgheWeb'},body:JSON.stringify({action:'logout'})}).catch(()=>{});}state.session=false;state.token='';state.user=null;state.permissionRevision='';state.permissionChecked=0;state.permissionPromise=null;state.dataRevision='';state.catalogRevision='';state.statusRevision='';state.pageDataAt.clear();state.generation++;state.cache.clear();state.inFlight.clear();state.pageViews.clear();state.renderedPage=null;state.renderedDataRevision='';state.needsActiveRefresh=false;state.records=[];state.cats={truong:[],nghe:[],lydo:[]};state.statuses=[];$('#app').classList.add('hidden');$('#login').classList.remove('hidden');closeModal();if(window.google?.accounts?.id)google.accounts.id.disableAutoSelect();$('#login-note').textContent='Đăng nhập lại bằng tài khoản Google.';}
// YC-HN-006 — Bộ biểu tượng vector đồng nhất, không phụ thuộc font/emoji bên ngoài.
const ICON_PATHS={
  'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  'house':'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-8h6v8"/>',
  'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  'chart-column':'<path d="M3 21h18"/><rect x="5" y="12" width="4" height="9" rx=".5"/><rect x="11" y="7" width="4" height="14" rx=".5"/><rect x="17" y="3" width="4" height="18" rx=".5"/>',
  'layout-grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  'user-round':'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/>',
  'clock-3':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  'filter':'<path d="M3 4h18l-7 8v7l-4 2v-9Z"/>',
  'clipboard-list':'<rect x="5" y="5" width="14" height="17" rx="2"/><path d="M9 5V3h6v2M9 11h6M9 15h6"/>',
  'check':'<path d="m4 12 5 5L20 6"/>',
  'graduation-cap':'<path d="m2 10 10-5 10 5-10 5-10-5ZM6 12v5c3 3 9 3 12 0v-5M22 10v8"/>',
  'file-x':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 14l6 6m0-6-6 6"/>',
  'arrow-down-right':'<path d="M5 5 19 19M10 19h9v-9"/>',
  'x':'<path d="M5 5 19 19M19 5 5 19"/>',
  'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'eye':'<path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  'pencil':'<path d="M12 20h9M4 17l10-10 3 3L7 20H4zM14 7l2-2a2 2 0 0 1 3 0l1 1a2 2 0 0 1 0 3l-2 2"/>',
  'trash-2':'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  'clipboard-check':'<rect x="5" y="5" width="14" height="17" rx="2"/><path d="M9 5V3h6v2m-6 10 2 2 4-4"/>',
  'paperclip':'<path d="m21 11-9.1 9.1a5 5 0 0 1-7.1-7.1L14.7 3a3.4 3.4 0 0 1 4.8 4.8l-9.9 9.9a1.8 1.8 0 0 1-2.6-2.6l9.2-9.2"/>',
  'file-down':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 12v7m-3-3 3 3 3-3"/>'
};
function iconSvg(name,size=22){
  const paths=ICON_PATHS[name]||ICON_PATHS['file-text'];
  return `<svg class="line-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}
function navItems(){return [
  ['dashboard','house','Tổng quan','RECORD_VIEW'],['records','file-text','Hồ sơ học nghề','RECORD_VIEW'],
  ['reports','chart-column','Báo cáo','REPORT_VIEW'],['catalogs','layout-grid','Danh mục','CATALOG_MANAGE'],
  ['accounts','user-round','Quản lý tài khoản','ACCOUNT_MANAGE'],['audits','clock-3','Nhật ký thay đổi','AUDIT_VIEW']
].filter(i=>allowed(i[3]));}
function buildNav(){
  $('#navigation').innerHTML=navItems().map(([id,glyph,label])=>`<button type="button" data-nav="${id}" class="${state.page===id?'active':''}" ${state.page===id?'aria-current="page"':''}><span class="nav-glyph">${iconSvg(glyph,21)}</span><span class="nav-label">${esc(label)}</span></button>`).join('');
}
// PAGE_AGE chỉ là ngưỡng yêu cầu tái kiểm tra dữ liệu; không hủy nội dung đã xem.
const PAGE_AGE={dashboard:300000,records:300000,reports:300000,catalogs:300000,accounts:300000,audits:300000};
function rememberPage(page){
  const main=$('#main');
  if(!main||state.renderedPage!==page||state.renderedDataRevision!==state.dataRevision||state.needsActiveRefresh||main.querySelector('.spinner')||(page==='records'&&state.recordLoading))return;
  // Đồng bộ giá trị ĐANG HIỂN THỊ vào snapshot DOM (innerHTML thường giữ attribute ban đầu).
  // Dùng cho ngày dd/mm/yyyy, từ khóa, năm và mọi select khi quay lại menu.
  main.querySelectorAll('form[id$="-filters"] input').forEach(field=>{if(field.type!=='hidden')field.setAttribute('value',field.value);});
  main.querySelectorAll('form[id$="-filters"] select').forEach(field=>{Array.from(field.options).forEach(option=>{if(option.selected)option.setAttribute('selected','');else option.removeAttribute('selected');});});
  state.pageViews.set(page,{html:main.innerHTML,at:Date.now(),dataAt:state.pageDataAt.get(page)||Date.now(),scope:permissionScope(),dataRevision:state.dataRevision});
  while(state.pageViews.size>6)state.pageViews.delete(state.pageViews.keys().next().value);
}
function finishPageLoad(page,v){
  if(v!==state.routeVersion)return;
  state.pageDataAt.set(page,Date.now());state.renderedPage=page;state.renderedDataRevision=state.dataRevision;state.needsActiveRefresh=false;
  const note=$('#main .refresh-note');if(note)note.remove();
  rememberPage(page);
}
function safeRouteShell(page){
  const names={dashboard:'Tổng quan học nghề',records:'Hồ sơ học nghề',reports:'Báo cáo học nghề',catalogs:'Danh mục học nghề',accounts:'Quản lý tài khoản',audits:'Nhật ký thay đổi'};
  // No private data, account assignments or stale table rows before re-authorization.
  return `<div class="page-header"><div><h2>${esc(names[page]||'Theo dõi học nghề')}</h2></div></div><div class="card route-check" role="status" aria-live="polite">Đang đồng bộ phiên làm việc…</div>`;
}
function renderRouteData(page,v,keepOld=false){
  switch(page){
    case 'dashboard':return renderDashboard(v,keepOld);
    case 'records':return renderRecords(v,keepOld);
    case 'reports':return renderReports(v,keepOld);
    case 'catalogs':return renderCatalogs(v,keepOld);
    case 'accounts':return renderAccounts(v,keepOld);
    case 'audits':return renderAudits(v,keepOld);
  }
  return Promise.resolve();
}
function navigate(page,force=false){
  if(!navItems().some(item=>item[0]===page))page='dashboard';
  const main=$('#main'),previous=state.page;
  rememberPage(previous);
  state.page=page;const v=++state.routeVersion;state.routeLoading=true;
  $('#sidebar').classList.remove('open');buildNav();
  const fresh=Date.now()-state.permissionChecked<120000;
  const snapshot=state.pageViews.get(page);
  const verified=!!(fresh&&snapshot&&snapshot.scope===permissionScope()&&snapshot.dataRevision===state.dataRevision);
  const age=verified?Date.now()-(snapshot.dataAt||snapshot.at):Infinity;
  // Cache hot: no RPC, even if user switched away and came back within five minutes.
  if(!force&&verified&&age<PAGE_AGE[page]){
    main.innerHTML=snapshot.html;state.renderedPage=page;state.renderedDataRevision=state.dataRevision;state.routeLoading=false;return;
  }
  // Revalidate silently when needed. Do not block the entire app with a permission banner.
  // Stale private records are NOT restored until permission has been verified.
  if(verified&&!force){main.innerHTML=snapshot.html;state.renderedPage=page;}
  else{main.innerHTML=safeRouteShell(page);state.renderedPage=null;}
  (async()=>{
    try{
      await verifyPermission();
      if(v!==state.routeVersion)return;
      const saved=state.pageViews.get(page);
      const canRestore=!force&&saved&&saved.scope===permissionScope()&&saved.dataRevision===state.dataRevision;
      const savedAge=canRestore?Date.now()-(saved.dataAt||saved.at):Infinity;
      if(canRestore&&savedAge<PAGE_AGE[page]){
        main.innerHTML=saved.html;state.renderedPage=page;state.renderedDataRevision=state.dataRevision;return;
      }
      // Restore verified previous content immediately; refresh *only* the content region.
      if(canRestore){
        main.innerHTML=saved.html;
        if(!main.querySelector('.refresh-note'))main.insertAdjacentHTML('afterbegin','<div class="refresh-note" role="status">Đang cập nhật dữ liệu…</div>');
      }
      await renderRouteData(page,v,Boolean(canRestore));
      finishPageLoad(page,v);
    }catch(e){
      if(v===state.routeVersion){main.innerHTML=`<div class="card"><h3>Không tải được dữ liệu</h3><p class="muted">${esc(e.message)}</p><button class="btn" data-retry="1">Tải lại</button></div>`;state.renderedPage=null;}
      failure(e);
    }finally{if(v===state.routeVersion)state.routeLoading=false;}
  })();
}

function heading(title,desc,buttons=''){return `<div class="page-header"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><div class="page-actions">${buttons}</div></div>`;}
function sel(name,items,selected='',empty='Tất cả',key='ID',value='TEN'){
  return `<select name="${esc(name)}">${option('',empty,selected)}${items.map(x=>option(x[key],x[value],selected)).join('')}</select>`;
}
const schoolOpts= (s='',empty='Tất cả cơ sở',activeOnly=false) => isSchoolAccount()?`<input type="hidden" name="truong" value="${esc(state.user.TRUONG_ID)}"><select disabled><option>${esc(lookup('truong',state.user.TRUONG_ID))}</option></select>`:sel('truong',state.cats.truong.filter(x=>!activeOnly||x.TRANG_THAI==='ACTIVE'),s,empty,'TRUONG_ID','TEN_TRUONG');
const tradeOpts= (s='',empty='Tất cả nghề',activeOnly=false) => sel('nghe',state.cats.nghe.filter(x=>!activeOnly||x.TRANG_THAI==='ACTIVE'),s,empty,'NGHE_ID','TEN_NGHE');
function lookup(type,id){const def={truong:['TRUONG_ID','TEN_TRUONG'],nghe:['NGHE_ID','TEN_NGHE'],lydo:['LY_DO_ID','NOI_DUNG']}[type];let x=state.cats[type].find(r=>r[def[0]]===id);return x?.[def[1]] || 'Chưa có trong danh mục';}
// YC-HN-019: Nhập ngày dd/mm/yyyy, gửi yyyy-mm-dd để so sánh không lệch múi giờ.
function dateFilterToInput(value){const text=String(value||'');return /^\d{4}-\d{2}-\d{2}$/.test(text)?text.slice(8,10)+'/'+text.slice(5,7)+'/'+text.slice(0,4):text;}
function dateFilterToISO(value,label){
  const text=String(value||'').trim();if(!text)return '';
  const parts=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if(!parts)throw Error(label+' phải có định dạng dd/mm/yyyy (ví dụ 01/07/2026).');
  const day=Number(parts[1]),month=Number(parts[2]),year=Number(parts[3]);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(year<1||month<1||month>12||day<1||day>days[month-1])throw Error(label+' không phải ngày hợp lệ.');
  return `${parts[3]}-${parts[2]}-${parts[1]}`;
}
function readRangeFilters(form){
  const data=getFormFields(form);data.from=dateFilterToISO(data.from,'Từ ngày');data.to=dateFilterToISO(data.to,'Đến ngày');
  if(data.from&&data.to&&data.from>data.to)throw Error('Từ ngày không được sau Đến ngày.');
  return data;
}
function dateFilterControls(filters,mode='reports'){
  const byEnd=(mode==='records'||mode==='reports')&&filters.status===COURSE_END_FILTER;
  const dateKind=byEnd?'kết thúc đào tạo dự kiến':'ban hành quyết định';
  return ['from','to'].map((which)=>{
  const label=which==='from'?'Từ ngày':'Đến ngày';
  const value=dateFilterToInput(filters[which]);
  return `<div class="field calendar-field"><label for="filter-${which}">${label}</label><div class="calendar-input-wrap"><input id="filter-${which}" class="calendar-date-input" name="${which}" value="${esc(value)}" placeholder="dd/mm/yyyy" readonly autocomplete="off" aria-haspopup="dialog" aria-label="${label} ${dateKind}, chỉ chọn từ lịch" aria-describedby="filter-date-info"><button type="button" class="calendar-open-btn" data-calendar-open="${which}" aria-label="Mở lịch ${label}">${iconSvg('calendar',18)}</button></div></div>`;
}).join('')+`<p id="filter-date-info" class="filter-date-help">${byEnd?'Lọc theo Thời gian đào tạo – Đến ngày (ngày kết thúc dự kiến); không xác nhận học viên đã hoàn thành khóa học.':'Lọc theo ngày ban hành quyết định học nghề, gồm cả ngày đầu và ngày cuối. Chọn trên lịch, có thể xóa ngày.'}</p>`;}
function updateRecordDateFilterHelp(form){
  const hint=form?.querySelector('#filter-date-info');if(!hint)return;
  const end=form.elements.status?.value===COURSE_END_FILTER;
  hint.textContent=end?'Lọc theo Thời gian đào tạo – Đến ngày (ngày kết thúc dự kiến); không xác nhận học viên đã hoàn thành khóa học. Bấm Lọc dữ liệu để áp dụng.':'Lọc theo ngày ban hành quyết định học nghề, gồm cả ngày đầu và ngày cuối. Chọn trên lịch, có thể xóa ngày.';
  for(const input of form.querySelectorAll('.calendar-date-input')){const label=input.name==='from'?'Từ ngày':'Đến ngày';input.setAttribute('aria-label',label+' '+(end?'kết thúc đào tạo dự kiến':'ban hành quyết định')+', chỉ chọn từ lịch');}
}
// YC-HN-020: popup lịch độc lập với HTML snapshot, không bao giờ dùng nhập ngày tùy ý.
const CALENDAR_MONTHS=['Tháng Một','Tháng Hai','Tháng Ba','Tháng Tư','Tháng Năm','Tháng Sáu','Tháng Bảy','Tháng Tám','Tháng Chín','Tháng Mười','Tháng Mười Một','Tháng Mười Hai'];
const CALENDAR_DAYS=['T2','T3','T4','T5','T6','T7','CN'];
let activeCalendar=null;
function calendarISO(y,m,d){return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function closeCalendar(returnFocus=false){
  const input=activeCalendar?.input;document.getElementById('hn-date-calendar')?.remove();activeCalendar=null;
  if(returnFocus&&input?.isConnected)input.focus();
}
function calendarPosition(){
  const popup=document.getElementById('hn-date-calendar'),input=activeCalendar?.input;
  if(!popup||!input?.isConnected){closeCalendar();return;}
  const bounds=input.getBoundingClientRect(),space=8;
  const width=Math.min(330,innerWidth-2*space),height=popup.offsetHeight;
  const left=Math.max(space,Math.min(bounds.left,innerWidth-width-space));
  const below=bounds.bottom+height+space<=innerHeight;
  const top=below?bounds.bottom+5:Math.max(space,bounds.top-height-5);
  popup.style.width=width+'px';popup.style.left=left+'px';popup.style.top=top+'px';
}
function renderCalendar(focusDay=false){
  const cal=activeCalendar;if(!cal)return;
  const {year,month}=cal,first=new Date(year,month-1,1),offset=(first.getDay()+6)%7;
  const count=new Date(year,month,0).getDate(),today=new Date();
  const todayISO=calendarISO(today.getFullYear(),today.getMonth()+1,today.getDate());
  let selected='';try{selected=cal.input.value?dateFilterToISO(cal.input.value,'Ngày'):'';}catch{selected='';}
  const weekdays=CALENDAR_DAYS.map(x=>`<span class="calendar-weekday">${x}</span>`).join('');
  const cells=Array.from({length:offset},()=>'<span aria-hidden="true"></span>').join('')+
    Array.from({length:count},(_,index)=>{const day=index+1,iso=calendarISO(year,month,day);return `<button type="button" class="calendar-day${iso===selected?' selected':''}${iso===todayISO?' today':''}" data-calendar-day="${day}" aria-label="Ngày ${day} tháng ${month} năm ${year}" aria-pressed="${iso===selected}">${day}</button>`;}).join('');
  const years=Array.from({length:301},(_,i)=>1900+i).map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('');
  const months=CALENDAR_MONTHS.map((name,i)=>`<option value="${i+1}" ${month===i+1?'selected':''}>${name}</option>`).join('');
  const popup=document.getElementById('hn-date-calendar');if(!popup)return;
  popup.innerHTML=`<div class="calendar-controls"><button type="button" class="calendar-step" data-calendar-step="-1" aria-label="Tháng trước">‹</button><select data-calendar-month aria-label="Chọn tháng">${months}</select><select data-calendar-year aria-label="Chọn năm">${years}</select><button type="button" class="calendar-step" data-calendar-step="1" aria-label="Tháng tiếp theo">›</button></div><div class="calendar-days" role="grid" aria-label="Lịch ${CALENDAR_MONTHS[month-1]} năm ${year}">${weekdays}${cells}</div><div class="calendar-footer"><button type="button" data-calendar-clear>Xóa ngày</button><button type="button" data-calendar-today>Hôm nay</button></div>`;
  calendarPosition();if(focusDay)popup.querySelector('.calendar-day.selected,.calendar-day.today,.calendar-day')?.focus();
}
function openCalendar(input){
  if(!input?.closest('#records-filters,#reports-filters'))return;
  if(activeCalendar?.input===input){closeCalendar();return;}
  closeCalendar();let chosen='';try{chosen=dateFilterToISO(input.value,'Ngày');}catch{}
  const today=new Date();activeCalendar={input,year:chosen?Number(chosen.slice(0,4)):today.getFullYear(),month:chosen?Number(chosen.slice(5,7)):today.getMonth()+1};
  const popup=document.createElement('div');popup.id='hn-date-calendar';popup.className='hn-date-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-label',input.closest('#records-filters,#reports-filters')?.elements.status?.value===COURSE_END_FILTER?'Chọn ngày kết thúc đào tạo dự kiến':'Chọn ngày ban hành quyết định');document.body.append(popup);
  renderCalendar();popup.querySelector('[data-calendar-month]')?.focus();
}
function pickCalendar(iso){
  const input=activeCalendar?.input;if(!input)return;
  input.value=dateFilterToInput(iso);input.dispatchEvent(new Event('change',{bubbles:true}));closeCalendar(true);
}
function calendarStep(delta){const a=activeCalendar;if(!a)return;const when=new Date(a.year,a.month-1+delta,1);a.year=when.getFullYear();a.month=when.getMonth()+1;renderCalendar();}
function filterFields(filters,mode){return `<form class="card filter-grid ${mode==='dashboard'?'short':''}" id="${mode}-filters">
  <div class="field"><label>Năm quyết định</label><input type="number" min="1900" max="2200" name="year" placeholder="Tất cả các năm" value="${esc(filters.year||'')}"></div>
  <div class="field"><label>Cơ sở đào tạo</label>${schoolOpts(filters.truong)}</div>
  <div class="field"><label>Nghề đào tạo</label>${tradeOpts(filters.nghe)}</div>
  ${mode==='records'?`<div class="field"><label>Tình trạng</label><select name="status">${option('','Tất cả',filters.status)}${[[ALL_DECISIONS_FILTER,'Tổng số Quyết định đã ban hành'],...allStatusOptions().filter(([k])=>k!=='BO_HOC'),['BO_HOC','Bỏ học'],[COURSE_END_FILTER,'Hoàn thành khóa học']].map(([k,v])=>option(k,v,filters.status)).join('')}</select></div><div class="field"><label>Tìm người học / số QĐ</label><input name="query" value="${esc(filters.query||'')}" placeholder="Nhập từ khóa..."></div>`:''}
  ${mode==='reports'?`<div class="field"><label>Tình trạng</label><select name="status">${[['','Tất cả tình trạng'],[ALL_DECISIONS_FILTER,'Tổng số Quyết định đã ban hành'],['REPORT_PARTICIPATED_ALL','Đã tham gia'],['BO_HOC','Bỏ học'],['KHONG_THAM_GIA','Không tham gia'],['KHONG_NHAN_QUYET_DINH','Không nhận Quyết định'],['CHO_XAC_NHAN','Chưa xác nhận'],...state.statuses.map(x=>[x.id,x.label]),[COURSE_END_FILTER,'Hoàn thành khóa học']].map(([k,v])=>option(k,v,filters.status||'')).join('')}</select></div>`:''}
  ${mode==='records'||mode==='reports'?dateFilterControls(filters,mode):''}
  <button class="btn btn-primary" type="submit">${iconSvg('filter',19)} Lọc dữ liệu</button></form>`;}
function getFormFields(form){return Object.fromEntries(new FormData(form).entries());}
// YC-HN-015: Chữ ký cố định cho bộ lọc, để quay về 'Tất cả' trúng cache cũ.
function normalizeRecordFilters(input){
  const previous=state.filters;
  return Object.fromEntries(['year','truong','nghe','status','dropout','from','to','query'].map(key=>[key,String(input[key]??(key==='dropout'?previous[key]||'':''))]));
}
// Không dựng lại form khi nhấn Lọc: draft ở DOM luôn thuộc quyền người đang nhập.
async function applyRecordFilters(form, page=1){
  let fields;try{fields=readRangeFilters(form);}catch(error){failure(error);return;}
  const filters=normalizeRecordFilters(fields);
  const key=JSON.stringify({filters,page});
  if(state.recordLoading && state.activeRecordRequestKey===key)return;
  state.filters=filters;state.recordPage=page;state.pageViews.delete('records');
  await refreshRecordResults(filters.query?'Đang tìm hồ sơ…':'Đang tải danh sách hồ sơ…',key);
}
async function refreshRecordResults(message,key=''){
  const v=state.routeVersion,version=++state.recordLoadVersion;
  state.recordLoading=true;state.activeRecordRequestKey=key;
  const count=$('#record-count'),table=$('#list-output'),pages=$('#list-pages');
  if(count){count.textContent=message;count.setAttribute('role','status');count.setAttribute('aria-live','polite');}
  if(table){table.setAttribute('aria-busy','true');table.classList.add('records-refreshing');}
  if(pages){pages.setAttribute('aria-busy','true');pages.classList.add('records-refreshing');}
  try{
    await loadRecordList(v,false,'',version);
    if(v===state.routeVersion && version===state.recordLoadVersion){
      state.renderedPage='records';
    }
  }catch(error){
    if(v===state.routeVersion&&version===state.recordLoadVersion){
      if(count)count.textContent='Chưa tải được kết quả bộ lọc mới. Bạn có thể bấm Lọc dữ liệu để thử lại.';
      if(table)table.classList.add('records-failed');
      failure(error);
    }
  }finally{
    if(version===state.recordLoadVersion){
      state.recordLoading=false;state.activeRecordRequestKey='';
      if(table){table.removeAttribute('aria-busy');table.classList.remove('records-refreshing');}
      if(pages){pages.removeAttribute('aria-busy');pages.classList.remove('records-refreshing');}
      if(v===state.routeVersion&&!table?.classList.contains('records-failed')){
        rememberPage('records');
      }
    }
  }
}
function recordIconButton(glyph,label,attr,id,danger=false){
  return `<button type="button" class="btn record-icon-btn${danger?' btn-danger':''}" ${attr}="${dataAttr(id)}" title="${esc(label)}" aria-label="${esc(label)}">${iconSvg(glyph,18)}</button>`;
}
function pillStatus(record){const st=record.TRANG_THAI_THAM_GIA;const other=state.statuses.find(x=>x.id===st)?.label;return st==='DA_THAM_GIA' ? `<span class="pill ${record.DA_BO_HOC==='TRUE'?'bad':'good'}">${record.DA_BO_HOC==='TRUE'?'Bỏ học':'Đã tham gia học'}</span>` : `<span class="pill ${st==='KHONG_THAM_GIA'?'bad':'warn'}">${esc(STATUS[st]||other||'Tình trạng chưa nhận diện')}</span>`;}
// YC-HN-006 — Chỉ tái sử dụng phản hồi overview hiện hành, không tăng số request.
function sortedStats(values,type){
  return Object.entries(values||{}).map(([id,value])=>({id,name:lookup(type,id),value:Number(value)||0}))
    .filter(x=>x.value>0).sort((a,b)=>b.value-a.value || a.name.localeCompare(b.name,'vi'));
}
function summaryDetailAction(){
  return allowed('REPORT_VIEW')?'<button type="button" class="btn btn-light summary-detail" data-dashboard-detail="1">Xem chi tiết '+iconSvg('arrow-right',17)+'</button>':'';
}
function schoolChart(values){
  const rows=sortedStats(values,'truong').slice(0,4);
  const header=`<div class="summary-head"><div><h3>Theo cơ sở đào tạo</h3><p>Thống kê số lượng hồ sơ theo từng cơ sở đào tạo</p></div>${summaryDetailAction()}</div>`;
  if(!rows.length)return `<section class="card visual-summary">${header}<div class="summary-empty">Chưa có hồ sơ để thống kê theo cơ sở đào tạo.</div></section>`;
  const peak=Math.max(...rows.map(r=>r.value),1);
  const axisMax=peak<=5?Math.max(1,Math.ceil(peak)+1):Math.ceil(peak/4)*4;
  const tickValues=axisMax<=6?Array.from({length:axisMax+1},(_,i)=>axisMax-i):[4,3,2,1,0].map(i=>Math.round(axisMax*i/4));
  const ticks=tickValues.map(n=>`<span>${num(n)}</span>`).join('');
  const bars=rows.map(r=>{
    const fraction=Math.min(100,Math.max(0,100*r.value/axisMax));
    return `<div class="bar-group" title="${esc(r.name)}: ${num(r.value)} hồ sơ"><div class="bar-area"><strong>${num(r.value)}</strong><div class="bar-column" style="height:${fraction.toFixed(2)}%"></div></div><div class="bar-label" title="${esc(r.name)}">${esc(r.name)}</div></div>`;
  }).join('');
  return `<section class="card visual-summary">${header}<div class="vertical-chart" role="img" aria-label="Số hồ sơ theo cơ sở đào tạo"><div class="chart-axis">${ticks}</div><div class="chart-bars">${bars}</div></div></section>`;
}
function tradeChart(values){
  const rows=sortedStats(values,'nghe');
  const header=`<div class="summary-head"><div><h3>Theo nghề đào tạo</h3><p>Thống kê số lượng hồ sơ theo từng nghề đào tạo</p></div>${summaryDetailAction()}</div>`;
  if(!rows.length)return `<section class="card visual-summary">${header}<div class="summary-empty">Chưa có hồ sơ để thống kê theo nghề đào tạo.</div></section>`;
  const top=rows.slice(0,4);
  const rest=rows.slice(4).reduce((total,x)=>total+x.value,0);
  if(rest>0)top.push({id:'other',name:'Các nghề khác',value:rest});
  const total=rows.reduce((sum,r)=>sum+r.value,0);
  const palette=['#4b96f4','#50c878','#8660ed','#ffa547','#7d91ae'];
  let progress=0;
  const arcs=top.map((r,i)=>{
    const from=progress;progress+=100*r.value/total;
    return `${palette[i]} ${from.toFixed(5)}% ${progress.toFixed(5)}%`;
  }).join(',');
  // Phân bổ phần lẻ lớn nhất: phần trăm được hiển thị luôn cộng đủ 100%.
  const raw=top.map(r=>r.value*100/total), percentages=raw.map(Math.floor);
  let remainder=100-percentages.reduce((a,b)=>a+b,0);
  raw.map((p,i)=>({i,f:p-percentages[i]})).sort((a,b)=>b.f-a.f || a.i-b.i).slice(0,remainder).forEach(x=>percentages[x.i]++);
  const legend=top.map((r,i)=>`<li><span class="legend-swatch" style="background:${palette[i]}"></span><span class="legend-name" title="${esc(r.name)}">${esc(r.name)}</span><b>${num(r.value)}</b><span class="legend-percent">${percentages[i]}%</span></li>`).join('');
  return `<section class="card visual-summary">${header}<div class="trade-visual"><div class="donut-chart" role="img" aria-label="Cơ cấu hồ sơ theo nghề" style="background:conic-gradient(${arcs})"><div class="donut-center"><strong>${num(total)}</strong><span>Tổng số Quyết định</span></div></div><ul class="trade-legend">${legend}</ul></div></section>`;
}
async function renderDashboard(v,keepOld=false){
  const f=state.dashboardFilters;
  const markup=`<section class="welcome-banner" aria-label="Tổng quan học nghề"><span class="welcome-art" aria-hidden="true">🎓</span><div class="welcome-copy"><h1>Tổng quan học nghề</h1><p>Quản lý hồ sơ, theo dõi quá trình tham gia và thống kê kết quả học nghề trên cùng một hệ thống.</p></div></section>`
    +filterFields(f,'dashboard')+'<div id="dashboard-output" class="spinner">Đang tổng hợp số liệu…</div>';
  if(!keepOld)$('#main').innerHTML=markup;
  const data=await rpc('overview',f,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  const tiles=[['Tổng số Quyết định','clipboard-list',k.total],['Đã tham gia','check',k.participated],['Không nhận Quyết định','file-x',data.statusCounts?.notReceived||0],['Bỏ học','arrow-down-right',k.dropout],['Không tham gia','x',k.notParticipating],['Chưa xác nhận','clock-3',k.pending]];
  // Khi trở lại menu, chỉ thay khu vực số liệu, giữ bộ lọc và banner đang hiển thị.
  $('#dashboard-output').className='dashboard-results';
  $('#dashboard-output').innerHTML=`<div class="kpi-grid" aria-label="Sáu chỉ tiêu tổng quan">${tiles.map(([label,glyph,n])=>`<article class="kpi"><div class="kpi-icon">${iconSvg(glyph,26)}</div><div class="kpi-body"><div class="desc">${esc(label)}</div><div class="metric">${num(n)}</div></div></article>`).join('')}</div><div class="sub-grid">${schoolChart(data.schoolCounts)}${tradeChart(data.tradeCounts)}</div>`;
}
async function renderRecords(v,keepOld=false){
  const markup=heading('Hồ sơ học nghề','Mỗi quyết định chỉ áp dụng cho một người; số quyết định được kiểm tra trùng trong cùng năm.',(state.user?.VAI_TRO==='ADMIN'?'<button class="btn btn-light" data-bulk-record="1">⇧ Nhập Excel</button><button class="btn btn-light" data-status-bulk="1">⇧ Cập nhật tình trạng từ Excel</button>':'')+(allowed('RECORD_CREATE')?'<button class="btn btn-primary" data-new-record="1">＋ Thêm hồ sơ</button>':''))+filterFields(state.filters,'records')+`<div class="panel-top"><span class="muted" id="record-count">Đang tải hồ sơ…</span><div class="page-actions">${allowed('REPORT_EXPORT')?'<button class="btn btn-light" data-export-list="1">Xuất Excel</button>':''}</div></div><div id="list-output" class="table-wrap"></div><div id="list-pages"></div>`;
  if(!keepOld)$('#main').innerHTML=markup;
  await loadRecordList(v,keepOld,markup);
}
// YC-HN-022: one canonical escaped row renderer, for initial load and single-row update.
function renderRecordRow(r){
  const endColumn=state.filters.status===COURSE_END_FILTER?`<td class="nowrap">${esc(dateVN(r.NGAY_KET_THUC_DU_KIEN))}</td>`:'';
  return `<tr data-record-id="${dataAttr(r.HO_SO_ID)}"><td class="nowrap">${esc(dateVN(r.NGAY_QUYET_DINH))}</td>${endColumn}<td><b>${esc(r.SO_QUYET_DINH)}</b></td><td>${esc(r.HO_TEN)}</td><td>${esc(lookup('truong',r.TRUONG_ID))}</td><td>${esc(lookup('nghe',r.NGHE_ID))}</td><td>${pillStatus(r)}</td><td class="record-action-cell"><div class="table-actions record-actions">${recordIconButton('eye','Chi tiết hồ sơ','data-detail-record',r.HO_SO_ID)}${allowed('RECORD_EDIT')?recordIconButton('pencil','Sửa hồ sơ','data-edit-record',r.HO_SO_ID):''}${canDeleteRecord(r)?recordIconButton('trash-2','Xóa hồ sơ','data-delete-record',r.HO_SO_ID,true):''}${allowed('RECORD_STATUS')?recordIconButton('clipboard-check','Cập nhật tình trạng','data-status-record',r.HO_SO_ID):''}${r.HAS_FILE&&allowed('FILE_VIEW')?recordIconButton('file-down','Xem hoặc tải tệp hiện có','data-file-get',r.HO_SO_ID):''}${allowed('FILE_UPLOAD')?recordIconButton('paperclip','Quản lý tệp đính kèm','data-file-modal',r.HO_SO_ID):''}</div></td></tr>`;
}
// A changed sort key or an applied filter field needs authoritative list/pagination refresh.
// Prefer a conservative refresh over incorrectly keeping a row in a filtered list.
function recordNeedsListRefresh(before,after,filters){
  if(!before||!after||before.HO_SO_ID!==after.HO_SO_ID)return true;
  if(before.TRUONG_ID!==after.TRUONG_ID || before.NGAY_QUYET_DINH!==after.NGAY_QUYET_DINH || before.TAO_LUC!==after.TAO_LUC)return true;
  if(filters.status===COURSE_END_FILTER && before.NGAY_KET_THUC_DU_KIEN!==after.NGAY_KET_THUC_DU_KIEN)return true;
  // Trong chế độ Hoàn thành, thay đổi tình trạng/bỏ học cũng có thể làm hồ sơ rời hoặc vào danh sách.
  if(filters.status===COURSE_END_FILTER && (before.TRANG_THAI_THAM_GIA!==after.TRANG_THAI_THAM_GIA||before.DA_BO_HOC!==after.DA_BO_HOC))return true;
  if(filters.year && before.NAM_QUYET_DINH!==after.NAM_QUYET_DINH)return true;
  if(filters.nghe && before.NGHE_ID!==after.NGHE_ID)return true;
  if(filters.status && filters.status!==COURSE_END_FILTER && (before.TRANG_THAI_THAM_GIA!==after.TRANG_THAI_THAM_GIA || before.DA_BO_HOC!==after.DA_BO_HOC))return true;
  if(filters.dropout && before.DA_BO_HOC!==after.DA_BO_HOC)return true;
  if(filters.query && ['HO_TEN','SO_QUYET_DINH','NGUOI_HOC_ID','HO_SO_ID'].some(k=>before[k]!==after[k]))return true;
  // Conservatively invalidate results on changed status used by report filtering.
  return false;
}
function invalidateSavedRecordViews(){
  expireCacheActions(['records_list','overview','report_matrix','report_export','audit_list']);
  for(const page of ['dashboard','reports','audits','records'])state.pageViews.delete(page);
  for(const page of ['dashboard','reports','audits'])state.pageDataAt.delete(page);
}
// This starts ONLY after server ACK. Do not change the DOM with optimistic form values.
async function commitSavedRecord(next,context){
  invalidateSavedRecordViews();
  // Invalidate any records_list request that was started before this mutation.
  state.recordLoadVersion++;state.recordLoading=false;state.activeRecordRequestKey='';
  for(const sel of ['#list-output','#list-pages']){const el=$(sel);el?.removeAttribute('aria-busy');el?.classList.remove('records-refreshing');}
  const idx=state.records.findIndex(r=>r.HO_SO_ID===next.HO_SO_ID);
  const before=idx>=0?state.records[idx]:null;
  if(idx>=0)state.records[idx]=next;
  closeModal();
  if(state.page!=='records'||!$('#records-filters'))return 'deferred';
  const sameView=context.scope===permissionScope() && context.page===state.recordPage &&
    context.filters===JSON.stringify(state.filters) && context.route===state.routeVersion;
  const row=sameView&&before?Array.from(document.querySelectorAll('#list-output tbody tr[data-record-id]'))
    .find(tr=>tr.dataset.recordId===next.HO_SO_ID):null;
  if(sameView && row && !recordNeedsListRefresh(before,next,state.filters)){
    const replacement=document.createElement('tbody');replacement.innerHTML=renderRecordRow(next);
    row.replaceWith(replacement.firstElementChild);
    // Refresh the current snapshot only; other results/cache remain invalidated.
    state.pageDataAt.set('records',Date.now());state.renderedPage='records';rememberPage('records');
    return 'row';
  }
  // Changed sort/filters, create, or a pending navigation: update only the result region.
  if(context.scope===permissionScope()){
    void refreshRecordResults('Đang cập nhật danh sách sau khi lưu…');
    return 'list';
  }
  return 'deferred';
}
function emitSaveTiming(started,ackAt,finished,mode,outcome){
  // Opt-in in browser DevTools: window.HN_PERF_TEST=true; no personal data.
  if(window.HN_PERF_TEST!==true)return;
  console.info('[HN_PERF] record_save',{
    mode,outcome,clickToAckMs:Math.round(ackAt-started),ackToUiMs:Math.round(finished-ackAt),
    clickToUiMs:Math.round(finished-started)
  });
}

async function loadRecordList(v,keepOld=false,markup="",loadVersion=++state.recordLoadVersion){
  // Snapshot tại thời điểm bấm Lọc. Request cũ không được ghi đè request mới.
  const filters={...state.filters},page=state.recordPage;
  const data=await rpc('records_list',{...filters,page,pageSize:20},{ttl:45000});
  if(v!==state.routeVersion||loadVersion!==state.recordLoadVersion)return;
  // Giữ nguyên form và từ khóa khi refresh danh sách trên trang đã mở.
  state.records=data.items;state.recordTotal=data.total;
  $('#list-output').classList.remove('records-failed');
  $('#record-count').textContent=`Hiển thị ${num(data.items.length)} / ${num(data.total)} hồ sơ · Trang ${data.page}`;
  const courseEndMode=filters.status===COURSE_END_FILTER;
  $('#list-output').innerHTML=`<table><thead><tr><th>Ngày QĐ</th>${courseEndMode?'<th>Ngày kết thúc đào tạo (dự kiến)</th>':''}<th>Số QĐ</th><th>Người học</th><th>Cơ sở đào tạo</th><th>Nghề</th><th>Tình trạng</th><th class="record-action-header">Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(renderRecordRow).join(''):`<tr><td colspan="${courseEndMode?8:7}" class="empty">Không có hồ sơ phù hợp.</td></tr>`}</tbody></table>`;
  const totalPages=Math.max(1,Math.ceil(data.total/20));
  $('#list-pages').innerHTML=`<div class="pagination"><button class="btn" data-page="${data.page-1}" ${data.page<=1?'disabled':''}>← Trước</button>Trang ${data.page}/${totalPages}<button class="btn" data-page="${data.page+1}" ${data.page>=totalPages?'disabled':''}>Tiếp →</button></div>`;
}
/** YC-HN-025 V2: Hoàn thành khóa học = đã tham gia + không bỏ học + có ngày kết thúc dự kiến hợp lệ.
 * Không đồng nghĩa có giấy xác nhận tốt nghiệp thực tế.
 */
function reportKpiRows(k,extra={},appliedStatus=''){
  const completed=['Hoàn thành khóa học',k.courseEndParticipated??0];
  const rows=[['Tổng số Quyết định đã ban hành',k.total],['Đã tham gia',k.participated],['Bỏ học',k.dropout],['Không tham gia',k.notParticipating],['Không nhận Quyết định',extra.notReceived||0],['Chưa xác nhận',k.pending],...(extra.other?[['Tình trạng khác',extra.other]]:[]),completed];
  if(!appliedStatus)return rows;
  const byStatus={
    [ALL_DECISIONS_FILTER]:rows[0], REPORT_PARTICIPATED_ALL:rows[1],
    BO_HOC:rows[2],KHONG_THAM_GIA:rows[3],KHONG_NHAN_QUYET_DINH:rows[4],CHO_XAC_NHAN:rows[5],
    [COURSE_END_FILTER]:completed
  };
  if(byStatus[appliedStatus])return [byStatus[appliedStatus]];
  // Backend đã lọc chính xác một trạng thái tùy chỉnh: total chính là số của trạng thái đó.
  const custom=state.statuses.find(x=>x.id===appliedStatus);
  if(custom)return [[custom.label,k.total]];
  return rows; // tương thích với giá trị tình trạng cũ khi người dùng đang chuyển phiên bản
}
function reportKpiCount(value){return typeof value==='number'?num(value):esc(String(value));}
// Thông tin phạm vi chỉ in trên giấy; không tạo lại banner giải thích trên màn hình.
function reportPrintDateScope(filters){
  const scopedSchool=isSchoolAccount()?`<p class="report-print-school">Cơ sở đào tạo: ${esc(lookup('truong',state.user?.TRUONG_ID||''))}</p>`:'';
  if(filters?.status!==COURSE_END_FILTER)return scopedSchool;
  const from=dateFilterToInput(filters.from)||'Không giới hạn',to=dateFilterToInput(filters.to)||'Không giới hạn';
  return scopedSchool+`<p class="report-print-date-scope">Ngày kết thúc đào tạo dự kiến: Từ ${esc(from)} đến ${esc(to)}</p>`;
}
async function renderReports(v,keepOld=false){
  const markup=heading('Báo cáo học nghề','',`${allowed('REPORT_EXPORT')?'<button class="btn btn-primary" id="report-export">Xuất Excel</button>':''}<button class="btn" id="print-report">In báo cáo</button>`)+filterFields(state.reportFilters,'reports')+'<div id="report-output" class="spinner">Đang tải thống kê…</div>';
  if(!keepOld)$('#main').innerHTML=markup;
  const data=await rpc('overview',state.reportFilters,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  $('#report-output').className='report-results';
  $('#report-output').innerHTML=`<div class="card report-card"><h3>Tổng hợp kết quả</h3>${reportPrintDateScope(state.reportFilters)}<div class="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th>Số lượng</th></tr></thead><tbody>${reportKpiRows(k,data.statusCounts,state.reportFilters.status).map(r=>`<tr><td${r[0]==='Hoàn thành khóa học'?' title="Đếm theo Thời gian đào tạo – Đến ngày; chỉ Đã tham gia và không Bỏ học. Chưa phải xác nhận tốt nghiệp thực tế"':''}>${esc(r[0])}</td><td><b>${reportKpiCount(r[1])}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}
async function renderCatalogs(v,keepOld=false){
  const canEdit=allowed('CATALOG_MANAGE');
  if(!keepOld)$('#main').innerHTML=heading('Danh mục học nghề','Cơ sở đào tạo, nghề và lý do bỏ học.',canEdit?'<button class="btn btn-light" data-bulk-catalog="1">⇧ Nhập hàng loạt</button><button class="btn btn-primary" data-new-catalog="1">＋ Thêm danh mục</button>':'')+
  `<div class="catalog-toolbar"><div class="tabs">${Object.entries(NAMES).map(([type,name])=>`<button class="btn ${state.catalogType===type?'active':''}" data-cat-tab="${type}">${name}</button>`).join('')}</div><div class="catalog-search"><label class="field"><span>Tìm danh mục</span><input id="catalog-search" placeholder="Nhập tên hoặc mã danh mục..." autocomplete="off" value="${esc(state.catalogSearch)}"></label></div></div><div id="cats-view"></div>`;
  await loadCatalogs(v);
}
async function loadCatalogs(v){
  const type=state.catalogType,data={items:state.cats[type]||[]};if(v!==state.routeVersion)return;
  state.cats[type]=data.items;
  const def={truong:['MA_TRUONG','TEN_TRUONG'],nghe:['MA_NGHE','TEN_NGHE'],lydo:['MA_LY_DO','NOI_DUNG']}[type];
  $('#cats-view').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên / Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(r=>`<tr class="catalog-data-row"><td>${esc(r[def[0]])}</td><td>${esc(r[def[1]])}</td><td><span class="pill ${r.TRANG_THAI==='ACTIVE'?'good':'warn'}">${r.TRANG_THAI==='ACTIVE'?'Đang sử dụng':'Ngừng sử dụng'}</span></td><td>${allowed('CATALOG_MANAGE')?`<div class="table-actions"><button class="btn" data-edit-catalog="${dataAttr(r[{truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type]])}">Sửa</button><button class="btn btn-danger" data-delete-catalog="${dataAttr(r[{truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type]])}">Xóa</button></div>`:'—'}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Chưa có danh mục. Quản trị viên hãy tạo trước khi nhập hồ sơ.</td></tr>'}</tbody></table></div>`;
  const query=state.catalogSearch.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  document.querySelectorAll('.catalog-data-row').forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(query);});
}
async function renderAccounts(v,keepOld=false){
  if(!keepOld)$('#main').innerHTML=heading('Quản lý tài khoản','Cấp một Gmail cho một cơ sở đào tạo; một cơ sở có thể có nhiều Gmail.','<button class="btn btn-primary" data-new-account="1">＋ Thêm tài khoản</button>')+'<div id="accounts-output" class="spinner">Đang tải…</div>';
  const data=await rpc('accounts_list',{}, {ttl:30000});if(v!==state.routeVersion)return;state.accountRows=data.items;
  $('#accounts-output').className='';
  $('#accounts-output').innerHTML=`<div class="table-wrap account-table"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Chức danh/Phòng ban</th><th>Cơ sở được cấp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.map(x=>`<tr><td>${esc(x.HO_TEN)}</td><td>${esc(x.EMAIL)}</td><td>${x.VAI_TRO==='ADMIN'?'Quản trị viên':x.VAI_TRO==='CO_SO_DAO_TAO'?'Cơ sở đào tạo':'Nhân viên'}</td><td>${x.VAI_TRO==='NHAN_VIEN'?esc(x.CHUC_DANH_HIEN_THI||'—'):'—'}</td><td>${x.VAI_TRO==='CO_SO_DAO_TAO'?esc(lookup('truong',x.TRUONG_ID)):'—'}</td><td><span class="pill ${x.TRANG_THAI==='ACTIVE'?'good':'bad'}">${x.TRANG_THAI==='ACTIVE'?'Hoạt động':'Khóa'}</span></td><td><div class="table-actions"><button class="btn" data-edit-account="${esc(x.TAI_KHOAN_ID)}">Sửa</button><button class="btn btn-danger" data-delete-account="${esc(x.TAI_KHOAN_ID)}">Xóa</button></div></td></tr>`).join('')}</tbody></table></div>`;
}
const AUDIT_ACTION_VI={CAP_NHAT_TRANG_THAI:'Cập nhật tình trạng',SUA_HO_SO:'Sửa hồ sơ',TAO_HO_SO:'Thêm hồ sơ',XOA_MEM_HO_SO:'Xóa hồ sơ',NHAP_HO_SO_HANG_LOAT:'Nhập hồ sơ từ Excel',SUA_DANH_MUC:'Sửa danh mục',TAO_DANH_MUC:'Thêm danh mục',XOA_MEM_DANH_MUC:'Xóa danh mục',DINH_KEM_TEP:'Đính kèm tệp',GO_TEP:'Gỡ tệp',TAO_TAI_KHOAN:'Tạo tài khoản',SUA_TAI_KHOAN:'Sửa tài khoản',XOA_MEM_TAI_KHOAN:'Xóa tài khoản',NHAP_DANH_MUC_HANG_LOAT:'Nhập danh mục',CAP_NHAT_TRANG_THAI_HANG_LOAT:'Cập nhật tình trạng từ Excel'};
const AUDIT_OBJECT_VI={HO_SO:'Hồ sơ',TAI_KHOAN:'Tài khoản',truong:'Cơ sở đào tạo',nghe:'Nghề đào tạo',lydo:'Lý do bỏ học',BATCH:'Nhiều hồ sơ'};
const auditLabel=(mapping,value)=>mapping[value]||String(value||'').replace(/_/g,' ').toLocaleLowerCase('vi-VN');
async function renderAudits(v,keepOld=false){
  if(!keepOld)$('#main').innerHTML=heading('Nhật ký thay đổi','Tra cứu hoạt động chỉnh sửa hồ sơ, danh mục và tài khoản.')+'<div id="audit-output" class="spinner">Đang tải nhật ký…</div>';
  const d=await rpc('audit_list',{page:state.auditPage},{ttl:30000});if(v!==state.routeVersion)return;
  $('#audit-output').className='';
  $('#audit-output').innerHTML=`<div class="table-wrap audit-table"><table><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th><th>Loại</th></tr></thead><tbody>${d.items.length?d.items.map(x=>`<tr><td class="nowrap">${esc(x.THOI_GIAN)}</td><td>${esc(x.EMAIL)}</td><td>${esc(auditLabel(AUDIT_ACTION_VI,x.HANH_DONG))}</td><td>${esc(auditLabel(AUDIT_OBJECT_VI,x.LOAI_DOI_TUONG))}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Chưa có nhật ký.</td></tr>'}</tbody></table></div><div class="pagination"><button class="btn" data-audit-page="${d.page-1}" ${d.page===1?'disabled':''}>← Trước</button>Trang ${d.page}/${Math.max(1,Math.ceil(d.total/d.pageSize))}<button class="btn" data-audit-page="${d.page+1}" ${d.page*d.pageSize>=d.total?'disabled':''}>Tiếp →</button></div>`;
}
function showModal(title,body,footer=''){$('#modal').innerHTML=`<div class="modal-head"><h3>${esc(title)}</h3><button class="btn icon-button" data-close="1" aria-label="Đóng">×</button></div>${body}${footer}`;$('#modal-layer').classList.remove('hidden');$('#modal-layer').setAttribute('aria-hidden','false');}
function closeModal(){state.statusImport=null;$('#modal-layer').classList.add('hidden');$('#modal-layer').setAttribute('aria-hidden','true');$('#modal').innerHTML='';state.usedPerson=null;if(state.needsActiveRefresh)queueMicrotask(()=>{void refreshVisibleStaleData();});}
const modalFoot=(label='Lưu hồ sơ')=>`<div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="submit" class="btn btn-primary" data-submit-btn="1">${label}</button></div>`;
const field=(label,name,value='',type='text',extra='')=>`<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><input id="f-${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const selectField=(label,name,inner)=>`<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><select id="f-${esc(name)}" name="${esc(name)}">${inner}</select></div>`;
function activeCatOptions(type,current){const id={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type],name={truong:'TEN_TRUONG',nghe:'TEN_NGHE',lydo:'NOI_DUNG'}[type];return option('','-- Chọn --',current)+state.cats[type].filter(x=>x.TRANG_THAI==='ACTIVE'||x[id]===current).map(x=>option(x[id],x[name],current)).join('');}
function learningSelection(r){return r?.DA_BO_HOC==='TRUE'?'BO_HOC':r?.TRANG_THAI_THAM_GIA||'CHO_XAC_NHAN';}
function statusSelect(r){const selected=learningSelection(r);return selectField('Tình trạng tham gia *','UI_TINH_TRANG',allStatusOptions().map(([k,v])=>option(k,v,selected)).join('')+option('KHAC','Khác',selected))+`<div class="field full status-custom" hidden><label>Tình trạng khác *</label><input name="customStatusName" maxlength="60" placeholder="Ví dụ: Thôi việc" disabled></div>`;}
// YC-HN-030: Chỉ hiển thị kỳ 1–6, không cho chọn vượt thời gian hỗ trợ.
// Hồ sơ cũ có KY:7+ hoặc ngày bỏ học ISO được giữ nếu không thay đổi giá trị.
function dropoutMaxPeriod(months){const raw=String(months??'').trim().replace(',','.');const n=raw===''?NaN:Number(raw);return Number.isInteger(n)&&n>=1?Math.min(6,n):0;}
const historicalDropoutPeriod=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)||/^KY:(?:[7-9]|[1-9]\d+)$/.test(value);
function dropoutPeriodOptions(months,selected='',original=''){
  const limit=dropoutMaxPeriod(months);let html=option('','-- Chọn tháng bắt đầu bỏ học --',selected);
  for(let n=1;n<=6;n++){
    const val='KY:'+n,valid=n<=limit;
    html+=`<option value="${val}" ${valid&&val===selected?'selected':''} ${valid?'':'disabled'}>Tháng thứ ${n}</option>`;
  }
  const saved=String(original||''),isDate=/^\d{4}-\d{2}-\d{2}$/.test(saved);
  if(saved===selected&&historicalDropoutPeriod(saved))html+=option(saved,isDate?'Dữ liệu cũ — '+dateVN(saved):'Kỳ lịch sử — '+saved.slice(3),saved);
  return html;
}
function dropoutFields(r){const months=r?.SO_THANG_HO_TRO||'',prev=r?.NGAY_BO_HOC||'';
  const historical=historicalDropoutPeriod(prev);
  return `<div class="dropout-only field"><label>Tháng bỏ học *</label><select name="NGAY_BO_HOC">${dropoutPeriodOptions(months,prev,prev)}</select>${historical?'<div class="form-hint">Dữ liệu bỏ học lịch sử được giữ nguyên nếu không thay đổi; không tự chuyển sang kỳ mới.</div>':''}</div><div class="dropout-only">${selectField('Lý do bỏ học *','LY_DO_BO_HOC_ID',activeCatOptions('lydo',r?.LY_DO_BO_HOC_ID))}</div>`;
}
function refreshDropoutPeriod(form){const select=form?.elements?.NGAY_BO_HOC;if(!select)return;
  const months=form.elements.SO_THANG_HO_TRO?.value??form.dataset.supportMonths??'',previous=select.value,original=form.dataset.originalPeriod||'';
  const limit=dropoutMaxPeriod(months),n=/^KY:(\d+)$/.exec(previous),isValid=n&&Number(n[1])>=1&&Number(n[1])<=limit;
  const keep=!!(isValid||(previous===original&&historicalDropoutPeriod(original)));
  select.innerHTML=dropoutPeriodOptions(months,keep?previous:'',original);
}
function updateDropoutFields(form){if(!form)return;refreshDropoutPeriod(form);
  const st=form.elements.UI_TINH_TRANG?.value,isDropout=st==='BO_HOC';
  form.querySelectorAll('.dropout-only').forEach(node=>{node.hidden=!isDropout;node.querySelectorAll('input,select').forEach(input=>{input.disabled=!isDropout;input.required=isDropout;});});
  const cust=form.querySelector('.status-custom');if(cust){cust.hidden=st!=='KHAC';cust.querySelector('input').disabled=st!=='KHAC';cust.querySelector('input').required=st==='KHAC';}
}
function recordPayload(form){const p=getFormFields(form),choice=p.UI_TINH_TRANG;
  p.TRANG_THAI_THAM_GIA=choice==='BO_HOC'?'DA_THAM_GIA':choice==='KHAC'?'':choice;
  p.DA_BO_HOC=choice==='BO_HOC';delete p.UI_TINH_TRANG;
  if(!p.DA_BO_HOC){p.NGAY_BO_HOC='';p.LY_DO_BO_HOC_ID='';}if(choice!=='KHAC')delete p.customStatusName;return p;
}
function recordForm(r){
  const edit=Boolean(r),x=r||{};state.usedPerson=null;
  const form=`<form id="record-form" class="form-grid" data-original-period="${esc(x.NGAY_BO_HOC||'')}" data-support-months="${esc(x.SO_THANG_HO_TRO||'')}" data-edit="${edit?'yes':'no'}">
  <input type="hidden" name="HO_SO_ID" value="${esc(x.HO_SO_ID||'')}"><input type="hidden" name="NGUOI_HOC_ID" value="${esc(x.NGUOI_HOC_ID||'')}"><input type="hidden" name="PHIEN_BAN" value="${esc(x.PHIEN_BAN||'')}">
  ${!edit?`<div class="full info-banner">Nếu người học đã có hồ sơ, hãy tìm theo tên để liên kết với đợt học mới.<div class="field" style="margin-top:10px"><label>Tìm người học đã có</label><div class="page-actions"><input id="person-query" placeholder="Nhập họ tên" style="flex:1;border:1px solid #cbdcea;border-radius:9px;padding:9px"><button class="btn" type="button" id="find-person">Tìm</button></div></div><div id="person-results" class="person-results"></div><div id="selected-person" class="small muted"></div></div>`:''}
  ${field('Họ tên người học *','HO_TEN',x.HO_TEN||'','text','required maxlength="250"')}
  ${field('Ngày sinh','NGAY_SINH',x.NGAY_SINH||'','date')}
  ${selectField('Giới tính','GIOI_TINH',option('','Chưa xác định',x.GIOI_TINH)+option('NAM','Nam',x.GIOI_TINH)+option('NU','Nữ',x.GIOI_TINH)+option('KHAC','Khác',x.GIOI_TINH))}
  ${field('Số quyết định *','SO_QUYET_DINH',x.SO_QUYET_DINH||'','text','required inputmode="numeric" pattern="[0-9]+" placeholder="VD: 02"')}
  ${field('Ngày quyết định *','NGAY_QUYET_DINH',x.NGAY_QUYET_DINH||'','date','required')}
  <div class="field"><label>Năm quyết định</label><input id="preview-year" type="text" value="${esc(x.NAM_QUYET_DINH||'Tự lấy từ ngày quyết định')}" readonly></div>
  ${selectField('Trường / Cơ sở đào tạo *','TRUONG_ID',activeCatOptions('truong',x.TRUONG_ID))}
  ${selectField('Nghề đào tạo *','NGHE_ID',activeCatOptions('nghe',x.NGHE_ID))}
  ${field('Ngày bắt đầu','NGAY_BAT_DAU',x.NGAY_BAT_DAU||'','date')}
  ${field('Ngày kết thúc dự kiến','NGAY_KET_THUC_DU_KIEN',x.NGAY_KET_THUC_DU_KIEN||'','date')}
  <div class="full extra-fields-title"><h4>Thông tin bổ sung theo danh sách học nghề</h4></div>
  ${field('Số sổ BHXH','SO_SO_BHXH',x.SO_SO_BHXH||'','text')}
  ${field('Số QĐ TCTN','SO_QD_TCTN',x.SO_QD_TCTN||'','text')}
  ${field('Ngày ban hành QĐ TCTN','NGAY_QD_TCTN',x.NGAY_QD_TCTN||'','date')}
  ${field('Số tháng hỗ trợ','SO_THANG_HO_TRO',supportMonthsVN(x.SO_THANG_HO_TRO),'text','inputmode="decimal" placeholder="VD: 3,5"')}
  ${field('Mức hỗ trợ/tháng','MUC_HO_TRO_THANG',supportMoneyVN(x.MUC_HO_TRO_THANG),'text','inputmode="decimal" placeholder="VD: 1.500.000"')}
  ${field('Ngày kết thúc hưởng TCTN','NGAY_KET_THUC_TCTN',x.NGAY_KET_THUC_TCTN||'','date')}
  ${field('Ngày kết thúc hỗ trợ học nghề','NGAY_KET_THUC_HO_TRO',x.NGAY_KET_THUC_HO_TRO||'','date')}
  ${field('Địa chỉ tạm trú','DIA_CHI_TAM_TRU',x.DIA_CHI_TAM_TRU||'','text')}
  ${field('Địa chỉ thường trú','DIA_CHI_THUONG_TRU',x.DIA_CHI_THUONG_TRU||'','text')}
  ${field('Số CMND','SO_CMND',x.SO_CMND||'','text')}
  ${field('Ngày cấp CMND','NGAY_CAP_CMND',x.NGAY_CAP_CMND||'','date')}
  ${field('Nơi cấp CMND','NOI_CAP_CMND',x.NOI_CAP_CMND||'','text')}
  ${field('Địa chỉ cơ sở đào tạo','DIA_CHI_CO_SO',x.DIA_CHI_CO_SO||'','text')}
  ${field('Chi nhánh BHTN','CHI_NHANH_BHTN',x.CHI_NHANH_BHTN||'','text')}
  ${field('Điện thoại','DIEN_THOAI',x.DIEN_THOAI||'','text')}
  ${statusSelect(x)}${dropoutFields(x)}
  <div class="field full"><label>Ghi chú</label><textarea name="GHI_CHU" maxlength="1500">${esc(x.GHI_CHU||'')}</textarea></div>
  ${modalFoot(edit?'Lưu thay đổi':'Tạo hồ sơ')}</form>`;
  showModal(edit?'Chỉnh sửa hồ sơ học nghề':'Thêm hồ sơ học nghề',form);updateDropoutFields($('#record-form'));
}
const RECORD_DETAIL_LABELS=[['HO_TEN','Họ và tên'],['NGAY_SINH','Năm sinh'],['GIOI_TINH','Giới tính'],['SO_SO_BHXH','Số sổ BHXH'],['SO_QUYET_DINH','Số QĐ HTHN'],['NGAY_QUYET_DINH','Ngày ban hành QĐHN'],['SO_QD_TCTN','Số QĐ TCTN'],['NGAY_QD_TCTN','Ngày ban hành QĐ TCTN'],['NGHE_ID','Nghề đăng ký'],['SO_THANG_HO_TRO','Số tháng hỗ trợ'],['MUC_HO_TRO_THANG','Mức hỗ trợ/tháng'],['NGAY_BAT_DAU','Thời gian đào tạo – Từ ngày'],['NGAY_KET_THUC_DU_KIEN','Thời gian đào tạo – Đến ngày'],['TRUONG_ID','Cơ sở đào tạo nghề'],['NGAY_KET_THUC_TCTN','Ngày kết thúc hưởng TCTN'],['NGAY_KET_THUC_HO_TRO','Ngày kết thúc hỗ trợ học nghề'],['DIA_CHI_TAM_TRU','Địa chỉ tạm trú'],['DIA_CHI_THUONG_TRU','Địa chỉ thường trú'],['SO_CMND','Số CMND'],['NGAY_CAP_CMND','Ngày cấp CMND'],['NOI_CAP_CMND','Nơi cấp CMND'],['DIA_CHI_CO_SO','Địa chỉ cơ sở đào tạo'],['CHI_NHANH_BHTN','Chi nhánh BHTN'],['DIEN_THOAI','Điện thoại']];
function recordDetail(r){const rows=RECORD_DETAIL_LABELS.map(([k,label])=>{let val=r[k]||'';if(k==='NGHE_ID')val=lookup('nghe',val);if(k==='TRUONG_ID')val=lookup('truong',val);if(k==='SO_THANG_HO_TRO')val=supportMonthsVN(val);if(k==='MUC_HO_TRO_THANG')val=supportMoneyVN(val);if(['NGAY_SINH','NGAY_QUYET_DINH','NGAY_QD_TCTN','NGAY_BAT_DAU','NGAY_KET_THUC_DU_KIEN','NGAY_KET_THUC_TCTN','NGAY_KET_THUC_HO_TRO','NGAY_CAP_CMND'].includes(k)&&val)val=dateVN(val);if(k==='GIOI_TINH')val=({NAM:'Nam',NU:'Nữ',KHAC:'Khác'})[val]||val;return `<tr><th>${esc(label)}</th><td>${esc(val||'—')}</td></tr>`;}).join('');showModal('Chi tiết hồ sơ học nghề',`<div class="table-wrap detail-table"><table><tbody>${rows}</tbody></table></div><div class="modal-foot"><button class="btn" data-close="1">Đóng</button></div>`);}
function statusForm(r){showModal('Cập nhật tình trạng học nghề',`<form id="status-form" class="form-grid" data-original-period="${esc(r.NGAY_BO_HOC||'')}" data-support-months="${esc(r.SO_THANG_HO_TRO||'')}"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="full info-banner">${esc(r.HO_TEN)} · Quyết định ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}</div>${statusSelect(r)}${dropoutFields(r)}${modalFoot('Cập nhật tình trạng')}</form>`);updateDropoutFields($('#status-form'));}
// A user's draft is never overwritten. Explicit confirmation is required to retry.
const situationLabel=r=>r.DA_BO_HOC==='TRUE'?'Bỏ học':STATUS[r.TRANG_THAI_THAM_GIA]||state.statuses.find(x=>x.id===r.TRANG_THAI_THAM_GIA)?.label||'Tình trạng khác';
function renderStatusConflict(form,fresh){
  if(!form?.isConnected||form.elements.HO_SO_ID.value!==fresh.HO_SO_ID)return;
  let area=$('#status-conflict');
  if(!area){area=document.createElement('div');area.id='status-conflict';area.className='full status-conflict';area.setAttribute('role','alert');form.querySelector('.info-banner')?.after(area);}
  const choice=form.elements.UI_TINH_TRANG?.selectedOptions?.[0]?.textContent||'Lựa chọn của bạn';
  area.innerHTML=`<strong>Hồ sơ vừa được người khác cập nhật</strong><p>Thay đổi của bạn chưa được lưu. Vui lòng đối chiếu tình trạng mới nhất trước khi quyết định cập nhật lại.</p><div class="conflict-compare"><span>Tình trạng mới nhất: <b>${esc(situationLabel(fresh))}</b></span><span>Bạn đang chọn: <b>${esc(choice)}</b></span></div><button type="button" class="btn btn-light" data-accept-conflict="1">Tôi đã kiểm tra, tiếp tục với lựa chọn của tôi</button>`;
  form.dataset.freshVersion=String(fresh.PHIEN_BAN);
  const submit=form.querySelector('[data-submit-btn]');if(submit)submit.disabled=true;
}
async function showStatusConflict(form){
  if(!form?.isConnected)return;
  try{
    const d=await rpc('record_fresh',{HO_SO_ID:form.elements.HO_SO_ID.value},{ttl:0});
    renderStatusConflict(form,d.record);
  }catch(e){failure(e);const submit=form.querySelector('[data-submit-btn]');if(submit)submit.disabled=true;}
}
function catalogForm(item){const type=state.catalogType,def={truong:['TRUONG_ID','MA_TRUONG','TEN_TRUONG'],nghe:['NGHE_ID','MA_NGHE','TEN_NGHE'],lydo:['LY_DO_ID','MA_LY_DO','NOI_DUNG']}[type],x=item||{};
  showModal((item?'Sửa':'Thêm')+' '+NAMES[type].toLowerCase(),`<form id="catalog-form" class="form-grid"><input type="hidden" name="id" value="${esc(x[def[0]])}"><input type="hidden" name="type" value="${type}">${item?field('Mã danh mục (không thể thay đổi)','code',x[def[1]]||'','text','readonly'):''}${field('Tên / Nội dung *','title',x[def[2]]||'','text','required maxlength="250"')}${type==='truong'?`${field('Tên viết tắt','shortName',x.TEN_VIET_TAT||'')}${field('Địa chỉ','address',x.DIA_CHI||'')}`:''}${type==='truong'?'':field('Thứ tự','order',x.THU_TU||0,'number')}${selectField('Trạng thái','status',option('ACTIVE','Đang sử dụng',x.TRANG_THAI||'ACTIVE')+option('INACTIVE','Ngừng sử dụng',x.TRANG_THAI))}<div class="field full"><label>Ghi chú</label><textarea name="note">${esc(x.GHI_CHU||'')}</textarea></div><div class="full form-hint">${item?'Mã danh mục đã cấp được giữ nguyên để bảo vệ hồ sơ liên kết.':'Hệ thống sẽ tự tạo mã sau khi lưu.'}</div>${modalFoot('Lưu danh mục')}</form>`);
}
const BULK_HEADERS={
  truong:['Tên cơ sở đào tạo','Tên viết tắt','Địa chỉ','Ghi chú'],
  nghe:['Tên nghề','Thứ tự hiển thị','Ghi chú'],
  lydo:['Nội dung lý do','Thứ tự hiển thị','Ghi chú']
};
function csvQuote(s){return '"'+String(s??'').replace(/"/g,'""')+'"';}
function downloadCatalogTemplate(type){
  if(!BULK_HEADERS[type])throw Error('Vui lòng chọn loại danh mục.');
  const a=document.createElement('a');a.href='/templates/MAU_DANH_MUC_'+type.toUpperCase()+'.xlsx';a.download='MAU_DANH_MUC_'+type.toUpperCase()+'.xlsx';document.body.appendChild(a);a.click();a.remove();
}
// Đọc workbook XLSX tiêu chuẩn bằng ZIP + XML, không gửi file Excel chứa thông tin cá nhân tới dịch vụ thứ ba.
async function readXlsxRows(bytes,{allowCachedFormula=false,sheetName=null}={}){
  const view=new DataView(bytes),u8=new Uint8Array(bytes),text=new TextDecoder('utf-8',{fatal:true});
  function u16(n){return view.getUint16(n,true);}function u32(n){return view.getUint32(n,true);}
  let pos=-1;for(let i=bytes.byteLength-22;i>=Math.max(0,bytes.byteLength-65557);i--){if(u32(i)===0x06054b50){pos=i;break;}}
  if(pos<0)throw Error('File Excel không hợp lệ.');
  const count=u16(pos+10),entries=new Map();let p=u32(pos+16),total=0;
  if(count>400)throw Error('File Excel có quá nhiều thành phần.');
  for(let i=0;i<count;i++){
    if(u32(p)!==0x02014b50)throw Error('Cấu trúc file Excel không hợp lệ.');
    const method=u16(p+10),comp=u32(p+20),plain=u32(p+24),len=u16(p+28),extra=u16(p+30),comment=u16(p+32),offset=u32(p+42);
    const name=text.decode(u8.slice(p+46,p+46+len));total+=plain;
    if(total>10000000||plain>6000000)throw Error('File Excel có dữ liệu quá lớn.');
    entries.set(name,{method,comp,offset});p+=46+len+extra+comment;
  }
  async function get(name){const entry=entries.get(name);if(!entry)return null;
    const at=entry.offset;if(u32(at)!==0x04034b50)throw Error('File Excel bị lỗi.');
    const dataAt=at+30+u16(at+26)+u16(at+28);const chunk=u8.slice(dataAt,dataAt+entry.comp);
    if(entry.method===0)return text.decode(chunk);
    if(entry.method!==8||typeof DecompressionStream==='undefined')throw Error('Trình duyệt chưa hỗ trợ đọc file Excel này.');
    const stream=new Blob([chunk]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return text.decode(await new Response(stream).arrayBuffer());
  }
  const shared=[],strings=await get('xl/sharedStrings.xml');
  if(strings){const doc=new DOMParser().parseFromString(strings,'text/xml');
    for(const si of doc.getElementsByTagNameNS('*','si'))shared.push([...si.getElementsByTagNameNS('*','t')].map(x=>x.textContent).join(''));
  }
  let sheetPath='xl/worksheets/sheet1.xml';
  if(sheetName){
    const bookText=await get('xl/workbook.xml'),relText=await get('xl/_rels/workbook.xml.rels');
    if(!bookText||!relText)throw Error('File Excel thiếu cấu trúc danh sách trang tính.');
    const book=new DOMParser().parseFromString(bookText,'text/xml');
    const list=[...book.getElementsByTagNameNS('*','sheet')];
    const selected=list.find(x=>keyVN(x.getAttribute('name'))===keyVN(sheetName));
    if(!selected&&list.length!==1)throw Error('File Excel phải có trang tính Danh sách chứa học viên.');
    const picked=selected||list[0];if(!picked)throw Error('Không tìm thấy trang tính học viên.');
    const rel=new DOMParser().parseFromString(relText,'text/xml');
    const rid=picked.getAttribute('r:id')||picked.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
    const entry=[...rel.getElementsByTagNameNS('*','Relationship')].find(x=>x.getAttribute('Id')===rid);
    if(!entry)throw Error('Liên kết trang tính Excel không hợp lệ.');
    const target=entry.getAttribute('Target')||'';
    sheetPath=target.startsWith('/')?target.replace(/^\/+/, ''):'xl/'+target.replace(/^\.\//,'');
    if(!/^xl\/worksheets\/sheet\d+\.xml$/.test(sheetPath))throw Error('Trang tính Excel không hợp lệ.');
  }
  const sheet=await get(sheetPath);if(!sheet)throw Error('Không tìm thấy trang tính học viên trong Excel.');
  const doc=new DOMParser().parseFromString(sheet,'text/xml');
  if(doc.getElementsByTagName('parsererror').length)throw Error('File Excel có cấu trúc không hợp lệ.');
  const rows=[];for(const row of doc.getElementsByTagNameNS('*','row')){
    const cells=[];
    for(const cell of row.getElementsByTagNameNS('*','c')){
      if(cell.getElementsByTagNameNS('*','f').length){if(!allowCachedFormula)throw Error('Không sử dụng công thức trong file danh mục.');if(!cell.getElementsByTagNameNS('*','v').length)throw Error('Một ô công thức chưa có kết quả lưu sẵn; vui lòng lưu lại file Excel trước khi nhập.');}
      const ref=cell.getAttribute('r')||'',letters=(ref.match(/^[A-Z]+/)||[''])[0];let col=0;for(const ch of letters)col=col*26+ch.charCodeAt(0)-64;col--;
      if(col<0||col>30)continue;
      const kind=cell.getAttribute('t'),v=cell.getElementsByTagNameNS('*','v')[0]?.textContent||'';
      const value=kind==='s'?(shared[Number(v)]||''):kind==='inlineStr'?[...cell.getElementsByTagNameNS('*','t')].map(x=>x.textContent).join(''):v;
      cells[col]=value;
    }
    if(cells.some(v=>String(v||'').trim()))rows.push(Array.from({length:Math.max(...Object.keys(cells).map(Number),0)+1},(_,i)=>String(cells[i]||'')));
    if(rows.length>4000)throw Error('File Excel có quá nhiều dòng.');
  }
  return rows;
}

/* YC-HN-009: Đọc Excel ở máy người dùng; không tải nguyên file lên máy chủ. */
const RECORD_HEADERS=['STT','Họ và tên','Ngày sinh','Giới tính','Số quyết định HTHN','Ngày quyết định HTHN','Cơ sở đào tạo nghề','Nghề đăng ký','Ngày bắt đầu','Ngày kết thúc dự kiến'];
const RECORD_ALIASES={
  name:['ho va ten','ho ten','ten nguoi hoc'],birthDate:['ngay sinh','nam sinh'],sex:['gioi tinh'],
  decision:['so qd hthn','so quyet dinh hthn','so qd hthn','so quyet dinh hoc nghe','so qd hoc nghe','so quyet dinh'],
  decisionDate:['ngay ban hanh qdhn','ngay quyet dinh hthn','ngay ban hanh qd hthn','ngay ban hanh quyet dinh hthn','ngay ban hanh qd hoc nghe','ngay quyet dinh'],
  school:['co so dao tao nghe','co so dao tao','truong co so dao tao'],trade:['nghe dang ky','nghe dao tao','nghe'],
  startDate:['thoi gian dao tao tu ngay','ngay bat dau','thoi gian dao tao tu ngay','tu ngay'],endDate:['thoi gian dao tao den ngay','ngay ket thuc du kien','thoi gian dao tao den ngay','den ngay'],
  SO_SO_BHXH:['so so bhxh'],
  SO_QD_TCTN:['so qd tctn'],
  NGAY_QD_TCTN:['ngay ban hanh qd tctn'],
  SO_THANG_HO_TRO:['so thang ho tro'],
  MUC_HO_TRO_THANG:['muc ho tro thang'],
  NGAY_KET_THUC_TCTN:['ngay ket thuc huong tctn'],
  NGAY_KET_THUC_HO_TRO:['ngay ket thuc ho tro hoc nghe'],
  DIA_CHI_TAM_TRU:['dia chi tam tru'],
  DIA_CHI_THUONG_TRU:['dia chi thuong tru'],
  SO_CMND:['so cmnd'],
  NGAY_CAP_CMND:['ngay cap cmnd'],
  NOI_CAP_CMND:['noi cap cmnd'],
  DIA_CHI_CO_SO:['dia chi co so dao tao'],
  CHI_NHANH_BHTN:['chi nhanh bhtn'],
  DIEN_THOAI:['dien thoai'],
  importStatus:['tinh trang hoc nghe','tinh trang tham gia'],
  dropoutDate:['ngay bo hoc'],
  dropoutReason:['ly do bo hoc']
};
const keyVN=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function excelISO(x){
  const t=String(x??'').trim();if(!t)return '';
  if(/^\d{4}-\d{2}-\d{2}/.test(t))return t.slice(0,10);
  const v=t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if(v)return v[3]+'-'+v[2].padStart(2,'0')+'-'+v[1].padStart(2,'0');
  if(/^\d{5}(?:\.0+)?$/.test(t)){const d=new Date(Date.UTC(1899,11,30)+Math.floor(Number(t))*86400000);return d.toISOString().slice(0,10);}
  return t;
}
function parseRecordExcel(data){
  if(!Array.isArray(data)||!data.length)throw Error('File Excel không có dữ liệu.');
  const sample=data[0].map(keyVN),sub=(data[1]||[]).map(keyVN);
  const secondHeader=sample.some(x=>x.includes('thoi gian dao tao'))&&sub.some(x=>x==='tu ngay'||x==='den ngay');
  const columns=sample.map((h,i)=>{
    if(secondHeader && (sub[i]==='tu ngay'||sub[i]==='den ngay'))return 'thoi gian dao tao '+sub[i];
    return h||sub[i]||'';
  });
  const mapping={};Object.entries(RECORD_ALIASES).forEach(([key,aliases])=>{const at=columns.findIndex(x=>aliases.includes(x));if(at>=0)mapping[key]=at;});
  for(const field of ['name','decision','decisionDate','school','trade'])if(mapping[field]===undefined)throw Error('Không nhận diện được cột bắt buộc: '+{name:'Họ và tên',decision:'Số quyết định HTHN',decisionDate:'Ngày quyết định HTHN',school:'Cơ sở đào tạo nghề',trade:'Nghề đăng ký'}[field]+'.');
  const used=new Set(Object.values(mapping));
  const unused=columns.filter((c,i)=>c&&i!==0&&!used.has(i)).map(c=>c).slice(0,30);
  const offset=secondHeader?2:1;
  const rows=data.slice(offset).map((cells,i)=>({cells,line:i+offset+1})).filter(({cells})=>cells.some(x=>String(x??'').trim())).map(({cells,line})=>{
    const read=key=>String(cells[mapping[key]]??'').trim();
    return {line,name:read('name'),birthDate:excelISO(read('birthDate')),sex:read('sex'),importStatus:read('importStatus'),dropoutDate:excelISO(read('dropoutDate')),dropoutReason:read('dropoutReason'),
      decision:read('decision'),decisionDate:excelISO(read('decisionDate')),
      school:read('school'),trade:read('trade'),startDate:excelISO(read('startDate')),endDate:excelISO(read('endDate')),SO_SO_BHXH:read('SO_SO_BHXH'),SO_QD_TCTN:read('SO_QD_TCTN'),NGAY_QD_TCTN:excelISO(read('NGAY_QD_TCTN')),SO_THANG_HO_TRO:read('SO_THANG_HO_TRO'),MUC_HO_TRO_THANG:read('MUC_HO_TRO_THANG'),NGAY_KET_THUC_TCTN:excelISO(read('NGAY_KET_THUC_TCTN')),NGAY_KET_THUC_HO_TRO:excelISO(read('NGAY_KET_THUC_HO_TRO')),DIA_CHI_TAM_TRU:read('DIA_CHI_TAM_TRU'),DIA_CHI_THUONG_TRU:read('DIA_CHI_THUONG_TRU'),SO_CMND:read('SO_CMND'),NGAY_CAP_CMND:excelISO(read('NGAY_CAP_CMND')),NOI_CAP_CMND:read('NOI_CAP_CMND'),DIA_CHI_CO_SO:read('DIA_CHI_CO_SO'),CHI_NHANH_BHTN:read('CHI_NHANH_BHTN'),DIEN_THOAI:read('DIEN_THOAI')};
  });
  if(rows.length<1||rows.length>3000)throw Error('Mỗi file cần từ 1 đến 3.000 dòng hồ sơ. Vui lòng chia file nếu có nhiều hơn.');
  return {rows,unused,offset};
}
function downloadRecordTemplate(){const a=document.createElement('a');a.href='/templates/MAU_NHAP_HO_SO_HOC_NGHE.xlsx';a.download='MAU_NHAP_HO_SO_HOC_NGHE.xlsx';document.body.append(a);a.click();a.remove();}
/** YC-HN-016: Trạng thái hàng loạt, chỉ cập nhật hồ sơ CHO_XAC_NHAN. */
const STATUS_BULK_HEADERS=['Họ và tên','Số QĐ HTHN','Ngày ban hành QĐHN','Cơ sở đào tạo nghề','Số sổ BHXH','Áp dụng (X)','Tháng bỏ học','Lý do bỏ học'];
const statusBulkTarget=()=>$('#status-bulk-form')?.elements?.status?.value||'';
function parseStatusBulkExcel(raw,status){
  if(!Array.isArray(raw)||!raw.length)throw Error('File Excel không có dữ liệu.');
  const h1=raw[0].map(keyVN),h2=(raw[1]||[]).map(keyVN);
  const second=h2.some(x=>x.includes('tham gia hoc')||x.includes('tu ngay')||x.includes('den ngay'));
  const labels=h1.map((x,i)=>[x,h2[i]||''].join(' ').trim());
  const find=(keys)=>labels.findIndex(s=>keys.some(x=>s===x||s.includes(x)));
  const col={name:find(['ho va ten']),decision:find(['so qd hthn','so quyet dinh hthn']),decisionDate:find(['ngay ban hanh qdhn','ngay quyet dinh hthn','ngay ban hanh qd hthn']),school:find(['co so dao tao nghe']),bhxh:find(['so so bhxh']),apply:find(['ap dung']),study:find(['tham gia hoc']),dropoutPeriod:find(['thang bo hoc']),dropoutReason:find(['ly do bo hoc'])};
  if(['name','decision','decisionDate','school'].some(k=>col[k]<0))throw Error('Thiếu cột Họ tên, Số QĐ HTHN, Ngày ban hành QĐHN hoặc Cơ sở đào tạo nghề.');
  const marker=status==='DA_THAM_GIA'?(col.apply>=0?col.apply:col.study):col.apply;
  if(marker<0)throw Error(status==='DA_THAM_GIA'?'Cần cột Tham gia học (X) hoặc Áp dụng (X).':'Với tình trạng đã chọn, phải sử dụng file danh sách riêng có cột Áp dụng (X).');
  const rows=[],skipped=[];const offset=second?2:1;
  for(let i=offset;i<raw.length;i++){
    const cells=raw[i]||[],line=i+1;
    const val=k=>col[k]<0?'':String(cells[col[k]]??'').trim();
    if(!cells.some(v=>String(v??'').trim()))continue;
    const name=val('name'),decision=val('decision'),date=excelISO(val('decisionDate')),school=val('school');
    if(!name&&!decision&&!school){skipped.push({line,kind:'ignored',reason:'Dòng tổng hợp không phải hồ sơ cá nhân.'});continue;}
    const isMarked=/^[xX]$/.test(String(cells[marker]??'').trim());
    if(!isMarked){skipped.push({line,kind:'unselected',reason:'Không đánh dấu X, giữ nguyên hồ sơ.'});continue;}
    rows.push({line,name,decision,decisionDate:date,school,bhxh:val('bhxh'),dropoutPeriod:val('dropoutPeriod'),dropoutReason:val('dropoutReason')});
  }
  if(rows.length+skipped.length>3000)throw Error('File vượt 3.000 dòng. Hãy chia thành nhiều lần.');
  return {rows,skipped};
}
function statusBulkForm(){
  if(state.user?.VAI_TRO!=='ADMIN')return;
  state.statusImport={rows:[],skipped:[],results:[],fileName:'',verified:false,session:null};
  const opts=allStatusOptions().map(([id,label])=>option(id,label,'DA_THAM_GIA')).join('');
  showModal('Cập nhật tình trạng từ Excel',`<form id="status-bulk-form" class="form-grid">
    <div class="full info-banner">Chỉ Quản trị viên được cập nhật hàng loạt. <b>Chỉ hồ sơ Chưa xác nhận mới được thay đổi.</b> Hồ sơ đã có tình trạng khác sẽ giữ nguyên, kể cả hồ sơ Bỏ học.</div>
    <div class="field full"><label>Tình trạng cần cập nhật *</label><select name="status">${opts}</select></div>
    <div class="field full status-bulk-dropout" hidden><label>Tháng bắt đầu bỏ học (nếu chung cho danh sách)</label><select name="dropoutPeriod">${option('','-- Chọn --')}${Array.from({length:6},(_,i)=>option('KY:'+(i+1),'Tháng thứ '+(i+1))).join('')}</select></div>
    <div class="field full status-bulk-dropout" hidden><label>Lý do bỏ học (nếu chung cho danh sách)</label><select name="dropoutReason">${option('','-- Chọn --')}${(state.cats.lydo||[]).filter(x=>x.TRANG_THAI==='ACTIVE').map(x=>option(x.LY_DO_ID,x.NOI_DUNG)).join('')}</select></div>
    <div class="full"><button type="button" class="btn btn-light" data-status-bulk-template="1">⬇ Tải Excel mẫu cập nhật tình trạng</button></div>
    <div class="field full"><label>Chọn file Excel (.xlsx) *</label><input id="status-bulk-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required></div>
    <p class="small full">Nếu chọn <b>Đã tham gia học</b>, hệ thống chỉ lấy người được đánh dấu X tại cột Tham gia học hoặc Áp dụng. Với tình trạng khác, sử dụng mẫu danh sách riêng, đánh dấu X tại cột Áp dụng. Ô không có X không bị thay đổi.</p>
    <div id="status-bulk-progress" class="full import-review" aria-live="polite">Chưa chọn file. Hãy chọn một tình trạng và danh sách tương ứng.</div>
    <div class="full"><button type="button" class="btn btn-light" data-status-bulk-errors="1" hidden>⬇ Xuất danh sách cần kiểm tra</button></div>
    <label class="import-accept full"><input name="ack" type="checkbox" required> Tôi đã kiểm tra kết quả đối chiếu và đồng ý chỉ cập nhật các hồ sơ đủ điều kiện.</label>
    <div class="modal-foot full"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-light" data-status-bulk-check="1">Kiểm tra dữ liệu</button><button type="submit" class="btn btn-primary" id="status-bulk-submit" disabled data-submit-btn="1">Xác nhận cập nhật</button></div>
  </form>`);
  statusBulkToggle();
}
function statusBulkToggle(){const f=$('#status-bulk-form');if(!f)return;const dropout=f.elements.status.value==='BO_HOC';f.querySelectorAll('.status-bulk-dropout').forEach(e=>e.hidden=!dropout);}
function resetStatusBulkReview(message){if(!state.statusImport)return;state.statusImport.verified=false;state.statusImport.session=null;state.statusImport.results=[];const el=$('#status-bulk-progress');if(el)el.textContent=message;const button=$('#status-bulk-submit');if(button)button.disabled=true;const errors=$('[data-status-bulk-errors]');if(errors)errors.hidden=true;}
const statusBulkCounts=items=>items.reduce((o,r)=>(o[r.kind]=(o[r.kind]||0)+1,o),{});
function statusBulkRenderResults(rows,skipped){
  const box=$('#status-bulk-progress');if(!box)return;
  const all=[...rows,...skipped],count=statusBulkCounts(all),summary=[['eligible','Đủ điều kiện'],['updated','Đã cập nhật'],['same','Đã đúng tình trạng'],['protected','Đã có tình trạng khác'],['changed','Đã thay đổi khi ghi'],['missing','Không tìm thấy'],['duplicate','Trùng'],['invalid','Sai/thiếu thông tin'],['unselected','Không đánh dấu X'],['ignored','Dòng tổng hợp'],['pending','Chưa xử lý']];
  const cards=summary.filter(([k])=>count[k]).map(([k,label])=>`<span>${esc(label)}: <b>${num(count[k])}</b></span>`).join('');
  const problematic=all.filter(x=>!['eligible','updated','ignored','unselected'].includes(x.kind));
  const sample=all.slice(0,35).map(x=>`<tr><td>${num(x.line)}</td><td>${esc(statusBulkKindVi(x.kind))}</td><td>${esc(x.reason)}</td></tr>`).join('');
  box.innerHTML=`<div class="import-summary"><b>${num(all.length)} dòng được đọc</b>${cards}</div>${problematic.length?`<p class="small"><b>${num(problematic.length)} dòng không cập nhật / cần rà soát.</b> Có thể tải danh sách riêng để kiểm tra.</p>`:''}<div class="table-wrap import-preview-table"><table><thead><tr><th>Dòng</th><th>Phân loại</th><th>Kết quả / lý do</th></tr></thead><tbody>${sample}</tbody></table></div>`;
  const exportBtn=$('[data-status-bulk-errors]');if(exportBtn)exportBtn.hidden=!problematic.length;
}
async function statusBulkCheck(){
  const f=$('#status-bulk-form'),s=state.statusImport;
  if(!f||!s?.rows?.length)throw Error('Vui lòng chọn file có ít nhất một dòng đánh dấu X.');
  const status=f.elements.status.value;if(s.target!==status)throw Error('Bạn đã đổi tình trạng. Vui lòng chọn lại file và kiểm tra.');
  const checked=[],global={dropoutPeriod:f.elements.dropoutPeriod.value,dropoutReason:f.elements.dropoutReason.value};
  const btn=$('[data-status-bulk-check]'),before=btn.textContent;btn.disabled=true;btn.textContent='Đang kiểm tra...';
  try{
    for(let i=0;i<s.rows.length;i+=120){$('#status-bulk-progress').textContent=`Đã kiểm tra ${num(i)}/${num(s.rows.length)} dòng. Đang đối chiếu với hồ sơ...`;
      const part=await rpc('record_status_bulk_check',{status,...global,rows:s.rows.slice(i,i+120)},{ttl:0});checked.push(...part.items);}
  }finally{btn.disabled=false;btn.textContent=before;}
  // Hai dòng cùng quyết định/năm trên toàn bộ file không được chọn ngẫu nhiên một dòng.
  const grouped=new Map();for(const r of s.rows){const k=String(r.decision).replace(/^0+(?=\d)/,'')+'|'+r.decisionDate.slice(0,4);grouped.set(k,(grouped.get(k)||0)+1);}
  const statusByLine=new Map(s.rows.map(r=>[r.line,r]));
  for(const row of checked){const source=statusByLine.get(row.line);if(!source)continue;const key=String(source.decision).replace(/^0+(?=\d)/,'')+'|'+source.decisionDate.slice(0,4);if(grouped.get(key)>1){Object.assign(row,{kind:'duplicate',reason:'Số quyết định/năm xuất hiện nhiều lần trong file.',hoSoId:'',version:''});}}
  s.results=checked;s.verified=true;s.session=null;s.global=global;
  statusBulkRenderResults(checked,s.skipped);
  $('#status-bulk-submit').disabled=!checked.some(x=>x.kind==='eligible');
}
async function statusBulkApply(){
  const s=state.statusImport,f=$('#status-bulk-form');if(!s?.verified||!f)throw Error('Bạn cần Kiểm tra dữ liệu trước khi cập nhật.');
  if(!f.elements.ack.checked)throw Error('Vui lòng xác nhận đã kiểm tra kết quả.');
  const target=f.elements.status.value;
  if(target!==s.target||JSON.stringify(s.global)!==JSON.stringify({dropoutPeriod:f.elements.dropoutPeriod.value,dropoutReason:f.elements.dropoutReason.value}))throw Error('Thông tin đã thay đổi, hãy kiểm tra lại.');
  const task=s.session||(s.session={batchId:rid(),offset:0,lines:s.results.filter(x=>x.kind==='eligible')});
  const list=task.lines,source=new Map(s.rows.map(r=>[r.line,r]));
  if(!list.length)throw Error('Không có hồ sơ đủ điều kiện cập nhật.');
  for(let i=task.offset;i<list.length;i+=10){
    const slice=list.slice(i,i+10),rows=slice.map(x=>({...source.get(x.line),hoSoId:x.hoSoId,version:x.version}));
    const result=await rpc('record_status_bulk_apply',{status:target,...s.global,batchId:task.batchId,rows},{mutate:true,requestId:task.batchId+'_'+String(i).padStart(5,'0')});
    for(const item of result.results){const current=s.results.find(x=>x.line===item.line);if(current)Object.assign(current,item);}
    task.offset=Math.min(i+10,list.length);
    const box=$('#status-bulk-progress');if(box)box.textContent=`Đã xử lý ${num(task.offset)}/${num(list.length)} hồ sơ đủ điều kiện. Đang cập nhật...`;
  }
  s.session=null;s.verified=false;
  statusBulkRenderResults(s.results,s.skipped);
  const updated=s.results.filter(x=>x.kind==='updated').length;
  $('#status-bulk-submit').disabled=true;
  notify(`Đã cập nhật ${num(updated)} hồ sơ. Các hồ sơ đã có tình trạng khác được giữ nguyên.`);
  // Không đóng ngay kết quả; invalidation dữ liệu cần làm mới khi trở lại trang.
  expireCacheActions(['overview','report_matrix','records_list','report_export']);state.pageViews.delete('dashboard');state.pageViews.delete('reports');state.pageViews.delete('records');
  if(state.page==='records')void navigate('records',true).catch(failure);
}

function bulkRecordForm(){
  if(state.user?.VAI_TRO!=='ADMIN')return;
  state.importRows=null;state.importFile=null;state.importPreview=null;state.importSession=null;
  showModal('Nhập hồ sơ học nghề từ Excel',`<form id="bulk-record-form" class="form-grid">
    <div class="full info-banner">Chức năng dành cho Quản trị viên. Hồ sơ do Quản trị viên nhập và được tự động hiển thị cho cơ sở đào tạo có tài khoản đã được cấp quyền tương ứng. Không phải phân công từng hồ sơ.</div>
    <div class="full"><button type="button" class="btn" data-record-template="1">⬇ Tải file Excel mẫu</button></div>
    <div class="field full"><label>Chọn file Excel (.xlsx) có tối đa 3.000 dòng</label><input type="file" id="record-import-file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required></div>
    <div id="record-import-review" class="full import-review muted" aria-live="polite">Chưa chọn file Excel.</div>
    <div class="full"><button type="button" class="btn btn-light" id="record-error-export" data-record-errors="1" hidden>⬇ Tải danh sách lỗi/trùng</button></div>
    <label class="import-accept full"><input name="ack" type="checkbox" required> Tôi đã kiểm tra dữ liệu xem trước và xác nhận nhập các hồ sơ hợp lệ.</label>
    <div class="modal-foot full"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-light" data-record-check="1">Kiểm tra dữ liệu</button><button type="submit" class="btn btn-primary" id="record-import-submit" data-submit-btn="1" disabled>Xác nhận nhập</button></div>
  </form>`);
}
async function recordBulkCheck(){
  const form=$('#bulk-record-form'),rows=state.importRows;
  if(!form||!rows?.length)throw Error('Vui lòng chọn file Excel trước.');
  const checkBtn=form.querySelector('[data-record-check]');const oldLabel=checkBtn.textContent;checkBtn.disabled=true;checkBtn.textContent='Đang kiểm tra...';
  const review=$('#record-import-review');const parts=[];try{for(let i=0;i<rows.length;i+=120){review.textContent=`Đã kiểm tra ${num(i)}/${num(rows.length)} dòng. Đang xử lý...`;parts.push(await rpc('record_bulk_check',{rows:rows.slice(i,i+120)},{ttl:0}));review.textContent=`Đã kiểm tra ${num(Math.min(i+120,rows.length))}/${num(rows.length)} dòng (${parts.length}/${Math.ceil(rows.length/120)} đợt).`;}}finally{checkBtn.disabled=false;checkBtn.textContent=oldLabel;}
  const newCatalogs={truong:[],nghe:[],lydo:[]};
  const nameKey=x=>String(x||'').normalize('NFC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
  for(const type of ['truong','nghe','lydo']){
    const seen=new Set();for(const part of parts)for(const title of (part.newCatalogs?.[type]||[])){
      if(!seen.has(nameKey(title))){newCatalogs[type].push(title);seen.add(nameKey(title));}
    }
  }
  const found=new Map(),issues=[];
  for(const part of parts)for(const issue of (part.issues||[])){found.set(Number(issue.line),issue.kind||(/quyết định.*trùng|quyết định đã có/i.test(issue.reason)?'duplicate':'invalid'));issues.push(issue);}
  const seen=new Set(),duplicateLines=new Set();
  for(const r of rows){const line=Number(r.line);if(found.has(line))continue;const key=/^\d+$/.test(String(r.decision))?String(r.decision).replace(/^0+(?=\d)/,'')+'|'+String(r.decisionDate).slice(0,4):'';if(key&&seen.has(key)){found.set(line,'duplicate');duplicateLines.add(line);issues.push({line,kind:'duplicate',reason:'Số quyết định trùng trong file Excel.'});}else if(key)seen.add(key);}
  const plan={total:rows.length,valid:rows.filter(r=>!found.has(Number(r.line))).length,duplicate:[...found.values()].filter(v=>v==='duplicate').length,invalid:[...found.values()].filter(v=>v!=='duplicate').length,issues:issues.sort((a,b)=>a.line-b.line),newCatalogs};
  state.importDuplicateLines=duplicateLines;
  state.importPreview=plan;state.importSession=null;
  const unhandled=state.importFile?.unused||[];
  const list=plan.issues.slice(0,25).map(x=>`<li>Dòng ${num(x.line)}: ${esc(x.reason)}</li>`).join('');
  const samples=rows.slice(0,10).map(r=>`<tr><td>${num(r.line)}</td><td>${esc(r.name)}</td><td>${esc(r.decision)}</td><td>${esc(r.decisionDate)}</td><td>${esc(r.school)}</td><td>${esc(r.trade)}</td></tr>`).join('');
  const catalogPreview=['truong','nghe','lydo'].map(type=>{
    const names=newCatalogs[type],label={truong:'Cơ sở đào tạo',nghe:'Nghề đào tạo',lydo:'Lý do bỏ học'}[type];
    return `<div class="import-catalog-preview"><b>${esc(label)} mới: ${num(names.length)}</b>${names.length?`<div class="small">${names.slice(0,35).map(esc).join(' · ')}${names.length>35?' · …':''}</div>`:''}</div>`;
  }).join('');
  $('#record-import-review').innerHTML=`<div class="import-summary"><b>${num(plan.total)} dòng</b><span>${num(plan.valid)} hợp lệ</span><span>${num(plan.duplicate)} trùng</span><span>${num(plan.invalid)} lỗi</span></div>
    <div class="import-new-catalogs"><b>Danh mục sẽ tự bổ sung khi xác nhận nhập:</b>${catalogPreview}<p class="small">Danh mục đã có sẽ được sử dụng lại. Danh mục ngừng sử dụng, trùng tên hoặc chưa rõ phải xử lý riêng.</p></div>
    ${unhandled.length?`<div class="import-warning"><b>Các cột chưa được ánh xạ (${num(unhandled.length)}):</b> ${unhandled.map(esc).join(', ')}. File gốc phải được lưu giữ để đối chiếu.</div>`:''}
    ${list?`<div class="small">Các dòng cần xem lại (tối đa 25):</div><ul class="import-issues">${list}</ul>`:''}
    <div class="small"><b>Xem trước 10 hồ sơ đầu tiên (chỉ để đối chiếu, chưa ghi):</b></div><div class="table-wrap import-preview-table"><table><thead><tr><th>Dòng</th><th>Họ tên</th><th>Số QĐ</th><th>Ngày QĐ</th><th>Cơ sở</th><th>Nghề</th></tr></thead><tbody>${samples}</tbody></table></div>
    <p class="small">Hồ sơ nhập từ Excel mặc định <b>Chưa xác nhận</b>. Chỉ những dòng hợp lệ và chưa có quyết định mới được nhập.</p>`;
  $('#record-import-submit').disabled=!(plan.valid>0)||unhandled.length>0;$('#record-error-export').hidden=plan.issues.length===0;
}
async function importBulkRecords(){
  const form=$('#bulk-record-form');
  if(!state.importPreview?.valid)throw Error('Vui lòng kiểm tra dữ liệu trước khi nhập.');
  if(state.importFile?.unused?.length)throw Error('File có cột chưa được nhận diện. Cần kiểm tra lại tiêu đề trước khi nhập.');
  if(!form.elements.ack.checked)throw Error('Vui lòng xác nhận đã kiểm tra dữ liệu.');
  const rows=state.importRows.filter(r=>!state.importDuplicateLines?.has(r.line)),btn=$('#record-import-submit');
  const task=state.importSession||(state.importSession={batchId:rid(),offset:0,added:0,duplicate:0,invalid:0,catalogsAdded:{truong:0,nghe:0,lydo:0}});
  const batchId=task.batchId,catalogsAdded=task.catalogsAdded;let {added,duplicate,invalid}=task;
  btn.disabled=true;
  // Giữ requestId ổn định cho từng đợt trong lần nhập; phía server kiểm tra trùng lại dưới LockService.
  for(let i=task.offset;i<rows.length;i+=40){
    const response=await rpc('record_bulk_import',{rows:rows.slice(i,i+40),batchId},{mutate:true,requestId:batchId+'_'+String(i).padStart(6,'0')});
    added+=response.added;duplicate+=response.duplicate;invalid+=response.invalid;
    for(const type of ['truong','nghe','lydo'])catalogsAdded[type]+=Number(response.addedCatalogs?.[type]||0);
    Object.assign(task,{offset:Math.min(i+40,rows.length),added,duplicate,invalid});
    const target=$('#record-import-review');if(target)target.innerHTML=`<b>Đã xử lý ${Math.min(i+40,rows.length)}/${rows.length} dòng.</b><p>Đã tạo: ${num(added)} hồ sơ · Trùng: ${num(duplicate)} · Lỗi: ${num(invalid)}. Danh mục mới: ${num(catalogsAdded.truong)} cơ sở, ${num(catalogsAdded.nghe)} nghề, ${num(catalogsAdded.lydo)} lý do bỏ học.</p>`;
  }
  state.importSession=null;
  try{const boot=await rpc('bootstrap',{}, {ttl:0});if(boot.catalogs)state.cats=boot.catalogs;}
  catch(e){notify('Hồ sơ đã ghi, nhưng danh mục chưa làm mới. Bạn có thể mở lại trang sau.',true);}
  notify(`Đã tạo ${num(added)} hồ sơ và ${num(catalogsAdded.truong)} cơ sở, ${num(catalogsAdded.nghe)} nghề, ${num(catalogsAdded.lydo)} lý do mới; bỏ qua ${num(duplicate)} quyết định trùng, ${num(invalid)} dòng lỗi.`);
  await afterMutation('records');
}

function parseCsv(text){
  const rows=[];let row=[],cell='',quote=false;
  const raw=String(text||'').replace(/^\uFEFF/,'');
  const header=raw.split(/\r?\n/,1)[0];
  const delimiter=header.split(';').length>header.split(',').length?';':',';
  for(let i=0;i<raw.length;i++){
    const c=raw[i];
    if(quote){if(c==='"'&&raw[i+1]==='"'){cell+='"';i++;}else if(c==='"')quote=false;else cell+=c;}
    else if(c==='"'){if(cell.length)throw Error('Tệp CSV có dấu nháy không hợp lệ.');quote=true;}
    else if(c===delimiter){row.push(cell);cell='';}
    else if(c==='\n'||c==='\r'){row.push(cell);cell='';if(row.some(x=>x.trim()!==''))rows.push(row);row=[];if(c==='\r'&&raw[i+1]==='\n')i++;}
    else cell+=c;
  }
  if(quote)throw Error('Tệp CSV thiếu dấu nháy đóng.');
  if(cell||row.length){row.push(cell);if(row.some(x=>x.trim()!==''))rows.push(row);}
  return rows;
}
function getBulkRows(form){
  const type=form.elements.type.value,headers=BULK_HEADERS[type];
  if(state.bulkRows){return state.bulkRows;}
  if(state.bulkFileText){
    const csv=parseCsv(state.bulkFileText);if(!csv.length)throw Error('Tệp không có nội dung.');
    if(csv[0].length!==headers.length||csv[0].some((h,i)=>h.trim()!==headers[i]))throw Error('Tiêu đề cột chưa đúng. Vui lòng sử dụng file mẫu của loại danh mục đã chọn.');
    return csv.slice(1).map((cells,i)=>{
      if(cells.length!==headers.length)throw Error('Số cột không đúng tại dòng '+(i+2)+'.');
      const row={title:cells[0].trim(),shortName:'',address:'',order:'',note:''};
      if(type==='truong'){row.shortName=cells[1].trim();row.address=cells[2].trim();row.note=cells[3].trim();}
      else {row.order=cells[1].trim();row.note=cells[2].trim();}
      return row;
    });
  }
  return form.elements.names.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(title=>({title}));
}
function bulkCatalogForm(){
  state.bulkFileText='';state.bulkRows=null;
  showModal('Nhập danh mục hàng loạt',`<form id="bulk-catalog-form" class="form-grid"><div class="field full"><label>Loại danh mục</label><select name="type">${Object.entries(NAMES).map(([t,n])=>option(t,n,state.catalogType)).join('')}</select></div>
    <div class="field full"><button type="button" class="btn btn-light" data-bulk-template="1">⬇ Tải file mẫu theo loại danh mục</button><p class="small muted">Điền danh sách theo đúng tên cột tiếng Việt trong file mẫu. Không cần nhập mã kỹ thuật.</p></div>
    <div class="field full"><label for="bulk-csv">Chọn file Excel (.xlsx) hoặc CSV đã điền</label><input id="bulk-csv" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"></div>
    <div class="field full"><label>Dán tên nhanh (mỗi dòng một tên, khi không dùng file)</label><textarea name="names" rows="6" placeholder="Dán danh sách tên, mỗi dòng một tên."></textarea></div>
    <div class="full info-banner">Sau khi kiểm tra, phần mềm sẽ báo số mục hợp lệ, trùng và lỗi. Các mục cũ được giữ nguyên.</div>
    <div id="bulk-review" class="full muted" aria-live="polite">Vui lòng kiểm tra danh sách trước khi nhập.</div>
    <div class="modal-foot full"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-light" data-bulk-check="1">Kiểm tra danh sách</button><button type="submit" class="btn btn-primary" data-submit-btn="1" id="bulk-import-submit" disabled>Xác nhận nhập</button></div></form>`);
}
function bulkNames(form){return getBulkRows(form).map(r=>r.title);}
function deleteRecordForm(r){showModal('Xác nhận xóa hồ sơ',`<div class="info-banner"><b>${esc(r.HO_TEN)}</b><div>Quyết định số ${esc(r.SO_QUYET_DINH)} năm ${esc(r.NAM_QUYET_DINH)}</div></div><p>Hồ sơ sẽ được chuyển vào danh sách đã xóa, không còn hiển thị trong thống kê hoạt động. Số quyết định vẫn được giữ để tránh sử dụng trùng.</p><div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-danger" data-confirm-delete="${esc(r.HO_SO_ID)}" data-submit-btn="1">Xác nhận xóa</button></div>`);}
function canDeleteRecord(r){return allowed('RECORD_DELETE')&&(state.user?.VAI_TRO==='ADMIN'||(r.TAO_BOI&&r.TAO_BOI.trim().toLowerCase()===state.user?.EMAIL?.trim().toLowerCase()));}
function deleteCatalogForm(item){const type=state.catalogType,def={truong:['TRUONG_ID','TEN_TRUONG'],nghe:['NGHE_ID','TEN_NGHE'],lydo:['LY_DO_ID','NOI_DUNG']}[type];
  showModal('Xác nhận xóa danh mục',`<div class="info-banner"><b>${esc(item[def[1]])}</b></div><p>Chỉ được xóa danh mục chưa từng sử dụng trong hồ sơ. Nếu danh mục đã được sử dụng, hãy chọn Ngừng sử dụng để giữ dữ liệu lịch sử.</p><div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-danger" data-confirm-catalog-delete="${esc(item[def[0]])}" data-submit-btn="1">Xác nhận xóa</button></div>`);
}
function deleteAccountForm(item){showModal('Xác nhận xóa tài khoản',`<div class="info-banner"><b>${esc(item.HO_TEN||item.EMAIL)}</b><div>${esc(item.EMAIL)}</div></div><p>Tài khoản sẽ không thể đăng nhập. Mọi hồ sơ đã tạo vẫn được lưu nguyên vẹn.</p><div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-danger" data-confirm-account-delete="${esc(item.TAI_KHOAN_ID)}" data-submit-btn="1">Xác nhận xóa</button></div>`);}
function updateAccountSchool(form){
  if(!form)return;
  const wrap=form.querySelector('.account-school'),select=form.elements.schoolId,show=form.elements.role?.value==='CO_SO_DAO_TAO';
  if(wrap)wrap.hidden=!show;
  if(select){select.disabled=!show;select.required=show;}
  const titleWrap=form.querySelector('.account-display-title'),titleInput=form.elements.displayTitle;
  const staff=form.elements.role?.value==='NHAN_VIEN';
  if(titleWrap)titleWrap.hidden=!staff;
  if(titleInput)titleInput.disabled=!staff;
}
function accountForm(item){const x=item||{};showModal(item?'Sửa tài khoản':'Thêm tài khoản',`<form id="account-form" class="form-grid"><input type="hidden" name="id" value="${esc(x.TAI_KHOAN_ID||'')}">${field('Email Google *','email',x.EMAIL||'','email','required')}${field('Họ tên','name',x.HO_TEN||'')}${selectField('Vai trò','role',option('NHAN_VIEN','Nhân viên',x.VAI_TRO||'NHAN_VIEN')+option('ADMIN','Quản trị viên',x.VAI_TRO)+option('CO_SO_DAO_TAO','Cơ sở đào tạo',x.VAI_TRO))}<div class="account-school">${selectField('Cơ sở được phân công','schoolId',activeCatOptions('truong',x.TRUONG_ID))}</div><div class="account-display-title"><div class="field"><label for="f-displayTitle">Chức danh/Phòng ban hiển thị</label><input id="f-displayTitle" name="displayTitle" type="text" maxlength="100" placeholder="Ví dụ: Nhân viên Phòng A, Trưởng phòng B" value="${esc(x.CHUC_DANH_HIEN_THI||'')}"></div></div>${selectField('Trạng thái','status',option('ACTIVE','Hoạt động',x.TRANG_THAI||'ACTIVE')+option('DISABLED','Khóa',x.TRANG_THAI))}${modalFoot('Lưu tài khoản')}</form>`);updateAccountSchool($('#account-form'));}
function fileModal(r){if(!allowed('FILE_UPLOAD')){notify('Bạn chỉ có quyền xem tệp đã được đính kèm.',true);return;}showModal('Tệp đính kèm của hồ sơ',`<div class="info-banner">${esc(r.HO_TEN)} · QĐ ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}<div>Chỉ chấp nhận PDF, JPG, PNG; tối đa 10 MB mỗi tệp.</div></div><form id="file-form" class="form-grid"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="field full"><label>Chọn tệp</label><input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg" required></div><div class="full" id="upload-progress" aria-live="polite"></div>${modalFoot('Tải lên')}</form>${r.HAS_FILE?`<div class="modal-file-actions">${allowed('FILE_VIEW')?`<button class="btn" data-file-get="${esc(r.HO_SO_ID)}">Tải tệp hiện tại</button>`:''}<button class="btn btn-danger" data-file-remove="${esc(r.HO_SO_ID)}">Gỡ tệp hiện tại</button></div>`:''}`);}
function getCurrentRecord(id){return state.records.find(x=>x.HO_SO_ID===id);}
async function refreshBootstrap(){const b=await rpc('bootstrap',{}, {ttl:0});state.user=b.user;state.cats=b.catalogs;state.statuses=b.statuses||[];state.permissionRevision=b.permissionRevision||'';state.dataRevision=b.dataRevision||'';state.catalogRevision=b.catalogRevision||'';state.statusRevision=b.statusRevision||'';state.permissionChecked=Date.now();}
async function afterMutation(page=state.page){closeModal();
  // Hồ sơ/tệp đã được invalidate trong rpc(); chỉ đọc lại bootstrap khi sửa danh mục hoặc tài khoản.
  if(page==='catalogs'||page==='accounts')await refreshBootstrap();
  navigate(page,true);
}
function csvCell(x){const str=String(x??'');const secure=/^[\s]*[=+\-@\t\r]/.test(str)?"'"+str:str;return '"'+secure.replace(/"/g,'""')+'"';}
function downloadCsv(name,rows){const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function exportReport(filters){const d=await rpc('report_export',filters,{ttl:30000});const firstHeader=[...d.columns];firstHeader[12]='Thời gian đào tạo';firstHeader[13]='';const secondHeader=Array(25).fill('');secondHeader[12]='Từ ngày';secondHeader[13]='Đến ngày';downloadXlsx('danh-sach-hoc-nghe-'+new Date().toISOString().slice(0,10)+'.xlsx',[firstHeader,secondHeader,...d.items]);notify('Đã xuất Excel '+num(d.items.length)+' hồ sơ.');}

function exportModal(){showModal('Xuất Excel báo cáo học nghề',`<form id="report-export-form" class="form-grid"><div class="field full"><label>Mẫu Excel cần xuất</label><select name="mode"><option value="list">Danh sách hồ sơ học nghề (25 cột)</option><option value="summary">Báo cáo tổng hợp (Chỉ tiêu / Số lượng)</option><option value="truong">Báo cáo theo cơ sở đào tạo</option><option value="nghe">Báo cáo theo nghề đào tạo</option></select></div>${modalFoot('Xuất Excel')}</form>`);}
async function exportSummaryOrMatrix(mode){
  const stamp=new Date().toISOString().slice(0,10);
  if(mode==='summary'){const d=await rpc('overview',state.reportFilters,{ttl:0});const lines=reportKpiRows(d.kpi,d.statusCounts,state.reportFilters.status).map((row,i)=>[i+1,...row]);downloadReportXlsx('Bao-cao-hoc-nghe-'+stamp+'.xlsx',['STT','Chỉ tiêu','Số lượng'],lines,'Báo cáo học nghề',{summaryCompact:true});}
  else{
    const d=await rpc('report_matrix',{...state.reportFilters,groupBy:mode},{ttl:0});
    const label=mode==='truong'?'Tên cơ sở đào tạo':'Tên nghề';
    // Các trạng thái tùy chỉnh có cột riêng khi xuất hiện; không đếm trùng vào "Khác".
    const customs=(d.customStatuses||[]).filter(x=>x&&x.id&&x.label);
    const customCount=r=>customs.reduce((sum,x)=>sum+Number(r.customStatusCounts?.[x.id]||0),0);
    const other=d.items.some(r=>Number(r.other||0)>customCount(r));
    const columns=['STT',label,'Tổng số Quyết định đã ban hành','Đã tham gia','Bỏ học','Không tham gia','Không nhận Quyết định','Chưa xác nhận','Hoàn thành khóa học',...customs.map(x=>x.label),...(other?['Tình trạng khác']:[])];
    // Frontend mới yêu cầu backend mới: không tự chuyển undefined thành 0 khi lệch bản triển khai.
    if(d.items.some(r=>!Number.isSafeInteger(r.participated)||r.participated<0)){
      throw Error('Chưa thể xuất báo cáo do dữ liệu chưa đồng bộ đầy đủ. Vui lòng liên hệ quản trị viên để kiểm tra.');
    }
    const rows=d.items.map((r,i)=>[i+1,r.name,r.total,r.participated,r.dropout,r.notParticipating,r.notReceived,r.pending,r.courseEndParticipated||0,...customs.map(x=>r.customStatusCounts?.[x.id]||0),...(other?[Math.max(0,Number(r.other||0)-customCount(r))]:[])]);
    // Đã tham gia bao gồm Bỏ học; không được cộng chồng cột Bỏ học vào tổng QĐ.
    if(d.items.some(r=>r.participated<Number(r.dropout||0)))throw Error('Số liệu Đã tham gia/Bỏ học chưa nhất quán. Vui lòng thử lại.');
    const total=[...Array(2).fill(''),...columns.slice(2).map((_,i)=>rows.reduce((sum,row)=>sum+Number(row[i+2]||0),0))];total[0]='Tổng cộng';
    if(total[2]!==d.total)throw Error('Số quyết định báo cáo chưa khớp; vui lòng thực hiện lại.');
    if(total[8]!==d.items.reduce((sum,r)=>sum+Number(r.courseEndParticipated||0),0))throw Error('Số hồ sơ hoàn thành chưa khớp.');
    rows.push(total);
    downloadReportXlsx('Bao-cao-theo-'+(mode==='truong'?'co-so-dao-tao':'nghe-dao-tao')+'-'+stamp+'.xlsx',columns,rows,'Báo cáo học nghề',{matrixTotals:true});
  }
  notify('Đã chuẩn bị Excel báo cáo học nghề.');
}
const FILE_LIMIT = 10485760;
function bufferToBase64(data){let text='';for(let i=0;i<data.length;i+=8192)text+=String.fromCharCode(...data.subarray(i,i+8192));return btoa(text);}
function base64ToBytes(b64){const text=atob(b64),result=new Uint8Array(text.length);for(let i=0;i<text.length;i++)result[i]=text.charCodeAt(i);return result;}
function setFileProgress(value,total){const el=$('#upload-progress');if(el)el.innerHTML=`<div class="progress-wrap"><div class="progress-track"><div class="progress-bar" style="width:${Math.min(100,Math.round(value/total*100))}%"></div></div><span>${Math.round(value/total*100)}% · ${num(value)} / ${num(total)} byte</span></div>`;}
async function uploadFile(file,form){
  if(file.size>FILE_LIMIT)throw Error('Tệp vượt dung lượng tối đa 10 MB.');
  if(!file.size)throw Error('Tệp trống. Vui lòng chọn tệp khác.');
  if(!['application/pdf','image/jpeg','image/png'].includes(file.type))throw Error('Chỉ chấp nhận PDF, JPG hoặc PNG.');
  const base={HO_SO_ID:form.elements.HO_SO_ID.value,PHIEN_BAN:form.elements.PHIEN_BAN.value};
  const begun=await rpc('file_upload_begin',{...base,name:file.name,mime:file.type,size:file.size},{mutate:true});
  const chunkSize=begun.chunkBytes||262144;
  try{
    let offset=0,finished=false;
    while(offset<file.size){
      const chunk=new Uint8Array(await file.slice(offset,Math.min(file.size,offset+chunkSize)).arrayBuffer());
      const answer=await rpc('file_upload_chunk',{uploadId:begun.uploadId,offset,base64:bufferToBase64(chunk)},{mutate:true});
      offset=answer.uploaded;finished=answer.finished;setFileProgress(offset,file.size);
    }
    if(!finished)throw Error('Chưa thể xác nhận tệp đã được lưu đầy đủ. Vui lòng kiểm tra hồ sơ trước khi thử lại.');
  }catch(e){try{await rpc('file_upload_cancel',{uploadId:begun.uploadId},{mutate:true});}catch(_){}throw e;}
}
async function getFile(id){
  const meta=await rpc('file_info',{HO_SO_ID:id},{ttl:0});
  if(meta.size>FILE_LIMIT)throw Error('Tệp vượt dung lượng tối đa 10 MB.');
  const parts=[];let offset=0;
  while(offset<meta.size){
    const d=await rpc('file_chunk',{HO_SO_ID:id,offset},{ttl:0});
    const part=base64ToBytes(d.base64);if(!part.length||d.offset!==offset)throw Error('Tệp tải xuống chưa đầy đủ. Vui lòng thử lại.');
    parts.push(part);offset+=part.length;
  }
  if(offset!==meta.size)throw Error('Tệp tải xuống chưa đầy đủ. Vui lòng thử lại.');
  const url=URL.createObjectURL(new Blob(parts,{type:meta.mime}));
  const a=document.createElement('a');a.href=url;a.download=meta.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  notify('Đã tải xuống tệp thành công.');
}
const serialized=async(fn,progress={})=>{
  if(state.busy)return;
  state.busy=true;
  const button=progress.button&&progress.button.isConnected?progress.button:null;
  const prior=button?.innerHTML;
  if(button){button.textContent=progress.label||'Đang xử lý…';button.setAttribute('aria-busy','true');}
  document.querySelectorAll('[data-submit-btn]').forEach(x=>x.disabled=true);
  try{await fn();}catch(e){if(e.code==='VERSION_CONFLICT'&&$('#status-form'))await showStatusConflict($('#status-form'));else failure(e);}
  finally{
    state.busy=false;
    if(button?.isConnected){button.innerHTML=prior;button.removeAttribute('aria-busy');}
    document.querySelectorAll('[data-submit-btn]').forEach(x=>{x.disabled=(!!(x.closest('#status-form')&&$('#status-conflict')) || x.id==='bulk-import-submit' && $('#bulk-catalog-form')?.dataset.ready!=='yes') || (x.id==='record-import-submit' && !state.importPreview?.valid) || (x.id==='status-bulk-submit' && (!state.statusImport?.verified || !state.statusImport?.results?.some(r=>r.kind==='eligible')));});
  }
};
// Delegated buttons: no inline user-controlled event handlers.
// YC-HN-020: lịch dùng event delegation; không bị mất handler khi chuyển menu.
document.addEventListener('click',e=>{
  const el=e.target.closest('button,.calendar-date-input');
  if(el?.matches('.calendar-date-input,[data-calendar-open]')){
    e.preventDefault();const input=el.matches('input')?el:el.closest('.calendar-field')?.querySelector('.calendar-date-input');openCalendar(input);return;
  }
  if(!activeCalendar)return;
  if(!e.target.closest('#hn-date-calendar')){closeCalendar();return;}
  const action=e.target.closest('button');if(!action)return;
  if(action.hasAttribute('data-calendar-day')){pickCalendar(calendarISO(activeCalendar.year,activeCalendar.month,Number(action.dataset.calendarDay)));return;}
  if(action.hasAttribute('data-calendar-step')){calendarStep(Number(action.dataset.calendarStep));return;}
  if(action.hasAttribute('data-calendar-clear')){pickCalendar('');return;}
  if(action.hasAttribute('data-calendar-today')){const d=new Date();pickCalendar(calendarISO(d.getFullYear(),d.getMonth()+1,d.getDate()));}
});
document.addEventListener('change',e=>{
  if(!activeCalendar||!e.target.closest('#hn-date-calendar'))return;
  const selector=e.target.matches('[data-calendar-month]')?'[data-calendar-month]':'[data-calendar-year]';
  if(e.target.matches('[data-calendar-month]'))activeCalendar.month=Number(e.target.value);
  if(e.target.matches('[data-calendar-year]'))activeCalendar.year=Number(e.target.value);
  renderCalendar();document.querySelector('#hn-date-calendar '+selector)?.focus();
});
document.addEventListener('keydown',e=>{
  if(!activeCalendar)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeCalendar(true);return;}
  if(e.key==='Tab'&&!e.target.closest('#hn-date-calendar'))closeCalendar();
  if(e.target.matches('.calendar-day')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();const day=Number(e.target.dataset.calendarDay),step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
    const d=new Date(activeCalendar.year,activeCalendar.month-1,day+step);
    activeCalendar.year=d.getFullYear();activeCalendar.month=d.getMonth()+1;renderCalendar();
    document.querySelector(`[data-calendar-day="${d.getDate()}"]`)?.focus();
  }
},true);
document.addEventListener('focusin',e=>{if(activeCalendar&&!e.target.closest?.('#hn-date-calendar')&&e.target!==activeCalendar.input&&!e.target.closest?.('.calendar-input-wrap'))closeCalendar();});
window.addEventListener('resize',()=>{if(activeCalendar)calendarPosition();});
window.addEventListener('scroll',()=>{if(activeCalendar)calendarPosition();},true);
document.addEventListener('click',async e=>{
  const node=e.target.closest('button');if(!node)return;
  if(node.hasAttribute('data-close')){if(!state.busy)closeModal();return;}
  if(node.hasAttribute('data-accept-conflict')){const form=$('#status-form');if(form?.dataset.freshVersion){form.elements.PHIEN_BAN.value=form.dataset.freshVersion;form.querySelector('#status-conflict')?.remove();form.dataset.freshVersion='';const submit=form.querySelector('[data-submit-btn]');if(submit)submit.disabled=false;}return;}
  if(node.hasAttribute('data-nav')){navigate(node.dataset.nav);return;}
  if(node.hasAttribute('data-dashboard-detail')){if(allowed('REPORT_VIEW'))navigate('reports');return;}
  if(node.hasAttribute('data-retry')){navigate(state.page,true);return;}
  if(node.hasAttribute('data-bulk-record')){bulkRecordForm();return;}
  if(node.hasAttribute('data-status-bulk')){statusBulkForm();return;}
  if(node.hasAttribute('data-status-bulk-template')){const a=document.createElement('a');a.href='/templates/MAU_CAP_NHAT_TINH_TRANG.xlsx';a.download='MAU_CAP_NHAT_TINH_TRANG.xlsx';document.body.append(a);a.click();a.remove();return;}
  if(node.hasAttribute('data-status-bulk-check')){await serialized(statusBulkCheck);return;}
  if(node.hasAttribute('data-status-bulk-errors')){const s=state.statusImport;if(!s)return;const list=[...(s.results||[]),...(s.skipped||[])].filter(x=>!['eligible','updated','ignored','unselected'].includes(x.kind));downloadCsv('ket-qua-chua-cap-nhat.csv',[['Dòng','Phân loại','Lý do'],...list.map(x=>[x.line,statusBulkKindVi(x.kind),x.reason])]);return;}
  if(node.hasAttribute('data-record-template')){downloadRecordTemplate();return;}
  if(node.hasAttribute('data-record-check')){await serialized(recordBulkCheck);return;}
  if(node.hasAttribute('data-record-errors')){const issues=state.importPreview?.issues||[];if(!issues.length)return;downloadCsv('danh-sach-loi-nhap-ho-so.csv',[['Dòng trong file','Vấn đề'],...issues.map(x=>[x.line,x.reason])]);return;}
  if(node.hasAttribute('data-new-record')){recordForm(null);return;}
  if(node.hasAttribute('data-edit-record')){const r=getCurrentRecord(node.dataset.editRecord);if(r)recordForm(r);return;}
  if(node.hasAttribute('data-delete-record')){const r=getCurrentRecord(node.dataset.deleteRecord);if(r&&canDeleteRecord(r))deleteRecordForm(r);return;}
  if(node.hasAttribute('data-detail-record')){const r=getCurrentRecord(node.dataset.detailRecord);if(r)recordDetail(r);return;}
  if(node.hasAttribute('data-confirm-delete')){const r=getCurrentRecord(node.dataset.confirmDelete);if(!r)return;await serialized(async()=>{await rpc('record_delete',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN},{mutate:true,preserveRecordList:true});
    state.records=state.records.filter(x=>x.HO_SO_ID!==r.HO_SO_ID);state.recordTotal=Math.max(0,state.recordTotal-1);
    // Delete invalidates *all* previously paginated queries, including those without
    // the deleted record on the current page. Never reuse a partially filled page.
    expireCacheActions(['records_list','overview','report_matrix','report_export']);
    state.pageViews.delete('dashboard');state.pageViews.delete('reports');
    closeModal();const tr=document.querySelector(`[data-delete-record="${CSS.escape(r.HO_SO_ID)}"]`)?.closest('tr');if(tr)tr.remove();
    const cnt=$('#record-count');if(cnt)cnt.textContent=`Hiển thị ${num(state.records.length)} / ${num(state.recordTotal)} hồ sơ · Trang ${state.recordPage}`;
    const empty=$('#list-output tbody');if(empty&&!empty.children.length)empty.innerHTML='<tr><td colspan="'+(state.filters.status===COURSE_END_FILTER?8:7)+'" class="empty">Không có hồ sơ phù hợp.</td></tr>';
    state.pageViews.delete('records');const lastPage=Math.max(1,Math.ceil(state.recordTotal/20));
    if(state.recordPage>lastPage){state.recordPage=lastPage;notify('Đã xóa hồ sơ; đang cập nhật trang cuối.');void refreshRecordResults('Đang cập nhật danh sách…');return;}
    const pageBox=$('#list-pages');if(pageBox)pageBox.innerHTML=`<div class="pagination"><button class="btn" data-page="${state.recordPage-1}" ${state.recordPage<=1?'disabled':''}>← Trước</button>Trang ${state.recordPage}/${lastPage}<button class="btn" data-page="${state.recordPage+1}" ${state.recordPage>=lastPage?'disabled':''}>Tiếp →</button></div>`;
    notify('Đã chuyển hồ sơ vào danh sách đã xóa.');
    // Refill the vacated row on a full page and re-check total/pagination.
    void refreshRecordResults('Đang đồng bộ danh sách sau khi xóa…');});return;}
  if(node.hasAttribute('data-status-record')){const r=getCurrentRecord(node.dataset.statusRecord);if(r)statusForm(r);return;}
  if(node.hasAttribute('data-file-modal')){const r=getCurrentRecord(node.dataset.fileModal);if(r)fileModal(r);return;}
  if(node.hasAttribute('data-file-get')){try{await getFile(node.dataset.fileGet);}catch(err){failure(err);}return;}
  if(node.hasAttribute('data-page')){state.recordPage=Number(node.dataset.page);state.pageViews.delete('records');navigate('records',true);return;}
  if(node.hasAttribute('data-audit-page')){state.auditPage=Number(node.dataset.auditPage);state.pageViews.delete('audits');navigate('audits',true);return;}
  if(node.hasAttribute('data-cat-tab')){state.catalogType=node.dataset.catTab;state.pageViews.delete('catalogs');navigate('catalogs',true);return;}
  if(node.hasAttribute('data-bulk-catalog')){bulkCatalogForm();return;}
  if(node.hasAttribute('data-bulk-template')){try{downloadCatalogTemplate($('#bulk-catalog-form').elements.type.value);}catch(err){failure(err);}return;}
  if(node.hasAttribute('data-bulk-check')){const f=$('#bulk-catalog-form');if(!f)return;await serialized(async()=>{const rows=getBulkRows(f);if(!rows.length||rows.length>2000)throw Error('Vui lòng nhập từ 1 đến 2.000 mục.');const plan=await rpc('catalog_bulk_check',{type:f.elements.type.value,rows},{ttl:0});$('#bulk-review').textContent=`${num(plan.valid)} mục hợp lệ · ${num(plan.duplicate)} mục trùng · ${num(plan.invalid)} mục không hợp lệ.${plan.invalidItems?.length?' Lỗi tại dòng: '+plan.invalidItems.map(x=>x.line).join(', '):''}`;f.dataset.ready=plan.invalid===0&&plan.valid>0?'yes':'no';$('#bulk-import-submit').disabled=f.dataset.ready!=='yes';f.dataset.verified=f.elements.type.value+'|'+JSON.stringify(rows);});return;}
  if(node.hasAttribute('data-new-catalog')){catalogForm(null);return;}
  if(node.hasAttribute('data-edit-catalog')){const type=state.catalogType,field={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type];catalogForm(state.cats[type].find(x=>x[field]===node.dataset.editCatalog));return;}
  if(node.hasAttribute('data-delete-catalog')){const type=state.catalogType,key={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type],item=state.cats[type].find(x=>x[key]===node.dataset.deleteCatalog);if(item)deleteCatalogForm(item);return;}
  if(node.hasAttribute('data-confirm-catalog-delete')){await serialized(async()=>{await rpc('catalog_delete',{type:state.catalogType,id:node.dataset.confirmCatalogDelete},{mutate:true});notify('Đã xóa danh mục.');await afterMutation('catalogs');});return;}
  if(node.hasAttribute('data-delete-account')){const item=state.accountRows.find(x=>x.TAI_KHOAN_ID===node.dataset.deleteAccount);if(item)deleteAccountForm(item);return;}
  if(node.hasAttribute('data-confirm-account-delete')){await serialized(async()=>{await rpc('account_delete',{id:node.dataset.confirmAccountDelete},{mutate:true});notify('Đã xóa tài khoản.');await afterMutation('accounts');});return;}
  if(node.hasAttribute('data-new-account')){accountForm(null);return;}
  if(node.hasAttribute('data-edit-account')){accountForm(state.accountRows.find(x=>x.TAI_KHOAN_ID===node.dataset.editAccount));return;}
  if(node.hasAttribute('data-file-remove')){if(!confirm('Gỡ tệp đính kèm của hồ sơ?'))return;const r=getCurrentRecord(node.dataset.fileRemove);if(!r)return;await serialized(async()=>{await rpc('file_remove',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN},{mutate:true});notify('Đã gỡ tệp.');await afterMutation('records');});return;}
  if(node.hasAttribute('data-export-list')){try{await exportReport({...state.filters,source:'records'});}catch(err){failure(err);}return;}
  if(node.id==='print-report'){window.print();return;}
  if(node.id==='report-export'){exportModal();return;}
  if(node.id==='find-person'){
    const q=$('#person-query')?.value||'';try{const data=await rpc('person_lookup',{query:q},{ttl:30000});$('#person-results').innerHTML=data.items.length?data.items.map(x=>`<button class="person-item" data-select-person="${esc(x.NGUOI_HOC_ID)}" data-person-name="${esc(x.HO_TEN)}" data-person-birth="${esc(x.NGAY_SINH)}" data-person-sex="${esc(x.GIOI_TINH)}" type="button">${esc(x.HO_TEN)} · ${esc(x.NGAY_SINH||'Không rõ ngày sinh')}</button>`).join(''):'<p class="small muted">Không tìm thấy người học phù hợp. Có thể nhập người học mới.</p>'; }catch(err){failure(err);}return;
  }
  if(node.hasAttribute('data-select-person')){const f=$('#record-form');if(!f)return;f.elements.NGUOI_HOC_ID.value=node.dataset.selectPerson;f.elements.HO_TEN.value=node.dataset.personName;f.elements.NGAY_SINH.value=node.dataset.personBirth;f.elements.GIOI_TINH.value=node.dataset.personSex;$('#selected-person').textContent='Đã chọn người học: '+node.dataset.personName;$('#person-results').innerHTML='';return;}
});
document.addEventListener('change',async e=>{if(e.target.id==='status-bulk-file'){
  try{const f=e.target.files?.[0],s=state.statusImport;resetStatusBulkReview('Đang đọc file Excel...');if(!f){if(s){s.rows=[];s.skipped=[];}return;}
    if(!/\.xlsx$/i.test(f.name)||f.size>6*1024*1024)throw Error('Chỉ chấp nhận Excel .xlsx dưới 6 MB.');
    const status=statusBulkTarget(),parsed=parseStatusBulkExcel(await readXlsxRows(await f.arrayBuffer(),{allowCachedFormula:true,sheetName:'Danh sách'}),status);
    s.rows=parsed.rows;s.skipped=parsed.skipped;s.fileName=f.name;s.target=status;
    resetStatusBulkReview(`Đã đọc ${num(parsed.rows.length)} dòng đánh dấu X từ ${f.name}; bỏ qua ${num(parsed.skipped.length)} dòng. Hãy bấm Kiểm tra dữ liệu.`);
  }catch(err){if(state.statusImport)state.statusImport.rows=[];e.target.value='';resetStatusBulkReview('Chưa đọc được file. Vui lòng chọn lại.');failure(err);}return;
}if(e.target.id==='record-import-file'){
  try{const file=e.target.files?.[0];state.importRows=null;state.importFile=null;state.importPreview=null;state.importSession=null;$('#record-import-submit').disabled=true;
    if(!file)return;if(!/\.xlsx$/i.test(file.name)||file.size>6*1024*1024)throw Error('Vui lòng chọn file Excel .xlsx không quá 6 MB.');
    const parsed=parseRecordExcel(await readXlsxRows(await file.arrayBuffer(),{allowCachedFormula:true}));state.importRows=parsed.rows;state.importFile={name:file.name,unused:parsed.unused};
    $('#record-import-review').textContent=`Đã đọc ${num(parsed.rows.length)} dòng từ ${file.name}. Vui lòng bấm Kiểm tra dữ liệu.`;
  }catch(err){state.importRows=null;state.importPreview=null;e.target.value='';failure(err);}return;
}if(e.target.id==='bulk-csv'){
  const file=e.target.files?.[0],form=$('#bulk-catalog-form');if(!form)return;
  try{
    state.bulkFileText='';state.bulkRows=null;
    if(file){
      if(file.size>1500000)throw Error('File danh mục vượt 1,5 MB. Vui lòng chia danh sách thành nhiều lượt.');
      let raw;
      if(/\.xlsx$/i.test(file.name))raw=await readXlsxRows(await file.arrayBuffer());
      else if(/\.csv$/i.test(file.name))raw=parseCsv(await file.text());
      else throw Error('Vui lòng chọn file Excel (.xlsx) hoặc CSV.');
      const headers=BULK_HEADERS[form.elements.type.value];
      if(!raw.length||raw[0].length!==headers.length||raw[0].some((x,i)=>String(x||'').trim()!==headers[i]))throw Error('Tiêu đề cột chưa đúng. Vui lòng tải mẫu mới từ website.');
      state.bulkRows=raw.slice(1).map((cells,i)=>{
        if(cells.length>headers.length||cells.length<1)throw Error('Số cột chưa đúng ở dòng '+(i+2)+'.');
        const title=String(cells[0]||'').trim(),row={title,shortName:'',address:'',order:'',note:''};
        if(form.elements.type.value==='truong'){row.shortName=String(cells[1]||'').trim();row.address=String(cells[2]||'').trim();row.note=String(cells[3]||'').trim();}
        else{row.order=String(cells[1]||'').trim();row.note=String(cells[2]||'').trim();}
        return row;
      });
      if(state.bulkRows.length>2000)throw Error('Mỗi lượt chỉ được nhập tối đa 2.000 danh mục.');
      form.elements.names.value='';
    }
    form.dataset.ready='no';form.dataset.verified='';$('#bulk-import-submit').disabled=true;
    $('#bulk-review').textContent=file?'Đã đọc file. Vui lòng bấm Kiểm tra danh sách.':'Vui lòng kiểm tra danh sách trước khi nhập.';
  }catch(err){state.bulkRows=null;state.bulkFileText='';e.target.value='';failure(err);}
}});
// User chose NO clear-X button. Backspace/Delete clearing the query auto-applies the filters.
let clearQueryTimer=null;
function autoApplyEmptyRecordQuery(input){
  if(!input||!input.closest('#records-filters')||input.value.trim()!=='')return;
  clearTimeout(clearQueryTimer);
  const form=input.form;
  clearQueryTimer=setTimeout(()=>{
    if(!state.session||state.page!=='records'||!form.isConnected||input.value.trim()!=='')return;
    void applyRecordFilters(form,1);
  },180);
}
document.addEventListener('input',e=>{
  if(e.target.name!=='query'||!e.target.closest('#records-filters'))return;
  clearTimeout(clearQueryTimer);
  if(e.isComposing||e.target.value.trim()!=='')return;
  // Reject pending search responses as soon as the user clears a submitted query.
  state.recordLoadVersion++;
  autoApplyEmptyRecordQuery(e.target);
});
document.addEventListener('compositionend',e=>{
  if(e.target.name==='query')autoApplyEmptyRecordQuery(e.target);
});
document.addEventListener('input',e=>{if(e.target.name==='SO_THANG_HO_TRO'&&e.target.closest('#record-form'))refreshDropoutPeriod(e.target.closest('form'));});
document.addEventListener('input',e=>{if(e.target.id==='catalog-search'){state.catalogSearch=e.target.value;const text=e.target.value.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'');document.querySelectorAll('.catalog-data-row').forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(text);});}const form=e.target.closest('#bulk-catalog-form');if(form){if(e.target.name==='names'&&e.target.value.trim()){state.bulkRows=null;state.bulkFileText='';const file=$('#bulk-csv');if(file)file.value='';}form.dataset.verified='';form.dataset.ready='no';const btn=$('#bulk-import-submit');if(btn)btn.disabled=true;}});
document.addEventListener('change',e=>{if(e.target.name==='status'&&e.target.closest('#records-filters,#reports-filters'))updateRecordDateFilterHelp(e.target.closest('#records-filters,#reports-filters'));});
document.addEventListener('change',e=>{if(e.target.name==='status'&&e.target.closest('#status-bulk-form')){statusBulkToggle();if(state.statusImport){state.statusImport.rows=[];state.statusImport.skipped=[];}const file=$('#status-bulk-file');if(file)file.value='';resetStatusBulkReview('Đã thay đổi tình trạng. Vui lòng chọn lại file Excel.');}if(['dropoutPeriod','dropoutReason'].includes(e.target.name)&&e.target.closest('#status-bulk-form'))resetStatusBulkReview('Đã thay đổi thông tin bỏ học. Vui lòng bấm Kiểm tra dữ liệu lại.');if(e.target.name==='UI_TINH_TRANG'){updateDropoutFields(e.target.closest('form'));}if(e.target.name==='role'&&e.target.closest('#account-form'))updateAccountSchool(e.target.closest('form'));if(e.target.name==='type'&&e.target.closest('#bulk-catalog-form')){const f=e.target.closest('form');f.dataset.ready='no';f.dataset.verified='';state.bulkRows=null;state.bulkFileText='';const file=$('#bulk-csv');if(file)file.value='';$('#bulk-import-submit').disabled=true;}});
document.addEventListener('change',e=>{if(e.target.name==='NGAY_QUYET_DINH'&&$('#preview-year'))$('#preview-year').value=e.target.value?.slice(0,4)||'Tự lấy từ ngày quyết định';});
// Refresh aggregate results without destroying filter controls or the current page shell.
async function refreshCurrentAggregate(page){
  const v=++state.routeVersion;
  const output=$('#'+(page==='dashboard'?'dashboard':'report')+'-output');
  if(output){output.setAttribute('aria-busy','true');output.classList.add('records-refreshing');}
  try{
    await (page==='dashboard'?renderDashboard(v,true):renderReports(v,true));
    if(v===state.routeVersion)finishPageLoad(page,v);
  }catch(error){if(v===state.routeVersion)failure(error);}
  finally{if(v===state.routeVersion&&output){output.removeAttribute('aria-busy');output.classList.remove('records-refreshing');}}
}
document.addEventListener('submit',e=>{
  const form=e.target,formId=form.getAttribute('id');if(!formId)return;e.preventDefault();
  if(formId==='report-export-form'){serialized(async()=>{const mode=form.elements.mode.value;if(mode==='list')await exportReport(state.reportFilters);else await exportSummaryOrMatrix(mode);closeModal();});return;}
  if(formId==='records-filters'){void applyRecordFilters(form,1);return;}
  if(formId==='dashboard-filters'){state.dashboardFilters=getFormFields(form);state.pageViews.delete('dashboard');void refreshCurrentAggregate('dashboard');return;}
  if(formId==='reports-filters'){let filters;try{filters=readRangeFilters(form);}catch(error){failure(error);return;}state.reportFilters=filters;state.pageViews.delete('reports');void refreshCurrentAggregate('reports');return;}
  if(formId==='bulk-record-form'){serialized(importBulkRecords);return;}
  if(formId==='status-bulk-form'){serialized(statusBulkApply,{button:form.querySelector('[data-submit-btn]'),label:'Đang cập nhật...'});return;}
  if(formId==='record-form'){
    serialized(async()=>{
      const started=performance.now();const p=recordPayload(form);
      const mode=p.HO_SO_ID?'edit':'create';
      const context={scope:permissionScope(),page:state.recordPage,filters:JSON.stringify(state.filters),route:state.routeVersion};
      // Retain the already-verified table; the backend still enforces owner, version and duplicate QĐ.
      const d=await rpc('record_save',p,{mutate:true,preserveRecordList:true});
      const ackAt=performance.now();
      const outcome=await commitSavedRecord(d.record,context);
      notify('Đã lưu hồ sơ '+d.record.SO_QUYET_DINH+'/'+d.record.NAM_QUYET_DINH);
      emitSaveTiming(started,ackAt,performance.now(),mode,outcome);
    },{button:form.querySelector('[data-submit-btn]'),label:'Đang lưu…'});
    return;
  }
  if(formId==='status-form'){serialized(async()=>{let p=recordPayload(form);const d=await rpc('record_status',p,{mutate:true,preserveRecordList:true});if(p.customStatusName)await refreshBootstrap();const next=d.record;state.records=state.records.map(r=>r.HO_SO_ID===next.HO_SO_ID?next:r);for(const [key,item] of state.cache){
      if(cacheAction(key)!=='records_list')continue;
      const cachedFilters=JSON.parse(key.slice(key.indexOf('records_list|')+'records_list|'.length));
      if(cachedFilters.status){state.cache.delete(key);continue;}
      const rows=item.value?.items||[];
      if(rows.some(r=>r.HO_SO_ID===next.HO_SO_ID))item.value.items=rows.map(r=>r.HO_SO_ID===next.HO_SO_ID?next:r);
    }notify('Đã cập nhật tình trạng.');closeModal();
    state.pageViews.delete('records');
    const status=state.filters.status;
    const noMatch=status&&(status==='BO_HOC'?next.DA_BO_HOC!=='TRUE':status==='DA_THAM_GIA'?(next.TRANG_THAI_THAM_GIA!=='DA_THAM_GIA'||next.DA_BO_HOC==='TRUE'):status!==next.TRANG_THAI_THAM_GIA);
    if(noMatch){navigate('records',true);}else{
      const button=[...document.querySelectorAll('[data-status-record]')].find(n=>n.dataset.statusRecord===next.HO_SO_ID);
      const badge=button?.closest('tr')?.querySelector('td:nth-child(6)');if(badge)badge.innerHTML=pillStatus(next);
    }},{button:form.querySelector('[data-submit-btn]'),label:'Đang cập nhật…'});return;}
  if(formId==='catalog-form'){serialized(async()=>{await rpc('catalog_save',getFormFields(form),{mutate:true});notify('Đã lưu danh mục.');await afterMutation('catalogs');});return;}
  if(formId==='account-form'){serialized(async()=>{const p=getFormFields(form);await rpc('account_save',p,{mutate:true});notify('Đã lưu tài khoản.');await afterMutation('accounts');});return;}
  if(formId==='bulk-catalog-form'){serialized(async()=>{
    if(form.dataset.ready!=='yes')throw Error('Vui lòng bấm Kiểm tra danh sách trước khi nhập.');
    const rows=getBulkRows(form);if(form.dataset.verified!==form.elements.type.value+'|'+JSON.stringify(rows))throw Error('Danh sách đã thay đổi. Vui lòng kiểm tra trước khi nhập.');
    let added=0,skipped=0;
    for(let i=0;i<rows.length;i+=100){const part=await rpc('catalog_bulk_import',{type:form.elements.type.value,rows:rows.slice(i,i+100)},{mutate:true});added+=part.added;skipped+=part.skipped;const target=$('#bulk-review');if(target)target.textContent=`Đã nhập ${num(added)} mục; bỏ qua ${num(skipped)} mục trùng. Đang xử lý ${Math.min(rows.length,i+100)}/${rows.length}...`;}
    notify(`Đã thêm ${num(added)} mục. Bỏ qua ${num(skipped)} mục trùng.`);await afterMutation('catalogs');
  });return;}
  if(formId==='file-form'){serialized(async()=>{
    const file=form.elements.file.files?.[0];if(!file)throw Error('Vui lòng chọn tệp.');
    await uploadFile(file,form);notify('Đã lưu tệp đính kèm thành công.');await afterMutation('records');
  });return;}
});
$('#logout').addEventListener('click',signOut);
$('#menu-toggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#modal-layer').addEventListener('click',e=>{if(e.target.id==='modal-layer'&&!state.busy)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!state.busy)closeModal();});
function recheckPermissionOnResume(){
  if(!state.session||document.visibilityState==='hidden')return;
  const now=Date.now();if(now-state.lastPermissionFocusCheck<15000)return;
  state.lastPermissionFocusCheck=now;
  if(now-state.permissionChecked>=30000)void verifyPermission(true).catch(()=>{/* Khi có lỗi mạng, giữ nguyên biểu mẫu đang nhập. */});
  else if(state.needsActiveRefresh)void refreshVisibleStaleData();
}
document.addEventListener('visibilitychange',recheckPermissionOnResume);
window.addEventListener('focus',recheckPermissionOnResume);
initialize();

// Export for non-network unit tests only; no tokens/private data exported.
export const tests = {esc,dateVN,STATUS,RIGHTS,csvCell,parseCsv,BULK_HEADERS,STAFF_RIGHTS,RECORD_HEADERS,parseRecordExcel,excelISO,parseStatusBulkExcel,statusBulkCounts};

import {downloadReportXlsx} from './xlsx-export.js';
/** THEO DÕI HỌC NGHỀ — v1.2.3-RC (YC-HN-016). Không lưu token/PII vào localStorage. */
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
const STATUS_FORM = { DA_THAM_GIA:'Đã tham gia học', KHONG_THAM_GIA:'Không tham gia', BO_HOC:'Bỏ học', KHONG_NHAN_QUYET_DINH:'Không nhận quyết định', CHO_XAC_NHAN:'Chưa xác nhận' };
const RIGHTS = { RECORD_VIEW:'Xem hồ sơ', RECORD_CREATE:'Thêm hồ sơ', RECORD_EDIT:'Sửa hồ sơ', RECORD_DELETE:'Xóa hồ sơ do mình tạo', RECORD_STATUS:'Cập nhật tình trạng', REPORT_VIEW:'Xem báo cáo', CATALOG_MANAGE:'Quản lý danh mục', ACCOUNT_MANAGE:'Quản lý tài khoản', AUDIT_VIEW:'Xem nhật ký', FILE_VIEW:'Xem tệp', FILE_UPLOAD:'Tải lên/xóa tệp' };
const NAMES = { truong:'Cơ sở đào tạo', nghe:'Nghề đào tạo', lydo:'Lý do bỏ học' };
const state = {
  token:'', session:false, clientId:'', user:null, cats:{truong:[],nghe:[],lydo:[]}, statuses:[], page:'dashboard', routeVersion:0,
  filters:{year:'',truong:'',nghe:'',status:'',dropout:'',query:''},
  dashboardFilters:{year:'',truong:'',nghe:''}, reportFilters:{year:'',truong:'',nghe:'',status:''},
  records:[], recordPage:1, recordTotal:0, accountRows:[], auditPage:1, catalogType:'truong', catalogSearch:'', bulkRows:null, importRows:null, importFile:null, importPreview:null, importSession:null, statusImport:null,
  cache:new Map(), inFlight:new Map(), pageViews:new Map(), renderedPage:null, generation:0, busy:false, usedPerson:null, permissionRevision:"", permissionChecked:0, scope:"", lastRecordSearchMs:0, recordLoadVersion:0, recordLoading:false, activeRecordRequestKey:""
};

function notify(message, error=false){ const el=$('#toast');el.textContent=String(message);el.className='toast show'+(error?' error':'');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),5500); }
const ERROR_TEXT = {
  LOGIN_EXPIRED:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', NOT_AUTHORIZED:'Tài khoản chưa được cấp quyền hoặc đã bị khóa.', NO_PERMISSION:'Bạn chưa được cấp quyền thực hiện thao tác này.', CATALOG_IN_USE:'Danh mục đã có hồ sơ sử dụng. Vui lòng chọn Ngừng sử dụng thay vì xóa.', CANNOT_DELETE_SELF:'Bạn không thể xóa tài khoản đang đăng nhập.', LAST_ADMIN:'Hệ thống phải có ít nhất một Quản trị viên đang hoạt động.', NOT_OWNER:'Bạn chỉ được xóa hồ sơ do chính mình tạo.',
  DECISION_DUPLICATE:'Số quyết định đã tồn tại trong năm được chọn. Vui lòng kiểm tra lại.', DUPLICATE:'Thông tin này đã tồn tại. Vui lòng kiểm tra lại.', VERSION_CONFLICT:'Hồ sơ đã được cập nhật ở nơi khác. Vui lòng tải lại trước khi lưu.', NOT_FOUND:'Không tìm thấy thông tin cần thao tác. Vui lòng tải lại danh sách.', ALREADY_DELETED:'Hồ sơ này đã được xóa trước đó.',
  FILE_TOO_LARGE:'Tệp vượt dung lượng tối đa 10 MB.', VALIDATION:'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.', UPLOAD_EXPIRED:'Lượt tải đã hết hạn. Vui lòng chọn lại tệp.', UPLOAD_OFFSET:'Có gián đoạn trong quá trình tải tệp. Vui lòng thử lại.', UPLOAD_UNAVAILABLE:'Không tải được tệp lúc này. Vui lòng thử lại.', DOWNLOAD_UNAVAILABLE:'Không tải được tệp lúc này. Vui lòng thử lại.',
  GATEWAY_UNAVAILABLE:'Hệ thống tạm thời không phản hồi. Vui lòng thử lại sau.', SERVER_ERROR:'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', INTERNAL_ERROR:'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', BUSY:'Hệ thống đang xử lý yêu cầu khác. Vui lòng thử lại.', SCHEMA_MISMATCH:'Dữ liệu hệ thống cần được quản trị viên kiểm tra.', USE_CHUNK_UPLOAD:'Vui lòng tải lại trang và thử đính kèm tệp.'
};
function friendlyError(code,message){
  if(ERROR_TEXT[code])return ERROR_TEXT[code];
  // Chỉ hiển thị thông báo nghiệp vụ đã được phía máy chủ mã hóa phù hợp.
  if(['VALIDATION','DUPLICATE'].includes(code)&&message && !/[A-Z_]{3,}|Google|API|Script|JSON|\{|\}/i.test(message))return message;
  return 'Thao tác chưa hoàn tất. Vui lòng thử lại hoặc liên hệ quản trị viên.';
}
function failure(e){notify(e?.message||'Thao tác chưa hoàn tất. Vui lòng thử lại.',true);}
const STAFF_RIGHTS=new Set(['RECORD_VIEW','RECORD_CREATE','RECORD_EDIT','RECORD_DELETE','RECORD_STATUS','REPORT_VIEW','FILE_VIEW','FILE_UPLOAD']);
function allowed(p){return state.user?.VAI_TRO==='ADMIN'||(state.user?.VAI_TRO==='NHAN_VIEN'&&STAFF_RIGHTS.has(p))||(state.user?.VAI_TRO==='CO_SO_DAO_TAO'&&['RECORD_VIEW','RECORD_STATUS','REPORT_VIEW','FILE_VIEW'].includes(p));}
const allStatusOptions=()=>[...Object.entries(STATUS_FORM),...state.statuses.map(x=>[x.id,x.label])];
const isSchoolAccount=()=>state.user?.VAI_TRO==='CO_SO_DAO_TAO';
function rid(){return 'r_'+(crypto?.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(36).slice(2)));}
function permissionScope(){const u=state.user||{};return [u.TAI_KHOAN_ID||'',u.EMAIL||'',u.VAI_TRO||'',u.TRUONG_ID||'',state.permissionRevision||''].join('|');}
function cacheKey(a,p){return permissionScope()+'::'+a+'|'+JSON.stringify(p||{});}
function cacheAction(key){return key.split('::').slice(1).join('::').split('|')[0];}
function expireCacheActions(actions){for(const k of state.cache.keys())if(actions.includes(cacheAction(k)))state.cache.delete(k);}
function trimCache(){while(state.cache.size>110)state.cache.delete(state.cache.keys().next().value);}
async function verifyPermission(){
  if(!state.session||Date.now()-state.permissionChecked<120000)return true;
  const data=await rpc('bootstrap',{}, {ttl:0});
  state.permissionChecked=Date.now();
  const u=state.user||{},n=data.user||{};
  if([u.TAI_KHOAN_ID,u.EMAIL,u.VAI_TRO,u.TRUONG_ID||'',u.TRANG_THAI].join('|')!==[n.TAI_KHOAN_ID,n.EMAIL,n.VAI_TRO,n.TRUONG_ID||'',n.TRANG_THAI].join('|')){
    signOut();throw Error('Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại để nhận quyền mới.');
  }
  if(state.permissionRevision!==(data.permissionRevision||'')){
    state.cache.clear();state.pageViews.clear();state.generation++;
    state.permissionRevision=data.permissionRevision||'';
  }
  return true;
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
    if(!out.ok){if(out.error?.code==='LOGIN_EXPIRED'){signOut();}throw Error(friendlyError(out.error?.code,out.error?.message));}
    if(options.mutate){
      state.generation++;
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
function activateSession(data){
  state.session=true;state.user=data.user;state.cats=data.catalogs;state.statuses=data.statuses||[];state.token='';state.permissionRevision=data.permissionRevision||'';state.permissionChecked=Date.now();
  state.pageViews.clear();state.cache.clear();state.inFlight.clear();state.renderedPage=null;
  $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
  $('#current-user').innerHTML=`<b>${esc(state.user.HO_TEN||state.user.EMAIL)}</b><span>${state.user.VAI_TRO==='ADMIN'?'Quản trị viên':isSchoolAccount()?'Cơ sở đào tạo: '+esc(lookup('truong',state.user.TRUONG_ID)):'Nhân viên'}</span>`;
  navigate('dashboard');
}
function signOut(){if(state.session){fetch('/api/rpc',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'HocNgheWeb'},body:JSON.stringify({action:'logout'})}).catch(()=>{});}state.session=false;state.token='';state.user=null;state.permissionRevision='';state.permissionChecked=0;state.generation++;state.cache.clear();state.inFlight.clear();state.pageViews.clear();state.renderedPage=null;state.records=[];state.cats={truong:[],nghe:[],lydo:[]};state.statuses=[];$('#app').classList.add('hidden');$('#login').classList.remove('hidden');closeModal();if(window.google?.accounts?.id)google.accounts.id.disableAutoSelect();$('#login-note').textContent='Đăng nhập lại bằng tài khoản Google.';}
// YC-HN-006 — Bộ biểu tượng vector đồng nhất, không phụ thuộc font/emoji bên ngoài.
const ICON_PATHS={
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
  'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>'
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
const PAGE_AGE={dashboard:90000,records:65000,reports:90000,catalogs:90000,accounts:30000,audits:30000};
function navigate(page,force=false){
  if(!navItems().some(item=>item[0]===page))page='dashboard';
  const main=$('#main'),previous=state.page,scope=permissionScope();
  if(state.renderedPage===previous && main && !main.querySelector('.spinner') && !(previous==='records' && state.recordLoading)){
    state.pageViews.set(previous,{html:main.innerHTML,at:Date.now(),scope});
  }
  state.page=page;state.routeVersion++;
  $('#sidebar').classList.remove('open');buildNav();
  const old=state.pageViews.get(page);
  const snapshot=old&&old.scope===scope?old:null;
  const fresh=snapshot&&Date.now()-snapshot.at<(PAGE_AGE[page]||45000);
  const permissionFresh=Date.now()-state.permissionChecked<120000;
  if(!force&&fresh&&permissionFresh){main.innerHTML=snapshot.html;state.renderedPage=page;return;}
  const v=state.routeVersion;
  const canShow=snapshot&&permissionFresh;
  if(canShow){main.innerHTML=snapshot.html;main.insertAdjacentHTML('afterbegin','<div class="refresh-note" role="status">Đang làm mới dữ liệu…</div>');}
  else main.innerHTML='<div class="spinner">Đang tải dữ liệu…</div>';
  state.renderedPage=null;
  (async()=>{
    try{
      await verifyPermission();
      if(v!==state.routeVersion)return;
      switch(page){case 'dashboard':await renderDashboard(v,canShow);break;
        case 'records':await renderRecords(v,canShow);break;
        case 'reports':await renderReports(v,canShow);break;
        case 'catalogs':await renderCatalogs(v);break;
        case 'accounts':await renderAccounts(v);break;
        case 'audits':await renderAudits(v);break;}
      if(v===state.routeVersion){state.renderedPage=page;if(!(page==='records'&&state.recordLoading))state.pageViews.set(page,{html:main.innerHTML,at:Date.now(),scope:permissionScope()});}
    }catch(e){if(v===state.routeVersion){main.innerHTML=`<div class="card"><h3>Không tải được dữ liệu</h3><p class="muted">${esc(e.message)}</p><button class="btn" data-retry="1">Tải lại</button></div>`;state.renderedPage=null;}failure(e);}
  })();
}

function heading(title,desc,buttons=''){return `<div class="page-header"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><div class="page-actions">${buttons}</div></div>`;}
function sel(name,items,selected='',empty='Tất cả',key='ID',value='TEN'){
  return `<select name="${esc(name)}">${option('',empty,selected)}${items.map(x=>option(x[key],x[value],selected)).join('')}</select>`;
}
const schoolOpts= (s='',empty='Tất cả cơ sở',activeOnly=false) => isSchoolAccount()?`<input type="hidden" name="truong" value="${esc(state.user.TRUONG_ID)}"><select disabled><option>${esc(lookup('truong',state.user.TRUONG_ID))}</option></select>`:sel('truong',state.cats.truong.filter(x=>!activeOnly||x.TRANG_THAI==='ACTIVE'),s,empty,'TRUONG_ID','TEN_TRUONG');
const tradeOpts= (s='',empty='Tất cả nghề',activeOnly=false) => sel('nghe',state.cats.nghe.filter(x=>!activeOnly||x.TRANG_THAI==='ACTIVE'),s,empty,'NGHE_ID','TEN_NGHE');
function lookup(type,id){const def={truong:['TRUONG_ID','TEN_TRUONG'],nghe:['NGHE_ID','TEN_NGHE'],lydo:['LY_DO_ID','NOI_DUNG']}[type];let x=state.cats[type].find(r=>r[def[0]]===id);return x?.[def[1]] || 'Chưa có trong danh mục';}
function filterFields(filters,mode){return `<form class="card filter-grid ${mode==='dashboard'?'short':''}" id="${mode}-filters">
  <div class="field"><label>Năm quyết định</label><input type="number" min="1900" max="2200" name="year" placeholder="Tất cả các năm" value="${esc(filters.year||'')}"></div>
  <div class="field"><label>Cơ sở đào tạo</label>${schoolOpts(filters.truong)}</div>
  <div class="field"><label>Nghề đào tạo</label>${tradeOpts(filters.nghe)}</div>
  ${mode==='records'?`<div class="field"><label>Tình trạng</label><select name="status">${option('','Tất cả',filters.status)}${allStatusOptions().filter(([k])=>k!=='BO_HOC').concat([['BO_HOC','Bỏ học']]).map(([k,v])=>option(k,v,filters.status)).join('')}</select></div><div class="field"><label>Tìm người học / số QĐ</label><input name="query" value="${esc(filters.query||'')}" placeholder="Nhập từ khóa..."></div>`:''}
  ${mode==='reports'?`<div class="field"><label>Tình trạng</label><select name="status">${[['','Tất cả tình trạng'],['REPORT_PARTICIPATED_ALL','Đã tham gia'],['DA_THAM_GIA','Đang học'],['BO_HOC','Bỏ học'],['KHONG_THAM_GIA','Không tham gia'],['KHONG_NHAN_QUYET_DINH','Không nhận Quyết định'],['CHO_XAC_NHAN','Chưa xác nhận'],...state.statuses.map(x=>[x.id,x.label])].map(([k,v])=>option(k,v,filters.status||'')).join('')}</select></div>`:''}
  <button class="btn btn-primary" type="submit">${iconSvg('filter',19)} Lọc dữ liệu</button></form>`;}
function getFormFields(form){return Object.fromEntries(new FormData(form).entries());}
// YC-HN-015: Chữ ký cố định cho bộ lọc, để quay về 'Tất cả' trúng cache cũ.
function normalizeRecordFilters(input){
  const previous=state.filters;
  return Object.fromEntries(['year','truong','nghe','status','dropout','from','to','query'].map(key=>[key,String(input[key]??(key==='dropout'||key==='from'||key==='to'?previous[key]||'':''))]));
}
// Không dựng lại form khi nhấn Lọc: draft ở DOM luôn thuộc quyền người đang nhập.
async function applyRecordFilters(form, page=1){
  const filters=normalizeRecordFilters(getFormFields(form));
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
        state.pageViews.set('records',{html:$('#main').innerHTML,at:Date.now(),scope:permissionScope()});
      }
    }
  }
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
  if(keepOld)$('#main').innerHTML=markup;
  $('#dashboard-output').className='dashboard-results';
  $('#dashboard-output').innerHTML=`<div class="kpi-grid" aria-label="Sáu chỉ tiêu tổng quan">${tiles.map(([label,glyph,n])=>`<article class="kpi"><div class="kpi-icon">${iconSvg(glyph,26)}</div><div class="kpi-body"><div class="desc">${esc(label)}</div><div class="metric">${num(n)}</div></div></article>`).join('')}</div><div class="sub-grid">${schoolChart(data.schoolCounts)}${tradeChart(data.tradeCounts)}</div>`;
}
async function renderRecords(v,keepOld=false){
  const markup=heading('Hồ sơ học nghề','Mỗi quyết định chỉ áp dụng cho một người; số quyết định được kiểm tra trùng trong cùng năm.',(state.user?.VAI_TRO==='ADMIN'?'<button class="btn btn-light" data-bulk-record="1">⇧ Nhập Excel</button><button class="btn btn-light" data-status-bulk="1">⇧ Cập nhật tình trạng từ Excel</button>':'')+(allowed('RECORD_CREATE')?'<button class="btn btn-primary" data-new-record="1">＋ Thêm hồ sơ</button>':''))+filterFields(state.filters,'records')+`<div class="panel-top"><span class="muted" id="record-count">Đang tải hồ sơ…</span><div class="page-actions">${state.user?.VAI_TRO==='ADMIN'||state.user?.VAI_TRO==='NHAN_VIEN'?'<button class="btn btn-light" data-export-list="1">Xuất Excel</button>':''}</div></div><div id="list-output" class="table-wrap"></div><div id="list-pages"></div>`;
  if(!keepOld)$('#main').innerHTML=markup;
  await loadRecordList(v,keepOld,markup);
}
async function loadRecordList(v,keepOld=false,markup="",loadVersion=++state.recordLoadVersion){
  // Snapshot tại thời điểm bấm Lọc. Request cũ không được ghi đè request mới.
  const filters={...state.filters},page=state.recordPage;
  const data=await rpc('records_list',{...filters,page,pageSize:20},{ttl:45000});
  if(v!==state.routeVersion||loadVersion!==state.recordLoadVersion)return;
  if(keepOld&&markup)$('#main').innerHTML=markup;
  state.records=data.items;state.recordTotal=data.total;
  $('#list-output').classList.remove('records-failed');
  $('#record-count').textContent=`Hiển thị ${num(data.items.length)} / ${num(data.total)} hồ sơ · Trang ${data.page}`;
  $('#list-output').innerHTML=`<table><thead><tr><th>Ngày QĐ</th><th>Số QĐ</th><th>Người học</th><th>Cơ sở đào tạo</th><th>Nghề</th><th>Tình trạng</th><th>Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(r=>`<tr><td class="nowrap">${esc(dateVN(r.NGAY_QUYET_DINH))}</td><td><b>${esc(r.SO_QUYET_DINH)}</b><div class="muted small">Năm ${esc(r.NAM_QUYET_DINH)}</div></td><td>${esc(r.HO_TEN)}</td><td>${esc(lookup('truong',r.TRUONG_ID))}</td><td>${esc(lookup('nghe',r.NGHE_ID))}</td><td>${pillStatus(r)}</td><td><div class="table-actions"><button class="btn" data-detail-record="${dataAttr(r.HO_SO_ID)}">Chi tiết</button>${allowed('RECORD_EDIT')?`<button class="btn" data-edit-record="${dataAttr(r.HO_SO_ID)}">Sửa</button>`:''}${canDeleteRecord(r)?`<button class="btn btn-danger" data-delete-record="${dataAttr(r.HO_SO_ID)}">Xóa</button>`:''}${allowed('RECORD_STATUS')?`<button class="btn" data-status-record="${dataAttr(r.HO_SO_ID)}">Tình trạng</button>`:''}${r.HAS_FILE&&allowed('FILE_VIEW')?`<button class="btn" data-file-get="${dataAttr(r.HO_SO_ID)}">Tệp</button>`:''}${allowed('FILE_UPLOAD')?`<button class="btn" data-file-modal="${dataAttr(r.HO_SO_ID)}">Đính kèm</button>`:''}</div></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Không có hồ sơ phù hợp.</td></tr>'}</tbody></table>`;
  const totalPages=Math.max(1,Math.ceil(data.total/20));
  $('#list-pages').innerHTML=`<div class="pagination"><button class="btn" data-page="${data.page-1}" ${data.page<=1?'disabled':''}>← Trước</button>Trang ${data.page}/${totalPages}<button class="btn" data-page="${data.page+1}" ${data.page>=totalPages?'disabled':''}>Tiếp →</button></div>`;
}
function reportKpiRows(k,extra={}){return [['Tổng số Quyết định',k.total],['Đã tham gia',k.participated],['Đang học',k.learning],['Bỏ học',k.dropout],['Không tham gia',k.notParticipating],['Không nhận Quyết định',extra.notReceived||0],['Chưa xác nhận',k.pending],...(extra.other?[['Tình trạng khác',extra.other]]:[])];}
async function renderReports(v,keepOld=false){
  const markup=heading('Báo cáo học nghề','',`${state.user?.VAI_TRO==='ADMIN'?'<button class="btn btn-primary" id="report-export">Xuất Excel</button>':''}<button class="btn" id="print-report">In báo cáo</button>`)+filterFields(state.reportFilters,'reports')+'<div id="report-output" class="spinner">Đang tải thống kê…</div>';
  if(!keepOld)$('#main').innerHTML=markup;
  const data=await rpc('overview',state.reportFilters,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  if(keepOld)$('#main').innerHTML=markup;
  $('#report-output').className='report-results';
  $('#report-output').innerHTML=`<div class="card report-card"><h3>Tổng hợp kết quả</h3><div class="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th>Số lượng</th></tr></thead><tbody>${reportKpiRows(k,data.statusCounts).map(r=>`<tr><td>${r[0]}</td><td><b>${num(r[1])}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}
async function renderCatalogs(v){
  const canEdit=allowed('CATALOG_MANAGE');
  $('#main').innerHTML=heading('Danh mục học nghề','Cơ sở đào tạo, nghề và lý do bỏ học.',canEdit?'<button class="btn btn-light" data-bulk-catalog="1">⇧ Nhập hàng loạt</button><button class="btn btn-primary" data-new-catalog="1">＋ Thêm danh mục</button>':'')+
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
async function renderAccounts(v){
  $('#main').innerHTML=heading('Quản lý tài khoản','Cấp một Gmail cho một cơ sở đào tạo; một cơ sở có thể có nhiều Gmail.','<button class="btn btn-primary" data-new-account="1">＋ Thêm tài khoản</button>')+'<div id="accounts-output" class="spinner">Đang tải…</div>';
  const data=await rpc('accounts_list',{}, {ttl:30000});if(v!==state.routeVersion)return;state.accountRows=data.items;
  $('#accounts-output').className='';
  $('#accounts-output').innerHTML=`<div class="table-wrap account-table"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Cơ sở được cấp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.map(x=>`<tr><td>${esc(x.HO_TEN)}</td><td>${esc(x.EMAIL)}</td><td>${x.VAI_TRO==='ADMIN'?'Quản trị viên':x.VAI_TRO==='CO_SO_DAO_TAO'?'Cơ sở đào tạo':'Nhân viên'}</td><td>${x.VAI_TRO==='CO_SO_DAO_TAO'?esc(lookup('truong',x.TRUONG_ID)):'—'}</td><td><span class="pill ${x.TRANG_THAI==='ACTIVE'?'good':'bad'}">${x.TRANG_THAI==='ACTIVE'?'Hoạt động':'Khóa'}</span></td><td><div class="table-actions"><button class="btn" data-edit-account="${esc(x.TAI_KHOAN_ID)}">Sửa</button><button class="btn btn-danger" data-delete-account="${esc(x.TAI_KHOAN_ID)}">Xóa</button></div></td></tr>`).join('')}</tbody></table></div>`;
}
async function renderAudits(v){
  $('#main').innerHTML=heading('Nhật ký thay đổi','Tra cứu hoạt động chỉnh sửa hồ sơ, danh mục và tài khoản.')+'<div id="audit-output" class="spinner">Đang tải nhật ký…</div>';
  const d=await rpc('audit_list',{page:state.auditPage},{ttl:30000});if(v!==state.routeVersion)return;
  $('#audit-output').className='';
  $('#audit-output').innerHTML=`<div class="table-wrap audit-table"><table><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th><th>Loại</th></tr></thead><tbody>${d.items.length?d.items.map(x=>`<tr><td class="nowrap">${esc(x.THOI_GIAN)}</td><td>${esc(x.EMAIL)}</td><td>${esc(x.HANH_DONG)}</td><td>${esc(x.LOAI_DOI_TUONG)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Chưa có nhật ký.</td></tr>'}</tbody></table></div><div class="pagination"><button class="btn" data-audit-page="${d.page-1}" ${d.page===1?'disabled':''}>← Trước</button>Trang ${d.page}/${Math.max(1,Math.ceil(d.total/d.pageSize))}<button class="btn" data-audit-page="${d.page+1}" ${d.page*d.pageSize>=d.total?'disabled':''}>Tiếp →</button></div>`;
}
function showModal(title,body,footer=''){$('#modal').innerHTML=`<div class="modal-head"><h3>${esc(title)}</h3><button class="btn icon-button" data-close="1" aria-label="Đóng">×</button></div>${body}${footer}`;$('#modal-layer').classList.remove('hidden');$('#modal-layer').setAttribute('aria-hidden','false');}
function closeModal(){state.statusImport=null;$('#modal-layer').classList.add('hidden');$('#modal-layer').setAttribute('aria-hidden','true');$('#modal').innerHTML='';state.usedPerson=null;}
const modalFoot=(label='Lưu hồ sơ')=>`<div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="submit" class="btn btn-primary" data-submit-btn="1">${label}</button></div>`;
const field=(label,name,value='',type='text',extra='')=>`<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><input id="f-${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const selectField=(label,name,inner)=>`<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><select id="f-${esc(name)}" name="${esc(name)}">${inner}</select></div>`;
function activeCatOptions(type,current){const id={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type],name={truong:'TEN_TRUONG',nghe:'TEN_NGHE',lydo:'NOI_DUNG'}[type];return option('','-- Chọn --',current)+state.cats[type].filter(x=>x.TRANG_THAI==='ACTIVE'||x[id]===current).map(x=>option(x[id],x[name],current)).join('');}
function learningSelection(r){return r?.DA_BO_HOC==='TRUE'?'BO_HOC':r?.TRANG_THAI_THAM_GIA||'CHO_XAC_NHAN';}
function statusSelect(r){const selected=learningSelection(r);return selectField('Tình trạng tham gia *','UI_TINH_TRANG',allStatusOptions().map(([k,v])=>option(k,v,selected)).join('')+option('KHAC','Khác',selected))+`<div class="field full status-custom" hidden><label>Tình trạng khác *</label><input name="customStatusName" maxlength="60" placeholder="Ví dụ: Thôi việc" disabled></div>`;}
function dropoutFields(r){const N=Number(String(r?.SO_THANG_HO_TRO||'').replace(',','.'));const periods=Number.isInteger(N)&&N>1?Array.from({length:Math.min(120,N-1)},(_,i)=>i+2):[];const prev=r?.NGAY_BO_HOC||'';const options=option('','-- Chọn tháng bắt đầu bỏ học --',prev)+periods.map(n=>option('KY:'+n,'Tháng thứ '+n,prev)).join('');const legacy=/^\d{4}-\d{2}-\d{2}$/.test(prev)?`<div class="form-hint">Dữ liệu cũ: ${esc(dateVN(prev))}. Không tự chuyển đổi ngày cũ sang tháng mới; chỉ đổi khi đã xác nhận kỳ học.</div>`:'';return `<div class="dropout-only field"><label>Tháng bỏ học *</label><select name="NGAY_BO_HOC" ${periods.length?'':'disabled'}>${options}${/^\d{4}-\d{2}-\d{2}$/.test(prev)?option(prev,'Dữ liệu cũ — '+dateVN(prev),prev):''}</select>${legacy}${periods.length?'':'<div class="form-hint">Cần số tháng hỗ trợ nguyên và lớn hơn 1 để chọn kỳ bỏ học.</div>'}</div><div class="dropout-only">${selectField('Lý do bỏ học *','LY_DO_BO_HOC_ID',activeCatOptions('lydo',r?.LY_DO_BO_HOC_ID))}</div>`;}
function updateDropoutFields(form){if(!form)return;const st=form.elements.UI_TINH_TRANG?.value,isDropout=st==='BO_HOC';form.querySelectorAll('.dropout-only').forEach(node=>{node.hidden=!isDropout;node.querySelectorAll('input,select').forEach(input=>{input.disabled=!isDropout;input.required=isDropout;});});const cust=form.querySelector('.status-custom');if(cust){cust.hidden=st!=='KHAC';cust.querySelector('input').disabled=st!=='KHAC';cust.querySelector('input').required=st==='KHAC';}}
function recordPayload(form){const p=getFormFields(form),choice=p.UI_TINH_TRANG;
  p.TRANG_THAI_THAM_GIA=choice==='BO_HOC'?'DA_THAM_GIA':choice==='KHAC'?'':choice;
  p.DA_BO_HOC=choice==='BO_HOC';delete p.UI_TINH_TRANG;
  if(!p.DA_BO_HOC){p.NGAY_BO_HOC='';p.LY_DO_BO_HOC_ID='';}if(choice!=='KHAC')delete p.customStatusName;return p;
}
function recordForm(r){
  const edit=Boolean(r),x=r||{};state.usedPerson=null;
  const form=`<form id="record-form" class="form-grid" data-edit="${edit?'yes':'no'}">
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
function statusForm(r){showModal('Cập nhật tình trạng học nghề',`<form id="status-form" class="form-grid"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="full info-banner">${esc(r.HO_TEN)} · Quyết định ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}</div>${statusSelect(r)}${dropoutFields(r)}${modalFoot('Cập nhật tình trạng')}</form>`);updateDropoutFields($('#status-form'));}
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
    <div class="field full status-bulk-dropout" hidden><label>Tháng bắt đầu bỏ học (nếu chung cho danh sách)</label><select name="dropoutPeriod">${option('','-- Chọn --')}${Array.from({length:11},(_,i)=>option('KY:'+(i+2),'Tháng thứ '+(i+2))).join('')}</select></div>
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
  const sample=all.slice(0,35).map(x=>`<tr><td>${num(x.line)}</td><td>${esc(x.kind)}</td><td>${esc(x.reason)}</td></tr>`).join('');
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
function updateAccountSchool(form){if(!form)return;const wrap=form.querySelector('.account-school'),select=form.elements.schoolId,show=form.elements.role?.value==='CO_SO_DAO_TAO';if(wrap)wrap.hidden=!show;if(select){select.disabled=!show;select.required=show;}}
function accountForm(item){const x=item||{};showModal(item?'Sửa tài khoản':'Thêm tài khoản',`<form id="account-form" class="form-grid"><input type="hidden" name="id" value="${esc(x.TAI_KHOAN_ID||'')}">${field('Email Google *','email',x.EMAIL||'','email','required')}${field('Họ tên','name',x.HO_TEN||'')}${selectField('Vai trò','role',option('NHAN_VIEN','Nhân viên',x.VAI_TRO||'NHAN_VIEN')+option('ADMIN','Quản trị viên',x.VAI_TRO)+option('CO_SO_DAO_TAO','Cơ sở đào tạo',x.VAI_TRO))}<div class="account-school">${selectField('Cơ sở được phân công','schoolId',activeCatOptions('truong',x.TRUONG_ID))}</div>${selectField('Trạng thái','status',option('ACTIVE','Hoạt động',x.TRANG_THAI||'ACTIVE')+option('DISABLED','Khóa',x.TRANG_THAI))}${modalFoot('Lưu tài khoản')}</form>`);updateAccountSchool($('#account-form'));}
function fileModal(r){if(!allowed('FILE_UPLOAD')){notify('Bạn chỉ có quyền xem tệp đã được đính kèm.',true);return;}showModal('Tệp đính kèm của hồ sơ',`<div class="info-banner">${esc(r.HO_TEN)} · QĐ ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}<div>Chỉ chấp nhận PDF, JPG, PNG; tối đa 10 MB mỗi tệp.</div></div><form id="file-form" class="form-grid"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="field full"><label>Chọn tệp</label><input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg" required></div><div class="full" id="upload-progress" aria-live="polite"></div>${modalFoot('Tải lên')}</form>${r.HAS_FILE?`<div class="modal-file-actions">${allowed('FILE_VIEW')?`<button class="btn" data-file-get="${esc(r.HO_SO_ID)}">Tải tệp hiện tại</button>`:''}<button class="btn btn-danger" data-file-remove="${esc(r.HO_SO_ID)}">Gỡ tệp hiện tại</button></div>`:''}`);}
function getCurrentRecord(id){return state.records.find(x=>x.HO_SO_ID===id);}
async function refreshBootstrap(){const b=await rpc('bootstrap',{}, {ttl:0});state.user=b.user;state.cats=b.catalogs;state.statuses=b.statuses||[];state.permissionRevision=b.permissionRevision||'';state.permissionChecked=Date.now();}
async function afterMutation(page=state.page){closeModal();
  // Hồ sơ/tệp đã được invalidate trong rpc(); chỉ đọc lại bootstrap khi sửa danh mục hoặc tài khoản.
  if(page==='catalogs'||page==='accounts')await refreshBootstrap();
  navigate(page,true);
}
function csvCell(x){const str=String(x??'');const secure=/^[\s]*[=+\-@\t\r]/.test(str)?"'"+str:str;return '"'+secure.replace(/"/g,'""')+'"';}
function downloadCsv(name,rows){const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
// YC-HN-011: xuất XLSX thực sự từ 25 cột Excel, không đẩy dữ liệu sang bên thứ ba.
function downloadRecordXlsx(name,rows){
  const encoder=new TextEncoder(),xmlEsc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const cols=Array.from({length:25},(_,i)=>String.fromCharCode(65+i));
  const cells=rows.map((r,i)=>`<row r="${i+1}">${r.slice(0,25).map((v,j)=>`<c r="${cols[j]}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`).join('')}</row>`).join('');
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${cells}</sheetData><mergeCells count="1"><mergeCell ref="M1:N1"/></mergeCells></worksheet>`;
  const files=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Danh sách" sheetId="1" r:id="rId1"/></sheets></workbook>'],['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],['xl/worksheets/sheet1.xml',sheet]];
  const w16=(a,o,n)=>{a[o]=n&255;a[o+1]=(n>>>8)&255;},w32=(a,o,n)=>{w16(a,o,n);w16(a,o+2,n>>>16);};
  let chunks=[],central=[],offset=0;const crc=data=>{let c=0xffffffff;for(const b of data){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  for(const [path,content] of files){const fn=encoder.encode(path),data=encoder.encode(content),checksum=crc(data),h=new Uint8Array(30+fn.length),d=new Uint8Array(46+fn.length);
    w32(h,0,0x04034b50);w16(h,4,20);w32(h,14,checksum);w32(h,18,data.length);w32(h,22,data.length);w16(h,26,fn.length);h.set(fn,30);
    w32(d,0,0x02014b50);w16(d,4,20);w16(d,6,20);w32(d,16,checksum);w32(d,20,data.length);w32(d,24,data.length);w16(d,28,fn.length);w32(d,42,offset);d.set(fn,46);
    chunks.push(h,data);central.push(d);offset+=h.length+data.length;}
  const csize=central.reduce((n,b)=>n+b.length,0),tail=new Uint8Array(22);w32(tail,0,0x06054b50);w16(tail,8,files.length);w16(tail,10,files.length);w32(tail,12,csize);w32(tail,16,offset);
  const blob=new Blob([...chunks,...central,tail],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
async function exportReport(filters){const d=await rpc('report_export',filters,{ttl:30000});const firstHeader=[...d.columns];firstHeader[12]='Thời gian đào tạo';firstHeader[13]='';const secondHeader=Array(25).fill('');secondHeader[12]='Từ ngày';secondHeader[13]='Đến ngày';downloadRecordXlsx('danh-sach-hoc-nghe-'+new Date().toISOString().slice(0,10)+'.xlsx',[firstHeader,secondHeader,...d.items]);notify('Đã xuất Excel '+num(d.items.length)+' hồ sơ.');}

function exportModal(){showModal('Xuất Excel báo cáo học nghề',`<form id="report-export-form" class="form-grid"><div class="field full"><label>Mẫu Excel cần xuất</label><select name="mode"><option value="list">Danh sách hồ sơ học nghề (25 cột)</option><option value="summary">Báo cáo tổng hợp (Chỉ tiêu / Số lượng)</option><option value="truong">Báo cáo theo cơ sở đào tạo</option><option value="nghe">Báo cáo theo nghề đào tạo</option></select></div>${modalFoot('Xuất Excel')}</form>`);}
async function exportSummaryOrMatrix(mode){
  const stamp=new Date().toISOString().slice(0,10);
  if(mode==='summary'){const d=await rpc('overview',state.reportFilters,{ttl:0});const lines=reportKpiRows(d.kpi,d.statusCounts);downloadReportXlsx('Bao-cao-hoc-nghe-'+stamp+'.xlsx',['Chỉ tiêu','Số lượng'],lines,'Báo cáo học nghề');}
  else{const d=await rpc('report_matrix',{...state.reportFilters,groupBy:mode},{ttl:0}),label=mode==='truong'?'Tên cơ sở đào tạo':'Tên nghề',other=d.items.some(r=>r.other>0),columns=['STT',label,'Tổng số Quyết định','Đã tham gia học','Bỏ học','Không tham gia','Không nhận Quyết định','Chưa xác nhận',...(other?['Tình trạng khác']:[])];const rows=d.items.map((r,i)=>[i+1,r.name,r.total,r.learning,r.dropout,r.notParticipating,r.notReceived,r.pending,...(other?[r.other]:[])]);
    const total=[...Array(2).fill(''),...columns.slice(2).map((_,i)=>rows.reduce((sum,row)=>sum+Number(row[i+2]||0),0))];total[0]='Tổng cộng';
    if(total[2]!==d.total)throw Error('Số quyết định báo cáo chưa khớp; vui lòng thực hiện lại.');
    rows.push(total);
    downloadReportXlsx('Bao-cao-theo-'+(mode==='truong'?'co-so-dao-tao':'nghe-dao-tao')+'-'+stamp+'.xlsx',columns,rows,'Báo cáo học nghề',{matrixTotals:true});}
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
  try{await fn();}catch(e){failure(e);}
  finally{
    state.busy=false;
    if(button?.isConnected){button.innerHTML=prior;button.removeAttribute('aria-busy');}
    document.querySelectorAll('[data-submit-btn]').forEach(x=>{x.disabled=(x.id==='bulk-import-submit' && $('#bulk-catalog-form')?.dataset.ready!=='yes') || (x.id==='record-import-submit' && !state.importPreview?.valid) || (x.id==='status-bulk-submit' && (!state.statusImport?.verified || !state.statusImport?.results?.some(r=>r.kind==='eligible')));});
  }
};
// Delegated buttons: no inline user-controlled event handlers.
document.addEventListener('click',async e=>{
  const node=e.target.closest('button');if(!node)return;
  if(node.hasAttribute('data-close')){if(!state.busy)closeModal();return;}
  if(node.hasAttribute('data-nav')){navigate(node.dataset.nav);return;}
  if(node.hasAttribute('data-dashboard-detail')){if(allowed('REPORT_VIEW'))navigate('reports');return;}
  if(node.hasAttribute('data-retry')){navigate(state.page,true);return;}
  if(node.hasAttribute('data-bulk-record')){bulkRecordForm();return;}
  if(node.hasAttribute('data-status-bulk')){statusBulkForm();return;}
  if(node.hasAttribute('data-status-bulk-template')){const a=document.createElement('a');a.href='/templates/MAU_CAP_NHAT_TINH_TRANG.xlsx';a.download='MAU_CAP_NHAT_TINH_TRANG.xlsx';document.body.append(a);a.click();a.remove();return;}
  if(node.hasAttribute('data-status-bulk-check')){await serialized(statusBulkCheck);return;}
  if(node.hasAttribute('data-status-bulk-errors')){const s=state.statusImport;if(!s)return;const list=[...(s.results||[]),...(s.skipped||[])].filter(x=>!['eligible','updated','ignored','unselected'].includes(x.kind));downloadCsv('ket-qua-chua-cap-nhat.csv',[['Dòng','Phân loại','Lý do'],...list.map(x=>[x.line,x.kind,x.reason])]);return;}
  if(node.hasAttribute('data-record-template')){downloadRecordTemplate();return;}
  if(node.hasAttribute('data-record-check')){await serialized(recordBulkCheck);return;}
  if(node.hasAttribute('data-record-errors')){const issues=state.importPreview?.issues||[];if(!issues.length)return;downloadCsv('danh-sach-loi-nhap-ho-so.csv',[['Dòng trong file','Vấn đề'],...issues.map(x=>[x.line,x.reason])]);return;}
  if(node.hasAttribute('data-new-record')){recordForm(null);return;}
  if(node.hasAttribute('data-edit-record')){const r=getCurrentRecord(node.dataset.editRecord);if(r)recordForm(r);return;}
  if(node.hasAttribute('data-delete-record')){const r=getCurrentRecord(node.dataset.deleteRecord);if(r&&canDeleteRecord(r))deleteRecordForm(r);return;}
  if(node.hasAttribute('data-detail-record')){const r=getCurrentRecord(node.dataset.detailRecord);if(r)recordDetail(r);return;}
  if(node.hasAttribute('data-confirm-delete')){const r=getCurrentRecord(node.dataset.confirmDelete);if(!r)return;await serialized(async()=>{await rpc('record_delete',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN},{mutate:true,preserveRecordList:true});
    state.records=state.records.filter(x=>x.HO_SO_ID!==r.HO_SO_ID);state.recordTotal=Math.max(0,state.recordTotal-1);
    for(const [k,c] of state.cache)if(k.startsWith('records_list|')){
      const data=c.value;if(data?.items?.some(x=>x.HO_SO_ID===r.HO_SO_ID)){
        data.items=data.items.filter(x=>x.HO_SO_ID!==r.HO_SO_ID);data.total=Math.max(0,data.total-1);c.at=Date.now();
      }else state.cache.delete(k);
    }
    closeModal();const tr=document.querySelector(`[data-delete-record="${CSS.escape(r.HO_SO_ID)}"]`)?.closest('tr');if(tr)tr.remove();
    const cnt=$('#record-count');if(cnt)cnt.textContent=`Hiển thị ${num(state.records.length)} / ${num(state.recordTotal)} hồ sơ · Trang ${state.recordPage}`;
    const empty=$('#list-output tbody');if(empty&&!empty.children.length)empty.innerHTML='<tr><td colspan="7" class="empty">Không có hồ sơ phù hợp.</td></tr>';
    state.pageViews.delete('records');const lastPage=Math.max(1,Math.ceil(state.recordTotal/20));
    if(state.recordPage>lastPage){state.recordPage=lastPage;notify('Đã xóa hồ sơ; đang cập nhật trang cuối.');navigate('records',true);return;}
    const pageBox=$('#list-pages');if(pageBox)pageBox.innerHTML=`<div class="pagination"><button class="btn" data-page="${state.recordPage-1}" ${state.recordPage<=1?'disabled':''}>← Trước</button>Trang ${state.recordPage}/${lastPage}<button class="btn" data-page="${state.recordPage+1}" ${state.recordPage>=lastPage?'disabled':''}>Tiếp →</button></div>`;
    notify('Đã chuyển hồ sơ vào danh sách đã xóa.');});return;}
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
  if(node.hasAttribute('data-export-list')){try{await exportReport(state.filters);}catch(err){failure(err);}return;}
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
document.addEventListener('input',e=>{if(e.target.name==='SO_THANG_HO_TRO'&&e.target.closest('#record-form')){const form=e.target.closest('form'),select=form.elements.NGAY_BO_HOC;if(!select)return;const N=Number(String(e.target.value).replace(',','.')),prior=select.value,periods=Number.isInteger(N)&&N>1?Array.from({length:Math.min(N-1,120)},(_,i)=>i+2):[];select.innerHTML=option('','-- Chọn tháng bắt đầu bỏ học --',prior)+periods.map(n=>option('KY:'+n,'Tháng thứ '+n,prior)).join('');select.disabled=!periods.length||form.elements.UI_TINH_TRANG?.value!=='BO_HOC';}});
document.addEventListener('input',e=>{if(e.target.id==='catalog-search'){state.catalogSearch=e.target.value;const text=e.target.value.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'');document.querySelectorAll('.catalog-data-row').forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(text);});}const form=e.target.closest('#bulk-catalog-form');if(form){if(e.target.name==='names'&&e.target.value.trim()){state.bulkRows=null;state.bulkFileText='';const file=$('#bulk-csv');if(file)file.value='';}form.dataset.verified='';form.dataset.ready='no';const btn=$('#bulk-import-submit');if(btn)btn.disabled=true;}});
document.addEventListener('change',e=>{if(e.target.name==='status'&&e.target.closest('#status-bulk-form')){statusBulkToggle();if(state.statusImport){state.statusImport.rows=[];state.statusImport.skipped=[];}const file=$('#status-bulk-file');if(file)file.value='';resetStatusBulkReview('Đã thay đổi tình trạng. Vui lòng chọn lại file Excel.');}if(['dropoutPeriod','dropoutReason'].includes(e.target.name)&&e.target.closest('#status-bulk-form'))resetStatusBulkReview('Đã thay đổi thông tin bỏ học. Vui lòng bấm Kiểm tra dữ liệu lại.');if(e.target.name==='UI_TINH_TRANG'){updateDropoutFields(e.target.closest('form'));}if(e.target.name==='role'&&e.target.closest('#account-form'))updateAccountSchool(e.target.closest('form'));if(e.target.name==='type'&&e.target.closest('#bulk-catalog-form')){const f=e.target.closest('form');f.dataset.ready='no';f.dataset.verified='';state.bulkRows=null;state.bulkFileText='';const file=$('#bulk-csv');if(file)file.value='';$('#bulk-import-submit').disabled=true;}});
document.addEventListener('change',e=>{if(e.target.name==='NGAY_QUYET_DINH'&&$('#preview-year'))$('#preview-year').value=e.target.value?.slice(0,4)||'Tự lấy từ ngày quyết định';});
document.addEventListener('submit',e=>{
  const form=e.target,formId=form.getAttribute('id');if(!formId)return;e.preventDefault();
  if(formId==='report-export-form'){serialized(async()=>{const mode=form.elements.mode.value;if(mode==='list')await exportReport(state.reportFilters);else await exportSummaryOrMatrix(mode);closeModal();});return;}
  if(formId==='records-filters'){void applyRecordFilters(form,1);return;}
  if(formId==='dashboard-filters'){state.dashboardFilters=getFormFields(form);state.pageViews.delete('dashboard');navigate('dashboard',true);return;}
  if(formId==='reports-filters'){state.reportFilters=getFormFields(form);state.pageViews.delete('reports');navigate('reports',true);return;}
  if(formId==='bulk-record-form'){serialized(importBulkRecords);return;}
  if(formId==='status-bulk-form'){serialized(statusBulkApply,{button:form.querySelector('[data-submit-btn]'),label:'Đang cập nhật...'});return;}
  if(formId==='record-form'){serialized(async()=>{let p=recordPayload(form);const d=await rpc('record_save',p,{mutate:true});notify('Đã lưu hồ sơ '+d.record.SO_QUYET_DINH+'/'+d.record.NAM_QUYET_DINH);await afterMutation('records');});return;}
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
initialize();

// Export for non-network unit tests only; no tokens/private data exported.
export const tests = {esc,dateVN,STATUS,RIGHTS,csvCell,parseCsv,BULK_HEADERS,STAFF_RIGHTS,RECORD_HEADERS,parseRecordExcel,excelISO,parseStatusBulkExcel,statusBulkCounts};

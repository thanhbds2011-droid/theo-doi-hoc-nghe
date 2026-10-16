/** THEO DÕI HỌC NGHỀ — v1.1.1-RC (YC-HN-005). Không lưu token/PII vào localStorage. */
const $ = (s, root = document) => root.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dataAttr = esc;
const num = value => Number(value || 0).toLocaleString('vi-VN');
const option = (value, label, selected = '') => `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
const dateVN = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : (d || '—');
const STATUS = { CHO_XAC_NHAN:'Chưa xác nhận', DA_THAM_GIA:'Đã tham gia', KHONG_THAM_GIA:'Không tham gia' };
const RIGHTS = { RECORD_VIEW:'Xem hồ sơ', RECORD_CREATE:'Thêm hồ sơ', RECORD_EDIT:'Sửa hồ sơ', RECORD_DELETE:'Xóa hồ sơ do mình tạo', RECORD_STATUS:'Cập nhật tình trạng', REPORT_VIEW:'Xem báo cáo', CATALOG_MANAGE:'Quản lý danh mục', ACCOUNT_MANAGE:'Quản lý tài khoản', AUDIT_VIEW:'Xem nhật ký', FILE_VIEW:'Xem tệp', FILE_UPLOAD:'Tải lên/xóa tệp' };
const NAMES = { truong:'Cơ sở đào tạo', nghe:'Nghề đào tạo', lydo:'Lý do bỏ học' };
const state = {
  token:'', clientId:'', user:null, cats:{truong:[],nghe:[],lydo:[]}, page:'dashboard', routeVersion:0,
  filters:{year:'',truong:'',nghe:'',status:'',dropout:'',query:''},
  reportFilters:{year:'',truong:'',nghe:''},
  records:[], recordPage:1, recordTotal:0, accountRows:[], auditPage:1, catalogType:'truong',
  cache:new Map(), inFlight:new Map(), generation:0, busy:false, usedPerson:null
};

function notify(message, error=false){ const el=$('#toast');el.textContent=String(message);el.className='toast show'+(error?' error':'');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),5500); }
const ERROR_TEXT = {
  LOGIN_EXPIRED:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', NOT_AUTHORIZED:'Tài khoản chưa được cấp quyền hoặc đã bị khóa.', NO_PERMISSION:'Bạn chưa được cấp quyền thực hiện thao tác này.', NOT_OWNER:'Bạn chỉ được xóa hồ sơ do chính mình tạo.',
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
function allowed(p){return state.user?.VAI_TRO==='ADMIN'||(state.user?.QUYEN||'').split(',').map(x=>x.trim()).includes(p);}
function rid(){return 'r_'+(crypto?.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(36).slice(2)));}
function cacheKey(a,p){return a+'|'+JSON.stringify(p||{});}
async function rpc(action,payload={},options={}) {
  if(!state.token) throw Error('Bạn cần đăng nhập Google.');
  const read = !options.mutate;
  const key=cacheKey(action,payload),ttl=Number(options.ttl ?? 45000);
  if(read && state.cache.has(key) && Date.now()-state.cache.get(key).at<ttl)return state.cache.get(key).value;
  if(read && state.inFlight.has(key))return state.inFlight.get(key);
  const generation=state.generation;
  const run=async()=>{
    let res;
    try {res=await fetch('/api/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload,idToken:state.token,requestId:options.requestId||rid()}),cache:'no-store'});}
    catch(e){throw Error('Không kết nối được hệ thống. Vui lòng kiểm tra mạng và thử lại.');}
    let out;
    try{out=await res.json();}catch{throw Error('Hệ thống chưa phản hồi đầy đủ. Vui lòng kiểm tra lại thao tác trước khi thử lại.');}
    if(!out.ok){if(out.error?.code==='LOGIN_EXPIRED'){signOut();}throw Error(friendlyError(out.error?.code,out.error?.message));}
    if(options.mutate){state.generation++;state.cache.clear();state.inFlight.clear();}
    else if(ttl>0 && generation===state.generation){state.cache.set(key,{at:Date.now(),value:out.data});}
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
    google.accounts.id.renderButton($('#google-login'),{theme:'outline',size:'large',shape:'pill',text:'signin_with',width:270});
    $('#login-note').textContent='Đăng nhập bằng tài khoản đã được cấp quyền.';
  }catch(e){$('#login-note').textContent=e.message;failure(e);}
}
async function credentialResponse(response){
  if(!response?.credential)return;
  state.token=response.credential;
  $('#login-note').textContent='Đang kiểm tra tài khoản và phân quyền…';
  try{
    const data=await rpc('bootstrap',{}, {ttl:0});
    state.user=data.user;state.cats=data.catalogs;
    $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
    $('#current-user').innerHTML=`<b>${esc(state.user.HO_TEN || state.user.EMAIL)}</b><span>${state.user.VAI_TRO==='ADMIN'?'Quản trị viên':'Nhân viên'}</span>`;
    navigate('dashboard');
  }catch(e){state.token='';$('#login-note').textContent='Không thể đăng nhập.';failure(e);}
}
function signOut(){state.token='';state.user=null;state.generation++;state.cache.clear();state.inFlight.clear();state.records=[];state.cats={truong:[],nghe:[],lydo:[]};$('#app').classList.add('hidden');$('#login').classList.remove('hidden');closeModal();if(window.google?.accounts?.id)google.accounts.id.disableAutoSelect();$('#login-note').textContent='Đăng nhập lại bằng tài khoản Google.';}
function navItems(){return [
  ['dashboard','◫','Tổng quan','RECORD_VIEW'],['records','▤','Hồ sơ học nghề','RECORD_VIEW'],
  ['reports','▥','Báo cáo','REPORT_VIEW'],['catalogs','☷','Danh mục','RECORD_VIEW'],
  ['accounts','♙','Quản lý tài khoản','ACCOUNT_MANAGE'],['audits','◴','Nhật ký thay đổi','AUDIT_VIEW']
].filter(i=>allowed(i[3]));}
function buildNav(){
  $('#navigation').innerHTML=navItems().map(([id,glyph,label])=>`<button data-nav="${id}" class="${state.page===id?'active':''}"><span class="nav-glyph">${glyph}</span>${esc(label)}</button>`).join('');
}
function navigate(page){
  if(!navItems().some(item=>item[0]===page))page='dashboard';
  state.page=page;state.routeVersion++;
  $('#sidebar').classList.remove('open');buildNav();
  $('#main').innerHTML='<div class="spinner">Đang tải dữ liệu…</div>';
  const v=state.routeVersion;
  (async()=>{
    try{
      switch(page){case 'dashboard':await renderDashboard(v);break;
        case 'records':await renderRecords(v);break;
        case 'reports':await renderReports(v);break;
        case 'catalogs':await renderCatalogs(v);break;
        case 'accounts':await renderAccounts(v);break;
        case 'audits':await renderAudits(v);break;
      }
    }catch(e){if(v===state.routeVersion)$('#main').innerHTML=`<div class="card"><h3>Không tải được dữ liệu</h3><p class="muted">${esc(e.message)}</p><button class="btn" data-retry="1">Tải lại</button></div>`;failure(e);}
  })();
}
function heading(title,desc,buttons=''){return `<div class="page-header"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><div class="page-actions">${buttons}</div></div>`;}
function sel(name,items,selected='',empty='Tất cả',key='ID',value='TEN'){
  return `<select name="${esc(name)}">${option('',empty,selected)}${items.map(x=>option(x[key],x[value],selected)).join('')}</select>`;
}
const schoolOpts= (s='',empty='Tất cả cơ sở',activeOnly=false) => sel('truong',state.cats.truong.filter(x=>!activeOnly||x.TRANG_THAI==='ACTIVE'),s,empty,'TRUONG_ID','TEN_TRUONG');
const tradeOpts= (s='',empty='Tất cả nghề',activeOnly=false) => sel('nghe',state.cats.nghe.filter(x=>!activeOnly||x.TRANG_THAI==='ACTIVE'),s,empty,'NGHE_ID','TEN_NGHE');
function lookup(type,id){const def={truong:['TRUONG_ID','TEN_TRUONG'],nghe:['NGHE_ID','TEN_NGHE'],lydo:['LY_DO_ID','NOI_DUNG']}[type];let x=state.cats[type].find(r=>r[def[0]]===id);return x?.[def[1]] || id || '—';}
function filterFields(filters,mode){return `<form class="card filter-grid ${mode==='dashboard'?'short':''}" id="${mode}-filters">
  <div class="field"><label>Năm quyết định</label><input type="number" min="1900" max="2200" name="year" placeholder="Tất cả các năm" value="${esc(filters.year||'')}"></div>
  <div class="field"><label>Cơ sở đào tạo</label>${schoolOpts(filters.truong)}</div>
  <div class="field"><label>Nghề đào tạo</label>${tradeOpts(filters.nghe)}</div>
  ${mode==='records'?`<div class="field"><label>Tình trạng</label><select name="status">${option('','Tất cả',filters.status)}${Object.entries(STATUS).map(([k,v])=>option(k,v,filters.status)).join('')}</select></div><div class="field"><label>Tìm người học / số QĐ</label><input name="query" value="${esc(filters.query||'')}" placeholder="Nhập từ khóa..."></div>`:''}
  <button class="btn btn-primary" type="submit">Lọc dữ liệu</button></form>`;}
function getFormFields(form){return Object.fromEntries(new FormData(form).entries());}
function pillStatus(record){const st=record.TRANG_THAI_THAM_GIA;return st==='DA_THAM_GIA' ? `<span class="pill ${record.DA_BO_HOC==='TRUE'?'bad':'good'}">${record.DA_BO_HOC==='TRUE'?'Bỏ học':'Đang học'}</span>` : `<span class="pill ${st==='KHONG_THAM_GIA'?'bad':'warn'}">${esc(STATUS[st]||'Chưa xác nhận')}</span>`;}
async function renderDashboard(v){
  const f=state.reportFilters;
  // YC-HN-005: sáu KPI theo lưới 3×2; không tạo thêm biểu đồ tổng hợp trùng lặp.
  $('#main').innerHTML=`<section class="welcome-banner" aria-label="Chào mừng">
    <span class="welcome-art" aria-hidden="true">🎓</span>
    <div class="welcome-copy"><span class="welcome-overline">TRANG QUẢN LÝ THEO DÕI HỌC NGHỀ</span>
      <h1>Xin chào, ${esc(state.user?.HO_TEN||'bạn')}!</h1>
      <p>Quản lý hồ sơ, theo dõi quá trình tham gia và thống kê kết quả học nghề trên cùng một hệ thống.</p>
    </div></section>`+filterFields(f,'dashboard')+'<div id="dashboard-output" class="spinner">Đang tổng hợp số liệu…</div>';
  const data=await rpc('overview',f,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  const tiles=[['Tổng hồ sơ','▤',k.total],['Đã tham gia','✓',k.participated],['Đang học','✦',k.learning],['Bỏ học','↘',k.dropout],['Không tham gia','×',k.notParticipating],['Chưa xác nhận','◷',k.pending]];
  const boxStats=(title,values,type)=>{
    const rows=Object.entries(values || {}).sort((a,b)=>b[1]-a[1] || lookup(type,a[0]).localeCompare(lookup(type,b[0]),'vi'));
    return `<section class="card summary-card"><h3>${esc(title)}</h3><div class="table-wrap summary-table"><table><thead><tr><th scope="col">STT</th><th scope="col">${type==='truong'?'Cơ sở đào tạo':'Nghề đào tạo'}</th><th scope="col">Số hồ sơ</th></tr></thead><tbody>${rows.length?rows.slice(0,12).map(([id,n],i)=>`<tr><td>${i+1}</td><td>${esc(lookup(type,id))}</td><td>${num(n)}</td></tr>`).join(''):'<tr><td colspan="3" class="empty">Chưa có dữ liệu phù hợp.</td></tr>'}</tbody></table></div></section>`;
  };
  $('#dashboard-output').className='dashboard-results';
  $('#dashboard-output').innerHTML=`<div class="kpi-grid" aria-label="Sáu chỉ tiêu tổng quan">${tiles.map(([label,glyph,n])=>`<article class="kpi"><div class="kpi-icon" aria-hidden="true">${glyph}</div><div class="kpi-body"><div class="desc">${esc(label)}</div><div class="metric">${num(n)}</div></div></article>`).join('')}</div><div class="sub-grid">${boxStats('Theo cơ sở đào tạo',data.schoolCounts,'truong')}${boxStats('Theo nghề đào tạo',data.tradeCounts,'nghe')}</div>`;
}
async function renderRecords(v){
  $('#main').innerHTML=heading('Hồ sơ học nghề','Mỗi quyết định chỉ áp dụng cho một người; số quyết định được kiểm tra trùng trong cùng năm.',allowed('RECORD_CREATE')?'<button class="btn btn-primary" data-new-record="1">＋ Thêm hồ sơ</button>':'')+filterFields(state.filters,'records')+`<div class="panel-top"><span class="muted" id="record-count">Đang tải hồ sơ…</span><div class="page-actions">${allowed('REPORT_VIEW')?'<button class="btn btn-light" data-export-list="1">Xuất CSV</button>':''}</div></div><div id="list-output" class="table-wrap"></div><div id="list-pages"></div>`;
  await loadRecordList(v);
}
async function loadRecordList(v){
  const data=await rpc('records_list',{...state.filters,page:state.recordPage,pageSize:20},{ttl:45000});
  if(v!==state.routeVersion)return;
  state.records=data.items;state.recordTotal=data.total;
  $('#record-count').textContent=`Hiển thị ${num(data.items.length)} / ${num(data.total)} hồ sơ · Trang ${data.page}`;
  $('#list-output').innerHTML=`<table><thead><tr><th>Ngày QĐ</th><th>Số QĐ</th><th>Người học</th><th>Cơ sở đào tạo</th><th>Nghề</th><th>Tình trạng</th><th>Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(r=>`<tr><td class="nowrap">${esc(dateVN(r.NGAY_QUYET_DINH))}</td><td><b>${esc(r.SO_QUYET_DINH)}</b><div class="muted small">Năm ${esc(r.NAM_QUYET_DINH)}</div></td><td>${esc(r.HO_TEN)}<div class="muted small">${esc(r.NGUOI_HOC_ID)}</div></td><td>${esc(lookup('truong',r.TRUONG_ID))}</td><td>${esc(lookup('nghe',r.NGHE_ID))}</td><td>${pillStatus(r)}</td><td><div class="table-actions">${allowed('RECORD_EDIT')?`<button class="btn" data-edit-record="${dataAttr(r.HO_SO_ID)}">Sửa</button>`:''}${canDeleteRecord(r)?`<button class="btn btn-danger" data-delete-record="${dataAttr(r.HO_SO_ID)}">Xóa</button>`:''}${allowed('RECORD_STATUS')?`<button class="btn" data-status-record="${dataAttr(r.HO_SO_ID)}">Tình trạng</button>`:''}${r.HAS_FILE&&allowed('FILE_VIEW')?`<button class="btn" data-file-get="${dataAttr(r.HO_SO_ID)}">Tệp</button>`:''}${allowed('FILE_UPLOAD')?`<button class="btn" data-file-modal="${dataAttr(r.HO_SO_ID)}">Đính kèm</button>`:''}</div></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Không có hồ sơ phù hợp.</td></tr>'}</tbody></table>`;
  const totalPages=Math.max(1,Math.ceil(data.total/20));
  $('#list-pages').innerHTML=`<div class="pagination"><button class="btn" data-page="${data.page-1}" ${data.page<=1?'disabled':''}>← Trước</button>Trang ${data.page}/${totalPages}<button class="btn" data-page="${data.page+1}" ${data.page>=totalPages?'disabled':''}>Tiếp →</button></div>`;
}
async function renderReports(v){
  $('#main').innerHTML=heading('Báo cáo học nghề','Tổng hợp theo năm, cơ sở và nghề; xuất hồ sơ tối đa 5.000 bản ghi/lần.',`<button class="btn btn-primary" id="report-export">Xuất CSV</button><button class="btn" id="print-report">In báo cáo</button>`)+filterFields(state.reportFilters,'dashboard')+'<div id="report-output" class="spinner">Đang tải thống kê…</div>';
  const data=await rpc('overview',state.reportFilters,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  $('#report-output').className='report-results';
  $('#report-output').innerHTML=`<div class="card report-card"><h3>Tổng hợp kết quả</h3><div class="info-banner">Tính theo số hồ sơ/quyết định, không phải số người học duy nhất. “Đang học” = đã tham gia và chưa bỏ học.</div><div class="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th>Số lượng</th></tr></thead><tbody>${[['Tổng số hồ sơ',k.total],['Đã tham gia',k.participated],['Đang học',k.learning],['Bỏ học',k.dropout],['Không tham gia',k.notParticipating],['Chưa xác nhận',k.pending]].map(r=>`<tr><td>${r[0]}</td><td><b>${num(r[1])}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}
async function renderCatalogs(v){
  const canEdit=allowed('CATALOG_MANAGE');
  $('#main').innerHTML=heading('Danh mục học nghề','Cơ sở đào tạo, nghề và lý do bỏ học.',canEdit?'<button class="btn btn-light" data-bulk-catalog="1">⇧ Nhập hàng loạt</button><button class="btn btn-primary" data-new-catalog="1">＋ Thêm danh mục</button>':'')+
  `<div class="catalog-toolbar"><div class="tabs">${Object.entries(NAMES).map(([type,name])=>`<button class="btn ${state.catalogType===type?'active':''}" data-cat-tab="${type}">${name}</button>`).join('')}</div><div class="catalog-search"><label class="field"><span>Tìm danh mục</span><input id="catalog-search" placeholder="Nhập tên hoặc mã danh mục..." autocomplete="off"></label></div></div><div id="cats-view"></div>`;
  await loadCatalogs(v);
}
async function loadCatalogs(v){
  const type=state.catalogType,data=await rpc('catalog_list',{type},{ttl:60000});if(v!==state.routeVersion)return;
  state.cats[type]=data.items;
  const def={truong:['MA_TRUONG','TEN_TRUONG'],nghe:['MA_NGHE','TEN_NGHE'],lydo:['MA_LY_DO','NOI_DUNG']}[type];
  $('#cats-view').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên / Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(r=>`<tr class="catalog-data-row"><td>${esc(r[def[0]])}</td><td>${esc(r[def[1]])}</td><td><span class="pill ${r.TRANG_THAI==='ACTIVE'?'good':'warn'}">${r.TRANG_THAI==='ACTIVE'?'Đang sử dụng':'Ngừng sử dụng'}</span></td><td>${allowed('CATALOG_MANAGE')?`<button class="btn" data-edit-catalog="${dataAttr(r[{truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type]])}">Sửa</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Chưa có danh mục. Quản trị viên hãy tạo trước khi nhập hồ sơ.</td></tr>'}</tbody></table></div>`;
}
async function renderAccounts(v){
  $('#main').innerHTML=heading('Quản lý tài khoản','Cấp quyền riêng cho phần mềm Học nghề.','<button class="btn btn-primary" data-new-account="1">＋ Thêm tài khoản</button>')+'<div id="accounts-output" class="spinner">Đang tải…</div>';
  const data=await rpc('accounts_list',{}, {ttl:30000});if(v!==state.routeVersion)return;state.accountRows=data.items;
  $('#accounts-output').className='';
  $('#accounts-output').innerHTML=`<div class="table-wrap account-table"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.map(x=>`<tr><td>${esc(x.HO_TEN)}</td><td>${esc(x.EMAIL)}</td><td>${x.VAI_TRO==='ADMIN'?'Quản trị viên':'Nhân viên'}</td><td><span class="pill ${x.TRANG_THAI==='ACTIVE'?'good':'bad'}">${x.TRANG_THAI==='ACTIVE'?'Hoạt động':'Khóa'}</span></td><td><button class="btn" data-edit-account="${esc(x.TAI_KHOAN_ID)}">Sửa</button></td></tr>`).join('')}</tbody></table></div>`;
}
async function renderAudits(v){
  $('#main').innerHTML=heading('Nhật ký thay đổi','Tra cứu hoạt động chỉnh sửa hồ sơ, danh mục và tài khoản.')+'<div id="audit-output" class="spinner">Đang tải nhật ký…</div>';
  const d=await rpc('audit_list',{page:state.auditPage},{ttl:30000});if(v!==state.routeVersion)return;
  $('#audit-output').className='';
  $('#audit-output').innerHTML=`<div class="table-wrap audit-table"><table><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th><th>Loại</th><th>Mã bản ghi</th></tr></thead><tbody>${d.items.length?d.items.map(x=>`<tr><td class="nowrap">${esc(x.THOI_GIAN)}</td><td>${esc(x.EMAIL)}</td><td>${esc(x.HANH_DONG)}</td><td>${esc(x.LOAI_DOI_TUONG)}</td><td>${esc(x.BAN_GHI_ID)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">Chưa có nhật ký.</td></tr>'}</tbody></table></div><div class="pagination"><button class="btn" data-audit-page="${d.page-1}" ${d.page===1?'disabled':''}>← Trước</button>Trang ${d.page}/${Math.max(1,Math.ceil(d.total/d.pageSize))}<button class="btn" data-audit-page="${d.page+1}" ${d.page*d.pageSize>=d.total?'disabled':''}>Tiếp →</button></div>`;
}
function showModal(title,body,footer=''){$('#modal').innerHTML=`<div class="modal-head"><h3>${esc(title)}</h3><button class="btn icon-button" data-close="1" aria-label="Đóng">×</button></div>${body}${footer}`;$('#modal-layer').classList.remove('hidden');$('#modal-layer').setAttribute('aria-hidden','false');}
function closeModal(){$('#modal-layer').classList.add('hidden');$('#modal-layer').setAttribute('aria-hidden','true');$('#modal').innerHTML='';state.usedPerson=null;}
const modalFoot=(label='Lưu hồ sơ')=>`<div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="submit" class="btn btn-primary" data-submit-btn="1">${label}</button></div>`;
const field=(label,name,value='',type='text',extra='')=>`<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><input id="f-${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const selectField=(label,name,inner)=>`<div class="field"><label for="f-${esc(name)}">${esc(label)}</label><select id="f-${esc(name)}" name="${esc(name)}">${inner}</select></div>`;
function activeCatOptions(type,current){const id={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type],name={truong:'TEN_TRUONG',nghe:'TEN_NGHE',lydo:'NOI_DUNG'}[type];return option('','-- Chọn --',current)+state.cats[type].filter(x=>x.TRANG_THAI==='ACTIVE'||x[id]===current).map(x=>option(x[id],x[name],current)).join('');}
function recordForm(r){
  const edit=Boolean(r),x=r||{};
  state.usedPerson=null;
  const form=`<form id="record-form" class="form-grid" data-edit="${edit?'yes':'no'}">
  <input type="hidden" name="HO_SO_ID" value="${esc(x.HO_SO_ID||'')}"><input type="hidden" name="NGUOI_HOC_ID" value="${esc(x.NGUOI_HOC_ID||'')}"><input type="hidden" name="PHIEN_BAN" value="${esc(x.PHIEN_BAN||'')}">
  ${!edit?`<div class="full info-banner">Một người có thể có nhiều hồ sơ. Nếu đã có hồ sơ trước, tìm và chọn mã người học để liên kết (không tự gộp chỉ vì trùng họ tên).<div class="field" style="margin-top:10px"><label>Tìm người học đã có</label><div class="page-actions"><input id="person-query" placeholder="Tên hoặc mã người học" style="flex:1;border:1px solid #cbdcea;border-radius:9px;padding:9px"><button class="btn" type="button" id="find-person">Tìm</button></div></div><div id="person-results" class="person-results"></div><div id="selected-person" class="small muted"></div></div>`:`<div class="full info-banner">Mã hồ sơ: ${esc(x.HO_SO_ID)} · Mã người học: ${esc(x.NGUOI_HOC_ID)} · Phiên bản ${esc(x.PHIEN_BAN)}</div>`}
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
  ${selectField('Tình trạng tham gia *','TRANG_THAI_THAM_GIA',Object.entries(STATUS).map(([k,v])=>option(k,v,x.TRANG_THAI_THAM_GIA||'CHO_XAC_NHAN')).join(''))}
  <div class="field"><label>Đã bỏ học?</label><select name="DA_BO_HOC">${option('FALSE','Không',x.DA_BO_HOC||'FALSE')}${option('TRUE','Có',x.DA_BO_HOC)}</select></div>
  ${field('Ngày bỏ học','NGAY_BO_HOC',x.NGAY_BO_HOC||'','date')}
  ${selectField('Lý do bỏ học','LY_DO_BO_HOC_ID',activeCatOptions('lydo',x.LY_DO_BO_HOC_ID))}
  <div class="field full"><label>Ghi chú</label><textarea name="GHI_CHU" maxlength="1500">${esc(x.GHI_CHU||'')}</textarea></div>
  <div class="full form-hint">Số quyết định được nhập theo văn bản đã ban hành. 02 của năm 2026 khác 02 của năm 2027; trong cùng một năm, 2/02/002 được coi là trùng.</div>
  ${modalFoot(edit?'Lưu thay đổi':'Tạo hồ sơ')}</form>`;
  showModal(edit?'Chỉnh sửa hồ sơ học nghề':'Thêm hồ sơ học nghề',form);
}
function statusForm(r){showModal('Cập nhật tình trạng học nghề',`<form id="status-form" class="form-grid"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="full info-banner">${esc(r.HO_TEN)} · Quyết định ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}</div>${selectField('Tình trạng tham gia','TRANG_THAI_THAM_GIA',Object.entries(STATUS).map(([k,v])=>option(k,v,r.TRANG_THAI_THAM_GIA)).join(''))}<div class="field"><label>Đã bỏ học</label><select name="DA_BO_HOC">${option('FALSE','Không',r.DA_BO_HOC)}${option('TRUE','Có',r.DA_BO_HOC)}</select></div>${field('Ngày bỏ học','NGAY_BO_HOC',r.NGAY_BO_HOC||'','date')}${selectField('Lý do bỏ học','LY_DO_BO_HOC_ID',activeCatOptions('lydo',r.LY_DO_BO_HOC_ID))}${modalFoot('Cập nhật tình trạng')}</form>`);}
function catalogForm(item){const type=state.catalogType,def={truong:['TRUONG_ID','MA_TRUONG','TEN_TRUONG'],nghe:['NGHE_ID','MA_NGHE','TEN_NGHE'],lydo:['LY_DO_ID','MA_LY_DO','NOI_DUNG']}[type],x=item||{};
  showModal((item?'Sửa':'Thêm')+' '+NAMES[type].toLowerCase(),`<form id="catalog-form" class="form-grid"><input type="hidden" name="id" value="${esc(x[def[0]])}"><input type="hidden" name="type" value="${type}">${item?field('Mã danh mục (không thể thay đổi)','code',x[def[1]]||'','text','readonly'):''}${field('Tên / Nội dung *','title',x[def[2]]||'','text','required maxlength="250"')}${type==='truong'?`${field('Tên viết tắt','shortName',x.TEN_VIET_TAT||'')}${field('Địa chỉ','address',x.DIA_CHI||'')}`:''}${type==='truong'?'':field('Thứ tự','order',x.THU_TU||0,'number')}${selectField('Trạng thái','status',option('ACTIVE','Đang sử dụng',x.TRANG_THAI||'ACTIVE')+option('INACTIVE','Ngừng sử dụng',x.TRANG_THAI))}<div class="field full"><label>Ghi chú</label><textarea name="note">${esc(x.GHI_CHU||'')}</textarea></div><div class="full form-hint">${item?'Mã danh mục đã cấp được giữ nguyên để bảo vệ hồ sơ liên kết.':'Hệ thống sẽ tự tạo mã sau khi lưu.'}</div>${modalFoot('Lưu danh mục')}</form>`);
}
function bulkCatalogForm(){
  showModal('Nhập danh mục hàng loạt',`<form id="bulk-catalog-form" class="form-grid"><div class="field full"><label>Loại danh mục</label><select name="type">${Object.entries(NAMES).map(([t,n])=>option(t,n,state.catalogType)).join('')}</select></div><div class="field full"><label>Danh sách tên, mỗi dòng một mục *</label><textarea name="names" rows="10" required placeholder="Dán danh sách tên vào đây, mỗi tên trên một dòng."></textarea><label class="small muted" for="bulk-csv">Hoặc chọn tệp CSV/TXT (một cột tên)</label><input type="file" id="bulk-csv" accept=".csv,.txt,text/csv,text/plain"></div><div class="full info-banner">Bạn có thể sao chép nhiều dòng từ bảng tính hoặc văn bản và dán vào đây. Hệ thống kiểm tra trùng trước khi nhập; không sửa hoặc xóa các mục đã có.</div><div id="bulk-review" class="full muted" aria-live="polite">Vui lòng kiểm tra danh sách trước khi nhập.</div><div class="modal-foot full"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-light" data-bulk-check="1">Kiểm tra danh sách</button><button type="submit" class="btn btn-primary" data-submit-btn="1" id="bulk-import-submit" disabled>Xác nhận nhập</button></div></form>`);
}
function bulkNames(form){return form.elements.names.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function deleteRecordForm(r){showModal('Xác nhận xóa hồ sơ',`<div class="info-banner"><b>${esc(r.HO_TEN)}</b><div>Quyết định số ${esc(r.SO_QUYET_DINH)} năm ${esc(r.NAM_QUYET_DINH)}</div></div><p>Hồ sơ sẽ được chuyển vào danh sách đã xóa, không còn hiển thị trong thống kê hoạt động. Số quyết định vẫn được giữ để tránh sử dụng trùng.</p><div class="modal-foot"><button type="button" class="btn" data-close="1">Hủy</button><button type="button" class="btn btn-danger" data-confirm-delete="${esc(r.HO_SO_ID)}" data-submit-btn="1">Xác nhận xóa</button></div>`);}
function canDeleteRecord(r){return allowed('RECORD_DELETE')&&(state.user?.VAI_TRO==='ADMIN'||(r.TAO_BOI&&r.TAO_BOI.trim().toLowerCase()===state.user?.EMAIL?.trim().toLowerCase()));}
function accountForm(item){const x=item||{},rights=(x.QUYEN||'').split(',');showModal(item?'Sửa tài khoản':'Thêm tài khoản',`<form id="account-form" class="form-grid"><input type="hidden" name="id" value="${esc(x.TAI_KHOAN_ID||'')}">${field('Email Google *','email',x.EMAIL||'','email','required')}${field('Họ tên','name',x.HO_TEN||'')}${selectField('Vai trò','role',option('NHAN_VIEN','Nhân viên',x.VAI_TRO||'NHAN_VIEN')+option('ADMIN','Quản trị viên',x.VAI_TRO))}${selectField('Trạng thái','status',option('ACTIVE','Hoạt động',x.TRANG_THAI||'ACTIVE')+option('DISABLED','Khóa',x.TRANG_THAI))}<div class="field full"><label>Các quyền của nhân viên (Admin có toàn quyền)</label><div class="rights">${Object.entries(RIGHTS).map(([p,n])=>`<label><input type="checkbox" name="permission" value="${esc(p)}" ${rights.includes(p)?'checked':''}>${esc(n)}</label>`).join('')}</div></div>${modalFoot('Lưu tài khoản')}</form>`);}
function fileModal(r){showModal('Tệp đính kèm của hồ sơ',`<div class="info-banner">${esc(r.HO_TEN)} · QĐ ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}<div>Chỉ chấp nhận PDF, JPG, PNG; tối đa 10 MB mỗi tệp.</div></div><form id="file-form" class="form-grid"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="field full"><label>Chọn tệp</label><input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg" required></div><div class="full" id="upload-progress" aria-live="polite"></div>${modalFoot('Tải lên')}</form>${r.HAS_FILE?`<div class="modal-file-actions">${allowed('FILE_VIEW')?`<button class="btn" data-file-get="${esc(r.HO_SO_ID)}">Tải tệp hiện tại</button>`:''}<button class="btn btn-danger" data-file-remove="${esc(r.HO_SO_ID)}">Gỡ tệp hiện tại</button></div>`:''}`);}
function getCurrentRecord(id){return state.records.find(x=>x.HO_SO_ID===id);}
async function refreshBootstrap(){const b=await rpc('bootstrap',{}, {ttl:0});state.user=b.user;state.cats=b.catalogs;}
async function afterMutation(page=state.page){closeModal();await refreshBootstrap();navigate(page);}
function csvCell(x){const str=String(x??'');const secure=/^[\s]*[=+\-@\t\r]/.test(str)?"'"+str:str;return '"'+secure.replace(/"/g,'""')+'"';}
function downloadCsv(name,rows){const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function exportReport(filters){const d=await rpc('report_export',filters,{ttl:30000});downloadCsv('bao-cao-hoc-nghe-'+new Date().toISOString().slice(0,10)+'.csv',[d.columns,...d.items]);notify('Đã xuất '+num(d.items.length)+' hồ sơ.');}
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
const serialized=async(fn)=>{if(state.busy)return;state.busy=true;document.querySelectorAll('[data-submit-btn]').forEach(x=>x.disabled=true);try{await fn();}catch(e){failure(e);}finally{state.busy=false;document.querySelectorAll('[data-submit-btn]').forEach(x=>{x.disabled=(x.id==='bulk-import-submit' && $('#bulk-catalog-form')?.dataset.ready!=='yes');});}};
// Delegated buttons: no inline user-controlled event handlers.
document.addEventListener('click',async e=>{
  const node=e.target.closest('button');if(!node)return;
  if(node.hasAttribute('data-close')){if(!state.busy)closeModal();return;}
  if(node.hasAttribute('data-nav')){navigate(node.dataset.nav);return;}
  if(node.hasAttribute('data-retry')){navigate(state.page);return;}
  if(node.hasAttribute('data-new-record')){recordForm(null);return;}
  if(node.hasAttribute('data-edit-record')){const r=getCurrentRecord(node.dataset.editRecord);if(r)recordForm(r);return;}
  if(node.hasAttribute('data-delete-record')){const r=getCurrentRecord(node.dataset.deleteRecord);if(r&&canDeleteRecord(r))deleteRecordForm(r);return;}
  if(node.hasAttribute('data-confirm-delete')){const r=getCurrentRecord(node.dataset.confirmDelete);if(!r)return;await serialized(async()=>{await rpc('record_delete',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN},{mutate:true});notify('Đã chuyển hồ sơ vào danh sách đã xóa.');await afterMutation('records');});return;}
  if(node.hasAttribute('data-status-record')){const r=getCurrentRecord(node.dataset.statusRecord);if(r)statusForm(r);return;}
  if(node.hasAttribute('data-file-modal')){const r=getCurrentRecord(node.dataset.fileModal);if(r)fileModal(r);return;}
  if(node.hasAttribute('data-file-get')){try{await getFile(node.dataset.fileGet);}catch(err){failure(err);}return;}
  if(node.hasAttribute('data-page')){state.recordPage=Number(node.dataset.page);navigate('records');return;}
  if(node.hasAttribute('data-audit-page')){state.auditPage=Number(node.dataset.auditPage);navigate('audits');return;}
  if(node.hasAttribute('data-cat-tab')){state.catalogType=node.dataset.catTab;navigate('catalogs');return;}
  if(node.hasAttribute('data-bulk-catalog')){bulkCatalogForm();return;}
  if(node.hasAttribute('data-bulk-check')){const f=$('#bulk-catalog-form');if(!f)return;await serialized(async()=>{const names=bulkNames(f);if(!names.length||names.length>2000)throw Error('Vui lòng nhập từ 1 đến 2.000 tên.');const plan=await rpc('catalog_bulk_check',{type:f.elements.type.value,names},{ttl:0});$('#bulk-review').textContent=`${num(plan.valid)} tên hợp lệ · ${num(plan.duplicate)} tên trùng · ${num(plan.invalid)} tên không hợp lệ.`;f.dataset.ready=plan.invalid===0&&plan.valid>0?'yes':'no';$('#bulk-import-submit').disabled=f.dataset.ready!=='yes';f.dataset.verified=f.elements.type.value+'|'+f.elements.names.value;});return;}
  if(node.hasAttribute('data-new-catalog')){catalogForm(null);return;}
  if(node.hasAttribute('data-edit-catalog')){const type=state.catalogType,field={truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type];catalogForm(state.cats[type].find(x=>x[field]===node.dataset.editCatalog));return;}
  if(node.hasAttribute('data-new-account')){accountForm(null);return;}
  if(node.hasAttribute('data-edit-account')){accountForm(state.accountRows.find(x=>x.TAI_KHOAN_ID===node.dataset.editAccount));return;}
  if(node.hasAttribute('data-file-remove')){if(!confirm('Gỡ tệp đính kèm của hồ sơ?'))return;const r=getCurrentRecord(node.dataset.fileRemove);if(!r)return;await serialized(async()=>{await rpc('file_remove',{HO_SO_ID:r.HO_SO_ID,PHIEN_BAN:r.PHIEN_BAN},{mutate:true});notify('Đã gỡ tệp.');await afterMutation('records');});return;}
  if(node.hasAttribute('data-export-list')){try{await exportReport(state.filters);}catch(err){failure(err);}return;}
  if(node.id==='print-report'){window.print();return;}
  if(node.id==='report-export'){try{await exportReport(state.reportFilters);}catch(err){failure(err);}return;}
  if(node.id==='find-person'){
    const q=$('#person-query')?.value||'';try{const data=await rpc('person_lookup',{query:q},{ttl:30000});$('#person-results').innerHTML=data.items.length?data.items.map(x=>`<button class="person-item" data-select-person="${esc(x.NGUOI_HOC_ID)}" data-person-name="${esc(x.HO_TEN)}" data-person-birth="${esc(x.NGAY_SINH)}" data-person-sex="${esc(x.GIOI_TINH)}" type="button">${esc(x.HO_TEN)} · ${esc(x.NGAY_SINH||'Không rõ ngày sinh')} <small>${esc(x.NGUOI_HOC_ID)}</small></button>`).join(''):'<p class="small muted">Không có người học phù hợp. Có thể tạo mã người học mới.</p>'; }catch(err){failure(err);}return;
  }
  if(node.hasAttribute('data-select-person')){const f=$('#record-form');if(!f)return;f.elements.NGUOI_HOC_ID.value=node.dataset.selectPerson;f.elements.HO_TEN.value=node.dataset.personName;f.elements.NGAY_SINH.value=node.dataset.personBirth;f.elements.GIOI_TINH.value=node.dataset.personSex;$('#selected-person').textContent='Đã chọn mã người học: '+node.dataset.selectPerson;$('#person-results').innerHTML='';return;}
});
document.addEventListener('change',async e=>{if(e.target.id==='bulk-csv'&&e.target.files?.[0]){const file=e.target.files[0];if(file.size>300000) {failure(Error('Tệp danh sách quá lớn. Vui lòng dùng tệp dưới 300 KB.'));return;}const f=$('#bulk-catalog-form');if(f){f.elements.names.value=await file.text();f.dataset.ready='no';f.dataset.verified='';$('#bulk-import-submit').disabled=true;}}});
document.addEventListener('input',e=>{if(e.target.id==='catalog-search'){const text=e.target.value.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'');document.querySelectorAll('.catalog-data-row').forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(text);});}const form=e.target.closest('#bulk-catalog-form');if(form){form.dataset.verified='';form.dataset.ready='no';const btn=$('#bulk-import-submit');if(btn)btn.disabled=true;}});
document.addEventListener('change',e=>{if(e.target.name==='NGAY_QUYET_DINH'&&$('#preview-year'))$('#preview-year').value=e.target.value?.slice(0,4)||'Tự lấy từ ngày quyết định';});
document.addEventListener('submit',e=>{
  const form=e.target;if(!form.id)return;e.preventDefault();
  if(form.id==='records-filters'){state.filters=getFormFields(form);state.recordPage=1;navigate('records');return;}
  if(form.id==='dashboard-filters'){state.reportFilters=getFormFields(form);navigate(state.page);return;}
  if(form.id==='record-form'){serialized(async()=>{let p=getFormFields(form);p.DA_BO_HOC=p.DA_BO_HOC==='TRUE';const d=await rpc('record_save',p,{mutate:true});notify('Đã lưu hồ sơ '+d.record.SO_QUYET_DINH+'/'+d.record.NAM_QUYET_DINH);await afterMutation('records');});return;}
  if(form.id==='status-form'){serialized(async()=>{let p=getFormFields(form);p.DA_BO_HOC=p.DA_BO_HOC==='TRUE';await rpc('record_status',p,{mutate:true});notify('Đã cập nhật tình trạng.');await afterMutation('records');});return;}
  if(form.id==='catalog-form'){serialized(async()=>{await rpc('catalog_save',getFormFields(form),{mutate:true});notify('Đã lưu danh mục.');await afterMutation('catalogs');});return;}
  if(form.id==='account-form'){serialized(async()=>{const p=getFormFields(form);p.permissions=Array.from(form.querySelectorAll('input[name="permission"]:checked')).map(x=>x.value).join(',');await rpc('account_save',p,{mutate:true});notify('Đã lưu tài khoản.');await afterMutation('accounts');});return;}
  if(form.id==='bulk-catalog-form'){serialized(async()=>{
    if(form.dataset.ready!=='yes'||form.dataset.verified!==form.elements.type.value+'|'+form.elements.names.value)throw Error('Danh sách đã thay đổi. Vui lòng bấm Kiểm tra danh sách trước khi nhập.');
    const names=bulkNames(form);let added=0,skipped=0;
    for(let i=0;i<names.length;i+=100){const part=await rpc('catalog_bulk_import',{type:form.elements.type.value,names:names.slice(i,i+100)},{mutate:true});added+=part.added;skipped+=part.skipped;const target=$('#bulk-review');if(target)target.textContent=`Đã nhập ${num(added)} mục; bỏ qua ${num(skipped)} mục trùng. Đang xử lý ${Math.min(names.length,i+100)}/${names.length}...`;}
    notify(`Đã thêm ${num(added)} mục. Bỏ qua ${num(skipped)} mục trùng.`);await afterMutation('catalogs');
  });return;}
  if(form.id==='file-form'){serialized(async()=>{
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
export const tests = {esc,dateVN,STATUS,RIGHTS,csvCell};

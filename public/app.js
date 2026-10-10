/** THEO DÕI HỌC NGHỀ — v1.0.0-RC. Không lưu token/PII vào localStorage. */
const $ = (s, root = document) => root.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dataAttr = esc;
const num = value => Number(value || 0).toLocaleString('vi-VN');
const option = (value, label, selected = '') => `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
const dateVN = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : (d || '—');
const STATUS = { CHO_XAC_NHAN:'Chưa xác nhận', DA_THAM_GIA:'Đã tham gia', KHONG_THAM_GIA:'Không tham gia' };
const RIGHTS = { RECORD_VIEW:'Xem hồ sơ', RECORD_CREATE:'Thêm hồ sơ', RECORD_EDIT:'Sửa hồ sơ', RECORD_STATUS:'Cập nhật tình trạng', REPORT_VIEW:'Xem báo cáo', CATALOG_MANAGE:'Quản lý danh mục', ACCOUNT_MANAGE:'Quản lý tài khoản', AUDIT_VIEW:'Xem nhật ký', FILE_VIEW:'Xem tệp', FILE_UPLOAD:'Tải lên/xóa tệp' };
const NAMES = { truong:'Cơ sở đào tạo', nghe:'Nghề đào tạo', lydo:'Lý do bỏ học' };
const state = {
  token:'', clientId:'', user:null, cats:{truong:[],nghe:[],lydo:[]}, page:'dashboard', routeVersion:0,
  filters:{year:'',truong:'',nghe:'',status:'',dropout:'',query:''},
  reportFilters:{year:'',truong:'',nghe:''},
  records:[], recordPage:1, recordTotal:0, accountRows:[], auditPage:1, catalogType:'truong',
  cache:new Map(), inFlight:new Map(), generation:0, busy:false, usedPerson:null
};

function notify(message, error=false){ const el=$('#toast');el.textContent=String(message);el.className='toast show'+(error?' error':'');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),5500); }
function failure(e){notify(e?.message||'Có lỗi xảy ra.',true);}
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
    catch(e){throw Error('Không kết nối được máy chủ Vercel.');}
    let out;
    try{out=await res.json();}catch{throw Error('Máy chủ trả phản hồi không hợp lệ.');}
    if(!out.ok){if(out.error?.code==='LOGIN_EXPIRED'){signOut();}throw Error(out.error?.message || 'Thao tác không thành công.');}
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
    if(!cfg.ok||!cfg.clientId)throw Error('Chưa cấu hình GOOGLE_CLIENT_ID trên Vercel.');
    state.clientId=cfg.clientId;
    let tries=0;
    while(!window.google?.accounts?.id && tries++<80)await new Promise(r=>setTimeout(r,150));
    if(!window.google?.accounts?.id)throw Error('Không tải được Google Identity Services.');
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
  $('#main').innerHTML=heading('Tổng quan học nghề','Thống kê hồ sơ theo quyết định và tình trạng tham gia.')+filterFields(f,'dashboard')+'<div id="dashboard-output" class="spinner">Đang tổng hợp số liệu…</div>';
  const data=await rpc('overview',f,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  const tiles=[['Tổng hồ sơ','▤',k.total],['Đã tham gia','✓',k.participated],['Đang học','✎',k.learning],['Bỏ học','↘',k.dropout],['Không tham gia','×',k.notParticipating],['Chưa xác nhận','◷',k.pending]];
  const boxStats=(title,values,type)=>{
    const rows=Object.entries(values).sort((a,b)=>b[1]-a[1]),max=Math.max(...rows.map(r=>r[1]),1);
    return `<section class="card"><h3>${title}</h3>${rows.length?rows.slice(0,12).map(([id,n])=>`<div class="stat-row"><div style="flex:1">${esc(lookup(type,id))}<div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,Math.round(n/max*100))}%"></div></div></div><b>${num(n)}</b></div>`).join(''):'<p class="muted">Chưa có dữ liệu.</p>'}</section>`;
  };
  $('#dashboard-output').className='';
  $('#dashboard-output').innerHTML=`<div class="kpi-grid">${tiles.map(([label,glyph,n])=>`<div class="kpi"><div class="kpi-icon">${glyph}</div><div class="metric">${num(n)}</div><div class="desc">${label}</div></div>`).join('')}</div><div class="sub-grid">${boxStats('Theo cơ sở đào tạo',data.schoolCounts,'truong')}${boxStats('Theo nghề đào tạo',data.tradeCounts,'nghe')}</div>`;
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
  $('#list-output').innerHTML=`<table><thead><tr><th>Ngày QĐ</th><th>Số QĐ</th><th>Người học</th><th>Cơ sở đào tạo</th><th>Nghề</th><th>Tình trạng</th><th>Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(r=>`<tr><td class="nowrap">${esc(dateVN(r.NGAY_QUYET_DINH))}</td><td><b>${esc(r.SO_QUYET_DINH)}</b><div class="muted small">Năm ${esc(r.NAM_QUYET_DINH)}</div></td><td>${esc(r.HO_TEN)}<div class="muted small">${esc(r.NGUOI_HOC_ID)}</div></td><td>${esc(lookup('truong',r.TRUONG_ID))}</td><td>${esc(lookup('nghe',r.NGHE_ID))}</td><td>${pillStatus(r)}</td><td><div class="table-actions">${allowed('RECORD_EDIT')?`<button class="btn" data-edit-record="${dataAttr(r.HO_SO_ID)}">Sửa</button>`:''}${allowed('RECORD_STATUS')?`<button class="btn" data-status-record="${dataAttr(r.HO_SO_ID)}">Tình trạng</button>`:''}${r.HAS_FILE&&allowed('FILE_VIEW')?`<button class="btn" data-file-get="${dataAttr(r.HO_SO_ID)}">Tệp</button>`:''}${allowed('FILE_UPLOAD')?`<button class="btn" data-file-modal="${dataAttr(r.HO_SO_ID)}">Đính kèm</button>`:''}</div></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Không có hồ sơ phù hợp.</td></tr>'}</tbody></table>`;
  const totalPages=Math.max(1,Math.ceil(data.total/20));
  $('#list-pages').innerHTML=`<div class="pagination"><button class="btn" data-page="${data.page-1}" ${data.page<=1?'disabled':''}>← Trước</button>Trang ${data.page}/${totalPages}<button class="btn" data-page="${data.page+1}" ${data.page>=totalPages?'disabled':''}>Tiếp →</button></div>`;
}
async function renderReports(v){
  $('#main').innerHTML=heading('Báo cáo học nghề','Tổng hợp theo năm, cơ sở và nghề; xuất hồ sơ tối đa 5.000 bản ghi/lần.',`<button class="btn btn-primary" id="report-export">Xuất CSV</button><button class="btn" id="print-report">In báo cáo</button>`)+filterFields(state.reportFilters,'dashboard')+'<div id="report-output" class="spinner">Đang tải thống kê…</div>';
  const data=await rpc('overview',state.reportFilters,{ttl:90000});if(v!==state.routeVersion)return;
  const k=data.kpi;
  $('#report-output').innerHTML=`<div class="card"><h3>Tổng hợp kết quả</h3><div class="info-banner">Tính theo số hồ sơ/quyết định, không phải số người học duy nhất. “Đang học” = đã tham gia và chưa bỏ học.</div><div class="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th>Số lượng</th></tr></thead><tbody>${[['Tổng số hồ sơ',k.total],['Đã tham gia',k.participated],['Đang học',k.learning],['Bỏ học',k.dropout],['Không tham gia',k.notParticipating],['Chưa xác nhận',k.pending]].map(r=>`<tr><td>${r[0]}</td><td><b>${num(r[1])}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}
async function renderCatalogs(v){
  const canEdit=allowed('CATALOG_MANAGE');
  $('#main').innerHTML=heading('Danh mục học nghề','Trường/cơ sở đào tạo, nghề và lý do bỏ học.',canEdit?'<button class="btn btn-primary" data-new-catalog="1">＋ Thêm danh mục</button>':'')+
  `<div class="tabs">${Object.entries(NAMES).map(([type,name])=>`<button class="btn ${state.catalogType===type?'active':''}" data-cat-tab="${type}">${name}</button>`).join('')}</div><div id="cats-view"></div>`;
  await loadCatalogs(v);
}
async function loadCatalogs(v){
  const type=state.catalogType,data=await rpc('catalog_list',{type},{ttl:60000});if(v!==state.routeVersion)return;
  state.cats[type]=data.items;
  const def={truong:['MA_TRUONG','TEN_TRUONG'],nghe:['MA_NGHE','TEN_NGHE'],lydo:['MA_LY_DO','NOI_DUNG']}[type];
  $('#cats-view').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Mã</th><th>Tên / Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.length?data.items.map(r=>`<tr><td>${esc(r[def[0]])}</td><td>${esc(r[def[1]])}</td><td><span class="pill ${r.TRANG_THAI==='ACTIVE'?'good':'warn'}">${r.TRANG_THAI==='ACTIVE'?'Đang sử dụng':'Ngừng sử dụng'}</span></td><td>${allowed('CATALOG_MANAGE')?`<button class="btn" data-edit-catalog="${dataAttr(r[{truong:'TRUONG_ID',nghe:'NGHE_ID',lydo:'LY_DO_ID'}[type]])}">Sửa</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">Chưa có danh mục. Quản trị viên hãy tạo trước khi nhập hồ sơ.</td></tr>'}</tbody></table></div>`;
}
async function renderAccounts(v){
  $('#main').innerHTML=heading('Quản lý tài khoản','Cấp quyền riêng cho phần mềm Học nghề.','<button class="btn btn-primary" data-new-account="1">＋ Thêm tài khoản</button>')+'<div id="accounts-output" class="spinner">Đang tải…</div>';
  const data=await rpc('accounts_list',{}, {ttl:30000});if(v!==state.routeVersion)return;state.accountRows=data.items;
  $('#accounts-output').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.items.map(x=>`<tr><td>${esc(x.HO_TEN)}</td><td>${esc(x.EMAIL)}</td><td>${x.VAI_TRO==='ADMIN'?'Quản trị viên':'Nhân viên'}</td><td><span class="pill ${x.TRANG_THAI==='ACTIVE'?'good':'bad'}">${x.TRANG_THAI==='ACTIVE'?'Hoạt động':'Khóa'}</span></td><td><button class="btn" data-edit-account="${esc(x.TAI_KHOAN_ID)}">Sửa</button></td></tr>`).join('')}</tbody></table></div>`;
}
async function renderAudits(v){
  $('#main').innerHTML=heading('Nhật ký thay đổi','Tra cứu hoạt động chỉnh sửa hồ sơ, danh mục và tài khoản.')+'<div id="audit-output" class="spinner">Đang tải nhật ký…</div>';
  const d=await rpc('audit_list',{page:state.auditPage},{ttl:30000});if(v!==state.routeVersion)return;
  $('#audit-output').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th><th>Loại</th><th>Mã bản ghi</th></tr></thead><tbody>${d.items.length?d.items.map(x=>`<tr><td class="nowrap">${esc(x.THOI_GIAN)}</td><td>${esc(x.EMAIL)}</td><td>${esc(x.HANH_DONG)}</td><td>${esc(x.LOAI_DOI_TUONG)}</td><td>${esc(x.BAN_GHI_ID)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">Chưa có nhật ký.</td></tr>'}</tbody></table></div><div class="pagination"><button class="btn" data-audit-page="${d.page-1}" ${d.page===1?'disabled':''}>← Trước</button>Trang ${d.page}/${Math.max(1,Math.ceil(d.total/d.pageSize))}<button class="btn" data-audit-page="${d.page+1}" ${d.page*d.pageSize>=d.total?'disabled':''}>Tiếp →</button></div>`;
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
  showModal((item?'Sửa':'Thêm')+' '+NAMES[type].toLowerCase(),`<form id="catalog-form" class="form-grid"><input type="hidden" name="id" value="${esc(x[def[0]])}"><input type="hidden" name="type" value="${type}">${field('Mã *','code',x[def[1]]||'','text','required pattern="[A-Za-z0-9_-]{2,60}"')}${field('Tên / Nội dung *','title',x[def[2]]||'','text','required')}${type==='truong'?`${field('Tên viết tắt','shortName',x.TEN_VIET_TAT||'')}${field('Địa chỉ','address',x.DIA_CHI||'')}`:''}${type==='truong'?'':field('Thứ tự','order',x.THU_TU||0,'number')}${selectField('Trạng thái','status',option('ACTIVE','Đang sử dụng',x.TRANG_THAI||'ACTIVE')+option('INACTIVE','Ngừng sử dụng',x.TRANG_THAI))}<div class="field full"><label>Ghi chú</label><textarea name="note">${esc(x.GHI_CHU||'')}</textarea></div>${modalFoot('Lưu danh mục')}</form>`);
}
function accountForm(item){const x=item||{},rights=(x.QUYEN||'').split(',');showModal(item?'Sửa tài khoản':'Thêm tài khoản',`<form id="account-form" class="form-grid"><input type="hidden" name="id" value="${esc(x.TAI_KHOAN_ID||'')}">${field('Email Google *','email',x.EMAIL||'','email','required')}${field('Họ tên','name',x.HO_TEN||'')}${selectField('Vai trò','role',option('NHAN_VIEN','Nhân viên',x.VAI_TRO||'NHAN_VIEN')+option('ADMIN','Quản trị viên',x.VAI_TRO))}${selectField('Trạng thái','status',option('ACTIVE','Hoạt động',x.TRANG_THAI||'ACTIVE')+option('DISABLED','Khóa',x.TRANG_THAI))}<div class="field full"><label>Các quyền của nhân viên (Admin có toàn quyền)</label><div class="rights">${Object.entries(RIGHTS).map(([p,n])=>`<label><input type="checkbox" name="permission" value="${esc(p)}" ${rights.includes(p)?'checked':''}>${esc(n)}</label>`).join('')}</div></div>${modalFoot('Lưu tài khoản')}</form>`);}
function fileModal(r){showModal('Tệp đính kèm của hồ sơ',`<div class="info-banner">${esc(r.HO_TEN)} · QĐ ${esc(r.SO_QUYET_DINH)}/${esc(r.NAM_QUYET_DINH)}<br/>Chỉ chấp nhận PDF/JPG/PNG, tối đa 1,2 MB, lưu riêng trong Google Drive.</div><form id="file-form" class="form-grid"><input type="hidden" name="HO_SO_ID" value="${esc(r.HO_SO_ID)}"><input type="hidden" name="PHIEN_BAN" value="${esc(r.PHIEN_BAN)}"><div class="field full"><label>Chọn tệp</label><input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg" required></div>${modalFoot('Tải lên')}</form>${r.HAS_FILE?`<div style="margin-top:12px"><button class="btn btn-danger" data-file-remove="${esc(r.HO_SO_ID)}">Gỡ tệp hiện tại</button></div>`:''}`);}
function getCurrentRecord(id){return state.records.find(x=>x.HO_SO_ID===id);}
async function refreshBootstrap(){const b=await rpc('bootstrap',{}, {ttl:0});state.user=b.user;state.cats=b.catalogs;}
async function afterMutation(page=state.page){closeModal();await refreshBootstrap();navigate(page);}
function csvCell(x){const str=String(x??'');const secure=/^[\s]*[=+\-@\t\r]/.test(str)?"'"+str:str;return '"'+secure.replace(/"/g,'""')+'"';}
function downloadCsv(name,rows){const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function exportReport(filters){const d=await rpc('report_export',filters,{ttl:30000});downloadCsv('bao-cao-hoc-nghe-'+new Date().toISOString().slice(0,10)+'.csv',[d.columns,...d.items]);notify('Đã xuất '+num(d.items.length)+' hồ sơ.');}
async function getFile(id){const d=await rpc('file_get',{HO_SO_ID:id},{ttl:0});const bin=atob(d.base64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:d.mime}));const a=document.createElement('a');a.href=url;a.download=d.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
const serialized=async(fn)=>{if(state.busy)return;state.busy=true;document.querySelectorAll('[data-submit-btn]').forEach(x=>x.disabled=true);try{await fn();}catch(e){failure(e);}finally{state.busy=false;document.querySelectorAll('[data-submit-btn]').forEach(x=>x.disabled=false);}};
// Delegated buttons: no inline user-controlled event handlers.
document.addEventListener('click',async e=>{
  const node=e.target.closest('button');if(!node)return;
  if(node.hasAttribute('data-close')){closeModal();return;}
  if(node.hasAttribute('data-nav')){navigate(node.dataset.nav);return;}
  if(node.hasAttribute('data-retry')){navigate(state.page);return;}
  if(node.hasAttribute('data-new-record')){recordForm(null);return;}
  if(node.hasAttribute('data-edit-record')){const r=getCurrentRecord(node.dataset.editRecord);if(r)recordForm(r);return;}
  if(node.hasAttribute('data-status-record')){const r=getCurrentRecord(node.dataset.statusRecord);if(r)statusForm(r);return;}
  if(node.hasAttribute('data-file-modal')){const r=getCurrentRecord(node.dataset.fileModal);if(r)fileModal(r);return;}
  if(node.hasAttribute('data-file-get')){try{await getFile(node.dataset.fileGet);}catch(err){failure(err);}return;}
  if(node.hasAttribute('data-page')){state.recordPage=Number(node.dataset.page);navigate('records');return;}
  if(node.hasAttribute('data-audit-page')){state.auditPage=Number(node.dataset.auditPage);navigate('audits');return;}
  if(node.hasAttribute('data-cat-tab')){state.catalogType=node.dataset.catTab;navigate('catalogs');return;}
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
document.addEventListener('change',e=>{if(e.target.name==='NGAY_QUYET_DINH'&&$('#preview-year'))$('#preview-year').value=e.target.value?.slice(0,4)||'Tự lấy từ ngày quyết định';});
document.addEventListener('submit',e=>{
  const form=e.target;if(!form.id)return;e.preventDefault();
  if(form.id==='records-filters'){state.filters=getFormFields(form);state.recordPage=1;navigate('records');return;}
  if(form.id==='dashboard-filters'){state.reportFilters=getFormFields(form);navigate(state.page);return;}
  if(form.id==='record-form'){serialized(async()=>{let p=getFormFields(form);p.DA_BO_HOC=p.DA_BO_HOC==='TRUE';const d=await rpc('record_save',p,{mutate:true});notify('Đã lưu hồ sơ '+d.record.SO_QUYET_DINH+'/'+d.record.NAM_QUYET_DINH);await afterMutation('records');});return;}
  if(form.id==='status-form'){serialized(async()=>{let p=getFormFields(form);p.DA_BO_HOC=p.DA_BO_HOC==='TRUE';await rpc('record_status',p,{mutate:true});notify('Đã cập nhật tình trạng.');await afterMutation('records');});return;}
  if(form.id==='catalog-form'){serialized(async()=>{await rpc('catalog_save',getFormFields(form),{mutate:true});notify('Đã lưu danh mục.');await afterMutation('catalogs');});return;}
  if(form.id==='account-form'){serialized(async()=>{const p=getFormFields(form);p.permissions=Array.from(form.querySelectorAll('input[name="permission"]:checked')).map(x=>x.value).join(',');await rpc('account_save',p,{mutate:true});notify('Đã lưu tài khoản.');await afterMutation('accounts');});return;}
  if(form.id==='file-form'){serialized(async()=>{
    const file=form.elements.file.files?.[0];if(!file)throw Error('Chưa chọn tệp.');if(file.size>1200000)throw Error('Tệp vượt giới hạn 1,2 MB.');
    if(!['application/pdf','image/jpeg','image/png'].includes(file.type))throw Error('Chỉ cho phép PDF, JPG, PNG.');
    const base64=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=()=>reject(Error('Không đọc được tệp.'));fr.onload=()=>resolve(String(fr.result).split(',')[1]);fr.readAsDataURL(file);});
    const p={HO_SO_ID:form.elements.HO_SO_ID.value,PHIEN_BAN:form.elements.PHIEN_BAN.value,name:file.name,mime:file.type,base64};
    await rpc('file_upload',p,{mutate:true});notify('Đã lưu tệp đính kèm.');await afterMutation('records');
  });return;}
});
$('#logout').addEventListener('click',signOut);
$('#menu-toggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#modal-layer').addEventListener('click',e=>{if(e.target.id==='modal-layer')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
initialize();

// Export for non-network unit tests only; no tokens/private data exported.
export const tests = {esc,dateVN,STATUS,RIGHTS,csvCell};

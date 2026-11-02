"""YC-HN-036/V6 Chromium mock: period dates, roles, completed filter and inline status update; no production calls."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=re.sub(r'<link rel="stylesheet" href="/styles\.css(?:\?[^" ]+)?"/>','<style>'+(root/'public/styles.css').read_text()+'</style>',html)
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
src=re.sub(r'^import .*\n','',(root/'public/app.js').read_text(),count=1)
src=re.sub(r'^export const tests = .*$', '',src,flags=re.MULTILINE)
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
  page=browser.new_page(viewport={'width':1560,'height':900})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''role=>{
    window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};
    window.mockCalls=[];
    window.db=[
      {HO_SO_ID:'HS_1',SO_QUYET_DINH:'701',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-09-03',HO_TEN:'Học viên A',TRUONG_ID:'S1',NGHE_ID:'N1',NGAY_BAT_DAU:'2026-09-01',NGAY_KET_THUC_DU_KIEN:'2027-02-28',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false},
      {HO_SO_ID:'HS_2',SO_QUYET_DINH:'702',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-09-02',HO_TEN:'Học viên B',TRUONG_ID:'S1',NGHE_ID:'N1',NGAY_BAT_DAU:'',NGAY_KET_THUC_DU_KIEN:'2026-12-31',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false},
      {HO_SO_ID:'HS_3',SO_QUYET_DINH:'703',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-09-01',HO_TEN:'Học viên C',TRUONG_ID:'S1',NGHE_ID:'N1',NGAY_BAT_DAU:'2026-02-29',NGAY_KET_THUC_DU_KIEN:'',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false},
      {HO_SO_ID:'HS_4',SO_QUYET_DINH:'704',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-08-30',HO_TEN:'Học viên D',TRUONG_ID:'S1',NGHE_ID:'N1',NGAY_BAT_DAU:'',NGAY_KET_THUC_DU_KIEN:'',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false},
      {HO_SO_ID:'HS_5',SO_QUYET_DINH:'705',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-08-29',HO_TEN:'Học viên E',TRUONG_ID:'S1',NGHE_ID:'N1',NGAY_BAT_DAU:'2026-03-01',NGAY_KET_THUC_DU_KIEN:'2026-08-31',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false},
      {HO_SO_ID:'HS_6',SO_QUYET_DINH:'706',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-08-28',HO_TEN:'Học viên F',TRUONG_ID:'S2',NGHE_ID:'N1',NGAY_BAT_DAU:'2026-01-01',NGAY_KET_THUC_DU_KIEN:'2026-06-30',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false}
    ];
    const user={TAI_KHOAN_ID:'U_'+role,EMAIL:role+'@example.test',HO_TEN:'Người thử',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'};
    const view=()=>window.db.filter(r=>role!=='CO_SO_DAO_TAO'||r.TRUONG_ID==='S1');
    window.fetch=async(url,options={})=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const req=JSON.parse(options.body),a=req.action,p=req.payload||{};window.mockCalls.push(a);let data={};
      if(a==='bootstrap')data={user,statuses:[],permissionRevision:'U1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',tradeScopeRevision:'T1',catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường A',TRANG_THAI:'ACTIVE'},{TRUONG_ID:'S2',TEN_TRUONG:'Trường B',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề A',TRANG_THAI:'ACTIVE'}],lydo:[]},tradeScopeMap:{S1:['N1'],S2:['N1']}};
      else if(a==='permission_check')data={user,permissionRevision:'U1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',tradeScopeRevision:'T1'};
      else if(a==='overview')data={kpi:{total:view().length,participated:1,dropout:0,notParticipating:0,pending:4,courseEndParticipated:1},statusCounts:{},schoolCounts:{},tradeCounts:{}};
      else if(a==='records_list'){
        let rows=view().filter(x=>!p.truong||x.TRUONG_ID===p.truong);
        if(p.status==='FILTER_COURSE_END_DATE')rows=rows.filter(x=>x.TRANG_THAI_THAM_GIA==='DA_THAM_GIA'&&x.DA_BO_HOC!=='TRUE'&&x.NGAY_KET_THUC_DU_KIEN);
        data={items:rows,total:rows.length,page:1,pageSize:20};
      }else if(a==='record_status'){
        const row=view().find(x=>x.HO_SO_ID===p.HO_SO_ID);
        if(!row)return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
        Object.assign(row,{TRANG_THAI_THAM_GIA:p.TRANG_THAI_THAM_GIA,DA_BO_HOC:'FALSE',PHIEN_BAN:'2'});data={record:{...row}};
      }
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const s=document.createElement("script");s.textContent=src;document.body.appendChild(s)}',src)
  page.wait_for_selector('.kpi',timeout=12000)
  page.locator('[data-nav="records"]').click()
  count=5 if role=='CO_SO_DAO_TAO' else 6
  page.wait_for_function('n=>document.querySelectorAll("#list-output tr[data-record-id]").length===n',arg=count,timeout=12000)
  headers=page.locator('#list-output thead th').all_inner_texts()
  assert headers==['Ngày QĐ','Số QĐ','Người học','Cơ sở đào tạo','Nghề','Thời gian đào tạo','Tình trạng','Thao tác'],(role,headers)
  assert page.locator('#list-output tr[data-record-id] td').count()==count*8
  cell=page.locator('[data-record-id="HS_1"] td.training-period-cell')
  assert 'Từ ngày: 01/09/2026' in ' '.join(cell.inner_text().split())
  assert 'Đến ngày: 28/02/2027' in ' '.join(cell.inner_text().split())
  assert 'Chưa có thông tin' in page.locator('[data-record-id="HS_2"] td.training-period-cell').inner_text()
  assert page.locator('[data-record-id="HS_3"] td.training-period-cell').inner_text().count('Chưa có thông tin')==2
  assert page.locator('[data-record-id="HS_4"] td.training-period-cell').inner_text().count('Chưa có thông tin')==2
  if role=='CO_SO_DAO_TAO':assert page.locator('[data-record-id="HS_6"]').count()==0
  initial_rpc=page.evaluate('window.mockCalls.filter(a=>a==="records_list").length')
  # Update status, ensure the status label changes but dates remain in their own cell.
  page.locator('[data-record-id="HS_1"] [data-status-record]').click()
  page.locator('#status-form [name="UI_TINH_TRANG"]').select_option('DA_THAM_GIA')
  page.locator('#status-form [data-submit-btn]').click()
  page.wait_for_function('document.querySelector("#modal-layer").classList.contains("hidden")',timeout=12000)
  assert 'Đã tham gia' in page.locator('[data-record-id="HS_1"] td.record-status-cell').inner_text(),role
  assert '01/09/2026' in page.locator('[data-record-id="HS_1"] td.training-period-cell').inner_text()
  assert page.evaluate('window.mockCalls.filter(a=>a==="records_list").length')==initial_rpc
  # Course-end filter is visually an 8-column list with only one end date and same action buttons.
  page.locator('#records-filters select[name="status"]').select_option('FILTER_COURSE_END_DATE')
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_function('()=>document.querySelectorAll("#list-output tbody tr[data-record-id]").length===2',timeout=12000)
  assert page.locator('#list-output thead th').all_inner_texts()==headers
  assert page.locator('#list-output [data-record-id="HS_5"] td.training-period-cell').count()==1
  assert '31/08/2026' in page.locator('#list-output [data-record-id="HS_5"] td.training-period-cell').inner_text()
  assert not errors,errors
  if role=='ADMIN':
   page.screenshot(path='/mnt/data/YC-HN-036_V6_CHROMIUM_DESKTOP.png',full_page=False)
  # Narrow screens keep the whole table horizontally scrollable, not hide actions.
  page.set_viewport_size({'width':390,'height':844})
  dimensions=page.locator('#list-output').evaluate('el=>({viewport:el.clientWidth,content:el.scrollWidth,overflow:getComputedStyle(el).overflowX})')
  assert dimensions['content']>dimensions['viewport'] and dimensions['overflow']=='auto',(role,dimensions)
  assert page.locator('#list-output th.training-period-header').count()==1
  assert page.locator('#list-output th.record-action-header').count()==1
  assert page.locator('#list-output tr[data-record-id] [data-status-record]').count()>=1
  page.close()
 browser.close()
print('YC036_V6_BROWSER_OK: 3 roles, missing/invalid dates, 8 cols, status update, completed filter, no extra list RPC')

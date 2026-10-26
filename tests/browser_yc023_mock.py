"""YC-HN-023 Chromium mock: virtual completion-date filter, role scope, date help, export, targeted refresh."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>','',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
source=re.sub(r'^import .*\n','',(root/'public/app.js').read_text(),count=1)
source=re.sub(r'^export const tests = .*$', '',source,flags=re.MULTILINE)
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda error:errors.append(role+': '+str(error)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate("() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}")
  page.evaluate('''role=>{
    window.calls=[];window.excelPreview=null;window.rowVersion=1;
    window.mockRows=[
      {HO_SO_ID:'HS_A',NGUOI_HOC_ID:'N_A',SO_QUYET_DINH:'101',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-10-13',NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'2027-07-14',HO_TEN:'A học viên',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',HAS_FILE:false,PHIEN_BAN:'1',TAO_LUC:'2026-10-13'},
      {HO_SO_ID:'HS_B',NGUOI_HOC_ID:'N_B',SO_QUYET_DINH:'102',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-07-01',NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'2027-01-14',HO_TEN:'B học viên',TRUONG_ID:'S2',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',HAS_FILE:false,PHIEN_BAN:'1',TAO_LUC:'2026-07-01'},
      {HO_SO_ID:'HS_C',NGUOI_HOC_ID:'N_C',SO_QUYET_DINH:'103',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-08-03',NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'2027-07-01',HO_TEN:'C học viên',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',HAS_FILE:false,PHIEN_BAN:'1',TAO_LUC:'2026-08-03'},
      {HO_SO_ID:'HS_D',NGUOI_HOC_ID:'N_D',SO_QUYET_DINH:'104',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-09-10',NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'2027-07-31',HO_TEN:'D học viên',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'KHONG_THAM_GIA',DA_BO_HOC:'FALSE',HAS_FILE:false,PHIEN_BAN:'1',TAO_LUC:'2026-09-10'},
      {HO_SO_ID:'HS_E',NGUOI_HOC_ID:'N_E',SO_QUYET_DINH:'105',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-07-31',NGAY_BAT_DAU:'2026-12-01',NGAY_KET_THUC_DU_KIEN:'',HO_TEN:'E học viên',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',HAS_FILE:false,PHIEN_BAN:'1',TAO_LUC:'2026-07-31'},
    ];
    const user={TAI_KHOAN_ID:'USER_'+role,EMAIL:'test@example.com',HO_TEN:'Người thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'};
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const r=JSON.parse(opt.body),p=r.payload||{};window.calls.push({action:r.action,payload:p});let data={};
      if(r.action==='bootstrap')data={user,permissionRevision:'P1',dataRevision:'D'+window.rowVersion,catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường S1',TRANG_THAI:'ACTIVE'},{TRUONG_ID:'S2',TEN_TRUONG:'Trường S2',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề N1',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      else if(r.action==='permission_check')data={user,permissionRevision:'P1',dataRevision:'D'+window.rowVersion,catalogRevision:'C1',statusRevision:'S1'};
      else if(r.action==='overview')data={kpi:{total:5,participated:3,learning:3,dropout:0,notParticipating:1,pending:1},statusCounts:{notReceived:0},schoolCounts:{S1:4,S2:1},tradeCounts:{N1:5}};
      else if(r.action==='records_list'||r.action==='report_export'){
        const source=window.mockRows.filter(x=>role!=='CO_SO_DAO_TAO'||x.TRUONG_ID==='S1');
        const items=source.filter(x=>{
          if(p.year&&x.NAM_QUYET_DINH!==p.year)return false;
          if(p.status==='FILTER_COURSE_END_DATE'){
            const end=x.NGAY_KET_THUC_DU_KIEN;if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(end))return false;
            if(p.from&&end<p.from)return false;if(p.to&&end>p.to)return false;
          }else{
            if(p.status&&x.TRANG_THAI_THAM_GIA!==p.status)return false;
            if(p.from&&x.NGAY_QUYET_DINH<p.from)return false;if(p.to&&x.NGAY_QUYET_DINH>p.to)return false;
          }
          if(p.query&&x.SO_QUYET_DINH!==p.query&&!x.HO_TEN.includes(p.query))return false;
          return true;
        }).sort((a,b)=>p.status==='FILTER_COURSE_END_DATE'?a.NGAY_KET_THUC_DU_KIEN.localeCompare(b.NGAY_KET_THUC_DU_KIEN):b.NGAY_QUYET_DINH.localeCompare(a.NGAY_QUYET_DINH));
        if(r.action==='records_list')data={items,total:items.length,page:Number(p.page)||1,pageSize:20};
        else{
          if(role==='CO_SO_DAO_TAO')return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
          data={columns:Array.from({length:25},(_,i)=>'Cột '+i),items:items.map((x,i)=>{const row=Array(25).fill('');row[0]=i+1;row[5]=x.SO_QUYET_DINH;row[13]=x.NGAY_KET_THUC_DU_KIEN;return row;})};
        }
      }else if(r.action==='record_save'){
        const i=window.mockRows.findIndex(x=>x.HO_SO_ID===p.HO_SO_ID);
        window.mockRows[i]={...window.mockRows[i],...p,PHIEN_BAN:String(+(window.mockRows[i].PHIEN_BAN)+1)};
        window.rowVersion++;data={record:window.mockRows[i]};
      }
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const s=document.createElement("script");s.textContent="const downloadReportXlsx=()=>{};const downloadXlsx=(name,rows)=>{window.excelPreview={name,rows};};\\n"+src;document.body.append(s);}',source)
  page.wait_for_selector('.kpi',timeout=12000)
  page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table',timeout=12000)
  assert 'Hoàn thành khóa học' in page.locator('#records-filters [name="status"]').inner_text(),role
  # YC024: Reports now uses the same virtual course-end filter; checked after navigating to Reports.
  page.locator('#records-filters [name="status"]').select_option('FILTER_COURSE_END_DATE')
  assert 'ngày kết thúc dự kiến' in page.locator('#filter-date-info').inner_text(),role
  page.locator('#records-filters [name="from"]').click()
  page.locator('[data-calendar-year]').select_option('2027');page.locator('[data-calendar-month]').select_option('7');page.locator('[data-calendar-day="1"]').click()
  page.locator('#records-filters [name="to"]').click()
  page.locator('[data-calendar-year]').select_option('2027');page.locator('[data-calendar-month]').select_option('7');page.locator('[data-calendar-day="31"]').click()
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_function('window.calls.some(x=>x.action==="records_list"&&x.payload.status==="FILTER_COURSE_END_DATE")',timeout=10000)
  page.wait_for_function('document.querySelector("#list-output thead")?.innerText.includes("Ngày kết thúc đào tạo")',timeout=10000)
  assert page.locator('#list-output thead th').count()==8,role
  expected=3
  assert page.locator('#list-output tbody tr[data-record-id]').count()==expected,role
  numbers=page.locator('#list-output tbody tr td:nth-child(3)').all_inner_texts()
  assert numbers==['103','101','104'],(role,numbers)
  if role in ('ADMIN','NHAN_VIEN'):
   page.locator('[data-export-list]').click()
   page.wait_for_function('window.excelPreview!==null',timeout=10000)
   x=page.evaluate('window.calls.filter(r=>r.action==="report_export").at(-1).payload')
   assert x['source']=='records' and x['status']=='FILTER_COURSE_END_DATE' and x['from']=='2027-07-01' and x['to']=='2027-07-31',x
   assert page.evaluate('window.excelPreview.rows.length')==5,'2 tiêu đề + 3 dữ liệu'
   if role=='ADMIN':
    page.evaluate('window.originalFilters=document.querySelector("#records-filters")')
    page.locator('[data-edit-record="HS_A"]').click()
    page.locator('#record-form [name="NGAY_KET_THUC_DU_KIEN"]').fill('2027-08-01')
    page.locator('#record-form [data-submit-btn]').click()
    page.wait_for_function('window.mockRows.find(r=>r.HO_SO_ID==="HS_A").NGAY_KET_THUC_DU_KIEN==="2027-08-01"',timeout=10000)
    page.wait_for_function('document.querySelectorAll("#list-output tbody tr[data-record-id]").length===2',timeout=10000)
    assert page.evaluate('window.originalFilters===document.querySelector("#records-filters")'),role
  else:
   assert page.locator('[data-export-list]').count()==0
  page.locator('[data-nav="reports"]').click();page.wait_for_selector('#reports-filters [name="status"]',timeout=12000)
  assert 'Hoàn thành khóa học' in page.locator('#reports-filters [name="status"]').inner_text(),role
  page.close()
 browser.close()
assert not errors,errors
print('YC023_BROWSER_OK: ADMIN/NHAN_VIEN/CO_SO_DAO_TAO, end-date calendar & status, 8-column dynamic table, Excel matching list, targeted refresh after end-date edit, report isolation')

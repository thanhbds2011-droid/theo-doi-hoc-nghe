"""YC-HN-024: Chromium UI regression, mocked backend; no production access."""
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
  print('ROLE',role,flush=True)
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda err:errors.append(role+': '+str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate("() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}")
  page.evaluate('''role=>{
    window.calls=[];window.exported=[];window.printCount=0;window.print=()=>window.printCount++;
    const rows=[
      {number:'801',date:'2026-10-13',end:'2027-07-01',status:'DA_THAM_GIA',school:'S1'},
      {number:'802',date:'2026-10-13',end:'2027-07-14',status:'CHO_XAC_NHAN',school:'S1'},
      {number:'803',date:'2026-10-13',end:'2027-07-31',status:'KHONG_THAM_GIA',school:'S2'},
      {number:'804',date:'2026-07-10',end:'2027-08-01',status:'DA_THAM_GIA',school:'S1'},
      {number:'805',date:'2026-07-12',end:'',status:'DA_THAM_GIA',school:'S1'}
    ];
    const user={TAI_KHOAN_ID:'U_'+role,EMAIL:'actor@example.test',HO_TEN:'Người thử',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'};
    function matches(p){return rows.filter(x=>{
      if(role==='CO_SO_DAO_TAO'&&x.school!=='S1')return false;
      if(p.year&&p.year!==x.date.slice(0,4))return false;
      if(p.truong&&p.truong!==x.school)return false;
      if(p.status==='FILTER_COURSE_END_DATE'){
        if(x.status!=='DA_THAM_GIA')return false;
        if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(x.end))return false;
        if(p.from&&x.end<p.from)return false;if(p.to&&x.end>p.to)return false;
      }else{
        if(p.status==='DA_THAM_GIA'&&x.status!=='DA_THAM_GIA')return false;
        if(p.from&&x.date<p.from)return false;if(p.to&&x.date>p.to)return false;
      }
      return true;
    });}
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const req=JSON.parse(opt.body),p=req.payload||{};window.calls.push({action:req.action,payload:p});let data={};
      if(req.action==='bootstrap')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường 1',TRANG_THAI:'ACTIVE'},{TRUONG_ID:'S2',TEN_TRUONG:'Trường 2',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề 1',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      else if(req.action==='permission_check')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1'};
      else if(req.action==='overview'){
        const rs=matches(p),participated=rs.filter(x=>x.status==='DA_THAM_GIA').length;
        data={kpi:{total:rs.length,participated,learning:participated,dropout:0,notParticipating:rs.filter(x=>x.status==='KHONG_THAM_GIA').length,pending:rs.filter(x=>x.status==='CHO_XAC_NHAN').length,courseEndScheduled:rs.filter(x=>/^\\d{4}-\\d{2}-\\d{2}$/.test(x.end )).length,courseEndParticipated:rs.filter(x=>x.status==='DA_THAM_GIA'&&x.end).length},statusCounts:{notReceived:0,other:0},schoolCounts:{},tradeCounts:{}};
      }else if(req.action==='report_export'){
        data={columns:Array.from({length:25},(_,i)=>'Cột '+(i+1)),items:matches(p).map((x,i)=>{const arr=Array(25).fill('');arr[0]=i+1;arr[5]=x.number;arr[13]=x.end;return arr;})};
      }else if(req.action==='report_matrix'){
        const found=matches(p),groupBy=p.groupBy==='truong'?'school':'status';
        const groups=[...new Set(found.map(x=>x[groupBy]))];
        data={total:found.length,items:groups.map(key=>{const sub=found.filter(x=>x[groupBy]===key);return {name:key,total:sub.length,participated:sub.filter(x=>x.status==='DA_THAM_GIA').length,learning:sub.filter(x=>x.status==='DA_THAM_GIA').length,dropout:0,notParticipating:sub.filter(x=>x.status==='KHONG_THAM_GIA').length,notReceived:0,pending:sub.filter(x=>x.status==='CHO_XAC_NHAN').length,other:0,courseEndParticipated:sub.filter(x=>x.status==='DA_THAM_GIA'&&x.end).length,customStatusCounts:{}};})};
      }
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const s=document.createElement("script");s.textContent="const downloadReportXlsx=(name,cols,rows)=>window.exported.push({name,cols,rows});const downloadXlsx=(name,rows)=>window.exported.push({name,rows});\\n"+src;document.body.append(s)}',source)
  page.wait_for_selector('.kpi',timeout=12000)
  page.locator('[data-nav="reports"]').click()
  page.wait_for_selector('#reports-filters [name="status"]',timeout=12000)
  page.locator('#report-output table').wait_for(timeout=12000)
  assert page.locator('#reports-filters [name="status"] option[value="FILTER_COURSE_END_DATE"]').count()==1,role
  old=page.evaluate('window.calls.filter(x=>x.action==="overview").length')
  assert page.locator('#reports-filters [name="status"] option[value="FILTER_ALL_DECISIONS"]').count()==1,role
  assert page.locator('#reports-filters [name="status"] option[value="DA_THAM_GIA"]').count()==0,role
  page.locator('#reports-filters [name="status"]').select_option('FILTER_ALL_DECISIONS')
  page.locator('#reports-filters button[type="submit"]').click()
  page.wait_for_function('document.querySelector("#report-output tbody")?.rows.length===1',timeout=12000)
  assert 'Tổng số Quyết định đã ban hành' in page.locator('#report-output tbody').inner_text()
  page.locator('#reports-filters [name="status"]').select_option('FILTER_COURSE_END_DATE')
  old=page.evaluate('window.calls.filter(x=>x.action==="overview").length')
  assert 'ngày kết thúc dự kiến' in page.locator('#filter-date-info').inner_text().lower(),role
  assert page.evaluate('window.calls.filter(x=>x.action==="overview").length')==old,role+': changing filter must not submit automatically'
  for name,day in [('from',1),('to',31)]:
   page.locator(f'#reports-filters [name="{name}"]').click()
   assert 'ngày kết thúc đào tạo dự kiến' in (page.locator('#hn-date-calendar').get_attribute('aria-label') or '').lower(),role
   page.locator('[data-calendar-year]').select_option('2027')
   page.locator('[data-calendar-month]').select_option('7')
   page.locator(f'[data-calendar-day="{day}"]').click()
  assert page.locator('.report-print-date-scope').count()==0,role+': draft should not modify prior report'
  page.locator('#reports-filters button[type="submit"]').click()
  page.wait_for_function('window.calls.some(x=>x.action==="overview"&&x.payload.status==="FILTER_COURSE_END_DATE")',timeout=12000)
  page.wait_for_selector('.report-print-date-scope',state='attached',timeout=12000)
  scope=page.locator('.report-print-date-scope').inner_text()
  assert '01/07/2027' in scope and '31/07/2027' in scope and 'dự kiến' in scope,(role,scope)
  assert page.locator('.report-course-end-note').count()==0
  assert page.locator('.report-print-date-scope').evaluate('(el)=>getComputedStyle(el).display')=='none',role
  expected=1
  assert page.locator('#report-output table tbody tr').count()==1,role+' — chỉ hiển thị hàng đã lọc'
  row=page.locator('#report-output table tbody tr').filter(has_text='Hoàn thành khóa học')
  assert row.count()==1 and row.locator('td').nth(1).inner_text()=='1',role
  if role in ('ADMIN','NHAN_VIEN','CO_SO_DAO_TAO'):
   page.locator('#print-report').click()
   assert page.evaluate('window.printCount')==1
   page.emulate_media(media='print')
   assert page.locator('.report-print-date-scope').evaluate('(el)=>getComputedStyle(el).display')!='none'
   if role=='CO_SO_DAO_TAO':
    assert page.locator('.report-print-school').count()==1
    assert 'Trường 1' in page.locator('.report-print-school').inner_text()
    assert page.locator('.report-print-school').evaluate('(el)=>getComputedStyle(el).display')!='none'
   page.emulate_media(media='screen')
   page.locator('#report-export').click()
   page.wait_for_selector('#report-export-form',timeout=12000)
   page.locator('#report-export-form [name="mode"]').select_option('list')
   page.locator('#report-export-form [data-submit-btn]').click()
   
   try:page.wait_for_function('window.exported.length===1',timeout=3000)
   except Exception:
    print('DEBUG',role,page.evaluate('({exports:window.exported,calls:window.calls.slice(-4),toast:document.querySelector("#toast")?.textContent,modal:document.querySelector("#modal")?.textContent})'),errors);raise
   assert page.evaluate('window.exported[0].rows.length')==3
   assert page.evaluate('window.exported[0].rows[2][13]')=='2027-07-01'
   assert page.evaluate('window.calls.filter(x=>x.action==="report_export").at(-1).payload.status')=='FILTER_COURSE_END_DATE'
   for j,mode in enumerate(['summary','truong','nghe'],start=2):
    page.locator('#report-export').click()
    page.locator('#report-export-form [name="mode"]').select_option(mode)
    page.locator('#report-export-form [data-submit-btn]').click()
    page.wait_for_function(f'window.exported.length==={j}',timeout=12000)
    action='overview' if mode=='summary' else 'report_matrix'
    assert page.evaluate(f'window.calls.filter(x=>x.action==="{action}").at(-1).payload.status')=='FILTER_COURSE_END_DATE'
   assert page.evaluate('window.exported.length')==4
   assert page.evaluate('window.exported[2].cols.includes("Hoàn thành khóa học")')
   assert page.evaluate('window.exported[3].cols.includes("Tổng số Quyết định đã ban hành")')
   assert page.evaluate('window.exported[2].cols.includes("Đã tham gia")'),role
   lines=page.evaluate('window.exported[1].rows')
   assert len(lines)==1 and lines[0]==['Hoàn thành khóa học',1],(role,lines)
  page.locator('#reports-filters [name="status"]').select_option('')
  page.locator('#reports-filters button[type="submit"]').click()
  page.wait_for_function('window.calls.filter(x=>x.action==="overview").at(-1).payload.status===""',timeout=12000)
  page.wait_for_function('document.querySelector(".report-print-date-scope")===null',timeout=12000)
  assert page.locator('#report-output table tbody tr').first.locator('td').nth(1).inner_text()=='0',role
  assert page.locator('#report-output table tbody tr').filter(has_text='Hoàn thành khóa học').locator('td').nth(1).inner_text()=='0',role
  page.close()
 browser.close()
assert errors==[],errors
print('YC024_BROWSER_OK: 3 roles, draft/applied dates, inclusive July course-end filters, dynamic KPI, print note, 4 export formats, old-status decision date')

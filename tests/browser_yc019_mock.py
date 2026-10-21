"""YC-HN-019: Chromium end-to-end mock giao diện bộ lọc ngày, giữ giá trị và truyền ISO."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>','',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
source=(root/'public/app.js').read_text().replace("import {downloadReportXlsx} from './xlsx-export.js';",'')
source=re.sub(r'export const tests = \{[^;]+;', '',source)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate("() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}")
 page.evaluate("""()=>{
  window.requests=[];
  window.fetch=async(url,opt)=>{
   if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
   const req=JSON.parse(opt.body);window.requests.push({action:req.action,payload:req.payload});
   const user={TAI_KHOAN_ID:'TK019',EMAIL:'admin019@example.com',HO_TEN:'Quản trị viên',VAI_TRO:'ADMIN',TRUONG_ID:'',TRANG_THAI:'ACTIVE'};
   let data={};
   if(req.action==='bootstrap')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường ABC',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Bánh Âu',TRANG_THAI:'ACTIVE'}],lydo:[]}};
   else if(req.action==='permission_check')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1'};
   else if(req.action==='overview')data={kpi:{total:12,participated:2,learning:2,dropout:0,notParticipating:0,pending:10},statusCounts:{notReceived:0},schoolCounts:{S1:12},tradeCounts:{N1:12}};
   else if(req.action==='records_list')data={items:[],total:12,page:1,pageSize:20};
   else if(req.action==='report_matrix')data={items:[],total:0};
   return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
  };
 }""")
 page.evaluate('src=>{const el=document.createElement("script");el.textContent=src;document.body.appendChild(el)}',source)
 page.wait_for_selector('.kpi',timeout=15000)
 assert page.locator('#dashboard-filters [name="from"]').count()==0
 page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
 page.locator('#records-filters [name="from"]').fill('01/07/2026')
 page.locator('#records-filters [name="to"]').fill('31/07/2026')
 page.locator('#records-filters [name="query"]').fill('6273')
 page.locator('#records-filters button[type="submit"]').click()
 page.wait_for_function('window.requests.some(r=>r.action==="records_list" && r.payload.from==="2026-07-01")')
 assert page.locator('#records-filters [name="from"]').input_value()=='01/07/2026'
 assert page.locator('#records-filters [name="query"]').input_value()=='6273'
 records=page.evaluate('window.requests.filter(r=>r.action==="records_list").at(-1).payload')
 assert records['to']=='2026-07-31' and records['query']=='6273',records
 page.locator('#records-filters [name="to"]').fill('31/02/2026')
 before=page.evaluate('window.requests.length')
 page.locator('#records-filters button[type="submit"]').click()
 assert page.evaluate('window.requests.length')==before,'Ngày sai không gửi API'
 page.locator('#records-filters [name="to"]').fill('')
 page.locator('#records-filters button[type="submit"]').click()
 page.wait_for_function('window.requests.some(r=>r.action==="records_list" && r.payload.from==="2026-07-01" && r.payload.to==="")')
 page.locator('[data-nav="reports"]').click();page.wait_for_selector('#report-output table')
 page.locator('#reports-filters [name="from"]').fill('01/07/2026')
 page.locator('#reports-filters [name="to"]').fill('31/07/2026')
 page.locator('#reports-filters button[type="submit"]').click()
 page.wait_for_function('window.requests.some(r=>r.action==="overview" && r.payload.from==="2026-07-01")')
 page.wait_for_selector('#report-output table')
 assert page.locator('#reports-filters [name="from"]').input_value()=='01/07/2026'
 page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
 assert page.locator('#records-filters [name="from"]').input_value()=='01/07/2026'
 page.close();browser.close()
assert not errors,errors
print('YC019_BROWSER_OK: records/reports, dd/mm/yyyy, API ISO, invalid date stopped, independent retained filters')

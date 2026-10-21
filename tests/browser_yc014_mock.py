"""Offline Chrome mock smoke test for navigation and report status; needs installed Chromium."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
source=(root/'public/app.js').read_text().replace("import {downloadReportXlsx,downloadXlsx} from './xlsx-export.js';",'')
source=re.sub(r'export const tests = \{[^;]+;', '',source)
errors=[]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded')
    page.evaluate("""() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}""")
    page.evaluate("""role=>{
      window.calls={};window.seenStatuses=[];
      window.fetch=async(url,opt)=>{
        if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
        const body=JSON.parse(opt.body);const action=body.action;window.calls[action]=(window.calls[action]||0)+1;
        let data={};
        if(action==='bootstrap')data={user:{TAI_KHOAN_ID:'ID_'+role,EMAIL:'test@example.com',HO_TEN:'Người thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'},permissionRevision:'P1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường ABC',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề may',TRANG_THAI:'ACTIVE'}],lydo:[]}};
        else if(action==='overview'){
          const status=body.payload?.status||'';window.seenStatuses.push(status);
          data={kpi:{total:status==='REPORT_PARTICIPATED_ALL'?2:4,participated:2,learning:1,dropout:1,notParticipating:1,pending:1},statusCounts:{notReceived:0,other:0},schoolCounts:{S1:4},tradeCounts:{N1:4}};
        }else if(action==='records_list')data={items:[],total:0,page:1,pageSize:20};
        return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
      };
    }""",role)
    page.evaluate('src=>{const el=document.createElement("script");el.textContent=src;document.body.appendChild(el)}',source)
    page.wait_for_selector('.kpi',timeout=15000)
    assert page.locator('.kpi').count()==6
    assert 'Không nhận Quyết định' in page.locator('.kpi').nth(2).inner_text()
    assert page.evaluate('window.calls.overview')==1
    page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
    page.locator('[data-nav="dashboard"]').click();page.wait_for_selector('.kpi')
    assert page.evaluate('window.calls.overview')==1,role
    page.locator('[data-nav="reports"]').click();page.wait_for_selector('#report-output table')
    page.locator('#reports-filters select[name="status"]').select_option('REPORT_PARTICIPATED_ALL')
    page.locator('#reports-filters button[type="submit"]').click()
    page.wait_for_function("document.querySelector('#report-output tr:nth-child(1) td:nth-child(2)')?.textContent.trim()==='2'",timeout=15000)
    assert page.evaluate("window.seenStatuses.includes('REPORT_PARTICIPATED_ALL')")
    page.close()
  browser.close()
assert not errors,errors
print('YC014_BROWSER_OK: 3 roles, warm navigation, report filter')

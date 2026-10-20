"""Kiểm thử Chrome: quay lại menu 240s, xác minh quyền và revision an toàn."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
source=(root/'public/app.js').read_text().replace("import {downloadReportXlsx} from './xlsx-export.js';",'')
source=re.sub(r'export const tests = \{[^;]+;', '',source)
errors=[]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded')
    page.evaluate("() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}")
    page.evaluate("""role=>{
      window.calls={};window.backendDataRev='D1';window.backendPermRev='P1';window.backendRole=role;
      window.fetch=async(url,opt)=>{
        if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
        const body=JSON.parse(opt.body),action=body.action;window.calls[action]=(window.calls[action]||0)+1;
        const user={TAI_KHOAN_ID:'ID_'+role,EMAIL:'test@example.com',HO_TEN:'Người thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?(window.nextSchool||'S1'):'',TRANG_THAI:'ACTIVE'};
        let data={};
        if(action==='bootstrap')data={user,permissionRevision:window.backendPermRev,dataRevision:window.backendDataRev,catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường ABC',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề may',TRANG_THAI:'ACTIVE'}],lydo:[]}};
        else if(action==='permission_check')data={user,permissionRevision:window.backendPermRev,dataRevision:window.backendDataRev,catalogRevision:'C1',statusRevision:'S1'};
        else if(action==='overview')data={kpi:{total:25,participated:2,learning:1,dropout:1,notParticipating:0,pending:23},statusCounts:{notReceived:0},schoolCounts:{S1:25},tradeCounts:{N1:25}};
        else if(action==='records_list')data={items:[],total:0,page:1,pageSize:20};
        else if(action==='audit_list')data={items:[],total:0,page:1,pageSize:30};
        else if(action==='accounts_list')data={items:[]};
        return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
      };
    }""",role)
    page.evaluate('src=>{const el=document.createElement("script");el.textContent=src;document.body.appendChild(el)}',source)
    page.wait_for_selector('.kpi',timeout=15000)
    assert page.evaluate('window.calls.overview')==1,role
    page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
    page.evaluate("() => {state.permissionChecked=Date.now()-240001;state.pageDataAt.set('dashboard',Date.now()-240001);const v=state.pageViews.get('dashboard');if(v){v.dataAt=Date.now()-240001;}}")
    page.locator('[data-nav="dashboard"]').click();page.wait_for_selector('.kpi',timeout=15000)
    assert page.evaluate('window.calls.permission_check')==1,('verify once',role)
    assert page.evaluate('window.calls.overview')==1,('no needless overview after 240s',role)
    page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
    page.evaluate("() => {window.backendDataRev='D2';state.permissionChecked=Date.now()-240001;}")
    page.locator('[data-nav="dashboard"]').click();page.wait_for_function('window.calls.overview === 2',timeout=15000)
    page.wait_for_selector('.kpi')
    assert page.evaluate('window.calls.permission_check')==2
    if role=='CO_SO_DAO_TAO':
      page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
      page.evaluate("() => {window.nextSchool='S2';state.permissionChecked=Date.now()-240001;}")
      page.locator('[data-nav="dashboard"]').click()
      page.wait_for_function("document.querySelector('#login') && !document.querySelector('#login').classList.contains('hidden')",timeout=15000)
      assert page.locator('.kpi').count()==0,'Không phát lại dữ liệu ABC khi Gmail chuyển sang XYZ'
    page.close()
  browser.close()
assert not errors,errors
print('YC017_BROWSER_OK: 3 roles, 240s navigation and safe DATA revision refresh')

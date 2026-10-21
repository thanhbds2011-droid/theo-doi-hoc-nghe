"""YC-HN-022 browser integration: mocked network, no real user data or Sheets writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
source=(root/'public/app.js').read_text()
source=re.sub(r"^import .*\n",'',source,count=1)
source=re.sub(r'^export const tests = .*$', '',source,flags=re.MULTILINE)
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate("() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}")
  page.evaluate('''role => {
    window.calls=[];window.dataVersion=1;window.mockRows=[
      {HO_SO_ID:'HS_1',NGUOI_HOC_ID:'NH_1',SO_QUYET_DINH:'4281',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-08-11',HO_TEN:'Học viên A',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',TEP_DRIVE_ID:'',HAS_FILE:false,TAO_BOI:'tester@example.com',PHIEN_BAN:'1',TAO_LUC:'2026-08-11 00:00'},
      {HO_SO_ID:'HS_2',NGUOI_HOC_ID:'NH_2',SO_QUYET_DINH:'4280',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-08-10',HO_TEN:'Học viên B',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',TEP_DRIVE_ID:'',HAS_FILE:false,TAO_BOI:'tester@example.com',PHIEN_BAN:'1',TAO_LUC:'2026-08-10 00:00'}
    ];window.mockConflict=false;
    const user={TAI_KHOAN_ID:'TEST_'+role,EMAIL:'tester@example.com',HO_TEN:'Người thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'};
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const req=JSON.parse(opt.body),a=req.action;window.calls.push({action:a,payload:req.payload});
      let data={};
      if(a==='bootstrap')data={user,permissionRevision:'P1',dataRevision:'D'+window.dataVersion,catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường A',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề A',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      else if(a==='permission_check')data={user,permissionRevision:'P1',dataRevision:'D'+window.dataVersion,catalogRevision:'C1',statusRevision:'S1'};
      else if(a==='overview')data={kpi:{total:2,participated:2,learning:2,dropout:0,notParticipating:0,pending:0},statusCounts:{notReceived:0},schoolCounts:{S1:2},tradeCounts:{N1:2}};
      else if(a==='records_list'){await new Promise(r=>setTimeout(r,50));const f=req.payload||{};
        const items=window.mockRows.filter(x=>(!f.status||x.TRANG_THAI_THAM_GIA===f.status)&&(!f.year||x.NAM_QUYET_DINH===f.year));
        data={items,total:items.length,page:Number(f.page)||1,pageSize:20};
      }else if(a==='record_save'){
        await new Promise(r=>setTimeout(r,80));
        if(window.mockConflict)return new Response(JSON.stringify({ok:false,error:{code:'VERSION_CONFLICT'}}));
        const idx=window.mockRows.findIndex(x=>x.HO_SO_ID===req.payload.HO_SO_ID);
        const next={...window.mockRows[idx],...req.payload,DA_BO_HOC:req.payload.DA_BO_HOC?'TRUE':'FALSE',PHIEN_BAN:String(Number(window.mockRows[idx].PHIEN_BAN)+1)};
        delete next.UI_TINH_TRANG;window.mockRows[idx]=next;window.dataVersion++;
        data={record:next};
      }
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const script=document.createElement("script");script.textContent=src;document.body.append(script)}',source)
  page.wait_for_selector('.kpi',timeout=12000)
  page.locator('[data-nav="records"]').click()
  page.wait_for_selector('#list-output tbody tr[data-record-id="HS_2"]',timeout=12000)
  if role=='CO_SO_DAO_TAO':
   assert page.locator('[data-edit-record]').count()==0
   page.close();continue
  initial=page.evaluate('''() => ({other:document.querySelector('tr[data-record-id="HS_2"]'),records:window.calls.filter(x=>x.action==='records_list').length,filters:document.querySelector('#records-filters')})''')
  # Element references are compared inside the page, not serialized to Python.
  page.evaluate('window.unchangedRow=document.querySelector(\'tr[data-record-id="HS_2"]\');window.formElement=document.querySelector("#records-filters")')
  page.locator('[data-edit-record="HS_1"]').click()
  page.locator('#record-form [name="HO_TEN"]').fill('Học viên A đã sửa')
  page.locator('#record-form [data-submit-btn]').click()
  page.wait_for_function('document.querySelector("#modal-layer").classList.contains("hidden")',timeout=12000)
  page.wait_for_function('document.querySelector(\'tr[data-record-id="HS_1"]\').innerText.includes("Học viên A đã sửa")',timeout=12000)
  assert page.evaluate('''() => window.unchangedRow===document.querySelector('tr[data-record-id="HS_2"]')'''),role
  assert page.evaluate('''() => window.formElement===document.querySelector('#records-filters')'''),role
  assert page.evaluate('window.calls.filter(x=>x.action==="records_list").length')==initial['records'],role
  assert page.evaluate('state.records.find(r=>r.HO_SO_ID==="HS_1").PHIEN_BAN')=='2'
  # second update changes sort key -> result REGION refresh only (no shell replacement).
  page.locator('[data-edit-record="HS_1"]').click()
  page.locator('#record-form [name="NGAY_QUYET_DINH"]').fill('2026-07-01')
  page.locator('#record-form [data-submit-btn]').click()
  page.wait_for_function('window.calls.filter(x=>x.action==="records_list").length>=2',timeout=12000)
  assert page.evaluate('''() => window.formElement===document.querySelector('#records-filters')'''),role
  page.wait_for_function('!document.querySelector("#list-output").hasAttribute("aria-busy")',timeout=12000)
  # conflict keeps modal open + original displayed row untouched.
  page.evaluate('window.mockConflict=true')
  page.locator('[data-edit-record="HS_1"]').click()
  page.locator('#record-form [name="HO_TEN"]').fill('Sẽ bị từ chối')
  page.locator('#record-form [data-submit-btn]').click()
  page.wait_for_function('document.querySelector("#toast").textContent.includes("cập nhật")',timeout=12000)
  assert page.locator('#record-form').count()==1
  assert 'Sẽ bị từ chối' not in page.locator('#list-output').inner_text()
  page.close()
 browser.close()
assert not errors,errors
print('YC022_BROWSER_OK: ADMIN & NHAN_VIEN local row update, stable filter DOM, no redundant list RPC; sort-change targeted refresh; version-conflict safe; CO_SO_DAO_TAO no edit')

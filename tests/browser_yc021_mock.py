"""YC-HN-021 V4.1: Chromium mock, no real Sheets/network or personal records."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, zipfile, xml.etree.ElementTree as ET
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
  page.on('pageerror', lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate("() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}")
  page.evaluate('''role => {
    window.calls=[];
    window.role=role;
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const req=JSON.parse(opt.body),action=req.action;window.calls.push({action,payload:req.payload});
      const user={TAI_KHOAN_ID:'TEST_'+role,EMAIL:'tester@example.com',HO_TEN:'Người thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'};
      let data={};
      const rows=[
        {HO_SO_ID:'HS_1',SO_QUYET_DINH:'6273',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-10-13',HO_TEN:'Học viên một',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',TEP_DRIVE_ID:'',HAS_FILE:false,TAO_BOI:'tester@example.com'},
        {HO_SO_ID:'HS_2',SO_QUYET_DINH:'6204',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-10-12',HO_TEN:'Học viên hai',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',TEP_DRIVE_ID:'',HAS_FILE:false,TAO_BOI:'tester@example.com'}
      ];
      if(action==='bootstrap')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường ABC',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề thử',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      else if(action==='permission_check')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1'};
      else if(action==='overview')data={kpi:{total:2,participated:0,learning:0,dropout:0,notParticipating:0,pending:2},statusCounts:{notReceived:0},schoolCounts:{S1:2},tradeCounts:{N1:2}};
      else if(action==='records_list'){
        await new Promise(r=>setTimeout(r,90));
        const query=String(req.payload?.query||'');
        const matched=query?rows.filter(r=>r.SO_QUYET_DINH===query):rows;
        data={items:matched,total:matched.length,page:Number(req.payload.page)||1,pageSize:20};
      }else if(action==='audit_list')data={items:[],total:0,page:1,pageSize:30};
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const el=document.createElement("script");el.textContent=src;document.body.appendChild(el)}',source)
  page.wait_for_selector('.kpi',timeout=15000)
  page.locator('[data-nav="records"]').click()
  page.wait_for_selector('#list-output tbody tr:nth-child(2)',timeout=15000)
  # Existing buttons should be icons, semantic labels preserved.
  assert page.locator('.record-actions .record-icon-btn').count()>=2,role
  assert page.locator('[data-detail-record]').first.get_attribute('aria-label')=='Chi tiết hồ sơ'
  assert page.locator('[data-status-record]').first.count()==1,role
  # YC-HN-021 V5.1: action header centered with icon cells; number shows without year below.
  header=page.locator('#list-output th.record-action-header')
  cell=page.locator('#list-output td.record-action-cell').first
  assert header.count()==1 and cell.count()==1, role
  assert header.evaluate('(el)=>getComputedStyle(el).textAlign')=='center',role
  assert cell.evaluate('(el)=>getComputedStyle(el).textAlign')=='center',role
  hdr=header.bounding_box();icons=cell.locator('.record-actions').bounding_box()
  assert abs((hdr['x']+hdr['width']/2)-(icons['x']+icons['width']/2))<3,(role,hdr,icons)
  decision=page.locator('#list-output tbody tr:first-child td:nth-child(2)')
  assert decision.inner_text().strip()=='6273',role
  assert 'Năm 2026' not in page.locator('#list-output').inner_text(),role
  if role=='CO_SO_DAO_TAO':
    assert page.locator('[data-delete-record]').count()==0
    assert page.locator('[data-edit-record]').count()==0
    assert page.locator('[data-file-modal]').count()==0
  # Exact decision followed by keyboard-only clearing: no clear-X button.
  input=page.locator('#records-filters [name="query"]')
  input.fill('6273');page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_function('document.querySelectorAll("#list-output tbody tr").length===1 && document.querySelector("#list-output tbody").innerText.includes("6273")')
  assert input.input_value()=='6273'
  input.focus();input.press('ControlOrMeta+A');input.press('Backspace')
  assert input.input_value()==''
  page.wait_for_function('document.querySelectorAll("#list-output tbody tr").length===2',timeout=15000)
  assert page.evaluate('window.calls.filter(x=>x.action==="records_list").at(-1).payload.query')==''
  assert page.locator('#records-filters [data-clear-query]').count()==0
  # 240s permission expiration should not show obsolete blocking text in #main.
  page.evaluate('state.permissionChecked=Date.now()-240001')
  page.locator('[data-nav="dashboard"]').click()
  page.wait_for_selector('.kpi',timeout=15000)
  assert 'Đang kiểm tra quyền truy cập' not in page.locator('#main').inner_text()
  assert page.evaluate('window.calls.filter(x=>x.action==="permission_check").length')==1
  page.close()
 browser.close()
assert not errors,errors
print('YC021_BROWSER_OK: 3 roles, icon permissions, keyboard query clear auto-filter, stale permission recheck')
# Validate the generated stylesheet content and updated XML styles without sharing fonts.
from subprocess import run
assert 'horizontal="left" vertical="center" wrapText="1"' in (root/'public/xlsx-export.js').read_text()

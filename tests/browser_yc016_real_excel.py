"""Offline Chromium smoke test reading the real user workbook (no network / no writes)."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '', html)
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
src=(root/'public/app.js').read_text().replace("import {downloadReportXlsx} from './xlsx-export.js';",'')
src=re.sub(r'export const tests = \{[^;]+;', '',src)
wb=next(Path('/mnt/data').glob('Danh s*.xlsx'))
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page()
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}}; window.fetch=async()=>new Response(JSON.stringify({ok:false}));}')
  page.evaluate('src=>{const script=document.createElement("script");script.textContent=src;document.body.append(script)}',src)
  page.evaluate('() => {state.user={VAI_TRO:"ADMIN"};state.cats={truong:[],nghe:[],lydo:[]};statusBulkForm();}')
  page.locator('#status-bulk-file').set_input_files(str(wb))
  page.wait_for_function('state.statusImport?.rows?.length > 1000',timeout=30000)
  values=page.evaluate('({rows:state.statusImport.rows.length,skipped:state.statusImport.skipped.length, first:state.statusImport.rows[0], hasFile:!!document.getElementById("status-bulk-form")})')
  assert values['rows']==1324,values
  assert values['first']['decision'],values
  page.evaluate('''() => {
    state.session=true;window.mockStatusCalls={check:0,apply:0};
    window.fetch=async (_url,opt)=>{
      const body=JSON.parse(opt.body);
      if(body.action==='record_status_bulk_check'){
        window.mockStatusCalls.check++;
        return new Response(JSON.stringify({ok:true,data:{items:body.payload.rows.map(r=>({line:r.line,kind:'eligible',reason:'Đủ điều kiện',hoSoId:'HS'+r.line,version:'1'}))}}));
      }
      if(body.action==='record_status_bulk_apply'){
        window.mockStatusCalls.apply++;
        return new Response(JSON.stringify({ok:true,data:{updated:body.payload.rows.length,results:body.payload.rows.map(r=>({line:r.line,kind:'updated',reason:'Đã cập nhật'}))}}));
      }
      return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
    };
  }''')
  page.locator('[data-status-bulk-check]').click()
  page.wait_for_function('state.statusImport?.verified === true',timeout=60000)
  assert page.evaluate('state.statusImport.results.filter(x=>x.kind==="eligible").length')==1324
  page.locator('#status-bulk-form input[name="ack"]').check()
  page.locator('#status-bulk-submit').click()
  page.wait_for_function('state.statusImport?.verified === false && !state.busy',timeout=120000)
  data=page.evaluate('({updated:state.statusImport.results.filter(x=>x.kind==="updated").length,calls:window.mockStatusCalls})')
  assert data['updated']==1324,data
  assert data['calls']['check']==12,data
  assert data['calls']['apply']==133,data
  print('YC016_REAL_EXCEL_BROWSER_OK',values['rows'],values['skipped'],data)
  browser.close()
  assert not errs,errs

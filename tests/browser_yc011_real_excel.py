from playwright.sync_api import sync_playwright
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '', html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+ (root/'public/styles.css').read_text() + '</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','').replace('<script type="module" src="/app.js"></script>','')
app=re.sub(r'export const tests = \{[^;]+;', '',(root/'public/app.js').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':900})
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate('''() => {window.google={accounts:{id:{initialize:({callback})=>window._login=callback,renderButton:()=>{},disableAutoSelect:()=>{}}}};
 window.fetch=async (u,o)=>{if(String(u).includes('config'))return new Response(JSON.stringify({ok:true,clientId:'x'}));let d=JSON.parse(o.body),data={};
 if(d.action==='bootstrap')data={user:{EMAIL:'admin@example.test',HO_TEN:'Admin',VAI_TRO:'ADMIN',QUYEN:'*',TRANG_THAI:'ACTIVE'},catalogs:{truong:[],nghe:[],lydo:[]}};
 if(d.action==='overview')data={kpi:{total:0,participated:0,learning:0,dropout:0,notParticipating:0,pending:0},schoolCounts:{},tradeCounts:{}};
 if(d.action==='records_list')data={items:[],total:0,page:1,pageSize:20};
 return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}})};}''')
 page.evaluate('src=>{let script=document.createElement("script");script.textContent=src;document.body.appendChild(script)}',app)
 page.wait_for_function('typeof window._login==="function"')
 page.evaluate('window._login({credential:"mock"})')
 page.wait_for_selector('.kpi')
 page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output table')
 page.locator('[data-bulk-record]').click();page.wait_for_selector('#record-import-file')
 original='/mnt/data/Danh sách NLĐ học nghề năm 2026 (08.10).xlsx'
 page.locator('#record-import-file').set_input_files(original)
 page.wait_for_timeout(2500)
 out=page.evaluate('''() => ({count:state.importRows?.length,unused:state.importFile?.unused,first:state.importRows?.[0],last:state.importRows?.at(-1),toast:document.querySelector('#toast')?.textContent})''')
 print({k:v for k,v in out.items() if k not in ('first','last')})
 if out.get('first'): print('fields',len(out['first']),'firstDecision',out['first'].get('decision'))
 b.close()

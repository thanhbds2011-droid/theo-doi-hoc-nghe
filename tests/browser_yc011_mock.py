"""Kiểm thử offline luồng Xóa hồ sơ không tải lại bảng; không kết nối Google."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(ROOT/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
app=re.sub(r'export const tests = \{[^;]+;', '',(ROOT/'public/app.js').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate('''() => {
  window.google={accounts:{id:{initialize:({callback})=>window._login=callback,renderButton:()=>{},disableAutoSelect:()=>{}}}};
  window.calls={};window.items=[
    {HO_SO_ID:'HS1',SO_QUYET_DINH:'125',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-10-16',HO_TEN:'Người học 1',TRUONG_ID:'CS1',NGHE_ID:'NG1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',TAO_BOI:'admin@example.test'},
    {HO_SO_ID:'HS2',SO_QUYET_DINH:'123',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-10-10',HO_TEN:'Người học 2',TRUONG_ID:'CS1',NGHE_ID:'NG1',TRANG_THAI_THAM_GIA:'DA_THAM_GIA',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',TAO_BOI:'admin@example.test'}
  ];
  window.fetch=async(u,opts)=>{
    if(String(u).includes('config'))return new Response(JSON.stringify({ok:true,clientId:'test'}));
    const q=JSON.parse(opts.body);window.calls[q.action]=(window.calls[q.action]||0)+1;
    let data={};if(q.action==='bootstrap')data={user:{EMAIL:'admin@example.test',HO_TEN:'Admin',VAI_TRO:'ADMIN'},catalogs:{truong:[{TRUONG_ID:'CS1',TEN_TRUONG:'Trường 1',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'NG1',TEN_NGHE:'Nghề 1',TRANG_THAI:'ACTIVE'}],lydo:[]}};
    if(q.action==='overview')data={kpi:{total:2,participated:2,learning:2,dropout:0,notParticipating:0,pending:0},schoolCounts:{},tradeCounts:{}};
    if(q.action==='records_list')data={items:window.items,total:window.items.length,page:1,pageSize:20};
    if(q.action==='record_delete'){window.items=window.items.filter(r=>r.HO_SO_ID!==q.payload.HO_SO_ID);data={HO_SO_ID:q.payload.HO_SO_ID,TRANG_THAI_HO_SO:'DELETED'};}
    return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
  };
 }''')
 page.evaluate('source=>{const sc=document.createElement("script");sc.textContent=source;document.body.append(sc)}',app)
 page.wait_for_function('typeof window._login==="function"')
 page.evaluate('window._login({credential:"offline_token"})')
 page.wait_for_selector('.kpi')
 page.locator('[data-nav="records"]').click()
 page.wait_for_selector('[data-record-row="HS1"]')
 assert page.locator('[data-record-row]').count()==2
 reads=page.evaluate('window.calls.records_list')
 page.locator('[data-delete-record="HS1"]').click()
 page.locator('[data-confirm-delete="HS1"]').click()
 page.wait_for_function('document.querySelectorAll("[data-record-row]").length===1')
 assert page.evaluate('window.calls.records_list')==reads,'Đã phát sinh lượt đọc danh sách thừa sau xóa'
 assert page.locator('#record-count').inner_text().startswith('Hiển thị 1 / 1')
 assert page.locator('[data-record-row="HS2"]').count()==1
 assert not failures,failures
 browser.close()
print('YC011_DELETE_BROWSER_OK')

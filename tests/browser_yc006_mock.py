from playwright.sync_api import sync_playwright
from pathlib import Path
import json, os, time
root=Path('/mnt/data/hocnghe_yc006_work/theo-doi-hoc-nghe')
import re
html=(root/'public/index.html').read_text(encoding='utf8')
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text(encoding='utf8')+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
app_js=(root/'public/app.js').read_text(encoding='utf8').replace('export const tests = {esc,dateVN,STATUS,RIGHTS,csvCell};','')
user={'HO_TEN':'Nguyễn Chí Thạnh','EMAIL':'admin@example.test','VAI_TRO':'ADMIN','QUYEN':''}
schools=[('CS1','Trường Cao đẳng Việt Nam - Hàn Quốc Bình Dương',4),('CS2','Trung tâm GDNN Quận 1',3),('CS3','Trường Trung cấp Nghề',2),('CS4','Trung tâm GDNN Quận 2',1)]
trades=[('N1','Điện công nghiệp',4),('N2','Cơ khí',3),('N3','Công nghệ thông tin',2),('N4','May công nghiệp',1)]
catalogs={'truong':[{'TRUONG_ID':i,'TEN_TRUONG':t,'MA_TRUONG':f'CS{n+1:05d}','TRANG_THAI':'ACTIVE'} for n,(i,t,c) in enumerate(schools)],'nghe':[{'NGHE_ID':i,'TEN_NGHE':t,'MA_NGHE':f'NG{n+1:05d}','TRANG_THAI':'ACTIVE'} for n,(i,t,c) in enumerate(trades)],'lydo':[]}
overview={'kpi':{'total':10,'participated':7,'learning':6,'dropout':1,'notParticipating':2,'pending':1},'schoolCounts':{i:c for i,t,c in schools},'tradeCounts':{i:c for i,t,c in trades}}
records={'items':[{'HO_SO_ID':'HS1','NGAY_QUYET_DINH':'2026-10-10','SO_QUYET_DINH':'123','NAM_QUYET_DINH':'2026','HO_TEN':'Nguyễn Văn A','NGUOI_HOC_ID':'NH1','TRUONG_ID':'CS1','NGHE_ID':'N1','TRANG_THAI_THAM_GIA':'DA_THAM_GIA','DA_BO_HOC':'FALSE','TAO_BOI':'admin@example.test','PHIEN_BAN':'1'}],'total':1,'page':1,'pageSize':20}
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1672,941),(1920,1080),(1440,900),(1366,768),(990,900),(390,844)]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,locale='vi-VN')
  page=context.new_page()
  page.on('pageerror',lambda exc: errors.append(f'{width}: {exc}'))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''() => {
    window.google={accounts:{id:{initialize:({callback})=>window._onGoogle=callback,renderButton:(el)=>el.textContent='Đăng nhập Google (thử nghiệm)',disableAutoSelect:()=>{}}}};
  }''')
  mock_data={'user':user,'catalogs':catalogs,'overview':overview,'records':records}
  page.evaluate('''(mock) => {
    window.fetch=async (url,options) => {
       if(String(url).includes('/api/config')) return new Response(JSON.stringify({ok:true,clientId:'test-app.apps.googleusercontent.com'}),{status:200,headers:{'Content-Type':'application/json'}});
       const request=JSON.parse(options?.body || '{}'); const action=request.action; const args=request.payload || {};
       let data={items:[]};
       if(action==='bootstrap') data={user:mock.user,catalogs:mock.catalogs};
       if(action==='overview') data=mock.overview;
       if(action==='records_list') data=mock.records;
       if(action==='catalog_list') data={items:mock.catalogs[args.type]||[]};
       if(action==='accounts_list') data={items:[{TAI_KHOAN_ID:'TK1',HO_TEN:'Nguyễn Chí Thạnh',EMAIL:'admin@example.test',VAI_TRO:'ADMIN',TRANG_THAI:'ACTIVE'}]};
       if(action==='audit_list') data={items:[],page:1,total:0,pageSize:20};
       return new Response(JSON.stringify({ok:true,data}),{status:200,headers:{'Content-Type':'application/json'}});
    };
  }''',mock_data)
  page.evaluate('''(source) => { const script=document.createElement('script'); script.textContent=source; document.body.appendChild(script); }''',app_js)
  page.wait_for_function('typeof window._onGoogle === "function"')
  page.evaluate('window._onGoogle({credential:"offline_test_token"})')
  page.wait_for_selector('.kpi:nth-child(6)',timeout=10000)
  page.wait_for_selector('.donut-chart',timeout=10000)
  sizes=page.locator('.kpi').evaluate_all('(els)=>els.map(e=>({x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}))')
  extra=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,navIcons:document.querySelectorAll('#navigation svg').length,headings:document.querySelectorAll('.topbar-brand:not([hidden])').length,charts:document.querySelectorAll('.visual-summary').length,donut:document.querySelector('.donut-chart').getAttribute('style')})''')
  if width>=1251: assert len({s['y'] for s in sizes})==1,(width,sizes)
  assert extra['scrollWidth']<=extra['viewport']+1,(width,extra['scrollWidth'])
  assert extra['navIcons']==6,(width,extra)
  path=root/'docs'/'anh-kiem-thu'/f'YC006_TONG_QUAN_{width}x{height}.png'
  path.parent.mkdir(parents=True,exist_ok=True)
  page.screenshot(path=str(path),full_page=True)
  print(width,height,'kpiRows',len({s['y'] for s in sizes}),'kpiWidths',[s['w'] for s in sizes],'charts',extra['charts'],'pageWidth',extra['scrollWidth'],'donut',extra['donut'][:60])
  if width==1672:
   page.locator('[data-dashboard-detail]').first.click()
   page.wait_for_selector('#report-output.report-results')
   assert page.locator('h2').inner_text()=='Báo cáo học nghề'
   page.locator('[data-nav="records"]').click()
   page.wait_for_selector('#list-output tbody tr')
   page.locator('[data-new-record]').click()
   page.wait_for_selector('#record-form')
   assert page.locator('#modal .modal-foot button').count()==2
   page.locator('#modal [data-close]').first.click()
   page.locator('[data-nav="catalogs"]').click()
   page.wait_for_selector('.catalog-data-row')
   page.locator('[data-cat-tab="nghe"]').click()
   page.wait_for_selector('.catalog-data-row')
   page.locator('[data-nav="accounts"]').click()
   page.wait_for_selector('.account-table')
   page.locator('[data-nav="audits"]').click()
   page.wait_for_selector('.audit-table')
  context.close()
 browser.close()

assert not errors,errors
print('BROWSER_TEST_OK, pageerrors:',errors)

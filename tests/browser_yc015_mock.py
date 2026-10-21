"""Browser regression: YC-HN-015. Offline Chromium, simulated backend latencies, no production data."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>','',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
source=(root/'public/app.js').read_text().replace("import {downloadReportXlsx,downloadXlsx} from './xlsx-export.js';",'')
source=re.sub(r'export const tests = \{[^;]+;', '',source)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for role in ('ADMIN','NHAN_VIEN','CO_SO_DAO_TAO'):
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}''')
  page.evaluate('''role=>{
    window.calls=[];
    const makeRec=(n)=>({HO_SO_ID:'H_'+n,PHIEN_BAN:'1',SO_QUYET_DINH:String(n),NAM_QUYET_DINH:'2026',HO_TEN:'Người học '+n,
      NGAY_QUYET_DINH:'2026-10-13',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE'});
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const body=JSON.parse(opt.body),action=body.action,payload=body.payload||{};window.calls.push({action,payload});
      let data={};
      if(action==='bootstrap')data={user:{TAI_KHOAN_ID:'ID_'+role,EMAIL:'test@example.com',HO_TEN:'Người thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'},permissionRevision:'P1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường ABC',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề may',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      if(action==='overview')data={kpi:{total:2433,participated:1,learning:1,dropout:0,notParticipating:0,pending:2432},statusCounts:{notReceived:0},schoolCounts:{S1:2433},tradeCounts:{N1:2433}};
      if(action==='records_list'){
        const query=payload.query||'';
        if(query==='9999'&&window.failNextSearch){window.failNextSearch=false;return new Response(JSON.stringify({ok:false,error:{code:'GATEWAY_UNAVAILABLE'}}));}
        await new Promise(r=>setTimeout(r,query==='6273'?650:query==='6204'?120:80));
        const items=query?query==='6204'?[makeRec(6204)]:query==='6273'?[makeRec(6273)]:[]:[makeRec(6273),makeRec(6204)];
        data={items,total:query?items.length:2433,page:payload.page||1,pageSize:20};
      }
      if(action==='record_status'){
        await new Promise(r=>setTimeout(r,400));
        data={record:{...makeRec(6273),TRANG_THAI_THAM_GIA:payload.TRANG_THAI_THAM_GIA,PHIEN_BAN:'2'}};
      }
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const s=document.createElement("script");s.textContent=src;document.body.appendChild(s)}',source)
  page.wait_for_selector('.kpi')
  page.locator('[data-nav="records"]').click()
  page.wait_for_selector('#list-output table')
  assert page.locator('#record-count').inner_text().startswith('Hiển thị 2 / 2.433'),role
  query=page.locator('#records-filters input[name="query"]')
  query.fill('6273')
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_timeout(120)
  assert query.input_value()=='6273',role
  assert page.locator('#record-count').inner_text().startswith('Đang tìm'),role
  assert page.locator('#records-filters').count()==1,role
  # Thay từ khóa khi request 6273 còn đang bay; reply 6273 phải bị bỏ qua.
  query.fill('6204')
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_function("document.querySelector('#list-output tbody')?.textContent.includes('6204')")
  page.wait_for_timeout(550)
  assert query.input_value()=='6204',role
  assert '6273' not in page.locator('#list-output tbody').inner_text(),role
  query.fill('')
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_timeout(20)
  assert query.input_value()=='',role
  page.wait_for_function("document.querySelector('#record-count')?.textContent.includes('2.433')")
  assert query.input_value()=='',role
  assert '6273' in page.locator('#list-output tbody').inner_text(),role
  # Cache no-filter warm: same page, same scope, no fetch after explicit return.
  count=page.evaluate("window.calls.filter(x=>x.action==='records_list').length")
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_timeout(45)
  assert page.evaluate("window.calls.filter(x=>x.action==='records_list').length")==count,role
  # Status: button must react immediately; success only after server responds.
  page.locator('[data-status-record="H_6273"]').click()
  form=page.locator('#status-form')
  form.locator('select[name="UI_TINH_TRANG"]').select_option('DA_THAM_GIA')
  submit=form.locator('button[type="submit"]')
  submit.click()
  page.wait_for_timeout(40)
  assert submit.inner_text()=='Đang cập nhật…',role
  assert submit.is_disabled(),role
  page.wait_for_selector('#modal-layer.hidden',state='hidden',timeout=3000)
  page.wait_for_function("document.querySelector('#list-output tbody')?.textContent.includes('Đã tham gia học')",timeout=3000)
  assert 'Đã tham gia học' in page.locator('#list-output tbody').inner_text(),role
  # Lỗi API ở lượt lọc mới: giữ từ khóa, không trình bày bảng cũ như kết quả mới.
  page.evaluate('window.failNextSearch=true')
  query.fill('9999')
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_function("document.querySelector('#record-count')?.textContent.includes('Chưa tải được kết quả')",timeout=3000)
  assert query.input_value()=='9999',role
  assert 'records-failed' in page.locator('#list-output').get_attribute('class'),role
  page.locator('#records-filters button[type="submit"]').click()
  page.wait_for_function("document.querySelector('#record-count')?.textContent.includes('Hiển thị 0')",timeout=3000)
  assert query.input_value()=='9999',role
  page.close()
 browser.close()
assert not errors,errors
print('YC015_BROWSER_OK: 3 roles, query preserved, stale replies rejected, clear to all, cache, status feedback')

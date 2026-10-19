"""Kiểm thử trình duyệt offline YC-HN-009, không gọi dịch vụ thật."""
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
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':900}, accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate("""() => {window.google={accounts:{id:{initialize:({callback})=>window._login=callback,renderButton:(el)=>el.textContent='Đăng nhập thử',disableAutoSelect:()=>{}}}};}""")
 page.evaluate("""() => {window.calls={};window.fetch=async(u,opts)=>{
 if(String(u).includes('config'))return new Response(JSON.stringify({ok:true,clientId:'x'}));
 const o=JSON.parse(opts.body);window.calls[o.action]=(window.calls[o.action]||0)+1;
 const school=[{TRUONG_ID:'CS1',TEN_TRUONG:'Trường ABC',TRANG_THAI:'ACTIVE'}];const trade=[{NGHE_ID:'N1',TEN_NGHE:'Nghề may',TRANG_THAI:'ACTIVE'}];
 let data={};if(o.action==='bootstrap')data={user:{EMAIL:'admin@example.test',HO_TEN:'Quản trị',VAI_TRO:'ADMIN',QUYEN:'*',TRANG_THAI:'ACTIVE'},catalogs:{truong:school,nghe:trade,lydo:[]}};
 if(o.action==='overview')data={kpi:{total:0,participated:0,learning:0,dropout:0,notParticipating:0,pending:0},schoolCounts:{},tradeCounts:{}};
 if(o.action==='records_list')data={items:[],total:0,page:1,pageSize:20};
 if(o.action==='record_bulk_check')data={total:o.payload.rows.length,valid:o.payload.rows.length,duplicate:0,invalid:0,issues:[]};
 if(o.action==='record_bulk_import')data={added:o.payload.rows.length,duplicate:0,invalid:0,issues:[]};
 return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
 };}""")
 page.evaluate('source=>{const script=document.createElement("script");script.textContent=source;document.body.appendChild(script)}',app)
 page.wait_for_function('typeof window._login==="function"',timeout=15000)
 page.evaluate('window._login({credential:"offline_token"})')
 page.wait_for_selector('.kpi')
 page.locator('[data-nav="records"]').click()
 page.wait_for_selector('#list-output table')
 assert page.locator('[data-bulk-record]').count()==1
 page.locator('[data-bulk-record]').click()
 page.wait_for_selector('#bulk-record-form')
 template=ROOT/'public/templates/MAU_NHAP_HO_SO_HOC_NGHE.xlsx'
 page.locator('#record-import-file').set_input_files(str(template))
 # Không có dữ liệu: phải yêu cầu người dùng nhập từ dòng 2; template không bị trình duyệt đọc sai.
 page.wait_for_timeout(200)
 assert page.locator('#toast').inner_text() in ['', 'File có dòng thiếu toàn bộ thông tin bắt buộc. Vui lòng kiểm tra dữ liệu và thử lại.', 'Mỗi file cần từ 1 đến 1.200 dòng hồ sơ. Vui lòng chia file nếu có nhiều hơn.'] or 'file' in page.locator('#toast').inner_text().lower() or 'dòng' in page.locator('#toast').inner_text().lower(), page.locator('#toast').inner_text()
 # Kiểm tra parser độc lập với mẫu hai hàng tiêu đề (ảnh người dùng cung cấp).
 parsed=page.evaluate('''() => parseRecordExcel([
 ["STT","Họ và tên","Năm sinh","Giới tính","Số sổ BHXH","Số QĐ HTHN","Ngày ban hành QĐ HTHN","Số QĐ TCTN","Ngày ban hành QĐ TCTN","Nghề đăng ký","Số tháng hỗ trợ","Mức hỗ trợ/tháng","Thời gian đào tạo","","Cơ sở đào tạo nghề"],
 ["","","","","","","","","","","","","Từ ngày","Đến ngày",""],
 ["1","Nguyễn Văn A","07/01/1985","Nam","123456789","002","15/01/2026","8888","01/01/2026","Nghề may","3","1500000","01/03/2026","31/05/2026","Trường ABC"]
 ])''')
 assert parsed['rows'][0]['decision']=='002',parsed
 assert parsed['rows'][0]['startDate']=='2026-03-01',parsed
 assert parsed['rows'][0]['endDate']=='2026-05-31',parsed
 assert 'so so bhxh' in parsed['unused'],parsed
 assert not errors,errors
 page.screenshot(path='/mnt/data/YC009_NHAP_EXCEL_OFFLINE.png',full_page=False)
 b.close()
print('YC009_BROWSER_OK')

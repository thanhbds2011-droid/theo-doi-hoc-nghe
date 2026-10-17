"""Mô phỏng UI YC-HN-007; KHÔNG gọi Apps Script/Google Drive production."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '', html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(ROOT/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=html.replace('<script type="module" src="/app.js"></script>','')
app=(ROOT/'public/app.js').read_text()
app=re.sub(r'export const tests = \{[^;]+;', '', app)
user={'EMAIL':'admin@example.test','HO_TEN':'Quản trị thử nghiệm','VAI_TRO':'ADMIN','QUYEN':'*','TRANG_THAI':'ACTIVE'}
schools=[{'TRUONG_ID':'CS1','TEN_TRUONG':'Trường ABC','MA_TRUONG':'CS00001','TRANG_THAI':'ACTIVE'}]
trades=[{'NGHE_ID':'N1','TEN_NGHE':'Nghề May','MA_NGHE':'NG00001','TRANG_THAI':'ACTIVE'}]
reasons=[{'LY_DO_ID':'L1','NOI_DUNG':'Sức khỏe','MA_LY_DO':'LD00001','TRANG_THAI':'ACTIVE'}]
mock={'user':user,'catalogs':{'truong':schools,'nghe':trades,'lydo':reasons}}
errors=[]
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=b.new_context(viewport={'width':1440,'height':900})
  page=ctx.new_page()
  page.on('pageerror',lambda err: errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''() => {window.google={accounts:{id:{initialize:({callback})=>window._login=callback,renderButton:(el)=>el.textContent='Đăng nhập thử',disableAutoSelect:()=>{}}}};}''')
  page.evaluate('''mock => {
    window.calls={}; window.db={catalogs:mock.catalogs,accounts:[{TAI_KHOAN_ID:'TK1',EMAIL:mock.user.EMAIL,HO_TEN:mock.user.HO_TEN,VAI_TRO:'ADMIN',TRANG_THAI:'ACTIVE'}], records:[]};
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'app-test'}));
      const req=JSON.parse(opt.body),a=req.action,p=req.payload||{};window.calls[a]=(window.calls[a]||0)+1;
      let data={items:[]};
      if(a==='bootstrap'&&!req.idToken&&!window.serverSession)return new Response(JSON.stringify({ok:false,error:{code:'LOGIN_EXPIRED'}}),{status:401});
      if(a==='bootstrap'){if(req.idToken)window.serverSession=true;data={user:mock.user,catalogs:window.db.catalogs};}
      if(a==='overview')data={kpi:{total:0,participated:0,learning:0,dropout:0,notParticipating:0,pending:0},schoolCounts:{},tradeCounts:{}};
      if(a==='records_list')data={items:window.db.records,total:window.db.records.length,page:1,pageSize:20};
      if(a==='catalog_list')data={items:window.db.catalogs[p.type]||[]};
      if(a==='accounts_list')data={items:window.db.accounts};
      if(a==='audit_list')data={items:[],total:0,page:1,pageSize:30};
      if(a==='catalog_bulk_check')data={valid:(p.rows||[]).length,duplicate:0,invalid:0,invalidItems:[]};
      if(a==='catalog_bulk_import')data={added:(p.rows||[]).length,skipped:0};
      if(a==='catalog_save'){
        const v={TRUONG_ID:'CS'+Date.now(),TEN_TRUONG:p.title,MA_TRUONG:'CS00099',TRANG_THAI:'ACTIVE'};
        window.db.catalogs.truong.push(v);data={item:v};
      }
      if(a==='account_save'){
        const u={TAI_KHOAN_ID:'TK'+Date.now(),EMAIL:p.email,HO_TEN:p.name,VAI_TRO:p.role,TRANG_THAI:p.status};
        window.db.accounts.push(u);data={item:u};
      }
      if(a==='record_save')data={record:{SO_QUYET_DINH:p.SO_QUYET_DINH,NAM_QUYET_DINH:'2026'}};
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',mock)
  page.evaluate('''source=>{const script=document.createElement('script');script.textContent=source;document.body.appendChild(script);}''',app)
  page.wait_for_function('typeof window._login === "function" && document.querySelector("#login-note").textContent.includes("Đăng nhập bằng")')
  page.evaluate('window._login({credential:"offline_token"})')
  page.wait_for_selector('.kpi')
  # navigate cached dashboard no new network
  page.locator('[data-nav="records"]').click()
  page.wait_for_selector('#list-output tbody tr')
  page.locator('[data-nav="dashboard"]').click()
  page.wait_for_selector('.kpi')
  assert page.evaluate('window.calls.overview')==1,'overview should be restored from page cache'
  # Add record; dropout field hidden and default participation
  page.locator('[data-nav="records"]').click()
  page.locator('[data-new-record]').click()
  page.wait_for_selector('#record-form')
  assert page.locator('#record-form select[name="UI_TINH_TRANG"]').input_value()=='DA_THAM_GIA'
  assert not page.locator('#record-form [name="NGAY_BO_HOC"]').is_visible()
  page.locator('#record-form select[name="UI_TINH_TRANG"]').select_option('BO_HOC')
  assert page.locator('#record-form [name="NGAY_BO_HOC"]').is_visible()
  assert page.locator('#record-form [name="NGAY_BO_HOC"]').get_attribute('required') is not None
  page.locator('#record-form select[name="UI_TINH_TRANG"]').select_option('KHONG_THAM_GIA')
  assert not page.locator('#record-form [name="NGAY_BO_HOC"]').is_visible()
  assert not page.locator('#modal').get_by_text('Số quyết định được nhập theo văn bản đã ban hành').count()
  page.locator('#modal [data-close]').first.click()
  # create catalog, save button sends backend and list refresh
  page.locator('[data-nav="catalogs"]').click();page.wait_for_selector('#cats-view tbody')
  page.locator('[data-new-catalog]').click();page.wait_for_selector('#catalog-form')
  page.locator('#catalog-form input[name="title"]').fill('Trường DEF')
  page.locator('#catalog-form input[name="address"]').fill('123 Nguyễn Huệ')
  page.evaluate('''() => {window.submitEvents=[];document.addEventListener('submit',e=>window.submitEvents.push(e.target.id),true);}''');page.locator('#catalog-form [type="submit"]').click()
  page.wait_for_function('window.calls.catalog_save >= 1', timeout=12000)
  page.wait_for_selector('#modal-layer.hidden',state='attached',timeout=12000)
  # enter bulk, select file XLSX theo đúng mẫu
  page.locator('[data-bulk-catalog]').click();page.wait_for_selector('#bulk-catalog-form')
  assert page.locator('[data-bulk-template]').count()==1
  page.locator('#bulk-csv').set_input_files(str(ROOT/'public/templates/MAU_DANH_MUC_TRUONG.xlsx'))
  page.wait_for_function('document.querySelector("#bulk-review").textContent.includes("Đã đọc file")');page.locator('#bulk-csv').set_input_files({'name':'truong.csv','mimeType':'text/csv','buffer':'Tên cơ sở đào tạo,Tên viết tắt,Địa chỉ,Ghi chú\nTrường Mới,TM,123 Nguyễn Huệ,Ghi chú thử'.encode('utf8')});page.locator('[data-bulk-check]').click();page.wait_for_function('window.calls.catalog_bulk_check >= 1')
  page.wait_for_function('!document.querySelector("#bulk-import-submit").disabled',timeout=10000)
  page.locator('#bulk-import-submit').click();page.wait_for_function('window.calls.catalog_bulk_import >= 1')
  page.locator('[data-nav="accounts"]').click();page.wait_for_selector('.account-table')
  page.locator('[data-new-account]').click();page.wait_for_selector('#account-form')
  assert page.locator('#account-form input[type="checkbox"]').count()==0
  page.locator('#account-form input[name="email"]').fill('staff2@example.test')
  page.locator('#account-form input[name="name"]').fill('Nhân viên 2')
  page.locator('#account-form [type="submit"]').click();page.wait_for_function('window.calls.account_save >= 1')
  page.wait_for_selector('#modal-layer.hidden',state='attached',timeout=10000)
  screenshot=ROOT/'docs/anh-kiem-thu/YC007_HO_SO_1440x900.png'
  page.locator('[data-nav="records"]').click();page.wait_for_selector('#list-output tbody')
  page.screenshot(path=str(screenshot),full_page=True)
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
  page.set_viewport_size({'width':390,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), 'Mobile page overflow'
  page.locator('[data-new-record]').click();page.wait_for_selector('#record-form')
  assert page.evaluate('document.querySelector("#modal").getBoundingClientRect().width <= window.innerWidth + 1'), 'Mobile modal overflow'
  page.screenshot(path=str(ROOT/'docs/anh-kiem-thu/YC007_MOBILE_FORM_390x844.png'),full_page=True)
  ctx.close();b.close()
assert not errors, errors
print('BROWSER_YC008_PASS — giữ DOM cache, biểu mẫu trạng thái, nút Lưu danh mục, nhập hàng loạt, nút Lưu tài khoản')

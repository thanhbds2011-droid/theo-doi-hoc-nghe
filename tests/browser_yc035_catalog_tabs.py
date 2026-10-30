"""YC-HN-035: end-user Chromium regression tests for real app.js render/navigation, with mocked API (no real Sheets)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
source=re.sub(r'^import .*\n','',(root/'public/app.js').read_text(),count=1)
source=re.sub(r'^export const tests = .*$', '',source, flags=re.MULTILINE)
calls={}
users=['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']

schools=[{'TRUONG_ID':'A','TEN_TRUONG':'Trường A','MA_TRUONG':'A01','TRANG_THAI':'ACTIVE'}]
trades=[{'NGHE_ID':'N1','TEN_NGHE':'Kỹ thuật trang điểm','MA_NGHE':'N01','TRANG_THAI':'ACTIVE'}]
reasons=[{'LY_DO_ID':'L1','NOI_DUNG':'Lý do thử nghiệm','MA_LY_DO':'L01','TRANG_THAI':'ACTIVE'}]
status=[{'id':'CUS_1','label':'Tình trạng cần rà soát','state':'PENDING','usageCount':2,'builtin':False},
        {'id':'DA_THAM_GIA','label':'Đã tham gia học','state':'ACTIVE','usageCount':10,'builtin':True}]
rev={'catalog':1,'data':1,'status':1}
def api(role,request):
 action=request.get('action');calls[role].append(action)
 user={'TAI_KHOAN_ID':'U_'+role,'EMAIL':role.lower()+'@example.test','HO_TEN':'Tài khoản kiểm thử',
       'VAI_TRO':role,'TRUONG_ID':'A' if role=='CO_SO_DAO_TAO' else '', 'TRANG_THAI':'ACTIVE'}
 base={'user':user,'permissionRevision':'P1','dataRevision':'D'+str(rev['data']),
       'catalogRevision':'C'+str(rev['catalog']),'statusRevision':'S'+str(rev['status']),'tradeScopeRevision':'T1'}
 if action in ('bootstrap','permission_check'):
  if action=='bootstrap':base.update({'catalogs':{'truong':schools,'nghe':trades,'lydo':reasons},'statuses':[],
      'tradeScopeMap':None if role=='CO_SO_DAO_TAO' else {'A':['N1']}})
  return {'ok':True,'data':base}
 if action=='overview':return {'ok':True,'data':{'kpi':{'total':2,'participated':1,'dropout':0,'notParticipating':0,'pending':1,'courseEndParticipated':0},'statusCounts':{'notReceived':0},'schoolCounts':{'A':2},'tradeCounts':{'N1':2}}}
 if action=='records_list':return {'ok':True,'data':{'items':[],'total':0,'page':1,'pageSize':20}}
 if action=='status_manage_list':
  if role!='ADMIN':return {'ok':False,'error':{'code':'NO_PERMISSION'}}
  return {'ok':True,'data':{'items':status}}
 if action=='accounts_list':return {'ok':True,'data':{'items':[]}}
 if action=='audit_list':return {'ok':True,'data':{'items':[],'total':0,'page':1,'pageSize':30}}
 if action=='status_manage_save':
  if role!='ADMIN':return {'ok':False,'error':{'code':'NO_PERMISSION'}}
  payload=request.get('payload') or {}
  if payload.get('id')=='CUS_1':status[0]['state']=payload.get('status','ACTIVE')
  rev['catalog']+=1;rev['status']+=1
  return {'ok':True,'data':{'saved':True}}
 return {'ok':False,'error':{'code':'NO_PERMISSION'}}

errors=[]
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 pages={}
 for role in users:
  calls[role]=[]
  page=browser.new_page(viewport={'width':1440,'height':900},locale='vi-VN')
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.expose_function('mockServer',lambda request, role=role:api(role,request))
  page.evaluate('''() => {
    window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};
    window.fetch=async(url,opts={})=>String(url).includes('/api/config')
      ?new Response(JSON.stringify({ok:true,clientId:'fake'}))
      :new Response(JSON.stringify(await window.mockServer(JSON.parse(opts.body))),{headers:{'Content-Type':'application/json'}});
  }''')
  page.evaluate('src=>{const s=document.createElement("script");s.textContent=src;document.body.appendChild(s)}',source)
  page.wait_for_selector('.kpi',timeout=16000)
  pages[role]=page

 admin=pages['ADMIN']
 assert len(admin.locator('#navigation button').all())==6
 admin.locator('[data-nav="catalogs"]').click()
 admin.wait_for_selector('[data-cat-tab="truong"].active')
 assert admin.locator('.catalog-data-row').count()==1
 # Reproduce original bug: clicking another tab within same route must ACTUALLY show new table.
 for category,expected_name,expected_button in [('nghe','Kỹ thuật trang điểm','Thêm danh mục'),
                                             ('lydo','Lý do thử nghiệm','Thêm danh mục'),
                                             ('tinhtrang','Tình trạng cần rà soát','Thêm tình trạng'),
                                             ('truong','Trường A','Thêm danh mục')]:
  admin.locator(f'[data-cat-tab="{category}"]').click()
  admin.wait_for_selector(f'[data-cat-tab="{category}"].active',timeout=10000)
  admin.locator('#cats-view').get_by_text(expected_name,exact=False).first.wait_for(timeout=10000)
  assert admin.locator('.page-actions').get_by_text(expected_button,exact=False).count()==1,(category,expected_button)
  assert admin.evaluate('state.catalogType')==category
 # Fast switching should not read Sheets; only first status_manage_list hits backend.
 before=calls['ADMIN'].count('status_manage_list')
 for i in range(3):
  admin.locator('[data-cat-tab="tinhtrang"]').click()
  admin.wait_for_selector('[data-cat-tab="tinhtrang"].active')
  admin.locator('#cats-view').get_by_text('Tình trạng cần rà soát').wait_for()
  admin.locator('[data-cat-tab="truong"]').click()
  admin.wait_for_selector('[data-cat-tab="truong"].active')
 assert calls['ADMIN'].count('status_manage_list')==before,('unnecessary status RPCs',calls['ADMIN'])
 # Every category has its own saved search, so searching for a school doesn't hide trades or reasons.
 admin.locator('#catalog-search').fill('Trường')
 admin.locator('[data-cat-tab="nghe"]').click()
 admin.wait_for_selector('[data-cat-tab="nghe"].active')
 assert admin.locator('#catalog-search').input_value()==''
 assert admin.locator('.catalog-data-row:visible').count()==1
 admin.locator('#catalog-search').fill('trang điểm')
 admin.locator('[data-cat-tab="truong"]').click()
 admin.wait_for_selector('[data-cat-tab="truong"].active')
 assert admin.locator('#catalog-search').input_value()=='Trường'
 assert admin.locator('.catalog-data-row:visible').count()==1
 admin.locator('[data-cat-tab="nghe"]').click()
 admin.wait_for_selector('[data-cat-tab="nghe"].active')
 assert admin.locator('#catalog-search').input_value()=='trang điểm'
 # Existing forms must open correct categories after switches.
 admin.locator('[data-new-catalog]').click()
 admin.wait_for_selector('#catalog-form')
 assert 'nghề đào tạo' in admin.locator('#modal h3').inner_text().lower()
 admin.locator('#modal [data-close]').first.click()
 admin.locator('[data-cat-tab="tinhtrang"]').click()
 admin.wait_for_selector('[data-cat-tab="tinhtrang"].active')
 admin.locator('[data-new-status]').click()
 admin.wait_for_selector('#manage-status-form')
 assert admin.locator('#modal h3').inner_text()=='Thêm tình trạng học nghề'
 admin.locator('#modal [data-close]').first.click()
 # Return from another menu: correct tab should stay selected; no extra status call.
 admin.locator('[data-nav="dashboard"]').click()
 admin.wait_for_selector('.kpi')
 admin.locator('[data-nav="catalogs"]').click()
 admin.wait_for_selector('[data-cat-tab="tinhtrang"].active')
 assert admin.locator('#cats-view').get_by_text('Tình trạng cần rà soát').is_visible()
 # ADMIN phê duyệt tình trạng lịch sử: cache được vô hiệu hóa sau khi ghi;
 # màn hình Danh mục hiển thị lại trạng thái mới với mã hồ sơ không đổi.
 admin.locator('[data-edit-status="CUS_1"]').click()
 admin.wait_for_selector('#manage-status-form')
 admin.locator('#manage-status-form select[name="status"]').select_option('ACTIVE')
 admin.locator('#manage-status-form button[type="submit"]').click()
 admin.wait_for_function('document.querySelector("#modal-layer")?.classList.contains("hidden")',timeout=10000)
 admin.locator('[data-cat-tab="tinhtrang"].active').wait_for(timeout=10000)
 admin.locator('#cats-view').get_by_text('Được phép chọn').first.wait_for(timeout=10000)
 assert calls['ADMIN'].count('status_manage_save')==1
 assert status[0]['id']=='CUS_1' and status[0]['state']=='ACTIVE'
 # Users without privilege must not even get a catalog nav/tab.
 for role in ['NHAN_VIEN','CO_SO_DAO_TAO']:
  p=pages[role]
  assert len(p.locator('#navigation button').all())==3,role
  assert p.locator('[data-nav="catalogs"]').count()==0
  for section in ['records','reports','dashboard']:
   p.locator(f'[data-nav="{section}"]').click()
   p.wait_for_selector(f'#{section}-filters')
  assert not any(x in calls[role] for x in ['status_manage_list','status_manage_save','catalog_save'])
 assert not errors,errors
 for p in pages.values():p.close()
 browser.close()
print('YC035_CHROMIUM_OK: ADMIN 4 tabs, action buttons, forms, search isolation, menu restore; 3-role RBAC; no repeated status RPC in hot cache')

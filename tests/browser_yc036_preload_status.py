"""YC-HN-036: Chromium with mocked backend; no requests to production."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
src=re.sub(r'^import .*\n','',(root/'public/app.js').read_text(),count=1)
src=re.sub(r'^export const tests = .*$', '', src, flags=re.MULTILINE)
user={'TAI_KHOAN_ID':'ADMIN001','EMAIL':'admin@example.test','HO_TEN':'Quản trị viên kiểm thử','VAI_TRO':'ADMIN','TRUONG_ID':'','TRANG_THAI':'ACTIVE'}
builtin=[{'id':'DA_THAM_GIA','label':'Đã tham gia học'}, {'id':'BO_HOC','label':'Bỏ học'},
 {'id':'KHONG_THAM_GIA','label':'Không tham gia'}, {'id':'KHONG_NHAN_QUYET_DINH','label':'Không nhận quyết định'}, {'id':'CHO_XAC_NHAN','label':'Chưa xác nhận'}]
managed=[dict(x,state='ACTIVE',builtin=True) for x in builtin]+[
 {'id':'CUS_PEND001','label':'Tình trạng chưa duyệt','state':'PENDING','builtin':False},
 {'id':'CUS_INA001','label':'Tình trạng đã ngừng','state':'INACTIVE','builtin':False}]
model={'calls':[],'version':1,'deleted':[]}
def backend(req):
 action=req.get('action');p=req.get('payload') or {};model['calls'].append(action)
 if action in ('bootstrap','permission_check'):
  obj={'user':user,'permissionRevision':'U1','dataRevision':'D1','catalogRevision':'C1','statusRevision':'S'+str(model['version']),'tradeScopeRevision':'T1'}
  if action=='bootstrap':obj.update({'statuses':[],'builtinStatuses':[{'id':x['id'],'label':x['label']} for x in managed if x['builtin'] and x['state']=='ACTIVE'],
   'catalogs':{'truong':[],'nghe':[],'lydo':[]},'tradeScopeMap':{}})
  return {'ok':True,'data':obj}
 if action=='status_manage_list':return {'ok':True,'data':{'items':[x.copy() for x in managed]}}
 if action=='status_manage_delete':
  row=next(x for x in managed if x['id']==p.get('id'))
  row['state']='DELETED';model['version']+=1;model['deleted'].append(row['id'])
  return {'ok':True,'data':{'id':row['id'],'deleted':True}}
 if action=='accounts_list':return {'ok':True,'data':{'items':[]}}
 if action=='audit_list':return {'ok':True,'data':{'items':[],'page':1,'pageSize':30,'total':0}}
 if action=='records_list':return {'ok':True,'data':{'items':[],'total':0,'page':1,'pageSize':20}}
 if action=='overview':return {'ok':True,'data':{'kpi':{'total':0,'participated':0,'learning':0,'dropout':0,'notParticipating':0,'pending':0,'courseEndParticipated':0},'statusCounts':{},'schoolCounts':{},'tradeCounts':{}}}
 return {'ok':False,'error':{'code':'NO_PERMISSION','message':'Not allowed'}}

errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1550,'height':900})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.expose_function('mockServer',backend)
 page.evaluate('''() => {
   window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};
   window.fetch=async(url,opts={})=>String(url).includes('/api/config')
    ?new Response(JSON.stringify({ok:true,clientId:'mock'}))
    :new Response(JSON.stringify(await window.mockServer(JSON.parse(opts.body))),{headers:{'Content-Type':'application/json'}});
 }''')
 page.evaluate('src=>{const sc=document.createElement("script");sc.textContent=src;document.body.appendChild(sc)}',src)
 page.wait_for_selector('.kpi',timeout=15000)
 # Wait for the sequential warmup; it must not request unbounded pages or Excel files.
 page.wait_for_function('state.cache.size>=5',timeout=15000)
 expected=['status_manage_list','accounts_list','audit_list','records_list']
 for action in expected:assert action in model['calls'],(action,model['calls'])
 before={k:model['calls'].count(k) for k in expected}
 # Cached first visit, no new RPC.
 page.locator('[data-nav="catalogs"]').click()
 page.locator('[data-cat-tab="tinhtrang"]').click()
 page.wait_for_selector('[data-edit-status="DA_THAM_GIA"]',timeout=10000)
 assert page.locator('th',has_text='Hồ sơ đang dùng').count()==0
 assert page.locator('[data-edit-status="CUS_INA001"]').count()==0
 assert page.locator('[data-edit-status="CUS_PEND001"]').count()==1
 assert page.locator('[data-delete-status="DA_THAM_GIA"]').count()==1
 assert model['calls'].count('status_manage_list')==before['status_manage_list'], model['calls']
 page.locator('[data-nav="accounts"]').click()
 page.wait_for_selector('#accounts-output table',timeout=10000)
 assert model['calls'].count('accounts_list')==before['accounts_list']
 page.locator('[data-nav="audits"]').click()
 page.wait_for_selector('#audit-output table',timeout=10000)
 assert model['calls'].count('audit_list')==before['audit_list']
 page.locator('[data-nav="catalogs"]').click()
 page.locator('[data-cat-tab="tinhtrang"]').click()
 page.wait_for_selector('[data-delete-status="DA_THAM_GIA"]')
 page.locator('[data-delete-status="DA_THAM_GIA"]').click()
 page.wait_for_selector('[data-confirm-status-delete="DA_THAM_GIA"]')
 page.locator('[data-confirm-status-delete="DA_THAM_GIA"]').click()
 page.wait_for_function('!document.querySelector("[data-delete-status=DA_THAM_GIA]")',timeout=12000)
 assert model['deleted']==['DA_THAM_GIA']
 assert not errors,errors
 page.close();browser.close()
print('YC036_CHROMIUM_OK: bounded preload, cached menu navigation, status manage actions, soft delete/hidden old statuses')

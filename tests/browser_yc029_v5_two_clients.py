"""YC-HN-029 V5: two real Chromium tabs, mock remote Apps Script/Sheets; no production requests."""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
src=re.sub(r'^import .*\n','',(root/'public/app.js').read_text(),count=1)
src=re.sub(r'^export const tests = .*$', '',src,flags=re.MULTILINE)
row={'HO_SO_ID':'HS_CLIENT1','SO_QUYET_DINH':'6273','NAM_QUYET_DINH':'2026','NGAY_QUYET_DINH':'2026-09-01','HO_TEN':'Học viên C','TRUONG_ID':'S1','NGHE_ID':'N1','TRANG_THAI_THAM_GIA':'CHO_XAC_NHAN','DA_BO_HOC':'FALSE','PHIEN_BAN':'1','HAS_FILE':False,'TAO_BOI':'admin@example.test'}
backend={'revision':1,'writes':0,'checks':0,'requests':[]}
user={'TAI_KHOAN_ID':'STAFF01','EMAIL':'staff@example.test','HO_TEN':'Nhân viên kiểm thử','VAI_TRO':'NHAN_VIEN','TRUONG_ID':'','TRANG_THAI':'ACTIVE','CHUC_DANH_HIEN_THI':'Phó phòng A'}
def server(request):
 a=request.get('action');p=request.get('payload') or {}
 backend['requests'].append(a)
 if a=='bootstrap':
  return {'ok':True,'data':{'user':user,'statuses':[],'permissionRevision':'P1','dataRevision':'D'+str(backend['revision']),'catalogRevision':'C1','statusRevision':'S1','catalogs':{'truong':[{'TRUONG_ID':'S1','TEN_TRUONG':'Trường C','TRANG_THAI':'ACTIVE'}],'nghe':[{'NGHE_ID':'N1','TEN_NGHE':'Nghề A','TRANG_THAI':'ACTIVE'}],'lydo':[]}}}
 if a=='permission_check':
  backend['checks']+=1
  return {'ok':True,'data':{'user':user,'permissionRevision':'P1','dataRevision':'D'+str(backend['revision']),'catalogRevision':'C1','statusRevision':'S1'}}
 if a=='records_list':return {'ok':True,'data':{'items':[row.copy()],'total':1,'page':1,'pageSize':20}}
 if a=='overview':
  yes=int(row['TRANG_THAI_THAM_GIA']=='DA_THAM_GIA');no=int(row['TRANG_THAI_THAM_GIA']=='KHONG_THAM_GIA')
  return {'ok':True,'data':{'kpi':{'total':1,'participated':yes,'learning':yes,'dropout':0,'notParticipating':no,'pending':1-yes-no,'courseEndParticipated':0},'statusCounts':{'notReceived':0},'schoolCounts':{},'tradeCounts':{}}}
 if a=='record_fresh':return {'ok':True,'data':{'record':row.copy()}}
 if a=='record_status':
  if str(p.get('PHIEN_BAN'))!=row['PHIEN_BAN']:return {'ok':False,'error':{'code':'VERSION_CONFLICT','message':'SERVER CODE VERSION_CONFLICT'}}
  row.update({'TRANG_THAI_THAM_GIA':p.get('TRANG_THAI_THAM_GIA','CHO_XAC_NHAN'),'DA_BO_HOC':'TRUE' if p.get('DA_BO_HOC') in [True,'true','TRUE'] else 'FALSE','PHIEN_BAN':str(int(row['PHIEN_BAN'])+1)})
  backend['revision']+=1;backend['writes']+=1
  return {'ok':True,'data':{'record':row.copy()}}
 return {'ok':False,'error':{'code':'NO_PERMISSION'}}
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 a,b=[browser.new_page(viewport={'width':1440,'height':900}) for _ in range(2)]
 for page in [a,b]:
  page.on('pageerror',lambda err: errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.expose_function('mockServer',server)
  page.evaluate('''() => {
    window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};
    window.fetch=async(url,opts={})=>String(url).includes('/api/config')
      ?new Response(JSON.stringify({ok:true,clientId:'mock'}))
      :new Response(JSON.stringify(await window.mockServer(JSON.parse(opts.body))),{headers:{'Content-Type':'application/json'}});
  }''')
  page.evaluate('src=>{const sc=document.createElement("script");sc.textContent=src;document.body.appendChild(sc)}',src)
  page.wait_for_selector('.kpi',timeout=12000)
 assert b.locator('.kpi .metric').nth(1).inner_text()=='0'
 assert len(a.locator('#navigation button').all())==3
 # A saves status; B stays on its old dashboard (stale until revision check).
 a.locator('[data-nav="records"]').click()
 a.locator('[data-status-record="HS_CLIENT1"]').click()
 a.locator('#status-form [name="UI_TINH_TRANG"]').select_option('DA_THAM_GIA')
 a.locator('#status-form [data-submit-btn]').click()
 a.wait_for_function('document.querySelector("#modal-layer").classList.contains("hidden")',timeout=12000)
 assert b.locator('.kpi .metric').nth(1).inner_text()=='0','No push without check; widget should not pretend realtime.'
 # Permission check sees new revision, refreshes dashboard results without rebuilding filters.
 b.evaluate('verifyPermission(true)')
 b.wait_for_function('document.querySelectorAll(".kpi .metric")[1]?.textContent.trim()==="1"',timeout=10000)
 assert not b.evaluate('state.needsActiveRefresh')
 # B opens status draft, A changes the same record while B is editing.
 b.locator('[data-nav="records"]').click()
 b.wait_for_selector('[data-status-record="HS_CLIENT1"]')
 b.locator('[data-status-record="HS_CLIENT1"]').click()
 b.locator('#status-form [name="UI_TINH_TRANG"]').select_option('DA_THAM_GIA')
 a.locator('[data-status-record="HS_CLIENT1"]').click()
 a.locator('#status-form [name="UI_TINH_TRANG"]').select_option('KHONG_THAM_GIA')
 a.locator('#status-form [data-submit-btn]').click()
 a.wait_for_function('document.querySelector("#modal-layer").classList.contains("hidden")',timeout=12000)
 assert row['PHIEN_BAN']=='3'
 b.locator('#status-form [data-submit-btn]').click()
 b.wait_for_selector('#status-conflict',timeout=12000)
 message=b.locator('#status-conflict').inner_text()
 assert 'Hồ sơ vừa được người khác cập nhật' in message
 assert 'Không tham gia' in message and 'Đã tham gia học' in message
 assert b.locator('#status-form [name="UI_TINH_TRANG"]').input_value()=='DA_THAM_GIA'
 assert row['TRANG_THAI_THAM_GIA']=='KHONG_THAM_GIA' and backend['writes']==2,'No silent stale overwrite.'
 assert b.locator('#status-form [data-submit-btn]').is_disabled()
 b.locator('[data-accept-conflict]').click()
 assert b.locator('#status-form [data-submit-btn]').is_enabled()
 b.locator('#status-form [data-submit-btn]').click()
 b.wait_for_function('document.querySelector("#modal-layer").classList.contains("hidden")',timeout=12000)
 assert backend['writes']==3 and row['TRANG_THAI_THAM_GIA']=='DA_THAM_GIA'
 assert not errors,errors
 a.close();b.close();browser.close()
print('YC029_V5_2_CLIENT_BROWSER_OK: revision check refresh, conflict retained draft, explicit retry, no silent overwrite')

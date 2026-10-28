"""YC-HN-031 — Chromium UI integration with mock backend, no production changes."""
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
src=re.sub(r'^export const tests = .*$', '',src,flags=re.MULTILINE)
trades=[{'NGHE_ID':trade,'TEN_NGHE':f'Nghề {trade}','TRANG_THAI':'ACTIVE'} for trade in ['T1','T2','T3','T4']]
schools=[{'TRUONG_ID':key,'TEN_TRUONG':f'Trường {key}','TRANG_THAI':'ACTIVE'} for key in ['A','B']]
rows=[{'TRUONG_ID':'A','NGHE_ID':'T1','HO_SO_ID':'R1'},{'TRUONG_ID':'A','NGHE_ID':'T2','HO_SO_ID':'R2'},{'TRUONG_ID':'B','NGHE_ID':'T3','HO_SO_ID':'R3'}]
rev={'data':1,'A':1,'B':1}
calls={'A':[],'B':[],'ADMIN':[],'NHAN_VIEN':[]}

def make_user(label):
 return {'TAI_KHOAN_ID':'ACC_'+label,'EMAIL':label.lower()+'@example.test','HO_TEN':'Người kiểm thử '+label,
  'VAI_TRO':label if label in ['ADMIN','NHAN_VIEN'] else 'CO_SO_DAO_TAO',
  'TRUONG_ID':label if label in ['A','B'] else '', 'TRANG_THAI':'ACTIVE','CHUC_DANH_HIEN_THI':''}

def do_rpc(label,req):
 action=req.get('action');payload=req.get('payload') or {}
 calls[label].append(action)
 user=make_user(label)
 data_revision='D'+str(rev['data'])
 if action in ('bootstrap','permission_check'):
  result={'user':user,'permissionRevision':'P1','dataRevision':data_revision,'catalogRevision':'C1','statusRevision':'S1',
    'tradeScopeRevision':'S'+str(rev[label]) if label in ['A','B'] else ''}
  if action=='bootstrap':
   permitted={r['NGHE_ID'] for r in rows if r['TRUONG_ID']==label} if label in ['A','B'] else {c['NGHE_ID'] for c in trades}
   result['catalogs']={'truong':[s for s in schools if s['TRUONG_ID']==label] if label in ['A','B'] else schools,
        'nghe':[x for x in trades if x['NGHE_ID'] in permitted], 'lydo':[]}
   result['statuses']=[]
  return {'ok':True,'data':result}
 visible=[r for r in rows if label not in ['A','B'] or r['TRUONG_ID']==label]
 f=[r for r in visible if (not payload.get('nghe') or r['NGHE_ID']==payload['nghe'])]
 if action=='overview':
  total=len(f)
  return {'ok':True,'data':{'kpi':{'total':total,'participated':0,'learning':0,'dropout':0,'notParticipating':0,'pending':total,'courseEndParticipated':0},
          'statusCounts':{'notReceived':0},'schoolCounts':{},'tradeCounts':{x['NGHE_ID']:sum(1 for r in f if r['NGHE_ID']==x['NGHE_ID']) for x in trades}}}
 if action=='records_list':
  recs=[{**r,'HO_TEN':'Người học thử','SO_QUYET_DINH':'6001','NAM_QUYET_DINH':'2026','NGAY_QUYET_DINH':'2026-10-01','TRANG_THAI_THAM_GIA':'CHO_XAC_NHAN','DA_BO_HOC':'FALSE','PHIEN_BAN':'1','HAS_FILE':False} for r in f]
  return {'ok':True,'data':{'items':recs,'total':len(recs),'page':1,'pageSize':20}}
 return {'ok':False,'error':{'code':'NO_PERMISSION'}}

def options(page,section):
 return page.locator('#'+section+'-filters select[name="nghe"] option').evaluate_all('(els)=>els.map(e=>e.value)')

errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 pages={}
 for label in ['A','B','ADMIN','NHAN_VIEN']:
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda err: errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.expose_function('mockServer',lambda req,key=label:do_rpc(key,req))
  page.evaluate('''() => {
    window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};
    window.fetch=async(url,opts={})=>String(url).includes('/api/config')
      ?new Response(JSON.stringify({ok:true,clientId:'mock'}))
      :new Response(JSON.stringify(await window.mockServer(JSON.parse(opts.body))),{headers:{'Content-Type':'application/json'}});
  }''')
  page.evaluate('src=>{const script=document.createElement("script");script.textContent=src;document.body.appendChild(script)}',src)
  page.wait_for_selector('.kpi',timeout=15000)
  pages[label]=page
 assert options(pages['A'],'dashboard')==['','T1','T2']
 assert options(pages['B'],'dashboard')==['','T3']
 assert options(pages['ADMIN'],'dashboard')==['','T1','T2','T3','T4']
 assert options(pages['NHAN_VIEN'],'dashboard')==['','T1','T2','T3','T4']
 for label,expected in [('A',['','T1','T2']),('B',['','T3'])]:
  pg=pages[label]
  assert len(pg.locator('#navigation button').all())==3
  for name,section in [('records','records'),('reports','reports'),('dashboard','dashboard')]:
   pg.locator(f'[data-nav="{name}"]').click()
   pg.wait_for_selector(f'#{section}-filters select[name="nghe"]',timeout=10000)
   assert options(pg,section)==expected,(label,name,options(pg,section))
 A=pages['A'];B=pages['B']
 # A đang chọn nghề T2 trên Tổng quan.
 A.locator('#dashboard-filters select[name="nghe"]').select_option('T2')
 A.locator('#dashboard-filters button[type="submit"]').click()
 A.wait_for_function('state.dashboardFilters.nghe==="T2"')
 # ADMIN chuyển hồ sơ cuối cùng của T2 ra khỏi A, thêm nghề T3 cho A.
 rows[:]=[r for r in rows if r['HO_SO_ID']!='R2'] + [{'TRUONG_ID':'A','NGHE_ID':'T3','HO_SO_ID':'R4'}]
 rev['data']+=1;rev['A']+=1
 before_b_boot=calls['B'].count('bootstrap')
 A.evaluate('verifyPermission(true)')
 A.wait_for_function('state.dashboardFilters.nghe==="" && document.querySelector("#dashboard-filters select[name=nghe]")?.options.length===3',timeout=10000)
 assert options(A,'dashboard')==['','T1','T3']
 assert A.locator('#dashboard-filters select[name="nghe"]').input_value()==''
 # B phát hiện DATA revision nhưng tập nghề không thay đổi, KHÔNG phát sinh bootstrap.
 B.evaluate('verifyPermission(true)')
 B.wait_for_function('state.dataRevision==="D2"',timeout=10000)
 assert calls['B'].count('bootstrap')==before_b_boot
 assert options(B,'dashboard')==['','T3']
 # Sau khi quay lại ba menu của A đều thấy nghề mới, không còn nghề T2.
 for name in ['records','reports','dashboard']:
  A.locator(f'[data-nav="{name}"]').click()
  A.wait_for_selector(f'#{name}-filters select[name="nghe"]',timeout=10000)
  assert options(A,name)==['','T1','T3']
 assert not errors, errors
 for page in pages.values():page.close()
 browser.close()
print('YC031_CHROMIUM_OK: A/B isolation; 3 menus; added/removed trade; invalid filter reset; B no extra bootstrap; admin/staff unchanged')

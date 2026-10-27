"""YC-HN-028 V2 browser integration against mocked API; no access to real account/Sheets."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>','',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+(root/'public/styles.css').read_text()+'</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','')
html=re.sub(r'<script type="module" src="/app\.js\?v=[^" ]+"></script>','',html)
app=re.sub(r'^import .*\n','',(root/'public/app.js').read_text(),count=1)
app=re.sub(r'^export const tests = .*$', '',app,flags=re.MULTILINE)
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
 for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
  page=browser.new_page(viewport={'width':1600,'height':900})
  page.on('pageerror',lambda err:errors.append(role+': '+str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}''')
  page.evaluate('''role=>{
    window.calls=[];window.exported=[];window.printCount=0;window.print=()=>window.printCount++;
    window.demoRole=role; window.displayTitle='Nhân viên Phòng A'; window.revision='P1';
    window.accountRows=[{TAI_KHOAN_ID:'STAFF1',EMAIL:'staff@example.test',HO_TEN:'Nguyễn Văn A',VAI_TRO:'NHAN_VIEN',TRUONG_ID:'',TRANG_THAI:'ACTIVE',CHUC_DANH_HIEN_THI:''}];
    const user=()=>({TAI_KHOAN_ID:'U_'+role,EMAIL:role.toLowerCase()+'@example.test',HO_TEN:'Nguyễn Văn A',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE',CHUC_DANH_HIEN_THI:role==='NHAN_VIEN'?window.displayTitle:''});
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const req=JSON.parse(opt.body),a=req.action,p=req.payload||{};
      window.calls.push({action:a,payload:p}); let data={};
      if(a==='bootstrap')data={user:user(),permissionRevision:window.revision,dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',statuses:[],catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường C',TRANG_THAI:'ACTIVE'},{TRUONG_ID:'S2',TEN_TRUONG:'Trường D',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề A',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      else if(a==='permission_check')data={user:user(),permissionRevision:window.revision,dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1'};
      else if(a==='accounts_list'){
        if(role!=='ADMIN')return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
        data={items:window.accountRows};
      }else if(a==='account_save'){
        if(role!=='ADMIN')return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
        const title=p.role==='NHAN_VIEN'?p.displayTitle.replace(/\\s+/g,' ').trim():'';
        window.accountRows[0]={...window.accountRows[0],HO_TEN:p.name,EMAIL:p.email,VAI_TRO:p.role,TRANG_THAI:p.status,CHUC_DANH_HIEN_THI:title};
        window.revision='P2';data={item:window.accountRows[0]};
      }else if(a==='overview')data={kpi:{total:2,participated:1,learning:1,dropout:0,notParticipating:0,pending:1,courseEndParticipated:1},statusCounts:{notReceived:0,other:0},schoolCounts:{},tradeCounts:{}};
      else if(a==='report_export')data={columns:Array.from({length:25},(_,i)=>'Cột '+(i+1)),items:Array.from({length:2},()=>Array(25).fill(''))};
      else if(a==='report_matrix')data={total:2,items:[{name:'Trường C',total:2,participated:1,learning:1,dropout:0,notParticipating:0,notReceived:0,pending:1,courseEndParticipated:1,other:0,customStatusCounts:{}}]};
      else if(a==='records_list')data={items:[],total:0,page:1,pageSize:20};
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('source=>{const script=document.createElement("script");script.textContent="const downloadReportXlsx=(name,cols,rows)=>window.exported.push({name,cols,rows});const downloadXlsx=(name,rows)=>window.exported.push({name,rows});\\n"+source;document.body.append(script)}',app)
  page.wait_for_selector('.kpi',timeout=12000)
  if role=='ADMIN':
   assert page.locator('#current-user span').inner_text()=='Quản trị viên'
   page.locator('[data-nav="accounts"]').click()
   page.wait_for_selector('#accounts-output table tbody tr',timeout=12000)
   assert page.locator('#accounts-output th').filter(has_text='Chức danh/Phòng ban').count()==1
   page.locator('[data-edit-account]').click()
   assert not page.locator('.account-display-title').is_hidden()
   page.locator('#account-form [name="displayTitle"]').fill('Trưởng phòng B')
   page.locator('#account-form [data-submit-btn]').click()
   page.wait_for_function('window.accountRows[0].CHUC_DANH_HIEN_THI==="Trưởng phòng B"',timeout=12000)
   page.wait_for_selector('#accounts-output table tbody tr',timeout=12000)
   assert 'Trưởng phòng B' in page.locator('#accounts-output table tbody tr').inner_text()
   assert page.locator('#accounts-output table tbody tr td').nth(2).inner_text()=='Nhân viên'
   page.locator('[data-edit-account]').click()
   page.locator('#account-form [name="role"]').select_option('CO_SO_DAO_TAO')
   assert page.locator('.account-display-title').is_hidden()
   assert page.locator('#account-form [name="displayTitle"]').is_disabled()
   assert not page.locator('.account-school').is_hidden()
   page.locator('#account-form [name="role"]').select_option('NHAN_VIEN')
   assert not page.locator('.account-display-title').is_hidden()
   assert page.locator('.account-school').is_hidden()
  else:
   assert len(page.locator('#navigation [data-nav]').all())==3
   assert page.locator('#current-user span').inner_text()==('Nhân viên Phòng A' if role=='NHAN_VIEN' else 'Cơ sở đào tạo: Trường C')
   if role=='NHAN_VIEN':
    page.evaluate('''() => {window.displayTitle='Trưởng phòng B';window.revision='P2';state.permissionChecked=0;}''')
    page.evaluate('async()=>{await verifyPermission()}')
    assert page.locator('#current-user span').inner_text()=='Trưởng phòng B'
    assert len(page.locator('#navigation [data-nav]').all())==3
    assert page.locator('#app').is_visible()
    page.evaluate('''() => {window.displayTitle='';window.revision='P3';state.permissionChecked=0;}''')
    page.evaluate('async()=>{await verifyPermission()}')
    assert page.locator('#current-user span').inner_text()=='Nhân viên'
   page.locator('[data-nav="reports"]').click()
   page.wait_for_selector('#report-export',timeout=12000)
   page.locator('#print-report').click(); assert page.evaluate('window.printCount')==1
   for index,mode in enumerate(['list','summary','truong','nghe'],start=1):
    page.locator('#report-export').click()
    page.locator('#report-export-form [name="mode"]').select_option(mode)
    page.locator('#report-export-form [data-submit-btn]').click()
    page.wait_for_function('(n)=>window.exported.length===n',arg=index,timeout=12000)
   assert page.evaluate('window.exported[2].cols.includes("Đã tham gia")')
   assert page.evaluate('window.exported[3].cols.includes("Hoàn thành khóa học")')
  page.close()
 browser.close()
assert not errors,errors
print('YC028_BROWSER_OK: ADMIN edit/display role, NHAN_VIEN live title refresh + 4 Excel and print, CO_SO_DAO_TAO legacy exports')

"""YC027 Chromium role UI; mocked signed gateway, no live personal data."""
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
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for role in ['ADMIN','NHAN_VIEN','CO_SO_DAO_TAO']:
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''() => {window.google={accounts:{id:{initialize:()=>{},renderButton:()=>{},disableAutoSelect:()=>{}}}};}''')
  page.evaluate('''role=>{
    window.calls=[];window.db=[
      {HO_SO_ID:'HS_S1',SO_QUYET_DINH:'701',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-09-01',HO_TEN:'Học viên Trường C',TRUONG_ID:'S1',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false,TAO_BOI:'admin@example.test'},
      {HO_SO_ID:'HS_S2',SO_QUYET_DINH:'702',NAM_QUYET_DINH:'2026',NGAY_QUYET_DINH:'2026-09-02',HO_TEN:'Học viên Trường D',TRUONG_ID:'S2',NGHE_ID:'N1',TRANG_THAI_THAM_GIA:'CHO_XAC_NHAN',DA_BO_HOC:'FALSE',PHIEN_BAN:'1',HAS_FILE:false,TAO_BOI:'admin@example.test'}
    ];
    const user={TAI_KHOAN_ID:'ACT_'+role,EMAIL:role.toLowerCase()+'@example.test',HO_TEN:'Thử nghiệm',VAI_TRO:role,TRUONG_ID:role==='CO_SO_DAO_TAO'?'S1':'',TRANG_THAI:'ACTIVE'};
    const view=()=>window.db.filter(r=>role!=='CO_SO_DAO_TAO'||r.TRUONG_ID==='S1');
    window.fetch=async(url,opt)=>{
      if(String(url).includes('/api/config'))return new Response(JSON.stringify({ok:true,clientId:'mock'}));
      const req=JSON.parse(opt.body),a=req.action,p=req.payload||{};window.calls.push({action:a,id:p.HO_SO_ID});let data={};
      if(a==='bootstrap')data={user,statuses:[],permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1',catalogs:{truong:[{TRUONG_ID:'S1',TEN_TRUONG:'Trường C',TRANG_THAI:'ACTIVE'},{TRUONG_ID:'S2',TEN_TRUONG:'Trường D',TRANG_THAI:'ACTIVE'}],nghe:[{NGHE_ID:'N1',TEN_NGHE:'Nghề A',TRANG_THAI:'ACTIVE'}],lydo:[]}};
      else if(a==='permission_check')data={user,permissionRevision:'P1',dataRevision:'D1',catalogRevision:'C1',statusRevision:'S1'};
      else if(a==='overview')data={kpi:{total:view().length,participated:0,learning:0,dropout:0,notParticipating:0,pending:view().length,courseEndParticipated:0},statusCounts:{notReceived:0},schoolCounts:{},tradeCounts:{}};
      else if(a==='records_list'){
        const filtered=view().filter(x=>!p.truong||x.TRUONG_ID===p.truong);
        data={items:filtered,total:filtered.length,page:1,pageSize:20};
      } else if(a==='record_status'){
        const row=view().find(x=>x.HO_SO_ID===p.HO_SO_ID);
        if(!row)return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
        if(String(row.PHIEN_BAN)!==String(p.PHIEN_BAN))return new Response(JSON.stringify({ok:false,error:{code:'VERSION_CONFLICT'}}));
        Object.assign(row,{TRANG_THAI_THAM_GIA:p.TRANG_THAI_THAM_GIA,DA_BO_HOC:p.DA_BO_HOC?'TRUE':'FALSE',PHIEN_BAN:String(Number(row.PHIEN_BAN)+1),CAP_NHAT_BOI:user.EMAIL});data={record:row};
      } else if(['record_save','record_delete','file_upload_begin','account_save','catalog_save'].includes(a)){
        if(role!=='ADMIN')return new Response(JSON.stringify({ok:false,error:{code:'NO_PERMISSION'}}));
      }
      return new Response(JSON.stringify({ok:true,data}),{headers:{'Content-Type':'application/json'}});
    };
  }''',role)
  page.evaluate('src=>{const script=document.createElement("script");script.textContent=src;document.body.append(script)}',src)
  page.wait_for_selector('.kpi',timeout=12000)
  menus=page.locator('#navigation button[data-nav]').all_text_contents()
  if role=='ADMIN':
   assert len(menus)==6,menus
  else:
   assert len(menus)==3,menus
   assert ['Tổng quan','Hồ sơ học nghề','Báo cáo']==[x.strip() for x in menus],menus
  page.locator('[data-nav="records"]').click()
  expected=1 if role=='CO_SO_DAO_TAO' else 2
  page.wait_for_function('(n)=>document.querySelectorAll("#list-output tr[data-record-id]").length===n',arg=expected,timeout=12000)
  assert page.locator('[data-status-record]').count()==expected,role
  if role!='ADMIN':
   assert page.locator('[data-edit-record]').count()==0,role
   assert page.locator('[data-delete-record]').count()==0,role
   assert page.locator('[data-file-modal]').count()==0,role
   assert page.locator('[data-new-record]').count()==0,role
  if role=='NHAN_VIEN':
   for ident in ['HS_S1','HS_S2']:
    page.locator('[data-status-record="'+ident+'"]').click()
    page.locator('#status-form [name="UI_TINH_TRANG"]').select_option('DA_THAM_GIA')
    page.locator('#status-form [data-submit-btn]').click()
    page.wait_for_function('document.querySelector("#modal-layer").classList.contains("hidden")',timeout=12000)
   assert page.evaluate('window.calls.filter(x=>x.action==="record_status").map(x=>x.id)')==['HS_S1','HS_S2']
   assert page.evaluate('window.db.every(x=>x.CAP_NHAT_BOI==="nhan_vien@example.test")')
  if role=='CO_SO_DAO_TAO':
   assert page.locator('tr[data-record-id="HS_S2"]').count()==0
  page.close()
 browser.close()
assert not errors,errors
print('YC027_BROWSER_OK: ADMIN six menus; NHAN_VIEN three menus, both schools status editable only; CO_SO_DAO_TAO restricted to own school')

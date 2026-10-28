"""YC-HN-030: Browser test for six dropout months, no long help text."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
src=(root/'public/app.js').read_text(encoding='utf8')
snippet=src[src.index('function dropoutMaxPeriod('):src.index('function recordPayload(')]
helpers="""const option=(v,l,s='')=>`<option value="${v}" ${v===s?'selected':''}>${l}</option>`;
const dateVN=v=>v.split('-').reverse().join('/');const esc=v=>String(v);
const selectField=(a,b,c)=>'';const activeCatOptions=()=>'';
"""+snippet
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 page.set_content('<form id="record-form" data-support-months="3" data-original-period=""><select name="UI_TINH_TRANG"><option value="BO_HOC">Bỏ học</option></select><input name="SO_THANG_HO_TRO" value="3"><div class="dropout-only"><select name="NGAY_BO_HOC"></select></div></form>')
 page.evaluate('code=>{const el=document.createElement("script");el.textContent=code;document.body.appendChild(el)}',helpers)
 page.evaluate('updateDropoutFields(document.querySelector("form"))')
 assert page.locator('[name="NGAY_BO_HOC"] option').count()==7
 for n in [1,2,3]:assert page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').is_enabled(),n
 for n in [4,5,6]:assert page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').is_disabled(),n
 for n in [7,8,9,10,11,12]:assert page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').count()==0,n
 page.locator('[name="NGAY_BO_HOC"]').select_option('KY:3')
 page.locator('[name="SO_THANG_HO_TRO"]').fill('2')
 page.evaluate('refreshDropoutPeriod(document.querySelector("form"))')
 assert page.locator('[name="NGAY_BO_HOC"]').input_value()==''
 page.locator('[name="SO_THANG_HO_TRO"]').fill('2,5')
 page.evaluate('refreshDropoutPeriod(document.querySelector("form"))')
 assert all(page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').is_disabled() for n in range(1,7))
 page.locator('[name="SO_THANG_HO_TRO"]').fill('12')
 page.evaluate('refreshDropoutPeriod(document.querySelector("form"))')
 assert page.locator('[name="NGAY_BO_HOC"] option[value="KY:6"]').is_enabled()
 assert page.locator('[name="NGAY_BO_HOC"] option[value="KY:7"]').count()==0
 browser.close()
print('YC030_BROWSER_OK: 1-6 only, no old hint, within support months, updates dynamically')

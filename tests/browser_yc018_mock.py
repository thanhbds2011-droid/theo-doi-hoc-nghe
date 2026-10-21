"""YC-HN-018: browser smoke for twelve dropout months and safe help text (mock-only)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
src=(root/'public/app.js').read_text()
snippet=src[src.index('function dropoutMaxPeriod('):src.index('function recordPayload(')]
# Minimal pure helpers; preserve actual production option logic and DOM update function.
helpers="""const option=(v,l,s='')=>`<option value="${v}" ${v===s?'selected':''}>${l}</option>`;
const dateVN=v=>v.split('-').reverse().join('/'); const esc=v=>String(v);
const selectField=(a,b,c)=>'';
const activeCatOptions=()=>'';
"""+snippet
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 page.set_content('<form id="record-form" data-support-months="3" data-original-period=""><select name="UI_TINH_TRANG"><option value="BO_HOC">Bỏ học</option></select><input name="SO_THANG_HO_TRO" value="3"><div class="dropout-only"><select name="NGAY_BO_HOC"></select><div data-dropout-help></div></div></form>')
 page.evaluate('code => {const el=document.createElement("script");el.textContent=code;document.body.appendChild(el);}', helpers)
 page.evaluate('updateDropoutFields(document.querySelector("form"))')
 assert page.locator('[name="NGAY_BO_HOC"] option').count()==13
 for n in [1,*range(4,13)]:
  assert page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').is_disabled(),n
 for n in [2,3]:assert page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').is_enabled(),n
 page.locator('[name="NGAY_BO_HOC"]').select_option('KY:3')
 page.locator('[name="SO_THANG_HO_TRO"]').fill('2')
 page.evaluate('refreshDropoutPeriod(document.querySelector("form"))')
 assert page.locator('[name="NGAY_BO_HOC"]').input_value()==''
 assert page.locator('[name="NGAY_BO_HOC"] option[value="KY:3"]').is_disabled()
 page.locator('[name="SO_THANG_HO_TRO"]').fill('2,5')
 page.evaluate('refreshDropoutPeriod(document.querySelector("form"))')
 assert 'không tự làm tròn' in page.locator('[data-dropout-help]').inner_text()
 assert all(page.locator(f'[name="NGAY_BO_HOC"] option[value="KY:{n}"]').is_disabled() for n in range(1,13))
 page.locator('[name="SO_THANG_HO_TRO"]').fill('12')
 page.evaluate('refreshDropoutPeriod(document.querySelector("form"))')
 assert page.locator('[name="NGAY_BO_HOC"] option[value="KY:12"]').is_enabled()
 browser.close()
print('YC018_BROWSER_OK: 12 options, limited by support months, dynamic revalidation, partial months disabled')

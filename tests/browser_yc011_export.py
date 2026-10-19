from playwright.sync_api import sync_playwright
from pathlib import Path
import re,zipfile
root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>','',html)
html=html.replace('<link rel="stylesheet" href="/styles.css"/>','<style>'+ (root/'public/styles.css').read_text() + '</style>')
html=html.replace('<script src="https://accounts.google.com/gsi/client" async defer></script>','').replace('<script type="module" src="/app.js"></script>','')
app=re.sub(r'export const tests = \{[^;]+;', '',(root/'public/app.js').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(accept_downloads=True)
 page.set_content(html);page.evaluate('src=>{let s=document.createElement("script");s.textContent=src;document.body.append(s)}',app)
 with page.expect_download() as info:
  page.evaluate('''() => {const first=Array(25).fill('Cột');first[12]='Thời gian đào tạo';first[13]='';const second=Array(25).fill('');second[12]='Từ ngày';second[13]='Đến ngày';const row=Array(25).fill('Dữ liệu');row[4]='00123456';downloadRecordXlsx('kiemtra.xlsx',[first,second,row]);}''')
 output='/mnt/data/yc011work/exporttest.xlsx';info.value.save_as(output)
 with zipfile.ZipFile(output) as z:
  assert z.testzip() is None
  xml=z.read('xl/worksheets/sheet1.xml').decode('utf8')
  assert 'M1:N1' in xml and '00123456' in xml and xml.count('<c r=')==75
  print('XLSX_EXPORT_BROWSER_OK',len(xml))
 b.close()

"""Hồi quy YC011: xuất 25 cột theo exporter dùng chung, kiểm tra mở được XLSX."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
source=(root/'public/xlsx-export.js').read_text().replace('export function ','function ')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(accept_downloads=True)
 page.set_content('<html><body>Kiểm thử xuất danh sách</body></html>')
 page.evaluate('src=>{const s=document.createElement("script");s.textContent=src;document.body.append(s)}',source)
 with page.expect_download() as info:
  page.evaluate('''() => {const h=Array(25).fill('Cột');h[12]='Thời gian đào tạo';h[13]='';const row=Array(25).fill('Dữ liệu');row[4]='00123456';downloadXlsx('kiemtra.xlsx',[h,row]);}''')
 target=Path('/mnt/data/work_hn020/yc011_exporttest.xlsx');info.value.save_as(target)
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  x=z.read('xl/worksheets/sheet1.xml').decode('utf8')
  assert 'M1:N1' in x and '00123456' in x and x.count('<c r=')==75
  assert 'xl/styles.xml' in z.namelist()
 print('XLSX_EXPORT_BROWSER_OK',len(x))
 b.close()

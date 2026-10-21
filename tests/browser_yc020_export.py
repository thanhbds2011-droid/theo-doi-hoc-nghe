"""YC-HN-020: Chromium kiểm tra XLSX tải về và Excel XML, không dùng dữ liệu thật."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import zipfile,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
src=(root/'public/xlsx-export.js').read_text().replace('export function ','function ')
ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(accept_downloads=True)
 page.set_content('<html><body>Kiểm thử xuất Excel danh sách học nghề</body></html>')
 page.evaluate('source=>{const s=document.createElement("script");s.textContent=source;document.body.append(s)}',src)
 with page.expect_download(timeout=60000) as d:
  page.evaluate('''()=>{
   const h=Array.from({length:25},(_,i)=>'Tiêu đề '+i);h[12]='Thời gian đào tạo';h[13]='';
   const row=Array(25).fill('');row[0]='1';row[1]='Học viên kiểm thử';row[2]='1997-09-17';row[3]='NU';row[4]='001234567890';row[6]='2026-10-13';row[14]='Trung tâm Đào tạo và Dạy nghề Kỹ thuật - Cơ sở thực hành dài';
   const all=Array.from({length:2433},(_,i)=>{const r=[...row];r[0]=String(i+1);return r;});
   downloadXlsx('kiem-thu-25-cot.xlsx',[h,...all]);
  }''')
 path=Path('/mnt/data/YC-HN-020_KIEM_THU_DINH_DANG_25_COT.xlsx');d.value.save_as(path)
 b.close()
with zipfile.ZipFile(path) as z:
 assert z.testzip() is None
 sheet=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
 styles=ET.fromstring(z.read('xl/styles.xml'))
 assert sheet.find('x:dimension',ns).attrib['ref']=='A1:Y2435'
 assert sheet.find('x:mergeCells/x:mergeCell',ns).attrib['ref']=='M1:N1'
 rows=sheet.findall('x:sheetData/x:row',ns);assert len(rows)==2435
 assert len(rows[2].findall('x:c',ns))==25
 def cell(ref):return sheet.find(f'.//x:c[@r="{ref}"]',ns)
 assert cell('C3').attrib['s']=='3' and cell('C3').find('x:v',ns) is not None
 assert cell('G3').attrib['s']=='3'
 assert cell('D3').find('x:is/x:t',ns).text=='Nữ'
 assert cell('E3').find('x:is/x:t',ns).text=='001234567890'
 assert cell('B3').attrib['s']=='2' and cell('O3').attrib['s']=='2'
 assert float(rows[2].attrib['ht'])>31
 assert styles.find('x:numFmts/x:numFmt',ns).attrib['formatCode']=='dd/mm/yyyy'
 assert len(styles.findall('x:cellXfs/x:xf',ns))==5
 print('YC020_XLSX_CHROMIUM_OK: 2433 rows, 25 columns, numeric dates, styles, Unicode, leading zeros, row heights')

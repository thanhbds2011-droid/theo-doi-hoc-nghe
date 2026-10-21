"""Kiểm thử browser tạo XLSX mẫu, kiểm tra XML kiểu căn lề; dữ liệu giả lập."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from zipfile import ZipFile
from xml.etree import ElementTree as ET
root=Path(__file__).resolve().parents[1]
source=(root/'public/xlsx-export.js').read_text().replace('export function ','function ')
out=Path('/mnt/data/YC-HN-021_V5_1_EXCEL_MAU_KIEM_THU.xlsx')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(accept_downloads=True)
 page.set_content('<html><body>Xuất XLSX mẫu kiểm thử định dạng</body></html>')
 page.evaluate('src=>{const s=document.createElement("script");s.textContent=src;document.body.append(s)}',source)
 with page.expect_download(timeout=25000) as d:
  page.evaluate('''()=>{
    const headers=Array.from({length:25},(_,i)=>`Cột ${i+1}`);headers[1]='Họ và tên';headers[9]='Nghề đăng ký';headers[14]='Cơ sở đào tạo nghề';headers[17]='Địa chỉ tạm trú';
    headers[12]='Thời gian đào tạo';headers[13]='';
    const r=Array(25).fill('');r[0]='1';r[1]='Học viên giả lập để kiểm tra căn trái và xuống dòng';r[2]='1996-09-15';r[3]='NU';r[4]='001234567890';r[6]='2026-10-13';r[9]='Kỹ thuật pha chế và phục vụ đồ uống có thời lượng nhiều buổi thực hành';r[14]='Trung tâm giáo dục nghề nghiệp và giáo dục thường xuyên dành cho học viên tại khu vực thử nghiệm';r[17]='Địa chỉ tạm trú mô phỏng, được nhập thành một đoạn rất dài để kiểm tra Wrap Text';r[18]='Địa chỉ thường trú mẫu dạng văn bản dài căn giữa';r[21]='Nơi cấp giả lập căn giữa';r[22]='Địa chỉ cơ sở đào tạo giả lập căn giữa';
    downloadXlsx('kiem-thu-yc021-v5_1.xlsx',[headers,r]);
  }''')
 d.value.save_as(out)
 b.close()
with ZipFile(out) as z:
 assert z.testzip() is None
 N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 ws=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
 style=ET.fromstring(z.read('xl/styles.xml'))
 assert ws.find('s:dimension',N).attrib['ref']=='A1:Y3'
 xfs=style.findall('s:cellXfs/s:xf',N)
 def alignment(cellref):
  c=ws.find(f'.//s:c[@r="{cellref}"]',N)
  return c,xfs[int(c.attrib['s'])].find('s:alignment',N).attrib
 for col in ['B','J','O','R']:
  c,a=alignment(col+'3')
  assert a['horizontal']=='left' and a['vertical']=='center' and a['wrapText']=='1',(col,a)
 for col in ['A','D','E','F','H','K','L','S','T','V','W','X','Y']:
  c,a=alignment(col+'3')
  assert a['horizontal']=='center' and a['vertical']=='center',(col,a)
 for col in ['C','G','I','M','N','P','Q','U']:
  c,a=alignment(col+'3')
  assert a['horizontal']=='center' and a['vertical']=='center',(col,a)
 assert ws.find('s:mergeCells/s:mergeCell',N).attrib['ref']=='M1:N1'
 d,_=alignment('G3');assert d.find('s:v',N) is not None
 x,_=alignment('D3');assert x.find('s:is/s:t',N).text=='Nữ'
 x,_=alignment('E3');assert x.find('s:is/s:t',N).text=='001234567890'
 assert float(ws.find('s:sheetData/s:row[@r="3"]',N).attrib['ht'])>31
 print('YC021_V5_1_EXCEL_OK: 25 columns, left=B/J/O/R, center other 21, dd/mm/yyyy, Nam/Nữ, Wrap Text, row height')
print(out)

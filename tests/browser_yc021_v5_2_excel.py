"""Browser smoke-test for final approved 25-column Excel export; synthetic data only."""
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
src=(root/'public/xlsx-export.js').read_text().replace('export function ','function ')
out=Path('/mnt/data/YC-HN-021_V5_2_XUAT_EXCEL_MAU_KIEM_THU.xlsx')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(accept_downloads=True)
    page.set_content('<html><body>Kiểm tra xuất danh sách Excel</body></html>')
    page.evaluate('src=>{const s=document.createElement("script");s.textContent=src;document.body.append(s)}',src)
    with page.expect_download(timeout=25000) as d:
        page.evaluate('''()=>{
          const head=Array.from({length:25},(_,i)=>`Cột ${i+1}`);head[12]='Thời gian đào tạo';head[13]='';
          const make=()=>Array(25).fill('');
          const first=make();first[0]='1';first[1]='Học viên ví dụ';first[2]='2026-07-01';first[3]='NU';first[4]='001234567890';first[14]='Trường nghề ví dụ';first[21]='Nơi cấp ví dụ';first[22]='Địa chỉ trường ví dụ';
          const medium=make();medium[0]='2';medium[1]='Người học với họ tên và thông tin dài';medium[14]='Trung tâm giáo dục nghề nghiệp và giáo dục thường xuyên khu vực';medium[17]='Địa chỉ tạm trú dài hơn nhưng vẫn căn giữa tại cột R';medium[21]='Cơ quan cấp giấy tờ với tên dài để kiểm tra xuống dòng';medium[22]='Địa chỉ cơ sở đào tạo nhiều chữ, có dấu tiếng Việt và xuống dòng hợp lý trong cùng ô';
          const long=make();long[0]='3';long[1]='Tên người học mẫu rất dài'.repeat(3);long[9]='Đào tạo nghề kỹ thuật chuyên môn'.repeat(3);long[14]='Tên cơ sở đào tạo thử nghiệm rất dài '.repeat(6);long[17]='Địa chỉ tạm trú mẫu dài '.repeat(4);long[21]='Nơi cấp mẫu dài '.repeat(5);long[22]='Địa chỉ trường học dài '.repeat(7);
          downloadXlsx('mau-excel-yc021-v5_2.xlsx',[head,first,medium,long]);
        }''')
    d.value.save_as(out)
    browser.close()
N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with ZipFile(out) as z:
    assert z.testzip() is None
    ws=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    st=ET.fromstring(z.read('xl/styles.xml'))
    xfs=st.findall('s:cellXfs/s:xf',N)
    def cell(c):
        el=ws.find(f'.//s:c[@r="{c}"]',N)
        assert el is not None,c
        return el,xfs[int(el.get('s'))].find('s:alignment',N).attrib
    for col in ['B','J','O','V','W']:
        _,a=cell(f'{col}3');assert a.get('horizontal')=='left' and a.get('vertical')=='center' and a.get('wrapText')=='1',(col,a)
    for col in ['A','R','S','D','E','X','Y']:
        _,a=cell(f'{col}3');assert a.get('horizontal')=='center' and a.get('vertical')=='center',(col,a)
    h=[int(ws.find(f's:sheetData/s:row[@r="{i}"]',N).get('ht')) for i in [3,4,5]]
    assert h[0] < h[1] < h[2], h
    assert ws.find('s:mergeCells/s:mergeCell',N).get('ref')=='M1:N1'
    assert ws.find('s:dimension',N).get('ref')=='A1:Y5'
    for c in ['B3','D3','E3']:
        assert cell(c)[0].find('s:is/s:t',N) is not None
    assert cell('D3')[0].find('s:is/s:t',N).text=='Nữ'
    assert cell('E3')[0].find('s:is/s:t',N).text=='001234567890'
    assert cell('C3')[0].find('s:v',N) is not None
    print('BROWSER_XLSX_OK; rows=',h,'left=B/J/O/V/W; R=center, 25 columns; Excel date and zero-preservation OK')
print('TEST_OUTPUT=',out)

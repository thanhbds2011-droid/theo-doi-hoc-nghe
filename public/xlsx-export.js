/** Xuất XLSX trực tiếp trong trình duyệt; không chuyển dữ liệu cá nhân sang dịch vụ ngoài. */
const enc=new TextEncoder();
const xml=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const address=n=>{let s='';for(let x=n+1;x;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s;};
function crc32(data){let crc=0xffffffff;for(const x of data){crc^=x;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function zipStored(files){let at=0;const chunks=[],central=[];function u16(d,v){d.push(v&255,(v>>>8)&255);}function u32(d,v){u16(d,v&65535);u16(d,(v>>>16)&65535);}
  for(const [path,body] of files){const name=enc.encode(path),content=enc.encode(body),crc=crc32(content),hdr=[];u32(hdr,0x04034b50);u16(hdr,20);u16(hdr,0x800);u16(hdr,0);u16(hdr,0);u16(hdr,0);u32(hdr,crc);u32(hdr,content.length);u32(hdr,content.length);u16(hdr,name.length);u16(hdr,0);chunks.push(new Uint8Array(hdr),name,content);
  const cd=[];u32(cd,0x02014b50);u16(cd,20);u16(cd,20);u16(cd,0x800);u16(cd,0);u16(cd,0);u16(cd,0);u32(cd,crc);u32(cd,content.length);u32(cd,content.length);u16(cd,name.length);u16(cd,0);u16(cd,0);u16(cd,0);u16(cd,0);u32(cd,0);u32(cd,at);central.push(new Uint8Array(cd),name);at+=hdr.length+name.length+content.length;
  }const dirSize=central.reduce((n,x)=>n+x.length,0);const footer=[];u32(footer,0x06054b50);u16(footer,0);u16(footer,0);u16(footer,files.length);u16(footer,files.length);u32(footer,dirSize);u32(footer,at);u16(footer,0);return new Blob([...chunks,...central,new Uint8Array(footer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});}
// YC-HN-020: duy nhất một bộ xuất XLSX danh sách 25 cột, không can thiệp mẫu báo cáo.
const RECORD_DATE_COLUMNS=new Set([2,6,8,12,13,15,16,20]); // C,G,I,M,N,P,Q,U
const RECORD_WIDTHS=[9,30,15,13,24,18,18,18,18,27,18,17,16,16,52,18,18,19,20,31,18,23,25,22,24];
function dateSerial(value){
  const text=String(value??'').trim();if(!text)return null;
  let m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text),y,month,day;
  if(m){y=+m[1];month=+m[2];day=+m[3];}
  else {m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);if(!m)return null;day=+m[1];month=+m[2];y=+m[3];}
  if(y<1900||y>9999||month<1||month>12)return null;
  const d=new Date(Date.UTC(y,month-1,day));
  if(d.getUTCFullYear()!==y||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return null;
  const serial=Math.round((d.getTime()-Date.UTC(1899,11,30))/86400000);
  return y===1900&&month<3?serial-1:serial;
}
function genderLabel(raw){const s=String(raw??'').trim();return ({NAM:'Nam',NU:'Nữ',KHAC:'Khác'})[s.toUpperCase()]??s;}
function recordStyles(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Arial"/><color rgb="FF1F3C58"/></font><font><b/><sz val="11"/><name val="Arial"/><color rgb="FF123C67"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDEBFA"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFB8CADC"/></left><right style="thin"><color rgb="FFB8CADC"/></right><top style="thin"><color rgb="FFB8CADC"/></top><bottom style="thin"><color rgb="FFB8CADC"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1" indent="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
</cellXfs></styleSheet>`;}
function recordTextCell(value, row, col, style){
  const text=String(value??'');return `<c r="${address(col)}${row}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(text)}</t></is></c>`;
}
function recordRowHeight(row){
  let lines=1;
  row.forEach((v,i)=>{
    const value=String(v??'');if(!value)return;
    const width=RECORD_WIDTHS[i],perLine=Math.max(7,Math.floor((width-3)*.87));
    const lineCount=value.split(/\r?\n/).reduce((sum,line)=>sum+Math.max(1,Math.ceil(Array.from(line).length/perLine)),0);
    lines=Math.max(lines,lineCount);
  });
  return Math.min(122,Math.max(31,31+Math.max(0,lines-1)*15));
}
export function buildXlsx(rows){
  if(!Array.isArray(rows)||rows.length<1||rows[0]?.length!==25)throw Error('Cấu trúc danh sách phải có đúng 25 cột.');
  const header=rows[0].map(x=>String(x??''));header[12]='Thời gian đào tạo';header[13]='';
  const hasSecond=rows.length>1&&rows[1]?.length===25&&rows[1][12]==='Từ ngày'&&rows[1][13]==='Đến ngày'&&rows[1].every((v,i)=>i===12||i===13||String(v??'')==='');
  const second=Array(25).fill('');second[12]='Từ ngày';second[13]='Đến ngày';
  const data=[header,second,...rows.slice(hasSecond?2:1)];
  if(data.length>5002)throw Error('Chỉ hỗ trợ xuất tối đa 5.000 hồ sơ mỗi lần.');
  let invalidDateCount=0;
  const sheetRows=data.map((values,index)=>{
    if(!Array.isArray(values)||values.length!==25)throw Error('Dòng dữ liệu Excel không có đủ 25 cột.');
    const r=index+1,headerRow=index<2,formatted=values.map((v,col)=>index>=2&&col===3?genderLabel(v):v);
    const cells=formatted.map((value,col)=>{
      if(!headerRow&&RECORD_DATE_COLUMNS.has(col)){
        const serial=dateSerial(value);if(serial!==null)return `<c r="${address(col)}${r}" s="3"><v>${serial}</v></c>`;
        if(String(value??'').trim())invalidDateCount++;
      }
      const style=headerRow?(index===0?1:4):([1,14].includes(col)?2:0);
      return recordTextCell(value,r,col,style);
    }).join('');
    const height=headerRow?(index===0?43:33):recordRowHeight(formatted);
    return `<row r="${r}" ht="${height}" customHeight="1">${cells}</row>`;
  }).join('');
  if(invalidDateCount)console.warn(`YC-HN-020: ${invalidDateCount} ô ngày không hợp lệ được giữ nguyên văn bản; cần đối chiếu dữ liệu nguồn.`);
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:Y${data.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="31"/><cols>${RECORD_WIDTHS.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${sheetRows}</sheetData><mergeCells count="1"><mergeCell ref="M1:N1"/></mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  const files=[
    ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Danh sách" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml',recordStyles()],['xl/worksheets/sheet1.xml',sheet]
  ];
  return zipStored(files);
}
export function downloadXlsx(filename,rows){const blob=buildXlsx(rows),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}

/** YC-HN-013: bảng tham mưu nhóm theo cơ sở/nghề, ô số là số Excel thực. */
export function buildReportXlsx(columns, rows, title='Báo cáo học nghề', opts={}){
  if(!Array.isArray(columns)||columns.length<2||columns.length>12||!Array.isArray(rows))throw Error('Mẫu báo cáo không hợp lệ.');
  const n=columns.length;
  const cell=(value, r, c, style)=>{
    const a=address(c),at=`${a}${r}`;
    if(typeof value==='number' && Number.isFinite(value))return `<c r="${at}" s="${style||0}"><v>${value}</v></c>`;
    const valueText=String(value??'');
    return `<c r="${at}" t="inlineStr" s="${style||0}"><is><t xml:space="preserve">${xml(valueText)}</t></is></c>`;
  };
  const lines=[`<row r="1" ht="35" customHeight="1">${cell(title.toUpperCase(),1,0,3)}</row>`,
    `<row r="2" ht="38" customHeight="1">${columns.map((x,c)=>cell(x,2,c,1)).join('')}</row>`];
  rows.forEach((r,i)=>{
    if(!Array.isArray(r)||r.length!==n)throw Error('Số cột báo cáo không khớp mẫu.');
    const total=opts.matrixTotals && i===rows.length-1;
    lines.push(`<row r="${i+3}" ht="${total?36:31}" customHeight="1">${r.map((x,c)=>cell(x,i+3,c,total?5:typeof x==='number'?2:4)).join('')}</row>`);
  });
  const last=address(n-1);
  const ws=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}${rows.length+2}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${Array.from({length:n},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${i===1?52:i===0?8:22}" customWidth="1"/>`).join('')}</cols><sheetData>${lines.join('')}</sheetData><mergeCells count="${opts.matrixTotals?2:1}"><mergeCell ref="A1:${last}1"/>${opts.matrixTotals?`<mergeCell ref="A${rows.length+2}:B${rows.length+2}"/>`:''}</mergeCells><pageMargins left="0.4" right="0.4" top="0.55" bottom="0.55" header="0.2" footer="0.2"/></worksheet>`;
  const files=[
    ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Báo cáo học nghề" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font><font><b/><sz val="15"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCEAF9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FF777777"/></left><right style="thin"><color rgb="FF777777"/></right><top style="thin"><color rgb="FF777777"/></top><bottom style="thin"><color rgb="FF777777"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="3" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs></styleSheet>'],
    ['xl/worksheets/sheet1.xml',ws]
  ];
  return zipStored(files);
}
export function downloadReportXlsx(filename,columns,rows,title,opts={}){
  const blob=buildReportXlsx(columns,rows,title,opts),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {buildXlsx} from '../public/xlsx-export.js';

const header=Array.from({length:25},(_,i)=>`Cột ${i+1}`);
const sample=()=>Array(25).fill('');
function rowHeight(raw,r){
  const m=new RegExp(`<row r="${r}" ht="(\\d+)" customHeight="1">`).exec(raw);
  assert.ok(m,`Missing Excel row ${r}`);return Number(m[1]);
}

test('YC021 V5.2: mẫu đã CHỐT căn trái B/J/O/V/W, R và các cột khác center/middle',async()=>{
 const row=sample();for(const i of [1,9,14,17,21,22])row[i]=`Dữ liệu cột ${i}`;
 const raw=Buffer.from(await buildXlsx([header,row]).arrayBuffer()).toString('utf8');
 for(const col of ['B','J','O','V','W'])assert.match(raw,new RegExp(`<c r="${col}3" s="2"`),col);
 for(const col of ['A','R','S','D','X','Y'])assert.match(raw,new RegExp(`<c r="${col}3" s="0"`),col);
 assert.match(raw,/horizontal="left" vertical="center" wrapText="1"/);
 assert.match(raw,/horizontal="center" vertical="center" wrapText="1"/);
});

test('YC021 V5.2: chiều cao gọn theo nội dung, không làm mọi dòng cao như nhau',async()=>{
 const short=sample();short[1]='Nguyễn A';
 const medium=sample();medium[22]='Một mô tả địa chỉ cơ sở có độ dài đủ để chiếm nhiều dòng trên cột W của file Excel được xuất.';
 const long=sample();long[22]='Tên cơ sở đào tạo và địa chỉ dài '.repeat(8);
 const raw=Buffer.from(await buildXlsx([header,short,medium,long]).arrayBuffer()).toString('utf8');
 const h=[3,4,5].map(r=>rowHeight(raw,r));
 assert.equal(h[0],33,'hàng cực ngắn phải gọn');
 assert.ok(h[1]>h[0],`medium ${h[1]} > short ${h[0]}`);
 assert.ok(h[2]>h[1],`long ${h[2]} > medium ${h[1]}`);
 assert.ok(h[2] < 350,'height bounded');
 assert.match(raw,/<row r="1" ht="43"/);assert.match(raw,/<row r="2" ht="33"/);
});

test('YC021 V5.2: chữ nhiều dòng giữ nguyên, không mất giới tính hoặc định dạng ngày',async()=>{
 const row=sample();row[1]='Người học\nTên trên dòng khác';row[2]='2026-10-21';row[3]='NU';row[4]='0012553';
 const raw=Buffer.from(await buildXlsx([header,row]).arrayBuffer()).toString('utf8');
 assert.match(raw,/Người học\nTên trên dòng khác/);assert.match(raw,/dd\/mm\/yyyy/);
 assert.match(raw,/<c r="C3" s="3"><v>\d+<\/v><\/c>/);
 assert.match(raw,/Nữ/);assert.match(raw,/0012553/);
});

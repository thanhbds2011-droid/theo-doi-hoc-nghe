import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildXlsx} from '../public/xlsx-export.js';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
test('YC020: lịch dạng chỉ chọn, có năm tháng ngày, xóa ngày, hỗ trợ bàn phím',()=>{
 for(const s of ['calendar-date-input','readonly autocomplete','data-calendar-open','data-calendar-year','data-calendar-month','data-calendar-day','data-calendar-clear','data-calendar-today','ArrowLeft','ArrowRight','Escape'])assert.ok(app.includes(s),s);
 assert.match(css,/\.hn-date-calendar/);assert.match(app,/calendarISO/);
 assert.match(app,/filter-date-info/);assert.match(app,/dateFilterToISO\(data\.from/);
});
test('YC020: xuất 25 cột, ngày số Excel, giới tính có dấu, style căn phải B O',async()=>{
 const head=Array.from({length:25},(_,i)=>'Cột '+(i+1));head[12]='Thời gian đào tạo';head[13]='';
 const two=Array(25).fill('');two[12]='Từ ngày';two[13]='Đến ngày';
 const row=Array(25).fill('');row[1]='Bùi Thị Huỳnh Như';row[2]='1997-09-17';row[3]='NU';row[4]='001234';row[6]='2026-10-13';row[14]='Cơ sở đào tạo nghề ABC';
 const raw=Buffer.from(await buildXlsx([head,two,row]).arrayBuffer()).toString('utf8');
 assert.match(raw,/xl\/styles.xml/);assert.match(raw,/dd\/mm\/yyyy/);assert.match(raw,/mergeCell ref="M1:N1"/);
 assert.match(raw,/pane ySplit="2"/);assert.match(raw,/<c r="B3" s="2" t="inlineStr">/);
 assert.match(raw,/<c r="O3" s="2" t="inlineStr">/);
 assert.match(raw,/<c r="C3" s="3"><v>\d+<\/v><\/c>/);
 assert.match(raw,/<c r="G3" s="3"><v>\d+<\/v><\/c>/);
 assert.match(raw,/<c r="D3" s="0" t="inlineStr"><is><t xml:space="preserve">Nữ<\/t>/);
 assert.match(raw,/001234/);
 assert.match(raw,/horizontal="right" vertical="center" wrapText="1" indent="1"/);
 assert.match(raw,/horizontal="center" vertical="center" wrapText="1"/);
});
test('YC020: 5000 hồ sơ vẫn đủ dòng, ngày không hợp lệ giữ nguyên không đổi bừa',async()=>{
 const head=Array.from({length:25},(_,i)=>'Cột '+i);const list=Array.from({length:5000},(_,i)=>{const r=Array(25).fill('');r[0]=String(i+1);r[2]='2026-02-31';r[3]='NAM';return r;});
 const raw=Buffer.from(await buildXlsx([head,...list]).arrayBuffer()).toString('utf8');
 assert.match(raw,/dimension ref="A1:Y5002"/);
 assert.match(raw,/<c r="C3" s="0" t="inlineStr"><is><t xml:space="preserve">2026-02-31<\/t>/);
 assert.match(raw,/Nam/);
 await assert.rejects(async()=>buildXlsx([head,...list,list[0]]),/5\.000/);
});

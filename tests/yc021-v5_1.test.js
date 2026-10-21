import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildXlsx} from '../public/xlsx-export.js';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const gs=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('YC021 V5.1: title Thao tác and its icon cell share centered alignment, no other tables changed',()=>{
  assert.match(app,/<th class="record-action-header">Thao tác<\/th>/);
  assert.match(app,/<td class="record-action-cell"><div class="table-actions record-actions">/);
  assert.match(css,/#list-output th\.record-action-header,#list-output td\.record-action-cell\{text-align:center;vertical-align:middle\}/);
  assert.match(css,/\.table-actions\.record-actions\{[^}]*justify-content:center/);
  for (const code of ['data-detail-record','data-edit-record','data-delete-record','data-status-record','data-file-get','data-file-modal'])assert.ok(app.includes(code),code);
});
test('YC021 V5.1: number of decision only; year stays in filters and original records',()=>{
  const line=app.split('\n').find(x=>x.includes("$('#list-output').innerHTML="));
  assert.ok(line,'record list renderer exists');
  assert.match(line,/<th>Số QĐ<\/th>/);
  assert.match(line,/<td><b>\$\{esc\(r\.SO_QUYET_DINH\)\}<\/b><\/td>/);
  assert.doesNotMatch(line,/Năm \$\{esc\(r\.NAM_QUYET_DINH\)\}/);
  assert.match(app,/Năm quyết định/);
  assert.match(app,/NAM_QUYET_DINH/);
  assert.match(gs,/NAM_QUYET_DINH/);
});
test('YC021 V5.2: XLSX 25 columns, left B/J/O/V/W, center R and remaining columns, dates intact', async()=>{
  const head=Array.from({length:25},(_,i)=>'Header '+i);
  const row=Array.from({length:25},(_,i)=>`Value ${i}`);
  row[1]='Tên người học dài';row[9]='Nghề';row[14]='Cơ sở đào tạo dài';row[17]='Địa chỉ dài';row[3]='NU';row[2]='2026-10-21';
  const raw=Buffer.from(await buildXlsx([head,row]).arrayBuffer()).toString('utf8');
  for(const col of ['B','J','O','V','W'])assert.match(raw,new RegExp(`<c r="${col}3" s="2"`),col);
  for(const col of ['A','D','E','F','H','K','L','R','S','T','X','Y'])assert.match(raw,new RegExp(`<c r="${col}3" s="0"`),col);
  for(const col of ['C','G','I','M','N','P','Q','U']){
    if(col==='C')assert.match(raw,/<c r="C3" s="3"><v>\d+<\/v><\/c>/);
    else assert.match(raw,new RegExp(`<c r="${col}3" s="0"`),col);
  }
  assert.match(raw,/<mergeCell ref="M1:N1"\/>/);
  assert.match(raw,/dd\/mm\/yyyy/);
  assert.match(raw,/>Nữ<\/t>/);
});

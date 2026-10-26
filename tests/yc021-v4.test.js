import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildXlsx} from '../public/xlsx-export.js';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('YC021: user overrides V4 clear-X; input empty triggers automatic submit and no new button',()=>{
  assert.match(app,/input\.value\.trim\(\)!==''/);
  assert.match(app,/void applyRecordFilters\(form,1\)/);
  assert.match(app,/e\.target\.name!=='query'/);
  assert.match(app,/e\.isComposing/);
  assert.doesNotMatch(app,/data-clear-query|query-clear-button/);
});
test('YC021: scoped record icons preserve original data actions, deletion invalidates cache',()=>{
  for(const att of ['data-detail-record','data-edit-record','data-delete-record','data-status-record','data-file-get','data-file-modal'])assert.ok(app.includes(att),att);
  for(const name of ['eye','pencil','trash-2','clipboard-check','paperclip','file-down'])assert.ok(app.includes(`'${name}'`),name);
  assert.match(app,/expireCacheActions\(\['records_list','overview','report_matrix','report_export'\]\)/);
  assert.doesNotMatch(app,/if\(k\.startsWith\('records_list\|'\)\)/);
});
test('YC021: permission-gated navigation and safe aggregate without full sort',()=>{
  assert.match(app,/await verifyPermission\(\);/);
  assert.match(app,/function safeRouteShell\(/);
  assert.match(app,/saved\.scope===permissionScope\(\)&&saved\.dataRevision===state\.dataRevision/);
  assert.match(gas,/var source=sorted===false\?\(sourceRecords\|\|visibleRecords_\(user\)\)/);
  assert.match(gas,/reportRecords_\(filters,user,false,visible\)/);
});
test('YC021 V5.2: final approved Excel sample overrides V5.1; B/J/O/V/W left, R/S centered',async()=>{
  const head=Array.from({length:25},(_,i)=>'Cột '+i);
  const row=Array.from({length:25},()=> '');row[1]='Tên người học';row[14]='Cơ sở đào tạo có tên rất dài và có dấu tiếng Việt';
  row[9]='Nghề đào tạo';row[17]='Địa chỉ học nghề';row[3]='NU';row[6]='2026-10-21';
  const bytes=Buffer.from(await buildXlsx([head,row]).arrayBuffer()).toString('utf8');
  for(const col of ['B','J','O','V','W'])assert.match(bytes,new RegExp(`<c r="${col}3" s="3"`));
  for(const col of ['R','S'])assert.match(bytes,new RegExp(`<c r="${col}3" s="1"`));
  assert.match(bytes,/horizontal="left" vertical="center" wrapText="1"/);
  assert.match(bytes,/horizontal="center" vertical="center" wrapText="1"/);
  assert.match(bytes,/<c r="G3" s="4"><v>\d+<\/v>/);
  assert.match(bytes,/>Nữ<\/t>/);
});

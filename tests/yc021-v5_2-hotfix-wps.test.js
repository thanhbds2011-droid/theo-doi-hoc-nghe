import test from 'node:test';
import assert from 'node:assert/strict';
import {buildXlsx} from '../public/xlsx-export.js';
import {readFileSync} from 'node:fs';
const header=Array.from({length:25},(_,i)=>`Cột ${i+1}`);
const data=Array(25).fill('');
for(const [col,val] of [[1,'Người học'],[9,'Nghề đào tạo'],[14,'Cơ sở đào tạo'],[17,'Địa chỉ tạm trú'],[21,'Nơi cấp'],[22,'Địa chỉ cơ sở']])data[col]=val;
data[2]='2026-10-21';data[3]='NU';data[4]='0001234567';
const raw=Buffer.from(await buildXlsx([header,data]).arrayBuffer()).toString('utf8');

test('Hotfix: style 0 is neutral, never assigned to data cells (WPS-compatible)',()=>{
 assert.match(raw,/<cellXfs count="6">/);
 assert.match(raw,/<cellXfs count="6">[\s\S]*?<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"\/>/);
 assert.doesNotMatch(raw,/<c r="[A-Z]+3" s="0"/);
 for(const col of ['A','D','E','F','H','K','L','R','S','T','X','Y'])assert.match(raw,new RegExp(`<c r="${col}3" s="1"`));
 for(const col of ['B','J','O','V','W'])assert.match(raw,new RegExp(`<c r="${col}3" s="3"`));
 assert.match(raw,/<c r="C3" s="4"><v>\d+<\/v><\/c>/);
});
test('Hotfix: every body style has explicit border, horizontal + vertical alignment',()=>{
 const styles=raw.match(/<cellXfs count="6">([\s\S]*?)<\/cellXfs>/)?.[1];assert.ok(styles);
 const xfs=[...styles.matchAll(/<xf \b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].map(m=>m[0]);
 assert.equal(xfs.length,6);
 for(const idx of [1,3,4]){
  assert.match(xfs[idx],/borderId="1"/);assert.match(xfs[idx],/horizontal="(?:left|center)" vertical="center"/);
 }
 assert.match(xfs[1],/horizontal="center" vertical="center" wrapText="1"/);
 assert.match(xfs[3],/horizontal="left" vertical="center" wrapText="1"/);
});
test('Hotfix: versioned script URLs prevent stale xlsx-export.js module reuse',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(html,/\/app\.js\?v=1\.2\.22-RC/);
 assert.match(app,/xlsx-export\.js\?v=1\.2\.21-RC/);
});

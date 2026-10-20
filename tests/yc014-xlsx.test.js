import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReportXlsx} from '../public/xlsx-export.js';
const COL=['STT','Tên cơ sở đào tạo','Tổng số Quyết định','Đã tham gia học','Bỏ học','Không tham gia','Không nhận Quyết định','Chưa xác nhận'];
test('YC014: XLSX ma trận có đúng một dòng tổng, gộp A:B, nền vàng và ô số',async()=>{
 const blob=buildReportXlsx(COL,[[1,'Trường ABC',20,9,1,3,1,6],[2,'Trường XYZ',10,2,1,0,0,7],['Tổng cộng','',30,11,2,3,1,13]],'Báo cáo học nghề',{matrixTotals:true});
 const bytes=new Uint8Array(await blob.arrayBuffer());assert.equal(Buffer.from(bytes).subarray(0,4).toString('hex'),'504b0304');
 const text=Buffer.from(bytes).toString('utf8');
 assert.match(text,/mergeCell ref="A5:B5"/);assert.match(text,/mergeCells count="2"/);
 assert.match(text,/<c r="C5" s="5"><v>30<\/v><\/c>/);assert.match(text,/FFFFFF00/);
 assert.match(text,/Tổng cộng/);assert.match(text,/Chưa xác nhận/);
 assert.match(text,/cellXfs count="6"/);
});
test('YC014: một nhóm hoặc không nhóm vẫn có dòng tổng đúng',async()=>{
 for(const rows of [[['Tổng cộng','',0,0,0,0,0,0]],[[1,'ABC',2,1,0,0,0,1],['Tổng cộng','',2,1,0,0,0,1]]]){
  const data=Buffer.from(await buildReportXlsx(COL,rows,'Báo cáo',{matrixTotals:true}).arrayBuffer()).toString('utf8');
  assert.match(data,new RegExp(`mergeCell ref="A${rows.length+2}:B${rows.length+2}"`));
 }
});

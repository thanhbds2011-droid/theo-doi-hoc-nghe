import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReportXlsx} from '../public/xlsx-export.js';

test('YC013: báo cáo ma trận XLSX chuẩn ZIP, dữ liệu số ghi dạng number, tiêu đề thống nhất',async()=>{
  const blob=buildReportXlsx(['STT','Tên cơ sở đào tạo','Tổng số Quyết định','Đã tham gia học','Bỏ học','Không tham gia','Không nhận Quyết định','Chưa xác nhận'],[[1,'Trường ABC',250,125,12,28,5,80]],'Báo cáo học nghề');
  const data=new Uint8Array(await blob.arrayBuffer());
  assert.equal(Buffer.from(data).subarray(0,4).toString('hex'),'504b0304');
  const text=Buffer.from(data).toString('utf8');
  assert.ok(text.includes('Không tham gia'));
  assert.ok(!text.includes('Không học'));
  assert.match(text,/<c r="C3" s="2"><v>250<\/v><\/c>/);
  assert.ok(text.includes('mergeCell ref="A1:H1"'));
});

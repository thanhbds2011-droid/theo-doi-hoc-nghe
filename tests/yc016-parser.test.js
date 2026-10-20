import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const key=code.match(/const keyVN=x=>[^\n]+/)[0];
const from=code.slice(code.indexOf('function excelISO('),code.indexOf('function parseRecordExcel('));
const parser=code.slice(code.indexOf('function parseStatusBulkExcel('),code.indexOf('function statusBulkForm('));
const ctx={};vm.createContext(ctx);vm.runInContext(key+'\n'+from+'\n'+parser+'\nthis.parse=parseStatusBulkExcel;',ctx);
const col=(arr,size)=>Array.from({length:size},(_,i)=>arr[i]??'');
function sample(){return [
 col({1:'Họ và tên',4:'Số sổ BHXH',5:'Số QĐ HTHN',6:'Ngày ban hành QĐHN',14:'Cơ sở đào tạo nghề',25:'Thông tin cơ sở đào tạo nhập'},26),
 col({25:'Tham gia học (có tham gia học đánh dấu X)'},26),
 col({1:'Nguyễn Văn A',4:'0123456',5:'067',6:'13/10/2026',14:'Trường ABC',25:'X'},26),
 col({1:'Trần Văn B',5:'102',6:'14/10/2026',14:'Trường ABC',25:''},26),
 col({1:'Nguyễn Văn A',5:'68',6:'13/10/2026',14:'Trường XYZ',25:'X'},26),
 col({1:'Tổng cộng',5:'',6:'',14:'',25:''},26)
];}
test('YC016: file thực tế 26 cột/2 tiêu đề chỉ nhận X, giữ số QĐ 067',()=>{
 const p=ctx.parse(sample(),'DA_THAM_GIA');assert.equal(p.rows.length,2);assert.equal(p.rows[0].decision,'067');assert.equal(p.rows[0].decisionDate,'2026-10-13');assert.equal(p.rows[0].line,3);assert.equal(p.skipped.length,2);
});
test('YC016: không được dùng cột Tham gia học để áp Không tham gia',()=>{
 assert.throws(()=>ctx.parse(sample(),'KHONG_THAM_GIA'),/Áp dụng/);
});
test('YC016: mẫu riêng với cột Áp dụng (X) được chọn rõ ràng',()=>{
 const rows=[['Họ và tên','Số QĐ HTHN','Ngày ban hành QĐHN','Cơ sở đào tạo nghề','Số sổ BHXH','Áp dụng (X)','Tháng bỏ học','Lý do bỏ học'],['Nguyễn Văn A','67','2026-10-13','Trường ABC','','X','KY:2','Lý do sức khỏe'],['Nguyễn Văn B','69','2026-10-13','Trường ABC','','','','']];
 const p=ctx.parse(rows,'BO_HOC');assert.equal(p.rows.length,1);assert.equal(p.rows[0].dropoutPeriod,'KY:2');assert.equal(p.skipped.length,1);
});

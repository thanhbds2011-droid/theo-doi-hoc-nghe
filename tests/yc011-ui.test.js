import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {buildXlsx} from '../public/xlsx-export.js';
const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const gas=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
test('YC010: chỉ xóa dòng sau server xác nhận, không gọi lại afterMutation(records)',()=>{
 const line=js.slice(js.indexOf("if(node.hasAttribute('data-confirm-delete'))"),js.indexOf("if(node.hasAttribute('data-status-record'))"));
 assert.match(line,/preserveRecordView:true/);assert.match(line,/state\.records\.filter/);assert.match(line,/data-record-row/);
 assert.doesNotMatch(line,/afterMutation\('records'\)/);
});
test('YC011: biểu mẫu có 15 trường mới và trang chi tiết, sheet chuẩn 40 cột',()=>{
 for(const key of ['SO_SO_BHXH','SO_QD_TCTN','NGAY_QD_TCTN','SO_THANG_HO_TRO','MUC_HO_TRO_THANG','NGAY_KET_THUC_TCTN','NGAY_KET_THUC_HTHN','DIA_CHI_TAM_TRU','DIA_CHI_THUONG_TRU','SO_CMND','NGAY_CAP_CMND','NOI_CAP_CMND','DIA_CHI_CO_SO','CHI_NHANH_BHTN','DIEN_THOAI']){assert.ok(js.includes(key));assert.ok(gas.includes(key));}
 assert.match(js,/function recordDetail/);assert.match(js,/data-detail-record/);
 assert.ok(existsSync(new URL('../public/templates/MAU_NHAP_HO_SO_HOC_NGHE.xlsx',import.meta.url)));
});
test('YC011: xuất XLSX có nội dung ZIP hợp lệ, 25 cột và chữ có dấu',async()=>{
 const cols=Array.from({length:25},(_,i)=>'Cột '+(i+1));cols[12]='Thời gian đào tạo – Từ ngày';cols[13]='Thời gian đào tạo – Đến ngày';
 const blob=buildXlsx([cols,['1','Phạm Thị Uyên',...Array(23).fill('')]]);
 assert.ok(blob.size>1000);const buffer=Buffer.from(await blob.arrayBuffer());assert.equal(buffer.subarray(0,4).toString('hex'),'504b0304');
 assert.ok(buffer.includes(Buffer.from('Phạm Thị Uyên')));
});

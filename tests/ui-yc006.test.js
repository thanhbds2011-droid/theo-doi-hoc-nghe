import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('YC006 sidebar: đủ sáu tên và icon SVG đồng nhất',()=>{
 for(const icon of ['house','file-text','chart-column','layout-grid','user-round','clock-3'])assert.match(js,new RegExp(`'${icon}'`));
 assert.match(js,/<svg class="line-icon"/);
 assert.match(js,/aria-current="page"/);
});
test('YC006 một banner, không chào mừng trùng tên',()=>{
 const source=js.slice(js.indexOf('async function renderDashboard('),js.indexOf('async function renderRecords('));
 assert.match(source,/Tổng quan học nghề/);
 assert.doesNotMatch(source,/Xin chào|TRANG QUẢN LÝ/);
 assert.doesNotMatch(html,/Hệ thống quản lý độc lập<\/small>/);
});
test('YC006 tận dụng overview một lần cho tất cả biểu đồ',()=>{
 const source=js.slice(js.indexOf('async function renderDashboard('),js.indexOf('async function renderRecords('));
 assert.equal((source.match(/rpc\('overview'/g)||[]).length,1);
 assert.match(source,/schoolChart\(data.schoolCounts\)/);
 assert.match(source,/tradeChart\(data.tradeCounts\)/);
});
test('YC006: chi tiết báo cáo được xử lý qua ủy quyền điều hướng',()=>{
 assert.match(js,/data-dashboard-detail/);
 assert.match(js,/allowed\('REPORT_VIEW'\)\)navigate\('reports'\)/);
});
test('YC006 giữ font hệ thống và footer không lộ backend',()=>{
 assert.match(css,/:root\{[^}]*font-family:"Segoe UI",Tahoma,Arial,sans-serif/);
 assert.doesNotMatch(html,/Google Sheets/);
 assert.doesNotMatch(js,/Google Sheets/);
});
test('YC006 bản nguồn có phiên bản đồng bộ',()=>{
 assert.match(html,/v1\.2\.11-RC/);
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.version,'1.2.11-rc.0');
});

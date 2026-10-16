import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('YC-HN-005: Không còn biểu đồ tổng hợp trùng KPI',()=>{
  assert.doesNotMatch(js,/Biểu đồ tổng hợp 6 chỉ tiêu|dashboard-chart|mini-chart/);
});
test('YC-HN-005: Đủ 6 KPI, hai bảng theo cơ sở/nghề',()=>{
  const source=js.slice(js.indexOf('async function renderDashboard('),js.indexOf('async function renderRecords('));
  for(const name of ['Tổng hồ sơ','Đã tham gia','Đang học','Bỏ học','Không tham gia','Chưa xác nhận','Theo cơ sở đào tạo','Theo nghề đào tạo'])assert.ok(source.includes(name),name);
  assert.match(css,/\.kpi-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test('YC-HN-005: Không hiển thị Google Sheets trên giao diện',()=>{
  assert.doesNotMatch(html,/Google Sheets/i);
  assert.doesNotMatch(js,/Google Sheets/i);
});
test('YC-HN-005: Một bộ font dùng xuyên suốt toàn bộ phần mềm',()=>{
  assert.match(css,/:root\{[^}]*font-family:"Segoe UI",Tahoma,Arial,sans-serif/);
  assert.match(css,/button,input,select,textarea\{font-family:inherit/);
});
test('YC-HN-005: Bảng Báo cáo, Tài khoản, Nhật ký bỏ lớp chờ sau khi tải',()=>{
  assert.match(js,/\$\('#report-output'\)\.className='report-results'/);
  assert.match(js,/\$\('#accounts-output'\)\.className=''/);
  assert.match(js,/\$\('#audit-output'\)\.className=''/);
});
test('YC-HN-005: Danh mục có khả năng lọc tên ngay trên website',()=>{
  assert.match(js,/class="catalog-data-row"/);
  assert.match(js,/\.catalog-data-row'\)/);
});

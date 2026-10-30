import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const backend=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');

test('YC035: đổi tab nội bộ không được nhớ lại snapshot tab cũ; chặn quyền ngoài ADMIN',()=>{
 const start=app.indexOf("if(node.hasAttribute('data-cat-tab')){");
 const end=app.indexOf("if(node.hasAttribute('data-new-status'))",start);
 assert.ok(start>0 && end>start);
 const code=app.slice(start,end);
 assert.match(code,/state\.page!=='catalogs'/);
 assert.match(code,/!allowed\('CATALOG_MANAGE'\)/);
 assert.match(code,/!Object\.hasOwn\(NAMES,nextType\)/);
 assert.match(code,/state\.pageViews\.delete\('catalogs'\)/);
 assert.ok(code.indexOf('state.renderedPage=null') < code.indexOf("navigate('catalogs',true)"));
 assert.match(backend,/status_manage_list:'CATALOG_MANAGE'/);
});
test('YC035: lưu từ khóa riêng từng danh mục, cache ngắn trạng thái và tự hủy sau thao tác ghi',()=>{
 assert.match(app,/catalogSearchByType:\{truong:'',nghe:'',lydo:'',tinhtrang:''\}/);
 assert.match(app,/state\.catalogSearchByType\[state\.catalogType\]=state\.catalogSearch/);
 assert.match(app,/state\.catalogSearch=state\.catalogSearchByType\[nextType\]\|\|''/);
 assert.match(app,/rpc\('status_manage_list',\{\}, \{ttl:45000\}\)/);
 assert.match(app,/if\(options\.mutate\)\{[\s\S]*?state\.cache\.clear\(\)/);
});
test('YC035: giữ nguyên backend và mẫu Excel; phiên bản frontend đồng bộ',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.match(html,/app\.js\?v=1\.2\.29-RC/);
 assert.match(html,/v1\.2\.29-RC/);
 assert.equal(pkg.version,'1.2.29-rc.0');
 assert.match(app,/xlsx-export\.js\?v=1\.2\.29-RC/);
});

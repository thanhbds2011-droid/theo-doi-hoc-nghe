import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const clientId='123.apps.googleusercontent.com';
const secret='b'.repeat(64);
const source=fs.readFileSync(path.join(root,'api/rpc.js'),'utf8')
  .replace("import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';",'const {createHmac,randomUUID,timingSafeEqual}=crypto;')
  .replace("import { OAuth2Client } from 'google-auth-library';",'const OAuth2Client=StubOAuthClient;')
  .replace('export function createSignedEnvelope','function createSignedEnvelope')
  .replace('export async function POST','async function POST')
  + '\nthis.POST=POST;this.createSignedEnvelope=createSignedEnvelope;';
function env(claims={sub:'11223344556677889900',aud:clientId,email:'admin@example.com',email_verified:true,name:'Admin'}){
  const calls=[];
  class StubOAuthClient {
    constructor(c){assert.equal(c,clientId);}
    async verifyIdToken({idToken,audience}){assert.equal(audience,clientId);if(idToken==='BAD')throw Error('Invalid token');return {getPayload:()=>claims};}
  }
  const context={crypto,StubOAuthClient,Response,Request,URL,JSON,console,AbortSignal,Buffer,process:{env:{GOOGLE_CLIENT_ID:clientId,GAS_WEB_APP_URL:'https://script.google.com/macros/s/dep/exec',API_SHARED_SECRET:secret}},
    fetch:async(url,opt)=>{calls.push({url,opt});const body=JSON.parse(opt.body);const expect=crypto.createHmac('sha256',secret).update(body.raw).digest('base64url');assert.equal(expect,body.signature);return new Response(JSON.stringify({ok:true,data:{accepted:true}}),{status:200});}
  };
  vm.createContext(context);vm.runInContext(source,context,{timeout:4000});
  const send=(body,origin='https://myapp.vercel.app')=>context.POST(new Request(origin+'/api/rpc',{method:'POST',headers:{origin,'Content-Type':'application/json','X-Requested-With':'HocNgheWeb'},body:JSON.stringify(body)}));
  return {context,calls,send};
}
test('Proxy chỉ chấp nhận Google token hợp lệ và tạo chữ ký GAS',async()=>{const x=env();const res=await x.send({idToken:'VALID',action:'bootstrap',payload:{}});assert.equal(res.status,200);assert.equal(x.calls.length,1);const signed=JSON.parse(x.calls[0].opt.body);const raw=JSON.parse(signed.raw);assert.equal(raw.identity.email,'admin@example.com');assert.equal(raw.identity.aud,clientId);assert.equal(raw.identity.appOrigin,'https://myapp.vercel.app');assert.equal(raw.action,'bootstrap');});
test('Proxy từ chối ID token sai',async()=>{const x=env();const r=await x.send({idToken:'BAD',action:'bootstrap'});assert.equal(r.status,401);assert.equal(x.calls.length,0);});
test('Proxy chặn Origin không khớp',async()=>{const x=env();const r=await x.context.POST(new Request('https://a.vercel.app/api/rpc',{method:'POST',headers:{origin:'https://bad.example'},body:JSON.stringify({idToken:'VALID',action:'bootstrap'})}));assert.equal(r.status,403);});
test('Proxy từ chối email chưa xác thực',async()=>{const x=env({sub:'1',aud:clientId,email:'a@b.com',email_verified:false});const r=await x.send({idToken:'VALID',action:'bootstrap'});assert.equal(r.status,401);});
test('Proxy từ chối action không chuẩn',async()=>{const x=env();const r=await x.send({idToken:'VALID',action:'training_create'});assert.equal(r.status,200); // tên action hợp lệ về mặt cú pháp nhưng GAS quyết định danh sách cho phép.
const r2=await x.send({idToken:'VALID',action:'../admin'});assert.equal(r2.status,400);});
test('Proxy từ chối thiếu biến môi trường',async()=>{const x=env();x.context.process.env.API_SHARED_SECRET='short';const r=await x.send({idToken:'VALID',action:'bootstrap'});assert.equal(r.status,503);});

test('YC008: cookie phiên HttpOnly được phát hành sau bootstrap hợp lệ và dùng lại khi F5',async()=>{
 const e=env();const init=await e.send({idToken:'VALID',action:'bootstrap'});
 assert.equal(init.status,200);
 const cookie=init.headers.get('set-cookie')||'';
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);
 const token=cookie.split(';')[0];
 const next=await e.context.POST(new Request('https://myapp.vercel.app/api/rpc',{method:'POST',headers:{origin:'https://myapp.vercel.app','X-Requested-With':'HocNgheWeb','Content-Type':'application/json',cookie:token},body:JSON.stringify({action:'bootstrap'})}));
 assert.equal(next.status,200);
 assert.equal(e.calls.length,2);
 const envelope=JSON.parse(e.calls[1].opt.body);
 assert.equal(JSON.parse(envelope.raw).identity.email,'admin@example.com');
 const logout=await e.context.POST(new Request('https://myapp.vercel.app/api/rpc',{method:'POST',headers:{origin:'https://myapp.vercel.app','X-Requested-With':'HocNgheWeb'},body:JSON.stringify({action:'logout'})}));
 assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 const tampered=token.slice(0,-1)+(token.slice(-1)==='a'?'b':'a');
 const bad=await e.context.POST(new Request('https://myapp.vercel.app/api/rpc',{method:'POST',headers:{origin:'https://myapp.vercel.app','X-Requested-With':'HocNgheWeb',cookie:tampered},body:JSON.stringify({action:'bootstrap'})}));
 assert.equal(bad.status,401);
});

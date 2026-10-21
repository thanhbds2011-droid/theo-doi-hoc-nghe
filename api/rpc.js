import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

const textError = (code, message, status = 400) => Response.json(
  { ok: false, error: { code, message } },
  { status, headers: { 'Cache-Control': 'no-store' } }
);

export function createSignedEnvelope({ ts, requestId, identity, action, payload }, secret) {
  const raw = JSON.stringify({ v: 1, ts, requestId, identity, action, payload });
  const signature = createHmac('sha256', secret).update(raw, 'utf8').digest('base64url');
  return { raw, signature };
}

// Phiên website tồn tại qua F5. Không chuyển token Google vào localStorage.
const COOKIE_NAME='__Host-hocnghe_session';
const SESSION_AGE=8*60*60;
function cookieString(value,maxAge){return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
function makeSession(identity,secret){
  const payload=Buffer.from(JSON.stringify({v:1,sub:identity.sub,aud:identity.aud,email:identity.email,exp:Math.floor(Date.now()/1000)+SESSION_AGE})).toString('base64url');
  const sig=createHmac('sha256',secret).update(payload).digest('base64url');
  return payload+'.'+sig;
}
function readSession(request,secret,clientId){
  const all=request.headers.get('cookie')||'';
  const entry=all.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+'='));
  if(!entry)return null;
  const token=entry.slice(COOKIE_NAME.length+1),parts=token.split('.');
  if(parts.length!==2||parts[0].length>3000||parts[1].length>100)return null;
  const sig=createHmac('sha256',secret).update(parts[0]).digest('base64url');
  if(sig.length!==parts[1].length||!timingSafeEqual(Buffer.from(sig),Buffer.from(parts[1])))return null;
  try{
    const v=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
    if(v.v!==1||!Number.isSafeInteger(v.exp)||v.exp<=Math.floor(Date.now()/1000)||v.exp>Math.floor(Date.now()/1000)+SESSION_AGE+60)return null;
    if(v.aud!==clientId||!/^[0-9]{5,30}$/.test(String(v.sub))||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v.email)))return null;
    return {sub:v.sub,aud:v.aud,email:v.email};
  }catch{return null;}
}
export async function POST(request) {
  // Người dùng đăng xuất: xóa cookie dù phiên đã hết hạn.
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const gasUrl = process.env.GAS_WEB_APP_URL;
  const secret = process.env.API_SHARED_SECRET;
  if (!clientId || !gasUrl || !secret || secret.length < 32) {
    return textError('SERVER_NOT_CONFIGURED', 'Máy chủ chưa cấu hình đủ Google Client ID, Apps Script URL và khóa bảo mật.', 503);
  }
  const perfOn=process.env.HN_PERF_TEST==='1';const perfStarted=Date.now();
  try {
    const sameOrigin = new URL(request.url).origin;
    const origin = request.headers.get('origin');
    if (origin && origin !== sameOrigin) return textError('ORIGIN_DENIED', 'Yêu cầu không cùng nguồn.', 403);
    const size = Number(request.headers.get('content-length') || 0);
    if (size > 2_500_000) return textError('PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.', 413);
    const inputText = await request.text();
    if (inputText.length > 2_500_000) return textError('PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.', 413);
    let input;
    try { input = JSON.parse(inputText); } catch { return textError('BAD_JSON', 'Dữ liệu không hợp lệ.'); }
    if(input?.action==='logout')return Response.json({ok:true,data:{loggedOut:true}}, {headers:{'Cache-Control':'no-store','Set-Cookie':cookieString('',0)}});
    if(request.headers.get('x-requested-with')!=='HocNgheWeb' && request.headers.get('origin'))return textError('INVALID_REQUEST','Yêu cầu không hợp lệ.',403);
    const idToken = String(input?.idToken || '');
    const action = String(input?.action || '');
    if (idToken.length > 8192 || !/^[a-z][a-z0-9_]{1,40}$/.test(action)) {
      return textError('INVALID_REQUEST', 'Token hoặc tên thao tác không hợp lệ.', 400);
    }
    let identity;
    if(idToken){
      const googleClient=new OAuth2Client(clientId);
      const ticket=await googleClient.verifyIdToken({idToken,audience:clientId});
      const claims=ticket.getPayload();
      if(!claims||!claims.sub||!claims.email||!claims.email_verified)return textError('UNVERIFIED_ACCOUNT','Tài khoản Google chưa được xác minh.',401);
      identity={sub:String(claims.sub),aud:String(claims.aud),email:String(claims.email).toLowerCase(),name:String(claims.name||'').slice(0,150)};
    }else{
      const verified=readSession(request,secret,clientId);
      if(!verified)return textError('LOGIN_EXPIRED','Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',401);
      identity={...verified,name:''};
    }
    identity.appOrigin=sameOrigin;
    const payload = input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload) ? input.payload : {};
    const requestId = typeof input.requestId === 'string' && /^[a-zA-Z0-9_-]{12,80}$/.test(input.requestId)
      ? input.requestId : randomUUID();
    const perfIdentityMs=Date.now()-perfStarted;
    const envelope = createSignedEnvelope({ ts: Date.now(), requestId, identity, action, payload }, secret);
    const perfUpstreamStarted=Date.now();
    const upstream = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(envelope),
      redirect: 'follow',
      signal: AbortSignal.timeout(52_000)
    });
    const upstreamText = await upstream.text();
    const perfUpstreamMs=Date.now()-perfUpstreamStarted;
    if (!upstream.ok || upstreamText.length > 4_000_000) {
      return textError('GATEWAY_UNAVAILABLE', 'Không nhận được phản hồi hợp lệ từ Apps Script.', 502);
    }
    let result;
    try { result = JSON.parse(upstreamText); } catch {
      return textError('GATEWAY_BAD_RESPONSE', 'Apps Script chưa trả về JSON hợp lệ. Kiểm tra deployment /exec.', 502);
    }
    const headers={'Cache-Control':'no-store'};
    // Chỉ cấp phiên khi Google token vừa được xác minh VÀ Apps Script xác nhận tài khoản còn hoạt động.
    if(result.ok&&idToken&&action==='bootstrap')headers['Set-Cookie']=cookieString(makeSession(identity,secret),SESSION_AGE);
    if(!result.ok&&result.error?.code==='NOT_AUTHORIZED')headers['Set-Cookie']=cookieString('',0);
    if(perfOn && action==='record_save')console.info(JSON.stringify({name:'YC022',action:'record_save',identityMs:perfIdentityMs,upstreamMs:perfUpstreamMs,totalMs:Date.now()-perfStarted,ok:!!result.ok}));
    return Response.json(result, {
      status: result.ok ? 200 : (['NO_PERMISSION','NOT_OWNER'].includes(result.error?.code) ? 403 : ['NOT_AUTHORIZED','LOGIN_EXPIRED'].includes(result.error?.code) ? 401 : 400),
      headers
    });
  } catch (error) {
    if (/Token used too late|Wrong number of segments|Invalid token|audience|expired|signature/i.test(String(error?.message))) {
      return textError('LOGIN_EXPIRED', 'Phiên đăng nhập Google hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', 401);
    }
    console.error('rpc error', error?.name || 'Error');
    return textError('INTERNAL_ERROR', 'Yêu cầu không hoàn tất. Hãy thử lại.', 502);
  }
}

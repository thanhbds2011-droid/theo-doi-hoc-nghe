import { createHmac, randomUUID } from 'node:crypto';
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

export async function POST(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const gasUrl = process.env.GAS_WEB_APP_URL;
  const secret = process.env.API_SHARED_SECRET;
  if (!clientId || !gasUrl || !secret || secret.length < 32) {
    return textError('SERVER_NOT_CONFIGURED', 'Máy chủ chưa cấu hình đủ Google Client ID, Apps Script URL và khóa bảo mật.', 503);
  }
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
    const idToken = String(input?.idToken || '');
    const action = String(input?.action || '');
    if (!idToken || idToken.length > 8192 || !/^[a-z][a-z0-9_]{1,40}$/.test(action)) {
      return textError('INVALID_REQUEST', 'Token hoặc tên thao tác không hợp lệ.', 400);
    }
    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
    const claims = ticket.getPayload();
    if (!claims || !claims.sub || !claims.email || !claims.email_verified) {
      return textError('UNVERIFIED_ACCOUNT', 'Tài khoản Google chưa được xác minh.', 401);
    }
    const identity = {
      sub: String(claims.sub),
      aud: String(claims.aud),
      appOrigin: sameOrigin,
      email: String(claims.email).toLowerCase(),
      name: String(claims.name || '').slice(0, 150)
    };
    const payload = input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload) ? input.payload : {};
    const requestId = typeof input.requestId === 'string' && /^[a-zA-Z0-9_-]{12,80}$/.test(input.requestId)
      ? input.requestId : randomUUID();
    const envelope = createSignedEnvelope({ ts: Date.now(), requestId, identity, action, payload }, secret);
    const upstream = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(envelope),
      redirect: 'follow',
      signal: AbortSignal.timeout(52_000)
    });
    const upstreamText = await upstream.text();
    if (!upstream.ok || upstreamText.length > 4_000_000) {
      return textError('GATEWAY_UNAVAILABLE', 'Không nhận được phản hồi hợp lệ từ Apps Script.', 502);
    }
    let result;
    try { result = JSON.parse(upstreamText); } catch {
      return textError('GATEWAY_BAD_RESPONSE', 'Apps Script chưa trả về JSON hợp lệ. Kiểm tra deployment /exec.', 502);
    }
    return Response.json(result, {
      status: result.ok ? 200 : (result.error?.code === 'NO_PERMISSION' ? 403 : result.error?.code === 'NOT_AUTHORIZED' ? 401 : 400),
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    if (/Token used too late|Wrong number of segments|Invalid token|audience|expired|signature/i.test(String(error?.message))) {
      return textError('LOGIN_EXPIRED', 'Phiên đăng nhập Google hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', 401);
    }
    console.error('rpc error', error?.name || 'Error');
    return textError('INTERNAL_ERROR', 'Yêu cầu không hoàn tất. Hãy thử lại.', 502);
  }
}

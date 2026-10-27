export function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return Response.json({
    ok: Boolean(clientId && clientId.endsWith('.apps.googleusercontent.com')),
    appName: 'Theo dõi học nghề',
    version: '1.2.21-RC',
    clientId: clientId || '',
  }, { headers: { 'Cache-Control': 'no-store' }});
}

const EXPRESS_API_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';
const ALLOWED_ENDPOINTS = new Set(['request-otp', 'verify-otp', 'resend-otp', 'refresh', 'logout', 'me']);

async function proxy(request: Request, { endpoint }: { endpoint: string }) {
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return Response.json({ error: { code: 'NOT_FOUND', message: 'Route introuvable.' } }, { status: 404 });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const headers = new Headers({ 'content-type': 'application/json' });
    const authorization = request.headers.get('authorization');
    if (authorization) headers.set('authorization', authorization);
    const response = await fetch(`${EXPRESS_API_URL}/api/auth/${endpoint}`, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });
    if (response.status === 204) return new Response(null, { status: 204 });
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return Response.json({ error: {
      code: timedOut ? 'BACKEND_TIMEOUT' : 'BACKEND_UNREACHABLE',
      message: timedOut ? 'Le backend KaziRide met trop de temps à répondre.' : 'Le backend KaziRide est inaccessible.',
    } }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = proxy;
export const POST = proxy;

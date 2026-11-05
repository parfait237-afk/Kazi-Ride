const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';
const ALLOWED = new Set(['estimate', 'confirm']);

async function proxy(request: Request, { endpoint }: { endpoint: string }) {
  if (!ALLOWED.has(endpoint)) return Response.json({ error: { code: 'NOT_FOUND', message: 'Route introuvable.' } }, { status: 404 });
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const headers = new Headers({ 'content-type': 'application/json' }); const authorization = request.headers.get('authorization'); if (authorization) headers.set('authorization', authorization);
    const response = await fetch(`${BACKEND}/api/rides/${endpoint}`, { method: request.method, headers, body: await request.text(), signal: controller.signal });
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return Response.json({ error: { code: timedOut ? 'BACKEND_TIMEOUT' : 'BACKEND_UNREACHABLE', message: timedOut ? 'Le calcul du trajet prend trop de temps.' : 'Le backend KaziRide est inaccessible.' } }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
export const POST = proxy;

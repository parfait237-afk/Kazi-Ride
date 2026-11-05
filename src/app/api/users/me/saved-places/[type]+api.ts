const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';
async function proxy(request: Request, { type }: { type: string }) {
  try {
    const response = await fetch(`${BACKEND}/api/users/me/saved-places/${type}`, {
      method: request.method,
      headers: { authorization: request.headers.get('authorization') ?? '', 'content-type': 'application/json' },
      body: request.method === 'DELETE' ? undefined : await request.text(),
    });
    if (response.status === 204) return new Response(null, { status: 204 });
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json' } });
  } catch { return Response.json({ error: { code: 'BACKEND_UNREACHABLE', message: 'Le backend KaziRide est inaccessible.' } }, { status: 502 }); }
}
export const PUT = proxy;
export const DELETE = proxy;

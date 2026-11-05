const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';
export async function GET(request: Request) {
  try {
    const response = await fetch(`${BACKEND}/api/users/me/saved-places`, { headers: { authorization: request.headers.get('authorization') ?? '' } });
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json' } });
  } catch { return Response.json({ error: { code: 'BACKEND_UNREACHABLE', message: 'Le backend KaziRide est inaccessible.' } }, { status: 502 }); }
}

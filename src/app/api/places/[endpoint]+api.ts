const BACKEND = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:4000';
const ALLOWED = new Set(['reverse-geocode', 'autocomplete', 'details', 'city-autocomplete', 'city-details']);

export async function GET(request: Request, { endpoint }: { endpoint: string }) {
  if (!ALLOWED.has(endpoint)) return Response.json({ error: { code: 'NOT_FOUND', message: 'Route introuvable.' } }, { status: 404 });
  try {
    const incoming = new URL(request.url);
    const response = await fetch(`${BACKEND}/api/places/${endpoint}${incoming.search}`, { headers: { authorization: request.headers.get('authorization') ?? '' } });
    return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json' } });
  } catch {
    return Response.json({ error: { code: 'BACKEND_UNREACHABLE', message: 'Le backend KaziRide est inaccessible.' } }, { status: 502 });
  }
}

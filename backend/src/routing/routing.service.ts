import { env } from '../config/env.js';
import { ApiError } from '../errors.js';

type Coordinate = { latitude: number; longitude: number };

export async function getDrivingRoute(origin: Coordinate, destination: Coordinate) {
  if (!env.OSRM_BASE_URL) {
    throw new ApiError(503, 'ROUTING_NOT_CONFIGURED', 'Le service d’itinéraire KaziRide n’est pas encore configuré.');
  }
  const base = env.OSRM_BASE_URL.replace(/\/$/, '');
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${base}/route/v1/driving/${coordinates}?alternatives=false&steps=false&geometries=geojson&overview=full`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new ApiError(502, 'ROUTING_UNAVAILABLE', 'Le service d’itinéraire est temporairement indisponible.');
    const data = await response.json() as { code?: string; routes?: Array<{ distance: number; duration: number; geometry: { type: 'LineString'; coordinates: [number, number][] } }> };
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) throw new ApiError(404, 'ROUTE_NOT_FOUND', 'Aucun itinéraire routier n’a été trouvé.');
    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'ROUTING_UNAVAILABLE', 'Le service d’itinéraire est temporairement indisponible.');
  } finally { clearTimeout(timeout); }
}

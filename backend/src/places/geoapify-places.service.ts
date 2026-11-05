import { env } from '../config/env.js';
import { ApiError } from '../errors.js';
import type { CityBounds } from './google-places.service.js';

type GeoResult = {
  place_id: string; name?: string; city?: string; country?: string; country_code?: string;
  formatted?: string; address_line1?: string; address_line2?: string; lat: number; lon: number;
  bbox?: [number, number, number, number] | { lon1: number; lat1: number; lon2: number; lat2: number };
};

function key() {
  if (!env.GEOAPIFY_API_KEY) throw new ApiError(503, 'PLACES_NOT_CONFIGURED', 'Le service de recherche géographique n’est pas encore configuré.');
  return env.GEOAPIFY_API_KEY;
}

async function requestJson<T>(url: URL): Promise<T> {
  url.searchParams.set('apiKey', key());
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new ApiError(503, 'GEOAPIFY_KEY_REJECTED', 'La clé Geoapify est refusée ou cette API n’est pas autorisée.');
    if (response.status === 400) throw new ApiError(502, 'GEOAPIFY_REQUEST_INVALID', 'La requête de recherche géographique est invalide.');
    if (response.status === 429) throw new ApiError(429, 'PLACES_QUOTA_EXCEEDED', 'Quota de recherche temporairement dépassé.');
    throw new ApiError(502, 'PLACES_UNAVAILABLE', 'La recherche est temporairement indisponible.');
  }
  return response.json() as Promise<T>;
}

function boundsFrom(result: GeoResult): CityBounds | undefined {
  if (!result.bbox) return undefined;
  if (Array.isArray(result.bbox)) return { west: result.bbox[0], south: result.bbox[1], east: result.bbox[2], north: result.bbox[3] };
  return { west: result.bbox.lon1, south: result.bbox.lat1, east: result.bbox.lon2, north: result.bbox.lat2 };
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
  Object.entries({ lat: latitude, lon: longitude, type: 'city', format: 'json', lang: 'fr', limit: 1 }).forEach(([name, value]) => url.searchParams.set(name, String(value)));
  const data = await requestJson<{ results?: GeoResult[] }>(url);
  const result = data.results?.[0];
  const name = result?.city ?? result?.name;
  if (!result || !name || !result.country || !result.country_code) throw new ApiError(422, 'CITY_NOT_FOUND', 'Impossible d’identifier votre ville actuelle.');
  return { name, country: result.country, countryCode: result.country_code.toUpperCase(), center: { latitude, longitude }, bounds: boundsFrom(result), placeId: result.place_id, address: result.formatted };
}

export async function autocomplete(input: string, _sessionToken: string, bounds: CityBounds, countryCode: string, cityPlaceId?: string) {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  const filter = cityPlaceId ? `place:${cityPlaceId}` : `rect:${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
  Object.entries({ text: input, format: 'json', lang: 'fr', limit: 8, filter }).forEach(([name, value]) => url.searchParams.set(name, String(value)));
  const data = await requestJson<{ results?: GeoResult[] }>(url);
  return (data.results ?? []).map((result) => ({ placeId: result.place_id, name: result.name ?? result.address_line1 ?? result.formatted ?? '', address: result.formatted ?? result.address_line2 ?? '' }));
}

export async function autocompleteCities(input: string) {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  Object.entries({ text: input, type: 'city', format: 'json', lang: 'fr', limit: 8 }).forEach(([name, value]) => url.searchParams.set(name, String(value)));
  const data = await requestJson<{ results?: GeoResult[] }>(url);
  return (data.results ?? []).map((result) => ({ placeId: result.place_id, name: result.city ?? result.name ?? result.formatted ?? '', address: result.formatted ?? '' }));
}

async function details(placeId: string) {
  const url = new URL('https://api.geoapify.com/v2/place-details');
  Object.entries({ id: placeId, features: 'details', lang: 'fr' }).forEach(([name, value]) => url.searchParams.set(name, value));
  const data = await requestJson<{ features?: Array<{ bbox?: [number, number, number, number]; properties: GeoResult & { feature_type?: string } }> }>(url);
  const feature = data.features?.find((item) => item.properties.feature_type === 'details') ?? data.features?.[0];
  if (!feature) throw new ApiError(404, 'PLACE_NOT_FOUND', 'Lieu introuvable.');
  return { ...feature.properties, bbox: feature.bbox ?? feature.properties.bbox };
}

export async function cityDetails(placeId: string) {
  const result = await details(placeId);
  const name = result.city ?? result.name;
  if (!name || !result.country || !result.country_code || !result.bbox) throw new ApiError(422, 'CITY_NOT_FOUND', 'Impossible d’identifier cette ville.');
  return { name, country: result.country, countryCode: result.country_code.toUpperCase(), center: { latitude: result.lat, longitude: result.lon }, bounds: boundsFrom(result), placeId: result.place_id, address: result.formatted };
}

function inside(latitude: number, longitude: number, bounds: CityBounds) { return latitude >= bounds.south && latitude <= bounds.north && longitude >= bounds.west && longitude <= bounds.east; }

export async function placeDetails(placeId: string, _sessionToken: string, expectedCity: string, bounds: CityBounds) {
  const result = await details(placeId);
  if (!inside(result.lat, result.lon, bounds)) throw new ApiError(422, 'PLACE_OUTSIDE_CITY', 'Cette destination se trouve en dehors de votre ville actuelle.');
  return { placeId: result.place_id, name: result.name ?? result.address_line1 ?? result.formatted ?? '', address: result.formatted ?? '', latitude: result.lat, longitude: result.lon, city: result.city ?? expectedCity, country: result.country };
}

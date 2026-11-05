import { apiRequest } from './api';
import type { CurrentCity } from '@/types/city.types';
import type { Place, PlaceSuggestion } from '@/types/place.types';

const searchCache = new Map<string, { expiresAt: number; values: PlaceSuggestion[] }>();
const SEARCH_CACHE_TTL_MS = 2 * 60_000;

function queryString(values: Record<string, string | number>) {
  return new URLSearchParams(Object.entries(values).map(([key, value]) => [key, String(value)])).toString();
}

function requireBounds(city: CurrentCity) {
  if (!city.bounds) throw new Error('Les limites de votre ville sont indisponibles. Actualisez votre position.');
  return city.bounds;
}

export function createPlacesSessionToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function detectCurrentCity(latitude: number, longitude: number) {
  const response = await apiRequest<{ city: CurrentCity }>(`/api/places/reverse-geocode?${queryString({ latitude, longitude })}`);
  return response.city;
}

export async function searchPlaces(query: string, city: CurrentCity, sessionToken: string): Promise<PlaceSuggestion[]> {
  const bounds = requireBounds(city);
  const cacheKey = `${city.placeId ?? city.name}:${query.trim().toLocaleLowerCase('fr')}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.values;
  const response = await apiRequest<{ suggestions: PlaceSuggestion[] }>(`/api/places/autocomplete?${queryString({ input: query, sessionToken, countryCode: city.countryCode, ...(city.placeId ? { cityPlaceId: city.placeId } : {}), ...bounds })}`);
  searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, values: response.suggestions });
  if (searchCache.size > 60) searchCache.delete(searchCache.keys().next().value!);
  return response.suggestions;
}

export async function getPlaceDetails(placeId: string, city: CurrentCity, sessionToken: string): Promise<Place> {
  const bounds = requireBounds(city);
  const response = await apiRequest<{ place: Place }>(`/api/places/details?${queryString({ placeId, sessionToken, city: city.name, ...bounds })}`);
  return { ...response.place, country: city.country };
}

export async function searchCities(query: string, sessionToken: string): Promise<PlaceSuggestion[]> {
  const response = await apiRequest<{ suggestions: PlaceSuggestion[] }>(`/api/places/city-autocomplete?${queryString({ input: query, sessionToken })}`);
  return response.suggestions;
}

export async function getCityDetails(placeId: string, sessionToken: string): Promise<CurrentCity> {
  const response = await apiRequest<{ city: CurrentCity }>(`/api/places/city-details?${queryString({ placeId, sessionToken })}`);
  return response.city;
}

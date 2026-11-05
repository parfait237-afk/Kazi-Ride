import { env } from '../config/env.js';
import { ApiError } from '../errors.js';

export type CityBounds = { north: number; south: number; east: number; west: number };

type AddressComponent = { long_name?: string; short_name?: string; longText?: string; shortText?: string; types: string[] };

function apiKey() {
  if (!env.GOOGLE_MAPS_SERVER_API_KEY) throw new ApiError(503, 'GOOGLE_MAPS_NOT_CONFIGURED', 'La recherche Google Maps n’est pas encore configurée.');
  return env.GOOGLE_MAPS_SERVER_API_KEY;
}

async function googleFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json() as T & { error?: { message?: string; status?: string } };
  if (!response.ok) {
    const quota = response.status === 429 || data.error?.status === 'RESOURCE_EXHAUSTED';
    throw new ApiError(quota ? 429 : 502, quota ? 'GOOGLE_QUOTA_EXCEEDED' : 'GOOGLE_PLACES_ERROR', quota ? 'Quota Google Places temporairement dépassé.' : 'Service Google Maps temporairement indisponible.');
  }
  return data;
}

function component(components: AddressComponent[], types: string[]) {
  return components.find((item) => types.some((type) => item.types.includes(type)));
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${latitude},${longitude}`);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('key', apiKey());
  const data = await googleFetch<{ status: string; results: Array<{ place_id: string; formatted_address: string; types: string[]; address_components: AddressComponent[]; geometry: { bounds?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } }; viewport?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } } } }> }>(url.toString());
  const result = data.results.find((item) => item.types.includes('locality'))
    ?? data.results.find((item) => item.types.includes('administrative_area_level_2'));
  if (!result) throw new ApiError(422, 'CITY_NOT_FOUND', 'Impossible d’identifier votre ville actuelle.');
  const cityPart = component(result.address_components, ['locality', 'postal_town', 'administrative_area_level_2']);
  const countryPart = component(result.address_components, ['country']);
  if (!cityPart?.long_name || !countryPart?.long_name || !countryPart.short_name) throw new ApiError(422, 'CITY_NOT_FOUND', 'Impossible d’identifier votre ville actuelle.');
  const viewport = result.geometry.bounds ?? result.geometry.viewport;
  return {
    name: cityPart.long_name,
    country: countryPart.long_name,
    countryCode: countryPart.short_name.toUpperCase(),
    center: { latitude, longitude },
    bounds: viewport ? { north: viewport.northeast.lat, east: viewport.northeast.lng, south: viewport.southwest.lat, west: viewport.southwest.lng } : undefined,
    placeId: result.place_id,
    address: data.results[0]?.formatted_address ?? result.formatted_address,
  };
}

export async function autocomplete(input: string, sessionToken: string, bounds: CityBounds, countryCode: string) {
  const data = await googleFetch<{ suggestions?: Array<{ placePrediction?: { placeId: string; text: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }> }>('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': apiKey(), 'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat' },
    body: JSON.stringify({ input, sessionToken, languageCode: 'fr', includedRegionCodes: [countryCode.toLowerCase()], locationRestriction: { rectangle: { low: { latitude: bounds.south, longitude: bounds.west }, high: { latitude: bounds.north, longitude: bounds.east } } } }),
  });
  return (data.suggestions ?? []).flatMap((item) => item.placePrediction ? [{
    placeId: item.placePrediction.placeId,
    name: item.placePrediction.structuredFormat?.mainText?.text ?? item.placePrediction.text.text,
    address: item.placePrediction.structuredFormat?.secondaryText?.text ?? item.placePrediction.text.text,
  }] : []);
}

export async function autocompleteCities(input: string, sessionToken: string) {
  const data = await googleFetch<{ suggestions?: Array<{ placePrediction?: { placeId: string; text: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }> }>('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': apiKey(), 'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat' },
    body: JSON.stringify({ input, sessionToken, languageCode: 'fr', includedPrimaryTypes: ['(cities)'] }),
  });
  return (data.suggestions ?? []).flatMap((item) => item.placePrediction ? [{ placeId: item.placePrediction.placeId, name: item.placePrediction.structuredFormat?.mainText?.text ?? item.placePrediction.text.text, address: item.placePrediction.structuredFormat?.secondaryText?.text ?? item.placePrediction.text.text }] : []);
}

export async function cityDetails(placeId: string, sessionToken: string) {
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set('languageCode', 'fr'); url.searchParams.set('sessionToken', sessionToken);
  const place = await googleFetch<{ id: string; displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; viewport?: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } }; addressComponents?: Array<{ longText: string; shortText: string; types: string[] }> }>(url.toString(), {
    headers: { 'X-Goog-Api-Key': apiKey(), 'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,viewport,addressComponents' },
  });
  if (!place.location || !place.viewport || !place.displayName?.text) throw new ApiError(422, 'CITY_NOT_FOUND', 'Impossible d’identifier cette ville.');
  const country = component(place.addressComponents ?? [], ['country']);
  if (!country?.longText || !country.shortText) throw new ApiError(422, 'CITY_NOT_FOUND', 'Impossible d’identifier le pays de cette ville.');
  return { name: place.displayName.text, country: country.longText, countryCode: country.shortText.toUpperCase(), center: place.location, bounds: { north: place.viewport.high.latitude, east: place.viewport.high.longitude, south: place.viewport.low.latitude, west: place.viewport.low.longitude }, placeId: place.id, address: place.formattedAddress };
}

function insideBounds(latitude: number, longitude: number, bounds: CityBounds) {
  const latitudeOk = latitude >= bounds.south && latitude <= bounds.north;
  const longitudeOk = bounds.west <= bounds.east ? longitude >= bounds.west && longitude <= bounds.east : longitude >= bounds.west || longitude <= bounds.east;
  return latitudeOk && longitudeOk;
}

export async function placeDetails(placeId: string, sessionToken: string, expectedCity: string, bounds: CityBounds) {
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set('languageCode', 'fr');
  url.searchParams.set('sessionToken', sessionToken);
  const place = await googleFetch<{ id: string; displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; addressComponents?: Array<{ longText: string; shortText: string; types: string[] }> }>(url.toString(), {
    headers: { 'X-Goog-Api-Key': apiKey(), 'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents' },
  });
  if (!place.location || !insideBounds(place.location.latitude, place.location.longitude, bounds)) throw new ApiError(422, 'PLACE_OUTSIDE_CITY', 'Cette destination se trouve en dehors de votre ville actuelle.');
  const city = component(place.addressComponents ?? [], ['locality', 'postal_town', 'administrative_area_level_2']);
  const cityName = city?.longText ?? expectedCity;
  return { placeId: place.id, name: place.displayName?.text ?? place.formattedAddress ?? '', address: place.formattedAddress ?? '', latitude: place.location.latitude, longitude: place.location.longitude, city: cityName };
}

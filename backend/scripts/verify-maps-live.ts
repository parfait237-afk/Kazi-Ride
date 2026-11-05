import { autocomplete, placeDetails, reverseGeocode } from '../src/places/places-provider.service.js';
import { getDrivingRoute } from '../src/routing/routing.service.js';

const origin = { latitude: 4.0511, longitude: 9.7679 };
const city = await reverseGeocode(origin.latitude, origin.longitude);
if (!city.bounds) throw new Error('Limites de ville absentes.');
const suggestions = await autocomplete('Bon', crypto.randomUUID(), city.bounds, city.countryCode, city.placeId);
if (!suggestions.length) throw new Error('Aucune suggestion Geoapify reçue.');
console.log(JSON.stringify({ city: city.name, bounds: city.bounds, suggestionNames: suggestions.map((item) => item.name) }, null, 2));
let destination;
for (const suggestion of suggestions) {
  try { destination = await placeDetails(suggestion.placeId, crypto.randomUUID(), city.name, city.bounds); break; }
  catch { /* les résultats extérieurs sont volontairement exclus */ }
}
if (!destination) throw new Error('Aucune suggestion située dans les limites de la ville.');
const route = await getDrivingRoute(origin, destination);

console.log(JSON.stringify({
  cityDetected: city.name,
  suggestionsReceived: suggestions.length,
  destinationResolved: Boolean(destination.latitude && destination.longitude),
  routePoints: route.coordinates.length,
  distanceKilometers: Number((route.distanceMeters / 1000).toFixed(1)),
  durationMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
}, null, 2));

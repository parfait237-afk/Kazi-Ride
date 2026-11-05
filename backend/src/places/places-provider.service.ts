import { env } from '../config/env.js';
import * as geoapify from './geoapify-places.service.js';
import * as google from './google-places.service.js';

export const reverseGeocode = env.GEOAPIFY_API_KEY ? geoapify.reverseGeocode : google.reverseGeocode;
export const autocomplete = (input: string, sessionToken: string, bounds: google.CityBounds, countryCode: string, cityPlaceId?: string) => env.GEOAPIFY_API_KEY
  ? geoapify.autocomplete(input, sessionToken, bounds, countryCode, cityPlaceId)
  : google.autocomplete(input, sessionToken, bounds, countryCode);
export const autocompleteCities = env.GEOAPIFY_API_KEY ? geoapify.autocompleteCities : google.autocompleteCities;
export const cityDetails = env.GEOAPIFY_API_KEY ? geoapify.cityDetails : google.cityDetails;
export const placeDetails = env.GEOAPIFY_API_KEY ? geoapify.placeDetails : google.placeDetails;

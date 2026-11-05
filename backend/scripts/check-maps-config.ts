import { env } from '../src/config/env.js';

console.log(JSON.stringify({
  geoapifyConfigured: Boolean(env.GEOAPIFY_API_KEY),
  osrmConfigured: Boolean(env.OSRM_BASE_URL),
  googleFallbackConfigured: Boolean(env.GOOGLE_MAPS_SERVER_API_KEY),
}, null, 2));

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { autocomplete, autocompleteCities, cityDetails, placeDetails, reverseGeocode } from './places-provider.service.js';

const coordinate = z.coerce.number().finite();
const boundsSchema = z.object({ north: coordinate.min(-90).max(90), south: coordinate.min(-90).max(90), east: coordinate.min(-180).max(180), west: coordinate.min(-180).max(180) }).refine((value) => value.north > value.south, 'Limites invalides');
const limiter = rateLimit({ windowMs: 60_000, limit: 90, standardHeaders: 'draft-8', legacyHeaders: false });

export const placesRouter = Router();
placesRouter.use(requireAuth, limiter);
placesRouter.get('/reverse-geocode', async (req, res) => {
  const input = z.object({ latitude: coordinate.min(-90).max(90), longitude: coordinate.min(-180).max(180) }).parse(req.query);
  res.json({ success: true, city: await reverseGeocode(input.latitude, input.longitude) });
});
placesRouter.get('/autocomplete', async (req, res) => {
  const input = z.object({ input: z.string().trim().min(2).max(120), sessionToken: z.string().uuid(), countryCode: z.string().length(2), cityPlaceId: z.string().max(2048).optional(), ...boundsSchema.shape }).parse(req.query);
  const { input: query, sessionToken, countryCode, cityPlaceId, ...bounds } = input;
  res.json({ success: true, suggestions: await autocomplete(query, sessionToken, bounds, countryCode, cityPlaceId) });
});
placesRouter.get('/details', async (req, res) => {
  const input = z.object({ placeId: z.string().min(3).max(300), sessionToken: z.string().uuid(), city: z.string().min(1).max(100), ...boundsSchema.shape }).parse(req.query);
  const { placeId, sessionToken, city, ...bounds } = input;
  res.json({ success: true, place: await placeDetails(placeId, sessionToken, city, bounds) });
});
placesRouter.get('/city-autocomplete', async (req, res) => {
  const input = z.object({ input: z.string().trim().min(2).max(120), sessionToken: z.string().uuid() }).parse(req.query);
  res.json({ success: true, suggestions: await autocompleteCities(input.input, input.sessionToken) });
});
placesRouter.get('/city-details', async (req, res) => {
  const input = z.object({ placeId: z.string().min(3).max(300), sessionToken: z.string().uuid() }).parse(req.query);
  res.json({ success: true, city: await cityDetails(input.placeId, input.sessionToken) });
});

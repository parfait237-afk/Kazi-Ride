import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { getDrivingRoute } from './routing.service.js';

const coordinateSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
const querySchema = z.object({ origin: z.string(), destination: z.string() }).transform((value, context) => {
  const parse = (input: string) => {
    const [latitude, longitude] = input.split(',').map(Number);
    return coordinateSchema.safeParse({ latitude, longitude });
  };
  const origin = parse(value.origin); const destination = parse(value.destination);
  if (!origin.success || !destination.success) { context.addIssue({ code: 'custom', message: 'Coordonnées invalides.' }); return z.NEVER; }
  return { origin: origin.data, destination: destination.data };
});

export const routingRouter = Router();
routingRouter.use(requireAuth, rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
routingRouter.get('/', async (req, res) => {
  const input = querySchema.parse(req.query);
  res.json({ success: true, route: await getDrivingRoute(input.origin, input.destination) });
});

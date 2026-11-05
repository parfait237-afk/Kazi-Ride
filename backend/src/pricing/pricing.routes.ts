import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { ApiError } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';
import { createRideEstimate, validateRideEstimate } from './pricing.service.js';

const coordinate = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
const estimateInput = z.object({ pickup: coordinate, destination: coordinate });
const confirmationInput = z.object({ estimateId: z.string().uuid(), categoryCode: z.enum(['ECO', 'COMFORT', 'VAN']) });
export const pricingRouter = Router();
pricingRouter.use(requireAuth, rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }));
pricingRouter.post('/estimate', async (req, res) => { const input = estimateInput.parse(req.body); res.status(201).json(await createRideEstimate(req.auth!.sub, input.pickup, input.destination)); });
pricingRouter.post('/confirm', async (req, res) => { const input = confirmationInput.parse(req.body); await validateRideEstimate(req.auth!.sub, input.estimateId, input.categoryCode); throw new ApiError(409, 'BOOKING_NOT_AVAILABLE', 'Le devis est valide. La création de la demande de course sera activée avec le module chauffeurs.'); });

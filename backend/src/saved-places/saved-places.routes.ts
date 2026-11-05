import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { userSavedPlaces } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const placeTypeSchema = z.enum(['HOME', 'WORK']);
const savedPlaceSchema = z.object({
  label: z.string().trim().min(1).max(80),
  address: z.string().trim().min(3).max(500),
  placeId: z.string().trim().max(200).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const savedPlacesRouter = Router();
savedPlacesRouter.use(requireAuth);

savedPlacesRouter.get('/', async (req, res) => {
  const places = await db.select().from(userSavedPlaces).where(eq(userSavedPlaces.userId, req.auth!.sub));
  res.json({ success: true, places });
});

savedPlacesRouter.put('/:type', async (req, res) => {
  const type = placeTypeSchema.parse(req.params.type);
  const input = savedPlaceSchema.parse(req.body);
  const [place] = await db.insert(userSavedPlaces).values({ ...input, type, userId: req.auth!.sub })
    .onConflictDoUpdate({
      target: [userSavedPlaces.userId, userSavedPlaces.type],
      set: { ...input, updatedAt: new Date() },
    }).returning();
  res.json({ success: true, place });
});

savedPlacesRouter.delete('/:type', async (req, res) => {
  const type = placeTypeSchema.parse(req.params.type);
  await db.delete(userSavedPlaces).where(and(eq(userSavedPlaces.userId, req.auth!.sub), eq(userSavedPlaces.type, type)));
  res.status(204).send();
});

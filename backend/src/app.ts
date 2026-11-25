import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './auth/auth.routes.js';
import { errorHandler } from './middleware/error.js';
import { savedPlacesRouter } from './saved-places/saved-places.routes.js';
import { placesRouter } from './places/places.routes.js';
import { routingRouter } from './routing/routing.routes.js';
import { pricingRouter } from './pricing/pricing.routes.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: false }));
app.use(express.json({ limit: '32kb' }));
app.get('/', (_req, res) => res.json({
  name: 'KaziRide API',
  status: 'ok',
  health: '/health',
}));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/users/me/saved-places', savedPlacesRouter);
app.use('/api/places', placesRouter);
app.use('/api/routes', routingRouter);
app.use('/api/rides', pricingRouter);
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route introuvable.' } }));
app.use(errorHandler);

// Vercel détecte cet export et exécute l'application comme une fonction Express.
// Le serveur local continue d'utiliser src/server.ts et son app.listen().
export default app;

import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors.js';
import { verifyAccessToken, type AccessPayload } from '../auth/tokens.js';

declare global {
  namespace Express { interface Request { auth?: AccessPayload } }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'TOKEN_MISSING', 'Access token manquant.'));
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, 'TOKEN_INVALID', 'Access token invalide ou expiré.'));
  }
}

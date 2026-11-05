import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessPayload = { sub: string; sid: string; role: 'PASSENGER' };

export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m', issuer: 'kaziride-api', audience: 'kaziride-mobile' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'kaziride-api', audience: 'kaziride-mobile' }) as AccessPayload;
}

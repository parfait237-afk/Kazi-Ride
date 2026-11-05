import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');
export const hashOtp = (challengeId: string, code: string) =>
  createHmac('sha256', env.OTP_HMAC_SECRET).update(`${challengeId}:${code}`).digest('hex');
export const verifyOtpHash = (expected: string, challengeId: string, code: string) => {
  const actual = hashOtp(challengeId, code);
  return expected.length === actual.length && timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
};
export const generateRefreshToken = () => randomBytes(48).toString('base64url');
export const hashRefreshToken = (token: string) => createHash('sha256').update(token).digest('hex');

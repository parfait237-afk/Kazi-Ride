import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { getUserForSession, logout, refreshSession, requestOtp, resendOtp, verifyOtp } from './auth.service.js';
import { logoutSchema, refreshSchema, requestOtpSchema, resendOtpSchema, verifyOtpSchema } from './auth.schemas.js';

export const authRouter = Router();
const otpLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const verifyLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

authRouter.post('/request-otp', otpLimiter, async (req, res) => {
  const input = requestOtpSchema.parse(req.body);
  const result = await requestOtp(input.email, input.phone);
  res.status(201).json({ success: true, ...result, message: 'Demande de vérification traitée' });
});

authRouter.post('/verify-otp', verifyLimiter, async (req, res) => {
  const input = verifyOtpSchema.parse(req.body);
  res.json({ success: true, ...await verifyOtp(input.challengeId, input.code) });
});

authRouter.post('/resend-otp', otpLimiter, async (req, res) => {
  const input = resendOtpSchema.parse(req.body);
  res.status(201).json({ success: true, ...await resendOtp(input.challengeId), message: 'Demande de vérification traitée' });
});

authRouter.post('/refresh', async (req, res) => {
  const input = refreshSchema.parse(req.body);
  res.json({ success: true, ...await refreshSession(input.refreshToken) });
});

authRouter.post('/logout', async (req, res) => {
  const input = logoutSchema.parse(req.body);
  await logout(input.refreshToken);
  res.status(204).send();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, user: await getUserForSession(req.auth!.sub, req.auth!.sid) });
});

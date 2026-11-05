import { describe, expect, it } from 'vitest';
import { requestOtpSchema, verifyOtpSchema } from './auth.schemas.js';

describe('auth validation', () => {
  it('normalise email et téléphone', () => {
    expect(requestOtpSchema.parse({ email: ' PASSAGER@Example.COM ', phone: '+237612345678' }))
      .toEqual({ email: 'passager@example.com', phone: '+237612345678' });
  });
  it('rejette un email invalide', () => expect(() => requestOtpSchema.parse({ email: 'x', phone: '+237612345678' })).toThrow());
  it('rejette un téléphone invalide', () => expect(() => requestOtpSchema.parse({ email: 'a@b.com', phone: '123' })).toThrow());
  it('impose un OTP à six chiffres', () => expect(() => verifyOtpSchema.parse({ challengeId: crypto.randomUUID(), code: '1234' })).toThrow());
});

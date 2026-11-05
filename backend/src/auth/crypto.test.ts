import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
process.env.RESEND_API_KEY = 'test';
process.env.EMAIL_FROM = 'test@example.com';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
process.env.OTP_HMAC_SECRET = 'b'.repeat(32);
process.env.TEST_ALLOWED_EMAIL = 'passager@example.com';
process.env.EMAIL_MODE = 'resend-test';

describe('OTP security', async () => {
  const crypto = await import('./crypto.js');
  it('génère toujours six chiffres', () => expect(crypto.generateOtp()).toMatch(/^\d{6}$/));
  it('valide uniquement le bon OTP pour le bon challenge', () => {
    const hash = crypto.hashOtp('challenge-a', '123456');
    expect(crypto.verifyOtpHash(hash, 'challenge-a', '123456')).toBe(true);
    expect(crypto.verifyOtpHash(hash, 'challenge-a', '654321')).toBe(false);
    expect(crypto.verifyOtpHash(hash, 'challenge-b', '123456')).toBe(false);
  });
  it('génère des refresh tokens opaques distincts', () => expect(crypto.generateRefreshToken()).not.toBe(crypto.generateRefreshToken()));
});

import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'postgresql://user:pass@localhost/db';
process.env.RESEND_API_KEY = 'test';
process.env.EMAIL_FROM = 'KaziRide <onboarding@resend.dev>';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
process.env.OTP_HMAC_SECRET = 'b'.repeat(32);
process.env.EMAIL_MODE = 'mock';
process.env.TEST_ALLOWED_EMAIL = 'passager@example.com';

describe('email service', () => {
  let service: typeof import('./email.service.js');
  beforeAll(async () => { service = await import('./email.service.js'); });
  it('envoie via le faux fournisseur sans appeler Resend', async () => {
    const provider = new service.MockEmailProvider();
    await service.sendOtpEmailMessage('PASSAGER@example.com', '123456', provider);
    expect(provider.sent).toHaveLength(1);
    expect(provider.sent[0]?.to).toBe('passager@example.com');
    expect(provider.sent[0]?.from).toBe('KaziRide <onboarding@resend.dev>');
    expect(provider.sent[0]?.subject).toBe('Votre code de vérification KaziRide');
    expect(provider.sent[0]?.attachments).toHaveLength(1);
    expect(provider.sent[0]?.attachments?.[0]?.filename).toBe('kaziride-logo.png');
    expect(provider.sent[0]?.attachments?.[0]?.contentId).toBe('kaziride-logo');
    expect(provider.sent[0]?.attachments?.[0]?.content.length).toBeGreaterThan(0);
    for (const digit of '123456') expect(provider.sent[0]?.html).toContain(`>${digit}</div>`);
  });
  it('peut être appelé avec uniquement une adresse e-mail', async () => {
    const provider = new service.MockEmailProvider();
    const result = await service.sendOtpEmail('passager@example.com', provider);
    expect(result.code).toMatch(/^\d{6}$/);
  });
  it('propage une erreur fournisseur', async () => {
    const provider: import('./email.service.js').EmailProvider = { send: async () => { throw new Error('provider down'); } };
    await expect(service.sendOtpEmailMessage('passager@example.com', '123456', provider)).rejects.toThrow('provider down');
  });
});

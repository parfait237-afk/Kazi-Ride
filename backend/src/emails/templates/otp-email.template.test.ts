import { describe, expect, it } from 'vitest';
import { generateOtpEmailTemplate } from './otp-email.template.js';

describe('KaziRide OTP email template', () => {
  it('injecte le code dynamique dans les versions HTML et texte', () => {
    const template = generateOtpEmailTemplate('482913');
    for (const digit of '482913') expect(template.html).toContain(`>${digit}</div>`);
    expect(template.text).toContain('4 8 2 9 1 3');
  });
  it('contient les textes de sécurité et la durée', () => {
    const template = generateOtpEmailTemplate('123456');
    expect(template.html).toContain('Ne partagez jamais ce code');
    expect(template.html).toContain('Expire dans 5 minutes');
  });
  it('utilise des tableaux et styles inline compatibles e-mail', () => {
    const template = generateOtpEmailTemplate('123456');
    expect(template.html).toContain('role="presentation"');
    expect(template.html).toContain('style="');
    expect(template.html).toContain('@media only screen and (max-width:600px)');
  });
  it('contient l’identité et le sujet KaziRide', () => {
    const template = generateOtpEmailTemplate('123456');
    expect(template.subject).toBe('Votre code de vérification KaziRide');
    expect(template.html).toContain('src="cid:kaziride-logo"');
    expect(template.html).toContain('aria-label="Adresse e-mail à vérifier"');
    expect(template.html).toContain('alt="Logo KaziRide"');
    expect(template.html).toContain('Kazi<span style="color:#29C6FF">Ride</span>');
  });
  it('n’utilise aucun pictogramme Unicode à la place des éléments graphiques', () => {
    const template = generateOtpEmailTemplate('123456');
    expect(template.html).not.toMatch(/&#(?:9993|9716|10003);|[✉✓⏱◴]/u);
  });
  it.each(['12345', '1234567', 'abcdef', '12 345'])('rejette un OTP invalide : %s', (otp) => {
    expect(() => generateOtpEmailTemplate(otp)).toThrow('exactement 6 chiffres');
  });
});

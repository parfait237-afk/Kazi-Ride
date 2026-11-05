import { Resend } from 'resend';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../errors.js';
import { renderOtpEmail } from '../emails/templates/otp-email.template.js';
import { generateOtp } from '../auth/crypto.js';

export type EmailAttachment = { filename: string; content: Buffer; contentId: string };
export type EmailMessage = { from: string; to: string; subject: string; html: string; text: string; attachments?: EmailAttachment[] };
export interface EmailProvider { send(message: EmailMessage): Promise<void> }

export class ResendEmailProvider implements EmailProvider {
  private readonly client = new Resend(env.RESEND_API_KEY);
  async send(message: EmailMessage) {
    const { error } = await this.client.emails.send(message);
    if (error) throw new ApiError(502, 'EMAIL_PROVIDER_ERROR', 'Le fournisseur d’e-mails a refusé l’envoi.');
  }
}

export class MockEmailProvider implements EmailProvider {
  readonly sent: EmailMessage[] = [];
  async send(message: EmailMessage) { this.sent.push(message); }
}

const defaultProvider: EmailProvider = env.EMAIL_MODE === 'mock' ? new MockEmailProvider() : new ResendEmailProvider();

export async function sendOtpEmailMessage(email: string, otp: string, provider: EmailProvider = defaultProvider) {
  const normalizedEmail = z.string().trim().email().parse(email).toLowerCase();
  if (env.EMAIL_MODE === 'resend-test' && normalizedEmail !== env.TEST_ALLOWED_EMAIL?.toLowerCase()) {
    throw new ApiError(403, 'EMAIL_NOT_ALLOWED_IN_TEST_MODE', 'Cette adresse n’est pas autorisée par la configuration Resend de test.');
  }
  const template = renderOtpEmail(otp);
  const logo = await readFile(new URL('../../../assets/images/kaziride-logo.png', import.meta.url));
  await provider.send({
    from: env.EMAIL_FROM,
    to: normalizedEmail,
    ...template,
    attachments: [{ filename: 'kaziride-logo.png', content: logo, contentId: 'kaziride-logo' }],
  });
}

export async function sendOtpEmail(email: string, provider: EmailProvider = defaultProvider) {
  const code = generateOtp();
  await sendOtpEmailMessage(email, code, provider);
  return { code };
}

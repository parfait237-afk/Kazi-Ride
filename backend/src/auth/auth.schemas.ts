import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

const email = z.string().trim().email().transform((value) => value.toLowerCase());
const phone = z.string().trim().refine((value) => isValidPhoneNumber(value), 'Numéro de téléphone invalide')
  .transform((value) => parsePhoneNumber(value).number);

export const requestOtpSchema = z.object({ email, phone });
export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});
export const refreshSchema = z.object({ refreshToken: z.string().min(32) });
export const logoutSchema = refreshSchema;
export const resendOtpSchema = z.object({ challengeId: z.string().uuid() });

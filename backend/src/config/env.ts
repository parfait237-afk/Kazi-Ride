import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const backendEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
const rootEnvPath = fileURLToPath(new URL('../../../.env', import.meta.url));
config({ path: [backendEnvPath, rootEnvPath], quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
  JWT_ACCESS_SECRET: z.string().min(32),
  OTP_HMAC_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive().default(4000),
  EMAIL_MODE: z.enum(['resend-test', 'production', 'mock']).default('resend-test'),
  TEST_ALLOWED_EMAIL: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().email().optional(),
  ),
  GOOGLE_MAPS_SERVER_API_KEY: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(20).optional(),
  ),
  GEOAPIFY_API_KEY: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(20).optional(),
  ),
  OSRM_BASE_URL: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().url().optional(),
  ),
});

export const env = schema.parse(process.env);

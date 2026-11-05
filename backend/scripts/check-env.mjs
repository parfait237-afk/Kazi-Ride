import { readFile } from 'node:fs/promises';

const contents = await readFile(new URL('../.env', import.meta.url), 'utf8');
const required = ['DATABASE_URL', 'RESEND_API_KEY', 'EMAIL_FROM', 'JWT_ACCESS_SECRET', 'OTP_HMAC_SECRET', 'EMAIL_MODE', 'TEST_ALLOWED_EMAIL'];
for (const key of required) {
  const raw = contents.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() ?? '';
  const normalized = raw.replace(/^['"]|['"]$/g, '');
  const state = !normalized ? 'MISSING' : key === 'EMAIL_MODE' ? normalized : `SET(${normalized.length})`;
  console.info(`${key}: ${state}`);
}

import 'dotenv/config';
import { writeFile } from 'node:fs/promises';

if (!process.env.TEST_ALLOWED_EMAIL) throw new Error('TEST_ALLOWED_EMAIL manquant');
const response = await fetch('http://127.0.0.1:4000/api/auth/request-otp', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: process.env.TEST_ALLOWED_EMAIL, phone: '+237612345678' }),
});
const data = await response.json();
if (!response.ok) throw new Error(`${data?.error?.code ?? response.status}: ${data?.error?.message ?? 'Échec'}`);
await writeFile(new URL('../.live-test-challenge', import.meta.url), data.challengeId);
console.info(`OTP envoyé. Challenge: ${data.challengeId}`);

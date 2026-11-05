import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../.env', import.meta.url);
let contents = await readFile(path, 'utf8');
contents = contents
  .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET=${randomBytes(48).toString('base64url')}`)
  .replace(/^OTP_HMAC_SECRET=.*$/m, `OTP_HMAC_SECRET=${randomBytes(48).toString('base64url')}`);
await writeFile(path, contents);
console.info('Secrets JWT et OTP générés dans backend/.env.');

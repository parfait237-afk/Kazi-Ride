import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../.env', import.meta.url);
let contents = await readFile(path, 'utf8');
const currentFrom = contents.match(/^EMAIL_FROM=(.*)$/m)?.[1]?.replace(/^['"]|['"]$/g, '').trim();
const set = (key, value) => {
  const line = `${key}=${value}`;
  contents = new RegExp(`^${key}=.*$`, 'm').test(contents)
    ? contents.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${contents.trimEnd()}\n${line}\n`;
};
set('EMAIL_FROM', 'KaziRide <onboarding@resend.dev>');
set('EMAIL_MODE', 'resend-test');
if (!/^TEST_ALLOWED_EMAIL=.+$/m.test(contents) && currentFrom && !currentFrom.includes('onboarding@resend.dev')) {
  set('TEST_ALLOWED_EMAIL', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(currentFrom) ? currentFrom : '');
}
const configuredAllowed = contents.match(/^TEST_ALLOWED_EMAIL=(.*)$/m)?.[1]?.trim() ?? '';
if (configuredAllowed.includes('<') || configuredAllowed.includes('onboarding@resend.dev')) set('TEST_ALLOWED_EMAIL', '');
await writeFile(path, contents);
console.info('Mode e-mail Resend test configuré.');

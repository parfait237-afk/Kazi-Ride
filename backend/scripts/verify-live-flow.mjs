import 'dotenv/config';
import { writeFile } from 'node:fs/promises';

const baseUrl = 'http://127.0.0.1:4000';

function hiddenCode() {
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write('Code OTP à 6 chiffres : ');
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (key) => {
      if (key === '\u0003') { cleanup(); reject(new Error('Annulé')); return; }
      if (key === '\r' || key === '\n') { cleanup(); process.stdout.write('\n'); resolve(value); return; }
      if (key === '\u007f' || key === '\b') { value = value.slice(0, -1); return; }
      if (/^\d$/.test(key) && value.length < 6) value += key;
    };
    const cleanup = () => { process.stdin.setRawMode?.(false); process.stdin.pause(); process.stdin.off('data', onData); };
    process.stdin.on('data', onData);
  });
}

async function request(path, body, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}

if (!process.env.TEST_ALLOWED_EMAIL) throw new Error('TEST_ALLOWED_EMAIL manquant dans .env');
const requested = await request('/api/auth/request-otp', {
  email: process.env.TEST_ALLOWED_EMAIL,
  phone: '+237612345678',
});
if (!requested.response.ok) {
  throw new Error(`${requested.data?.error?.code ?? requested.response.status}: ${requested.data?.error?.message ?? 'Échec de l’envoi OTP'}`);
}
const challengeId = requested.data.challengeId;
await writeFile(new URL('../.live-test-challenge', import.meta.url), challengeId);
console.info(`E-mail OTP demandé avec succès pour ${process.env.TEST_ALLOWED_EMAIL}.`);

const code = await hiddenCode();
if (!/^\d{6}$/.test(code)) throw new Error('Le code doit contenir exactement 6 chiffres.');

const verified = await request('/api/auth/verify-otp', { challengeId, code });
if (!verified.response.ok) throw new Error(`${verified.data?.error?.code}: ${verified.data?.error?.message}`);
const firstMe = await request('/api/auth/me', undefined, verified.data.accessToken);
if (!firstMe.response.ok) throw new Error('Échec de GET /me après vérification.');
const refreshed = await request('/api/auth/refresh', { refreshToken: verified.data.refreshToken });
if (!refreshed.response.ok) throw new Error('Échec de la rotation du refresh token.');
const secondMe = await request('/api/auth/me', undefined, refreshed.data.accessToken);
if (!secondMe.response.ok) throw new Error('Échec de GET /me après rotation.');
const loggedOut = await request('/api/auth/logout', { refreshToken: refreshed.data.refreshToken });
if (loggedOut.response.status !== 204) throw new Error('Échec de la déconnexion.');
const afterLogout = await request('/api/auth/refresh', { refreshToken: refreshed.data.refreshToken });
if (afterLogout.response.ok) throw new Error('Le refresh token fonctionne encore après déconnexion.');

console.info('PARCOURS COMPLET RÉUSSI : OTP, utilisateur, session, me, refresh, logout et révocation.');

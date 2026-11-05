import { readFile, writeFile } from 'node:fs/promises';
import { generateOtpEmailTemplate } from '../src/emails/templates/otp-email.template.js';

const previewCode = '482913';
const { html } = generateOtpEmailTemplate(previewCode);
const logo = await readFile(new URL('../../assets/images/kaziride-logo.png', import.meta.url));
const previewHtml = html.replace('cid:kaziride-logo', `data:image/png;base64,${logo.toString('base64')}`);
const output = new URL('../otp-preview.html', import.meta.url);
await writeFile(output, previewHtml, 'utf8');
console.info(`Prévisualisation générée : ${output.pathname}`);

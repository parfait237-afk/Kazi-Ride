const OTP_PATTERN = /^\d{6}$/;

export function generateOtpEmailTemplate(otp: string): { subject: string; html: string; text: string } {
  if (!OTP_PATTERN.test(otp)) throw new Error('L’OTP doit contenir exactement 6 chiffres.');
  const digits = [...otp];
  const cells = digits.map((digit) => `<td width="16.66%" align="center" valign="middle" style="width:16.66%;padding:0 4px"><div class="otp-cell" style="height:64px;background:#FFFFFF;border:1px solid #CEE0FA;border-radius:14px;box-shadow:0 7px 16px rgba(5,35,86,.10);font-family:Arial,Helvetica,sans-serif;font-size:33px;line-height:64px;font-weight:800;color:#07285F">${digit}</div></td>`).join('');
  const subject = 'Votre code de vérification KaziRide';
  const text = `KaziRide\nVotre trajet en toute sérénité\n\nVérifiez votre adresse e-mail\n\nUtilisez ce code pour confirmer votre identité et accéder à votre compte KaziRide.\n\nVOTRE CODE DE VÉRIFICATION\n${digits.join(' ')}\n\nExpire dans 5 minutes.\n\nNe partagez jamais ce code. Si vous n'avez pas demandé cette connexion, ignorez cet e-mail.\n\nL'équipe KaziRide`;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@media only screen and (max-width:600px){
  .canvas{padding:0!important}.email{width:100%!important;border-radius:0!important;box-shadow:none!important}.hero{padding:20px 14px 43px!important}.body-pad{padding-left:16px!important;padding-right:16px!important}.title{font-size:23px!important;line-height:29px!important;letter-spacing:-.3px!important}.lead{font-size:14px!important;line-height:21px!important}.otp-wrap{padding:20px 8px 18px!important}.otp-table{width:100%!important;max-width:340px!important}.otp-cell{height:50px!important;font-size:26px!important;line-height:50px!important;border-radius:10px!important;box-shadow:0 4px 10px rgba(5,35,86,.09)!important}.brand-name{font-size:29px!important;line-height:34px!important}.desktop-badge{display:none!important}.mail-icon-box{width:80px!important;height:80px!important;border-radius:23px!important}.mail-icon{width:64px!important;height:64px!important}.security-copy{font-size:12px!important;line-height:18px!important}.footer{padding:17px 18px!important}
}
@media only screen and (max-width:360px){.body-pad{padding-left:12px!important;padding-right:12px!important}.otp-wrap{padding-left:4px!important;padding-right:4px!important}.otp-cell{height:46px!important;font-size:23px!important;line-height:46px!important}.title{font-size:21px!important;line-height:27px!important}}
</style></head>
<body style="margin:0;padding:0;background:#EAF2FC;font-family:Arial,Helvetica,sans-serif;color:#07285F;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#EAF2FC"><tr><td class="canvas" align="center" style="padding:30px 10px">
<table role="presentation" class="email" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:28px;overflow:hidden;box-shadow:0 18px 55px rgba(7,40,95,.14)">

<tr><td class="hero" align="center" bgcolor="#07285F" style="padding:27px 26px 54px;background-color:#07285F;background-image:linear-gradient(145deg,#061B46 0%,#073B8F 62%,#0879F9 100%);border-bottom:5px solid #FFC400">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
    <td class="desktop-badge" width="86" valign="top"><div style="margin-top:8px;font-size:9px;line-height:13px;font-weight:800;letter-spacing:1.2px;color:#8FC7FF">KAZIRIDE</div></td>
    <td align="center"><img src="cid:kaziride-logo" width="86" height="76" alt="Logo KaziRide" style="display:block;width:86px;height:76px;object-fit:contain;border:0;margin:0 auto"><div class="brand-name" style="margin-top:3px;font-size:35px;line-height:40px;font-weight:800;letter-spacing:-1.2px;color:#FFFFFF">Kazi<span style="color:#29C6FF">Ride</span></div><div style="margin-top:5px;font-size:14px;line-height:20px;color:#D5E7FF">Votre trajet en toute sérénité</div></td>
    <td class="desktop-badge" width="86" align="right" valign="top"><div style="display:inline-block;margin-top:4px;padding:6px 9px;border:1px solid #4D77AE;border-radius:18px;font-size:9px;line-height:12px;font-weight:800;letter-spacing:.8px;color:#FFFFFF">SÉCURISÉ</div></td>
  </tr></table>
</td></tr>

<tr><td align="center" style="padding:0 20px"><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:-39px"><tr><td class="mail-icon-box" align="center" style="width:96px;height:96px;background:#FFFFFF;border:1px solid #DDEAFF;border-radius:28px;box-shadow:0 10px 24px rgba(7,40,95,.13)"><svg class="mail-icon" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Adresse e-mail à vérifier" width="76" height="76" viewBox="0 0 112 112" style="display:block;margin:0 auto"><rect x="2" y="2" width="108" height="108" rx="32" fill="#F2F7FF"/><rect x="24" y="32" width="64" height="48" rx="10" fill="#FFFFFF" stroke="#0867F2" stroke-width="5"/><path d="M28 38L56 59L84 38" fill="none" stroke="#0867F2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="84" cy="78" r="17" fill="#FFBD00" stroke="#FFFFFF" stroke-width="4"/><path d="M76.5 78L81.5 83L91.5 72.5" fill="none" stroke="#082457" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></td></tr></table></td></tr>

<tr><td class="body-pad" align="center" style="padding:19px 42px 0">
  <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.8px;color:#0875F5">VÉRIFICATION DU COMPTE</div>
  <h1 class="title" style="margin:8px 0 0;font-size:31px;line-height:38px;font-weight:800;letter-spacing:-.6px;color:#061B46">Vérifiez votre adresse e-mail</h1>
  <p class="lead" style="margin:11px auto 0;max-width:455px;font-size:16px;line-height:25px;color:#5A6D89">Entrez ce code dans l’application KaziRide pour confirmer votre identité et continuer.</p>
</td></tr>

<tr><td class="body-pad" style="padding:24px 34px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F1F7FF;border-radius:22px"><tr><td class="otp-wrap" align="center" style="padding:25px 17px 22px">
  <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.6px;color:#526A8D">VOTRE CODE DE VÉRIFICATION</div>
  <table class="otp-table" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:400px;margin-top:17px;table-layout:fixed"><tr>${cells}</tr></table>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px"><tr><td style="padding:6px 10px;background:#FFC400;border-radius:20px;font-size:10px;line-height:14px;font-weight:800;letter-spacing:.7px;color:#061B46">5 MIN</td><td style="padding-left:9px;font-size:13px;line-height:19px;font-weight:700;color:#526A8D">Expire dans 5 minutes</td></tr></table>
</td></tr></table></td></tr>

<tr><td class="body-pad" style="padding:5px 42px 29px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
  <td width="5" style="width:5px;background:#FFC400;border-radius:5px;font-size:0">&nbsp;</td>
  <td style="padding:2px 0 2px 15px"><div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1px;color:#061B46">PROTÉGEZ VOTRE COMPTE</div><div class="security-copy" style="margin-top:4px;font-size:13px;line-height:20px;color:#61728C">Ne partagez jamais ce code. Si vous n’avez pas demandé cette connexion, ignorez simplement cet e-mail.</div></td>
</tr></table></td></tr>

<tr><td class="footer" align="center" bgcolor="#061B46" style="padding:20px 25px;background:#061B46"><div style="font-size:14px;line-height:20px;font-weight:800;color:#FFFFFF">L’équipe KaziRide</div><div style="margin-top:4px;font-size:11px;line-height:17px;color:#9FB5D5">Message automatique — aucune réponse nécessaire</div></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}

export const renderOtpEmail = generateOtpEmailTemplate;

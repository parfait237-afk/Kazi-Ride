# KaziRide Auth API

Backend d’authentification bêta séparé de l’application Expo. L’OTP est envoyé uniquement par e-mail.

## Configuration

1. Copier `.env.example` vers `.env`.
2. Renseigner les secrets Neon, Resend, JWT et HMAC.
3. Autoriser l’adresse `EMAIL_FROM` dans Resend.
4. Depuis la racine du projet, migrer et démarrer :

```bash
npm run db:migrate
npm run dev
```

Les mêmes commandes peuvent être lancées depuis `backend/` avec `npm run db:migrate` et `npm run dev`.

L’application Expo lit l’URL avec `EXPO_PUBLIC_API_URL`. Sur un appareil physique, utiliser l’adresse IP locale de la machine, par exemple `http://192.168.1.20:4000`, et non `localhost`.

## Routes

- `POST /api/auth/request-otp` — `{ "email": "...", "phone": "+237..." }`
- `POST /api/auth/verify-otp` — `{ "challengeId": "...", "code": "123456" }`
- `POST /api/auth/resend-otp` — `{ "challengeId": "..." }`
- `POST /api/auth/refresh` — `{ "refreshToken": "..." }`
- `POST /api/auth/logout` — `{ "refreshToken": "..." }`
- `GET /api/auth/me` — `Authorization: Bearer <accessToken>`
- `GET /health`

## Sécurité

- OTP de 6 chiffres, valable 5 minutes et limité à 5 tentatives.
- HMAC du code lié à l’identifiant du challenge ; aucun OTP stocké ou journalisé en clair.
- Refresh token opaque stocké sous forme SHA-256, rotation à chaque renouvellement.
- Access token JWT de 15 minutes et session serveur de 30 jours.
- Transactions et verrouillages PostgreSQL pour empêcher la double validation.
- Limitation par IP et délai minimal entre deux demandes liées au même e-mail ou téléphone.

## Validation

```bash
npm run build
npm test
npm audit --omit=dev
```

Les tests en ligne nécessitant Neon et Resend doivent être exécutés après configuration du fichier `.env` avec des identifiants de test.

## Resend en mode bêta

Configurer dans `.env` :

```env
EMAIL_FROM="KaziRide <onboarding@resend.dev>"
EMAIL_MODE=resend-test
TEST_ALLOWED_EMAIL=votre-adresse-autorisee@example.com
```

Le backend refuse explicitement tout autre destinataire en mode test. Pour les requêtes Postman ou Bruno, suivre [docs/api-testing.md](docs/api-testing.md).

## Prévisualiser le template OTP

Depuis la racine du projet :

```bash
npm run email:preview
```

La commande génère `backend/otp-preview.html` avec le code fictif `482913`. Ce code est réservé à la prévisualisation locale ; les vrais e-mails utilisent toujours l’OTP sécurisé créé par le challenge.

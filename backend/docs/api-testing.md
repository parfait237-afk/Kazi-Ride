# Tester l’API avec Postman ou Bruno

Créer une variable d’environnement `baseUrl` avec `http://localhost:4000`.

## 1. Demander un OTP

`POST {{baseUrl}}/api/auth/request-otp`

```json
{
  "email": "ADRESSE_AUTORISEE_RESEND",
  "phone": "+237612345678"
}
```

En mode `resend-test`, l’e-mail doit être identique à `TEST_ALLOWED_EMAIL` dans `backend/.env`. Le code n’est jamais renvoyé par l’API.

## 2. Vérifier l’OTP

`POST {{baseUrl}}/api/auth/verify-otp`

```json
{
  "challengeId": "IDENTIFIANT_RECU",
  "code": "CODE_RECU_PAR_EMAIL"
}
```

Conserver `accessToken` et `refreshToken` depuis la réponse.

## 3. Utilisateur courant

`GET {{baseUrl}}/api/auth/me`

Ajouter `Authorization: Bearer ACCESS_TOKEN`.

## 4. Renouveler

`POST {{baseUrl}}/api/auth/refresh`

```json
{ "refreshToken": "REFRESH_TOKEN" }
```

Remplacer immédiatement l’ancien refresh token par le nouveau. Réutiliser un ancien token révoque la session.

## 5. Déconnexion

`POST {{baseUrl}}/api/auth/logout`

```json
{ "refreshToken": "REFRESH_TOKEN_ACTUEL" }
```

## 6. Renvoyer un OTP

`POST {{baseUrl}}/api/auth/resend-otp`

```json
{ "challengeId": "IDENTIFIANT_PRECEDENT" }
```

Respecter le délai minimal avant une nouvelle demande.

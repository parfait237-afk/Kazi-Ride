# Configuration Google Maps de KaziRide

L’intégration utilise Google Maps côté mobile et Google Places/Geocoding uniquement depuis le backend.

## API Google Cloud à activer

Dans le même projet Google Cloud avec facturation activée :

- Places API (New)
- Geocoding API
- Maps SDK for Android
- Maps SDK for iOS

## Clé serveur

Créer une clé réservée au backend, limitée aux API **Places API (New)** et **Geocoding API**. En production, ajouter une restriction par adresse IP correspondant au serveur KaziRide.

Ajouter dans `backend/.env` :

```env
GOOGLE_MAPS_SERVER_API_KEY=votre_cle_serveur
```

Cette clé ne doit jamais être préfixée par `EXPO_PUBLIC_` et ne doit jamais être placée dans l’application mobile.

## Clés mobiles

Créer deux clés différentes :

1. Android : restriction d’application Android avec le package `com.kaziride.passenger` et l’empreinte SHA-1 de signature. Limiter la clé à **Maps SDK for Android**.
2. iOS : restriction d’application iOS avec le bundle identifier `com.kaziride.passenger`. Limiter la clé à **Maps SDK for iOS**.

Ajouter dans le fichier `.env` à la racine :

```env
GOOGLE_MAPS_ANDROID_API_KEY=votre_cle_android
GOOGLE_MAPS_IOS_API_KEY=votre_cle_ios
```

Les clés mobiles sont injectées au binaire par `app.config.js`. Après leur ajout, créer un nouveau development build ou un nouveau binaire. Expo Go permet de tester `react-native-maps`, mais ne remplace pas la validation d’un vrai build configuré.

## Redémarrage

```bash
cd backend
npm run dev
```

Puis, depuis la racine dans un autre terminal :

```bash
npm start
```

Les fichiers `.env` sont ignorés par Git. Ne jamais enregistrer les clés dans le dépôt.

## Documentation officielle

- Places Autocomplete (New) : https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
- Place Details (New) : https://developers.google.com/maps/documentation/places/web-service/place-details
- Reverse geocoding : https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
- Expo react-native-maps : https://docs.expo.dev/versions/latest/sdk/map-view/

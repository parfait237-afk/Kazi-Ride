# Cartographie et GPS KaziRide

## État réellement implémenté

- GPS au premier plan avec `expo-location`.
- Détection automatique de la ville.
- Sélection manuelle de ville si le GPS est refusé.
- Recherche limitée à la ville active.
- Geoapify prioritaire lorsque sa clé est configurée.
- Google Places utilisé uniquement comme repli facultatif.
- Cache court des recherches, debounce et limitation de débit backend.
- Maison et Travail enregistrés dans Neon.
- Itinéraire routier OSRM, tracé sur la carte, distance et durée.

## Variables backend

Dans `backend/.env` :

```env
GEOAPIFY_API_KEY=votre_cle_geoapify
OSRM_BASE_URL=https://votre-serveur-osrm.example.com
```

`GEOAPIFY_API_KEY` reste uniquement sur le serveur. Ne pas utiliser `EXPO_PUBLIC_GEOAPIFY_API_KEY`.

`OSRM_BASE_URL` doit viser une instance OSRM privée ou un fournisseur contractuellement utilisable en production. Le serveur public de démonstration OSRM n’est volontairement pas utilisé automatiquement.

## Carte mobile actuelle

La carte actuelle reste sur `react-native-maps` afin que le projet continue de fonctionner dans Expo Go. Sur Android, ce composant utilise Google Maps ; sur iOS il peut utiliser Apple Maps ou Google Maps selon le fournisseur configuré.

La migration vers MapLibre doit être réalisée dans un development build, car MapLibre contient du code natif absent d’Expo Go. Elle nécessite également un style et un fournisseur de tuiles autorisé pour l’usage commercial, par exemple MapTiler. Ne pas utiliser les serveurs de tuiles publics OpenStreetMap comme infrastructure de production.

## Development build MapLibre

Lorsque le fournisseur de tuiles et la clé mobile ont été choisis :

```bash
npx expo install expo-dev-client
npm install @maplibre/maplibre-react-native
npx expo prebuild
eas build --profile development --platform android
eas build --profile development --platform ios
```

La version MapLibre actuelle exige React Native 0.80 ou plus et la nouvelle architecture. Le projet utilise React Native 0.88.1, donc la base est compatible, mais le binaire doit être reconstruit.

## Temps réel chauffeur restant

Le projet actuel ne possède pas encore de rôle chauffeur, de table chauffeur, de table course, ni d’application chauffeur. Un WebSocket ouvert sans ces autorisations exposerait des positions privées. Le suivi temps réel doit être ajouté après les modèles `drivers`, `rides` et l’affectation sécurisée d’une course, avec authentification des sockets et contrôle d’accès par course.

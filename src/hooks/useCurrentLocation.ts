import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { detectCurrentCity } from '@/services/places.service';
import type { CurrentCity } from '@/types/city.types';

export type CurrentLocation = { latitude: number; longitude: number; address: string | null };

function formatAddress(value: Location.LocationGeocodedAddress) {
  return [value.street, value.streetNumber, value.district, value.city, value.region, value.country].filter(Boolean).join(', ');
}

export function useCurrentLocation(enabled = true) {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [city, setCity] = useState<CurrentCity | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') permission = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);
      if (permission.status !== 'granted') {
        setError('Autorisez la localisation pour définir votre point de départ.');
        return;
      }
      const services = await Location.hasServicesEnabledAsync();
      if (!services) { setError('Activez le GPS de votre téléphone.'); return; }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = result.coords;
      let address: string | null = null;
      try { const values = await Location.reverseGeocodeAsync({ latitude, longitude }); address = values[0] ? formatAddress(values[0]) : null; } catch { /* coordonnées conservées */ }
      try {
        const detectedCity = await detectCurrentCity(latitude, longitude);
        setCity(detectedCity);
        setCityError(null);
        address = detectedCity.address ?? address;
      } catch (cityRequestError) {
        setCity(null);
        setCityError(cityRequestError instanceof Error ? cityRequestError.message : 'Impossible d’identifier votre ville actuelle.');
      }
      setLocation({ latitude, longitude, address });
    } catch { setError('Votre position est momentanément indisponible.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (enabled) locate(); }, [enabled, locate]);
  return { location, city, cityError, loading, error, canAskAgain, locate, selectCity: setCity };
}

import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { CurrentLocation } from '@/hooks/useCurrentLocation';
import type { Place } from '@/types/place.types';
import type { RouteCoordinate } from '@/types/route.types';

export function HomeMap(_props: { location: CurrentLocation | null; center?: { latitude: number; longitude: number } | null; destination: Place | null; routeCoordinates?: RouteCoordinate[]; recenterToken: number }) {
  return <View style={styles.map}><AppText style={styles.text}>La carte GPS est disponible dans l’application mobile.</AppText></View>;
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFill, backgroundColor: '#E8F1F8', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#64748B', textAlign: 'center', padding: 30 },
});

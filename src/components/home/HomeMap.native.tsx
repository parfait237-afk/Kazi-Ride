import { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Platform, StyleSheet, View } from 'react-native';
import type { CurrentLocation } from '@/hooks/useCurrentLocation';
import type { Place } from '@/types/place.types';
import type { RouteCoordinate } from '@/types/route.types';

type Props = { location: CurrentLocation | null; center?: { latitude: number; longitude: number } | null; destination: Place | null; routeCoordinates?: RouteCoordinate[]; recenterToken: number };
export function HomeMap({ location, center, destination, routeCoordinates = [], recenterToken }: Props) {
  const ref = useRef<MapView>(null);
  useEffect(() => {
    const target = location ?? center;
    if (!target) return;
    const region: Region = { ...target, latitudeDelta: .025, longitudeDelta: .025 };
    ref.current?.animateToRegion(region, 700);
  }, [location, center, recenterToken]);
  useEffect(() => {
    if (routeCoordinates.length < 2) return;
    ref.current?.fitToCoordinates(routeCoordinates, { edgePadding: { top: 130, right: 50, bottom: 370, left: 50 }, animated: true });
  }, [routeCoordinates]);
  const initial = location ?? center;
  return <MapView ref={ref} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} style={StyleSheet.absoluteFill} showsCompass showsScale initialRegion={initial ? { ...initial, latitudeDelta: .025, longitudeDelta: .025 } : undefined}>
    {location && <Marker coordinate={location} tracksViewChanges={false}><View style={styles.halo}><View style={styles.ring}><View style={styles.dot} /></View></View></Marker>}
    {destination && <Marker coordinate={destination} pinColor="#EF4444" title={destination.name} description={destination.address} />}
    {routeCoordinates.length > 1 && <Polyline coordinates={routeCoordinates} strokeColor="#0066FF" strokeWidth={6} lineCap="round" lineJoin="round" />}
  </MapView>;
}
const styles = StyleSheet.create({ halo: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(0,102,255,.18)', alignItems: 'center', justifyContent: 'center' }, ring: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, dot: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#0066FF' } });

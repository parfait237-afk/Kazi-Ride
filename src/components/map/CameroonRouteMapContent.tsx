import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { OutlineButton, PrimaryButton } from '@/components/ui/Buttons';
import { colors, radius, shadows, spacing } from '@/theme';

type Props = { renderMap: (url: string) => ReactNode };
type LocationState = 'loading' | 'ready' | 'denied' | 'error';
const LOCAL_SUGGESTIONS = ['Centre-ville', 'Aéroport', 'Gare routière', 'Hôpital'];

export function CameroonRouteMapContent({ renderMap }: Props) {
  const [locationState, setLocationState] = useState<LocationState>('loading');
  const [origin, setOrigin] = useState('');
  const [city, setCity] = useState('');
  const [originLabel, setOriginLabel] = useState('Recherche de votre position…');
  const [destination, setDestination] = useState('');
  const [activeDestination, setActiveDestination] = useState('');
  const progress = useRef(new Animated.Value(0)).current;
  const mapUrl = useMemo(() => {
    if (!origin) return 'https://www.google.com/maps?output=embed&hl=fr&q=Cameroun';
    if (!activeDestination) return `https://www.google.com/maps?output=embed&hl=fr&q=${encodeURIComponent(origin)}`;
    return `https://www.google.com/maps?output=embed&hl=fr&saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(activeDestination)}&travelmode=driving`;
  }, [activeDestination, origin]);

  const detectLocation = async () => {
    setLocationState('loading');
    setOriginLabel('Recherche de votre position…');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationState('denied');
        setOriginLabel('Localisation non autorisée');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = `${current.coords.latitude},${current.coords.longitude}`;
      setOrigin(coordinates);
      setOriginLabel('Position actuelle détectée');
      setLocationState('ready');
      try {
        const addresses = await Location.reverseGeocodeAsync(current.coords);
        const detectedCity = addresses[0]?.city || addresses[0]?.district || addresses[0]?.subregion || '';
        if (detectedCity) { setCity(detectedCity); setOriginLabel(`Position actuelle — ${detectedCity}`); }
      } catch {
        setCity('');
      }
    } catch {
      setLocationState('error');
      setOriginLabel('Position indisponible');
    }
  };

  useEffect(() => { detectLocation(); }, []);

  const simulate = () => {
    if (!origin || !destination.trim()) return;
    const contextualDestination = city && !destination.toLowerCase().includes(city.toLowerCase()) ? `${destination.trim()}, ${city}, Cameroun` : destination.trim();
    setActiveDestination(contextualDestination);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 4200, useNativeDriver: true }).start();
  };

  return <View style={styles.wrapper}>
    <View style={styles.map}>{renderMap(mapUrl)}</View>
    {activeDestination ? <Animated.View pointerEvents="none" style={[styles.movingVehicle, { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 240] }) }, { translateY: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -70, -15] }) }] }]}><Image source={require('@/assets/images/vehicle-yaris.png')} resizeMode="contain" style={styles.vehicleImage} /></Animated.View> : null}
    <View style={styles.searchPanel}>
      <View style={styles.locationRow}><View style={styles.locationDot} /><View style={styles.locationText}><AppText variant="caption" color={colors.textMuted}>VOTRE DÉPART</AppText><AppText variant="button">{originLabel}</AppText></View>{locationState !== 'ready' ? <View style={styles.retry}><OutlineButton label="Réessayer" onPress={detectLocation} /></View> : null}</View>
      <AppInput label="Où allez-vous ?" value={destination} onChangeText={setDestination} onSubmitEditing={simulate} returnKeyType="search" placeholder="Rechercher dans votre ville" indicatorColor={colors.gold} />
      {locationState === 'ready' ? <View style={styles.suggestions}>{LOCAL_SUGGESTIONS.map((place) => <Pressable key={place} onPress={() => setDestination(place)} style={styles.suggestion}><AppText variant="caption">{place}</AppText></Pressable>)}</View> : null}
      <PrimaryButton label="Afficher et simuler le trajet" onPress={simulate} disabled={locationState !== 'ready' || !destination.trim()} />
    </View>
    {activeDestination ? <View style={styles.routeBadge}><AppText variant="caption" color={colors.textMuted}>TRAJET EN COURS</AppText><AppText variant="button" numberOfLines={1}>{originLabel} vers {activeDestination}</AppText></View> : null}
  </View>;
}

const styles = StyleSheet.create({ wrapper: { height: 720, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.canvas, ...shadows.card }, map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, searchPanel: { position: 'absolute', zIndex: 10, top: spacing[4], left: spacing[4], right: spacing[4], gap: spacing[3], padding: spacing[4], borderRadius: radius.lg, backgroundColor: colors.white, ...shadows.floating }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] }, locationDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.electricBlue }, locationText: { flex: 1 }, retry: { width: 112 }, suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }, suggestion: { paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.full, backgroundColor: colors.surfaceMuted }, movingVehicle: { position: 'absolute', zIndex: 8, left: '12%', top: '62%', width: 90, height: 58, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.9)', ...shadows.floating }, vehicleImage: { width: 90, height: 58 }, routeBadge: { position: 'absolute', zIndex: 10, left: spacing[4], right: spacing[4], bottom: spacing[4], padding: spacing[3], borderRadius: radius.md, backgroundColor: colors.white, ...shadows.floating } });

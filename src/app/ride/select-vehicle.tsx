import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Bell, LocateFixed, Menu, UserRound } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeMap } from '@/components/home/HomeMap';
import { VehicleCategoryCard } from '@/components/ride/VehicleCategoryCard';
import { AppText } from '@/components/ui';
import { useRideEstimate } from '@/hooks/useRideEstimate';
import { rideEstimateService } from '@/services/ride-estimate.service';
import { colors } from '@/theme';
import type { VehicleCategoryCode } from '@/types/ride.types';

export default function SelectVehicleScreen() {
  const params = useLocalSearchParams<{ pickupLat: string; pickupLng: string; destinationLat: string; destinationLng: string; destinationName?: string }>();
  const { height: screenHeight, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pickup = useMemo(() => ({ latitude: Number(params.pickupLat), longitude: Number(params.pickupLng), address: 'Point de départ' }), [params.pickupLat, params.pickupLng]);
  const destination = useMemo(() => ({ latitude: Number(params.destinationLat), longitude: Number(params.destinationLng), name: params.destinationName || 'Destination', address: params.destinationName || 'Destination', placeId: '' }), [params.destinationLat, params.destinationLng, params.destinationName]);
  const { estimate, loading, error, retry } = useRideEstimate(pickup, destination);
  const [selected, setSelected] = useState<VehicleCategoryCode | null>(null);
  const [confirming, setConfirming] = useState(false);

  const useFallbackScroll = screenHeight < 680 || fontScale > 1.35;
  const compactCards = screenHeight < 650;
  const cardGap = compactCards ? 8 : 10;
  const sheetHeight = Math.min(630, Math.max(useFallbackScroll ? screenHeight * .76 : 530, screenHeight * .65));

  useEffect(() => {
    if (!estimate) return;
    const preferred = estimate.categories.find((item) => item.code === 'COMFORT' && item.available)
      ?? estimate.categories.find((item) => item.available);
    setSelected(preferred?.code ?? null);
  }, [estimate?.estimateId]);

  const expired = estimate ? new Date(estimate.expiresAt).getTime() <= Date.now() : true;
  const confirmationDisabled = !estimate || !selected || expired || confirming;
  const confirm = async () => {
    if (!estimate || !selected || expired) return;
    setConfirming(true);
    try { await rideEstimateService.confirm(estimate.estimateId, selected); }
    catch (requestError) { Alert.alert('Devis validé', requestError instanceof Error ? requestError.message : 'La demande de course n’est pas encore disponible.'); }
    finally { setConfirming(false); }
  };

  const cards = estimate?.categories.map((quote) => <VehicleCategoryCard
    key={quote.code}
    quote={quote}
    compact={compactCards}
    selected={selected === quote.code}
    onPress={() => setSelected(quote.code)}
  />);

  return <View style={styles.page}>
    <HomeMap location={pickup} destination={destination} routeCoordinates={estimate?.routeCoordinates} recenterToken={0} />
    <View pointerEvents="none" style={[styles.mapShade, { bottom: sheetHeight - 12 }]} />

    <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.header}>
        <CircleButton label="Menu" onPress={() => router.back()}><Menu size={25} color={colors.navy} strokeWidth={2.5} /></CircleButton>
        <View style={styles.brand}>
          <Image source={require('@/assets/images/kaziride-logo.png')} resizeMode="contain" style={styles.brandLogo} />
          <AppText style={styles.brandName}>Kazi<AppText style={styles.brandBlue}>Ride</AppText></AppText>
        </View>
        <View style={styles.headerRight}>
          <CircleButton label="Notifications"><View><Bell size={23} color={colors.navy} strokeWidth={2.3} /><View style={styles.notificationDot} /></View></CircleButton>
          <CircleButton label="Profil"><UserRound size={23} color={colors.electricBlue} strokeWidth={2.4} /></CircleButton>
        </View>
      </View>
    </SafeAreaView>

    <View style={[styles.recenter, { bottom: sheetHeight + 18 }]}>
      <CircleButton label="Recentrer"><LocateFixed size={25} color={colors.navy} strokeWidth={2.5} /></CircleButton>
    </View>

    <View style={[styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.handle} />
      <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.82} style={styles.heading}>Choisissez votre trajet</AppText>
      <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.84} style={styles.subtitle}>Sélectionnez le type de véhicule qui vous convient.</AppText>

      {loading ? <View style={styles.state}>
        <ActivityIndicator size="large" color={colors.electricBlue} />
        <AppText style={styles.stateText}>Calcul des tarifs en cours…</AppText>
      </View> : error ? <View style={styles.state}>
        <AppText style={styles.error}>{error}</AppText>
        <Pressable onPress={retry} style={styles.retry}><AppText style={styles.retryText}>Réessayer</AppText></Pressable>
      </View> : useFallbackScroll ? <View style={styles.cardsViewport}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.cardsScrollContent, { gap: cardGap }]}>{cards}</ScrollView>
      </View> : <View style={[styles.cards, { gap: cardGap }]}>{cards}</View>}

      <Pressable
        accessibilityRole="button"
        disabled={confirmationDisabled}
        onPress={confirm}
        style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
      >
        <LinearGradient colors={confirmationDisabled ? ['#A7B8CE', '#93A5BB'] : ['#1295FF', '#0757F8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmGradient}>
          {confirming ? <ActivityIndicator color="#fff" /> : <><AppText style={styles.confirmText}>{expired && estimate ? 'Devis expiré' : 'Confirmer le trajet'}</AppText><ArrowRight size={27} color="#FFFFFF" strokeWidth={2.7} /></>}
        </LinearGradient>
      </Pressable>
    </View>
  </View>;
}

function CircleButton({ children, label, onPress }: { children: React.ReactNode; label: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.circle, pressed && styles.circlePressed]}>{children}</Pressable>;
}

const shadow = Platform.select({
  ios: { shadowColor: '#001B4E', shadowOpacity: .14, shadowRadius: 17, shadowOffset: { width: 0, height: 7 } },
  android: { elevation: 9 }, default: {},
});
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EAF1F7' },
  mapShade: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,27,78,.43)' },
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { height: 78, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', gap: 8 },
  brand: { position: 'absolute', left: '50%', marginLeft: -84, width: 168, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  brandLogo: { width: 58, height: 54 },
  brandName: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '900', marginLeft: -3 },
  brandBlue: { color: '#28A8FF' },
  circle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow },
  circlePressed: { opacity: .78, transform: [{ scale: .97 }] },
  notificationDot: { position: 'absolute', right: -3, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF253A', borderWidth: 1.5, borderColor: '#FFFFFF' },
  recenter: { position: 'absolute', right: 18 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingHorizontal: 14, paddingTop: 10, ...shadow },
  handle: { width: 50, height: 5, borderRadius: 3, backgroundColor: '#C8D1DE', alignSelf: 'center', marginBottom: 11 },
  heading: { color: '#000A2D', fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -.7 },
  subtitle: { color: '#5D6E88', fontSize: 14.5, lineHeight: 21, marginTop: 1, marginBottom: 10 },
  cards: { flex: 1, width: '100%', alignSelf: 'stretch', justifyContent: 'center' },
  cardsViewport: { flex: 1, width: '100%', alignSelf: 'stretch', overflow: 'hidden' },
  cardsScrollContent: { width: '100%', alignSelf: 'stretch', paddingVertical: 2 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13 },
  stateText: { color: '#5D6E88', fontSize: 14, fontWeight: '600' },
  error: { color: colors.error, fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 18 },
  retry: { height: 44, borderRadius: 22, paddingHorizontal: 25, backgroundColor: '#E8F3FF', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: colors.electricBlue, fontWeight: '800' },
  confirm: { height: 58, flexShrink: 0, borderRadius: 29, marginTop: 11, overflow: 'hidden', shadowColor: colors.electricBlue, shadowOpacity: .22, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  confirmGradient: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 23 },
  confirmPressed: { transform: [{ scale: .99 }] },
  confirmText: { color: '#FFFFFF', fontSize: 19, lineHeight: 24, fontWeight: '900' },
});

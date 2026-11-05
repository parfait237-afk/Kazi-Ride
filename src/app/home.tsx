import { router } from 'expo-router';
import { ArrowUpDown, Bell, ChevronRight, Clock3, LocateFixed, MapPin, Menu, Navigation, Route as RouteIcon, UserRound } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeMap } from '@/components/home/HomeMap';
import { SavedPlaceCard } from '@/components/home/SavedPlaceCard';
import { SavedPlaceModal } from '@/components/home/SavedPlaceModal';
import { CitySelectionModal } from '@/components/places/CitySelectionModal';
import { AppText } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { createPlacesSessionToken, getPlaceDetails, searchPlaces } from '@/services/places.service';
import { savedPlacesService } from '@/services/saved-places.service';
import { getDrivingRoute } from '@/services/routing.service';
import { colors } from '@/theme';
import type { Place, PlaceSuggestion, SavedPlace, SavedPlaceType } from '@/types/place.types';
import type { DrivingRoute } from '@/types/route.types';

type SearchMode = 'DESTINATION' | SavedPlaceType;

export default function PassengerHomeScreen() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { location, city, cityError, loading: locationLoading, error: locationError, canAskAgain, locate, selectCity } = useCurrentLocation(isAuthenticated);
  const [destination, setDestination] = useState<Place | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<SearchMode | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [saving, setSaving] = useState(false);
  const [recenterToken, setRecenterToken] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedModalType, setSavedModalType] = useState<SavedPlaceType | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [citySelectionOpen, setCitySelectionOpen] = useState(false);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const requestId = useRef(0);
  const placesSessionToken = useRef(createPlacesSessionToken());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth');
  }, [authLoading, isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) return;
    savedPlacesService.list().then(setSavedPlaces).catch(() => undefined).finally(() => setSavedLoading(false));
  }, [isAuthenticated]);
  useEffect(() => {
    if (!searchMode || !city || query.trim().length < 3) { setResults([]); setSearching(false); return; }
    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const places = await searchPlaces(query, city, placesSessionToken.current);
        if (current === requestId.current) setResults(places);
      } catch { if (current === requestId.current) setResults([]); }
      finally { if (current === requestId.current) setSearching(false); }
    }, 400);
    return () => { clearTimeout(timer); };
  }, [query, searchMode, city]);
  useEffect(() => {
    if (!location || !destination) { setRoute(null); setRouteError(null); return; }
    let active = true;
    setRouteLoading(true); setRouteError(null);
    getDrivingRoute(location, destination)
      .then((value) => { if (active) setRoute(value); })
      .catch((requestError) => { if (active) { setRoute(null); setRouteError(requestError instanceof Error ? requestError.message : 'Itinéraire indisponible.'); } })
      .finally(() => { if (active) setRouteLoading(false); });
    return () => { active = false; };
  }, [location?.latitude, location?.longitude, destination?.latitude, destination?.longitude]);

  const savedByType = useMemo(() => Object.fromEntries(savedPlaces.map((place) => [place.type, place])) as Partial<Record<SavedPlaceType, SavedPlace>>, [savedPlaces]);
  const openSearch = (mode: SearchMode) => { placesSessionToken.current = createPlacesSessionToken(); setSearchMode(mode); setQuery(''); setResults([]); setSelected(null); };
  const closeSearch = () => { setSearchMode(null); setQuery(''); setResults([]); setSelected(null); };
  const choosePlace = async (suggestion: PlaceSuggestion) => {
    if (!city) return;
    setSearching(true);
    try {
      const place = await getPlaceDetails(suggestion.placeId, city, placesSessionToken.current);
      setSelected(place);
      if (searchMode === 'DESTINATION') {
        setDestination(place); closeSearch();
        if (!location) { Alert.alert('Position indisponible', 'Votre position GPS est nécessaire pour calculer le trajet.'); return; }
        router.push({ pathname: '/ride/select-vehicle' as never, params: { pickupLat: String(location.latitude), pickupLng: String(location.longitude), destinationLat: String(place.latitude), destinationLng: String(place.longitude), destinationName: place.name } });
      }
    } catch (requestError) {
      Alert.alert('Destination indisponible', requestError instanceof Error ? requestError.message : 'Cette destination ne peut pas être sélectionnée.');
    } finally { setSearching(false); }
  };
  const savePlace = async () => {
    if (!selected || searchMode === 'DESTINATION' || !searchMode) return;
    setSaving(true);
    try {
      const saved = await savedPlacesService.save(searchMode, selected);
      setSavedPlaces((current) => [...current.filter((item) => item.type !== searchMode), saved]);
      closeSearch();
    } catch { Alert.alert('Enregistrement impossible', 'Vérifiez votre connexion puis réessayez.'); }
    finally { setSaving(false); }
  };
  const useSavedPlace = (type: SavedPlaceType) => {
    const place = savedByType[type];
    if (place) setDestination(place); else setSavedModalType(type);
  };
  const removeSavedPlace = (type: SavedPlaceType) => Alert.alert('Supprimer cette adresse ?', 'Cette action retirera le raccourci enregistré.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: async () => {
      try {
        await savedPlacesService.remove(type);
        setSavedPlaces((items) => items.filter((item) => item.type !== type));
        setNotice(type === 'HOME' ? 'Adresse de votre maison supprimée.' : 'Adresse de votre travail supprimée.');
        setTimeout(() => setNotice(null), 2600);
      } catch { Alert.alert('Suppression impossible', 'Vérifiez votre connexion puis réessayez.'); }
    } },
  ]);

  if (authLoading || !isAuthenticated) return <View style={styles.center}><ActivityIndicator color={colors.electricBlue} /></View>;
  return <View style={styles.page}>
    <HomeMap location={location} center={city?.center} destination={destination} routeCoordinates={route?.coordinates} recenterToken={recenterToken} />
    <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.header}>
        <CircleButton label="Menu" onPress={() => setMenuOpen(true)}><Menu size={25} color={colors.navy} strokeWidth={2.4} /></CircleButton>
        <Image source={require('@/assets/images/kaziride-logo.png')} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerRight}>
          <CircleButton label="Notifications"><Bell size={24} color={colors.navy} strokeWidth={2.2} /></CircleButton>
          <CircleButton label="Profil" onPress={() => Alert.alert('Compte KaziRide', user?.email ?? '')}><UserRound size={24} color={colors.electricBlue} strokeWidth={2.4} /></CircleButton>
        </View>
      </View>
    </SafeAreaView>

    <View style={[styles.mapControls, { bottom: Math.max(340, insets.bottom + 326) }]}>
      <CircleButton label="Recentrer" onPress={async () => { await locate(); setRecenterToken((value) => value + 1); }}><LocateFixed size={26} color={colors.electricBlue} strokeWidth={2.4} /></CircleButton>
      <CircleButton label="Orientation" onPress={() => setRecenterToken((value) => value + 1)}><Navigation size={25} color={colors.electricBlue} fill={colors.electricBlue} /></CircleButton>
    </View>

    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.handle} />
      <Pressable style={styles.locationCard} onPress={locate}>
        <View style={styles.iconSoft}><LocateFixed size={25} color={colors.electricBlue} strokeWidth={2.5} /></View>
        <View style={styles.cardCopy}>
          <AppText style={styles.cardTitle}>Ma position actuelle</AppText>
          {locationLoading ? <ActivityIndicator size="small" color={colors.electricBlue} style={styles.inlineLoader} /> : <AppText numberOfLines={1} style={styles.cardSubtitle}>{location?.address || locationError || 'Adresse GPS indisponible'}</AppText>}
        </View>
        <ArrowUpDown size={24} color={colors.electricBlue} strokeWidth={2.5} />
      </Pressable>
      {locationError && <Pressable onPress={canAskAgain ? locate : () => Linking.openSettings()}><AppText style={styles.permissionLink}>{canAskAgain ? 'Autoriser la localisation' : 'Ouvrir les paramètres'}</AppText></Pressable>}
      {!city && !locationLoading && <Pressable onPress={() => setCitySelectionOpen(true)}><AppText style={styles.permissionLink}>Choisir ma ville manuellement</AppText></Pressable>}
      <Pressable style={styles.destinationCard} onPress={() => openSearch('DESTINATION')}>
        <View style={styles.pinSoft}><MapPin size={25} color={colors.error} fill="#FFE5E5" strokeWidth={2.4} /></View>
        <AppText numberOfLines={1} style={[styles.destinationText, destination && styles.destinationSelected]}>{destination?.name || 'Où allez-vous ?'}</AppText>
        <ChevronRight size={27} color="#8290A8" />
      </Pressable>
      {(destination && (routeLoading || route || routeError)) && <View style={styles.routeSummary}>
        {routeLoading ? <ActivityIndicator size="small" color={colors.electricBlue} /> : route ? <>
          <View style={styles.routeMetric}><RouteIcon size={18} color={colors.electricBlue} /><AppText style={styles.routeMetricText}>{(route.distanceMeters / 1000).toFixed(1)} km</AppText></View>
          <View style={styles.routeDivider} />
          <View style={styles.routeMetric}><Clock3 size={18} color={colors.electricBlue} /><AppText style={styles.routeMetricText}>{Math.max(1, Math.round(route.durationSeconds / 60))} min</AppText></View>
        </> : <AppText style={styles.routeError}>{routeError}</AppText>}
      </View>}
      <View style={styles.savedRow}>
        <SavedPlaceCard type="HOME" place={savedByType.HOME} loading={savedLoading} onPress={() => useSavedPlace('HOME')} onEdit={() => setSavedModalType('HOME')} onDelete={() => removeSavedPlace('HOME')} />
        <SavedPlaceCard type="WORK" place={savedByType.WORK} loading={savedLoading} onPress={() => useSavedPlace('WORK')} onEdit={() => setSavedModalType('WORK')} onDelete={() => removeSavedPlace('WORK')} />
      </View>
    </View>

    {notice && <View style={[styles.notice, { bottom: Math.max(insets.bottom, 14) + 300 }]}><AppText style={styles.noticeText}>{notice}</AppText></View>}

    {savedModalType && <SavedPlaceModal
      visible
      type={savedModalType}
      currentPlace={savedByType[savedModalType]}
      city={city}
      onClose={() => setSavedModalType(null)}
      onSaved={(place) => {
        setSavedPlaces((current) => [...current.filter((item) => item.type !== place.type), place]);
        setNotice(place.type === 'HOME' ? 'Adresse de votre maison enregistrée.' : 'Adresse de votre travail enregistrée.');
        setTimeout(() => setNotice(null), 2600);
      }}
    />}

    <CitySelectionModal visible={citySelectionOpen} onClose={() => setCitySelectionOpen(false)} onSelect={(selectedCity) => { selectCity(selectedCity); setRecenterToken((value) => value + 1); }} />

    <Modal visible={Boolean(searchMode)} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeSearch}>
      <SafeAreaView style={styles.modalPage}>
        <View style={styles.modalHeader}><Pressable onPress={closeSearch} style={styles.close}><AppText style={styles.closeText}>Annuler</AppText></Pressable><AppText style={styles.modalTitle}>{searchMode === 'HOME' ? 'Adresse de votre maison' : searchMode === 'WORK' ? 'Adresse de votre travail' : 'Votre destination'}</AppText><View style={styles.closeSpacer} /></View>
        {city && <AppText style={styles.currentCity}>Ville actuelle : {city.name}, {city.country}</AppText>}
        {!city && <AppText style={styles.cityError}>{cityError || 'Autorisez la localisation ou choisissez votre ville manuellement.'}</AppText>}
        <View style={styles.searchBox}><MapPin size={21} color={colors.error} /><TextInput autoFocus value={query} onChangeText={(value) => { setQuery(value); setSelected(null); }} placeholder="Rechercher une adresse ou un lieu" placeholderTextColor="#8290A8" style={styles.searchInput} returnKeyType="search" /></View>
        {searching && <ActivityIndicator color={colors.electricBlue} style={styles.searchLoader} />}
        <FlatList data={results} keyboardShouldPersistTaps="handled" keyExtractor={(item) => item.placeId} renderItem={({ item }) => <Pressable onPress={() => void choosePlace(item)} style={styles.result}><View style={styles.resultPin}><MapPin size={18} color={colors.error} /></View><View style={styles.resultCopy}><AppText style={styles.resultName}>{item.name}</AppText><AppText numberOfLines={2} style={styles.resultAddress}>{item.address}</AppText></View></Pressable>} ListEmptyComponent={!searching && query.length >= 3 ? <AppText style={styles.empty}>Aucun lieu trouvé dans cette ville.</AppText> : undefined} />
        {searchMode !== 'DESTINATION' && <Pressable disabled={!selected || saving} onPress={savePlace} style={[styles.saveButton, (!selected || saving) && styles.saveDisabled]}>{saving ? <ActivityIndicator color="#fff" /> : <AppText style={styles.saveText}>Enregistrer l’adresse</AppText>}</Pressable>}
      </SafeAreaView>
    </Modal>

    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}><Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}><View style={styles.menu}><AppText style={styles.menuTitle}>KaziRide</AppText><AppText style={styles.menuEmail}>{user?.email}</AppText><Pressable style={styles.logout} onPress={async () => { setMenuOpen(false); await logout(); router.replace('/'); }}><AppText style={styles.logoutText}>Se déconnecter</AppText></Pressable></View></Pressable></Modal>
  </View>;
}

function CircleButton({ children, label, onPress }: { children: React.ReactNode; label: string; onPress?: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>{children}</Pressable>; }

const shadow = Platform.select({ ios: { shadowColor: '#061B46', shadowOpacity: .13, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } }, android: { elevation: 8 }, default: {} });
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EAF1F7' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 }, header: { height: 82, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerRight: { flexDirection: 'row', gap: 10 }, logo: { width: 148, height: 62 }, circleButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow }, pressed: { opacity: .75, transform: [{ scale: .97 }] },
  mapControls: { position: 'absolute', right: 18, gap: 12 }, sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 18, backgroundColor: 'rgba(255,255,255,.98)', borderTopLeftRadius: 34, borderTopRightRadius: 34, ...shadow }, handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 16 }, locationCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderRadius: 22, borderWidth: 1, borderColor: '#E2EAF3', backgroundColor: '#fff', padding: 12 }, iconSoft: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F3FF', alignItems: 'center', justifyContent: 'center' }, cardCopy: { flex: 1, marginLeft: 13 }, cardTitle: { color: colors.navy, fontSize: 17, fontWeight: '800' }, cardSubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 }, inlineLoader: { alignSelf: 'flex-start', marginTop: 6 }, swap: { color: colors.electricBlue, fontSize: 28, fontWeight: '800', paddingHorizontal: 6 }, permissionLink: { color: colors.electricBlue, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 6 },
  destinationCard: { height: 74, marginTop: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 22, borderWidth: 1, borderColor: '#E2EAF3', backgroundColor: '#fff', padding: 12 }, pinSoft: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }, destinationText: { flex: 1, marginLeft: 13, color: '#8290A8', fontSize: 18, fontWeight: '600' }, destinationSelected: { color: colors.navy }, chevron: { color: '#8290A8', fontSize: 36, fontWeight: '300' }, routeSummary: { minHeight: 42, marginTop: 9, borderRadius: 14, backgroundColor: '#EDF5FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 18 }, routeMetric: { flexDirection: 'row', alignItems: 'center', gap: 7 }, routeMetricText: { color: colors.navy, fontSize: 14, fontWeight: '800' }, routeDivider: { width: 1, height: 20, backgroundColor: '#BBD7FF' }, routeError: { color: colors.error, fontSize: 12, fontWeight: '700', textAlign: 'center' }, savedRow: { flexDirection: 'row', gap: 9, marginTop: 10 }, savedCard: { flex: 1, height: 78, flexDirection: 'row', alignItems: 'center', borderRadius: 20, backgroundColor: '#fff', padding: 10, borderWidth: 1, borderColor: '#EDF1F6' }, savedIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#E8F3FF', alignItems: 'center', justifyContent: 'center' }, savedIconText: { color: colors.electricBlue, fontSize: 19, fontWeight: '900' }, savedCopy: { flex: 1, marginLeft: 10 }, savedTitle: { color: colors.navy, fontSize: 16, fontWeight: '800' }, savedSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  modalPage: { flex: 1, backgroundColor: '#F8FAFC' }, modalHeader: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 }, close: { width: 72 }, closeSpacer: { width: 72 }, closeText: { color: colors.electricBlue, fontWeight: '700' }, modalTitle: { flex: 1, textAlign: 'center', color: colors.navy, fontSize: 17, fontWeight: '800' }, currentCity: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginHorizontal: 20, marginBottom: 8 }, cityError: { color: colors.error, fontSize: 13, fontWeight: '700', marginHorizontal: 20, marginBottom: 8 }, searchBox: { height: 58, marginHorizontal: 18, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 }, searchInput: { flex: 1, marginLeft: 14, color: colors.navy, fontSize: 16 }, searchLoader: { marginTop: 14 }, result: { flexDirection: 'row', marginHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E5EAF0' }, resultSelected: { backgroundColor: '#EDF5FF' }, resultPin: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }, resultCopy: { flex: 1, marginLeft: 12 }, resultName: { color: colors.navy, fontSize: 15, fontWeight: '800' }, resultAddress: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 }, empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40, paddingHorizontal: 30 }, saveButton: { margin: 18, height: 58, borderRadius: 29, backgroundColor: colors.electricBlue, alignItems: 'center', justifyContent: 'center' }, saveDisabled: { backgroundColor: colors.disabled }, saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  notice: { position: 'absolute', left: 24, right: 24, minHeight: 46, borderRadius: 15, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, zIndex: 20, ...shadow }, noticeText: { color: colors.white, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,27,78,.35)', justifyContent: 'flex-start' }, menu: { width: '78%', height: '100%', backgroundColor: '#fff', paddingTop: 80, paddingHorizontal: 24 }, menuTitle: { color: colors.navy, fontSize: 28, fontWeight: '900' }, menuEmail: { color: colors.textMuted, marginTop: 7 }, logout: { marginTop: 40, height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, logoutText: { color: colors.navy, fontWeight: '800' },
  menuIcon: { gap: 5 }, menuLine: { width: 22, height: 3, borderRadius: 2, backgroundColor: colors.navy }, bell: { width: 22, height: 25, alignItems: 'center' }, bellBody: { width: 17, height: 19, borderWidth: 2.5, borderColor: colors.navy, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }, bellDot: { width: 5, height: 3, borderRadius: 2, backgroundColor: colors.navy, marginTop: 1 }, person: { alignItems: 'center' }, personHead: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.electricBlue }, personBody: { width: 22, height: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: colors.electricBlue, marginTop: 3 }, targetOuter: { width: 25, height: 25, borderRadius: 13, borderWidth: 3, borderColor: colors.electricBlue, alignItems: 'center', justifyContent: 'center' }, targetInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.electricBlue }, pin: { width: 18, height: 22, borderRadius: 10, borderBottomRightRadius: 2, backgroundColor: '#EF4444', transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' }, pinHole: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }, navigation: { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 25, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.electricBlue, transform: [{ rotate: '42deg' }] },
});

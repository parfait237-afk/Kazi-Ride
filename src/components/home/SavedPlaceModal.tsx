import { ArrowRight, BriefcaseBusiness, Check, House, MapPin, Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui';
import { createPlacesSessionToken, getPlaceDetails, searchPlaces } from '@/services/places.service';
import { savedPlacesService } from '@/services/saved-places.service';
import { colors } from '@/theme';
import type { CurrentCity } from '@/types/city.types';
import type { Place, PlaceSuggestion, SavedPlace, SavedPlaceType } from '@/types/place.types';

type Props = {
  visible: boolean;
  type: SavedPlaceType;
  currentPlace?: SavedPlace;
  city: CurrentCity | null;
  onClose: () => void;
  onSaved: (place: SavedPlace) => void;
};

export function SavedPlaceModal({ visible, type, currentPlace, city, onClose, onSaved }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const sessionToken = useRef(createPlacesSessionToken());
  const title = type === 'HOME' ? 'Adresse de votre maison' : 'Adresse de votre travail';
  const Icon = type === 'HOME' ? House : BriefcaseBusiness;

  useEffect(() => {
    if (!visible) return;
    sessionToken.current = createPlacesSessionToken();
    setQuery(''); setResults([]); setSelected(currentPlace ?? null); setError(null); setSaving(false); setResolving(false);
  }, [visible, currentPlace]);

  useEffect(() => {
    if (!visible || !city || query.trim().length < 3) { setResults([]); setSearching(false); return; }
    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      setSearching(true); setError(null);
      try {
        const values = await searchPlaces(query.trim(), city, sessionToken.current);
        if (requestId.current === current) setResults(values);
      } catch {
        if (requestId.current === current) setError('La recherche est indisponible. Vérifiez votre connexion.');
      } finally { if (requestId.current === current) setSearching(false); }
    }, 400);
    return () => { clearTimeout(timer); };
  }, [query, visible, city]);

  const chooseSuggestion = async (suggestion: PlaceSuggestion) => {
    if (!city || resolving) return;
    setResolving(true); setError(null);
    try {
      setSelected(await getPlaceDetails(suggestion.placeId, city, sessionToken.current));
      setResults([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Cette adresse ne peut pas être sélectionnée.');
    } finally { setResolving(false); }
  };

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true); setError(null);
    try {
      const saved = await savedPlacesService.save(type, selected);
      onSaved(saved);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Enregistrement impossible. Veuillez réessayer.');
    } finally { setSaving(false); }
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={saving ? undefined : onClose}>
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headingIcon}><Icon size={25} color={colors.electricBlue} strokeWidth={2.4} /></View>
          <AppText style={styles.title}>{title}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" disabled={saving} onPress={onClose} style={styles.close}><X size={22} color={colors.navy} /></Pressable>
        </View>
        {city && <AppText style={styles.city}>Ville actuelle : {city.name}, {city.country}</AppText>}
        {!city && <AppText style={styles.error}>Impossible de déterminer votre ville. Actualisez votre position GPS.</AppText>}
        <View style={styles.searchBox}>
          <Search size={21} color={colors.electricBlue} />
          <TextInput autoFocus value={query} onChangeText={(value) => { setQuery(value); setSelected(null); }} placeholder="Rechercher une adresse" placeholderTextColor="#8290A8" style={styles.input} returnKeyType="search" />
          {(searching || resolving) && <ActivityIndicator size="small" color={colors.electricBlue} />}
        </View>
        {error && <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText>}
        {selected && <View style={styles.selected}>
          <View style={styles.selectedIcon}><Check size={19} color={colors.white} strokeWidth={3} /></View>
          <View style={styles.selectedCopy}><AppText style={styles.selectedLabel}>Adresse sélectionnée</AppText><AppText numberOfLines={2} style={styles.selectedAddress}>{selected.address}</AppText></View>
        </View>}
        <FlatList
          style={styles.list}
          data={results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => <Pressable onPress={() => void chooseSuggestion(item)} style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
            <View style={styles.pin}><MapPin size={19} color={colors.electricBlue} /></View>
            <View style={styles.resultCopy}><AppText style={styles.resultName}>{item.name}</AppText><AppText numberOfLines={2} style={styles.resultAddress}>{item.address}</AppText></View>
          </Pressable>}
          ListEmptyComponent={!searching && !resolving && query.trim().length >= 3 ? <AppText style={styles.empty}>Aucun lieu trouvé dans cette ville.</AppText> : undefined}
        />
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><AppText style={styles.cancelText}>Annuler</AppText></Pressable>
          <Pressable accessibilityRole="button" disabled={!selected || saving} onPress={save} style={({ pressed }) => [styles.next, (!selected || saving) && styles.nextDisabled, pressed && selected && !saving && styles.pressed]}>
            {saving ? <ActivityIndicator color={colors.white} /> : <><AppText style={styles.nextText}>Suivant</AppText><ArrowRight size={20} color={colors.white} /></>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8FAFC' }, flex: { flex: 1 },
  header: { minHeight: 84, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#EDF5FF', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.navy, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  city: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginHorizontal: 22, marginBottom: 8 }, searchBox: { height: 58, marginHorizontal: 20, borderRadius: 17, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 11 },
  input: { flex: 1, color: colors.navy, fontSize: 16 }, error: { color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '700', marginHorizontal: 22, marginTop: 10 },
  selected: { marginHorizontal: 20, marginTop: 13, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: '#BBD7FF', backgroundColor: '#EDF5FF', flexDirection: 'row', alignItems: 'center' },
  selectedIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }, selectedCopy: { flex: 1, marginLeft: 11 }, selectedLabel: { color: colors.electricBlue, fontSize: 12, fontWeight: '800' }, selectedAddress: { color: colors.navy, fontSize: 13, lineHeight: 18, marginTop: 2 },
  list: { flex: 1, marginTop: 8 }, result: { minHeight: 70, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5EAF0', paddingVertical: 11 }, pin: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDF5FF', alignItems: 'center', justifyContent: 'center' }, resultCopy: { flex: 1, marginLeft: 11 }, resultName: { color: colors.navy, fontSize: 15, fontWeight: '800' }, resultAddress: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 }, empty: { color: colors.textMuted, textAlign: 'center', marginTop: 34, paddingHorizontal: 30 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 18, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E9EEF5' }, cancel: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.navy, fontSize: 16, fontWeight: '800' }, next: { flex: 1, height: 54, borderRadius: 16, backgroundColor: colors.electricBlue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, nextDisabled: { backgroundColor: colors.disabled }, nextText: { color: colors.white, fontSize: 16, fontWeight: '800' }, pressed: { opacity: .78, transform: [{ scale: .98 }] },
});

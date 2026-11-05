import { MapPin, Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui';
import { createPlacesSessionToken, getCityDetails, searchCities } from '@/services/places.service';
import { colors } from '@/theme';
import type { CurrentCity } from '@/types/city.types';
import type { PlaceSuggestion } from '@/types/place.types';

export function CitySelectionModal({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (city: CurrentCity) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useRef(createPlacesSessionToken());
  const requestId = useRef(0);
  useEffect(() => { if (visible) { token.current = createPlacesSessionToken(); setQuery(''); setResults([]); setError(null); } }, [visible]);
  useEffect(() => {
    if (!visible || query.trim().length < 2) { setResults([]); return; }
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true); setError(null);
      try { const values = await searchCities(query.trim(), token.current); if (id === requestId.current) setResults(values); }
      catch { if (id === requestId.current) setError('La recherche est temporairement indisponible. Veuillez réessayer.'); }
      finally { if (id === requestId.current) setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, visible]);
  const choose = async (suggestion: PlaceSuggestion) => {
    setLoading(true); setError(null);
    try { onSelect(await getCityDetails(suggestion.placeId, token.current)); onClose(); }
    catch { setError('Impossible de sélectionner cette ville.'); }
    finally { setLoading(false); }
  };
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.page}>
    <View style={styles.header}><AppText style={styles.title}>Choisir votre ville</AppText><Pressable onPress={onClose} style={styles.close}><X size={22} color={colors.navy} /></Pressable></View>
    <View style={styles.search}><Search size={21} color={colors.electricBlue} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Rechercher une ville" placeholderTextColor="#8290A8" style={styles.input} />{loading && <ActivityIndicator size="small" color={colors.electricBlue} />}</View>
    {error && <AppText style={styles.error}>{error}</AppText>}
    <FlatList data={results} keyboardShouldPersistTaps="handled" keyExtractor={(item) => item.placeId} renderItem={({ item }) => <Pressable onPress={() => void choose(item)} style={styles.result}><View style={styles.pin}><MapPin size={20} color={colors.electricBlue} /></View><View style={styles.copy}><AppText style={styles.name}>{item.name}</AppText><AppText style={styles.address}>{item.address}</AppText></View></Pressable>} ListEmptyComponent={!loading && query.length >= 2 ? <AppText style={styles.empty}>Aucune ville trouvée.</AppText> : undefined} />
  </SafeAreaView></Modal>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F8FAFC' }, header: { height: 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }, title: { flex: 1, color: colors.navy, fontSize: 21, fontWeight: '900' }, close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, search: { height: 58, marginHorizontal: 20, borderRadius: 17, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16 }, input: { flex: 1, color: colors.navy, fontSize: 16 }, error: { color: colors.error, marginHorizontal: 22, marginTop: 10, fontSize: 13, fontWeight: '700' }, result: { minHeight: 70, marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5EAF0', flexDirection: 'row', alignItems: 'center' }, pin: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDF5FF', alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 12 }, name: { color: colors.navy, fontSize: 15, fontWeight: '800' }, address: { color: colors.textMuted, fontSize: 13, marginTop: 3 }, empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 } });

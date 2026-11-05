import { BriefcaseBusiness, House, Pencil, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';
import type { SavedPlace, SavedPlaceType } from '@/types/place.types';

type Props = {
  type: SavedPlaceType;
  place?: SavedPlace;
  loading?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SavedPlaceCard({ type, place, loading, onPress, onEdit, onDelete }: Props) {
  const title = type === 'HOME' ? 'Maison' : 'Travail';
  const Icon = type === 'HOME' ? House : BriefcaseBusiness;
  return <Pressable accessibilityRole="button" accessibilityLabel={place ? `Choisir ${title} comme destination` : `Ajouter l’adresse ${title}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.icon}><Icon size={23} strokeWidth={2.5} color={colors.electricBlue} fill={type === 'HOME' ? colors.electricBlue : 'transparent'} /></View>
    <View style={styles.copy}>
      <AppText style={styles.title}>{title}</AppText>
      {loading ? <ActivityIndicator size="small" color={colors.electricBlue} style={styles.loader} /> : <AppText numberOfLines={1} style={styles.subtitle}>{place?.address || 'Ajouter l’adresse'}</AppText>}
    </View>
    {place && <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Modifier l’adresse ${title}`} hitSlop={8} onPress={(event) => { event.stopPropagation(); onEdit(); }} style={styles.action}><Pencil size={17} color={colors.electricBlue} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer l’adresse ${title}`} hitSlop={8} onPress={(event) => { event.stopPropagation(); onDelete(); }} style={styles.action}><Trash2 size={17} color={colors.error} /></Pressable>
    </View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F0F4F9',
    ...Platform.select({
      ios: { shadowColor: '#31517A', shadowOpacity: .09, shadowRadius: 11, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 3 },
      default: {},
    }),
  },
  pressed: { opacity: .78, transform: [{ scale: .98 }] },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EAF4FF', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, marginLeft: 10 },
  title: { color: colors.navy, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  subtitle: { color: '#7890AD', fontSize: 11, lineHeight: 15, marginTop: 2 },
  loader: { alignSelf: 'flex-start', marginTop: 4 },
  actions: { gap: 3, marginLeft: 3 },
  action: { width: 25, height: 25, borderRadius: 8, backgroundColor: '#F5F8FC', alignItems: 'center', justifyContent: 'center' },
});

import { Check, UserRound, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';

export type RideOptionBoxProps = {
  image: ImageSourcePropType;
  title: string;
  description: string;
  passengerLabel: string;
  priceLabel: string;
  durationLabel: string;
  categoryIcon: LucideIcon;
  categoryColor: string;
  selected: boolean;
  available?: boolean;
  compact?: boolean;
  onPress: () => void;
};

export function RideOptionBox({
  image,
  title,
  description,
  passengerLabel,
  priceLabel,
  durationLabel,
  categoryIcon: CategoryIcon,
  categoryColor,
  selected,
  available = true,
  compact = false,
  onPress,
}: RideOptionBoxProps) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${title}, ${priceLabel}, ${durationLabel}`}
    accessibilityState={{ selected, disabled: !available }}
    disabled={!available}
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      compact && styles.cardCompact,
      selected && styles.cardSelected,
      !available && styles.cardUnavailable,
      pressed && styles.cardPressed,
    ]}
  >
    <View style={[styles.imageSection, compact && styles.imageSectionCompact]}>
      <Image source={image} resizeMode="contain" style={[styles.vehicleImage, compact && styles.vehicleImageCompact]} />
    </View>

    <View style={styles.informationSection}>
      <View style={styles.titleRow}>
        <AppText maxFontSizeMultiplier={1.05} numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>{title}</AppText>
        <CategoryIcon size={compact ? 17 : 20} color={categoryColor} strokeWidth={2.6} />
      </View>
      <AppText maxFontSizeMultiplier={1.05} numberOfLines={1} style={[styles.description, compact && styles.descriptionCompact]}>{description}</AppText>
      <View style={styles.passengerRow}>
        <UserRound size={compact ? 14 : 16} color="#526985" fill="#526985" strokeWidth={2.2} />
        <AppText maxFontSizeMultiplier={1.05} numberOfLines={1} style={[styles.passengers, compact && styles.passengersCompact]}>{passengerLabel}</AppText>
      </View>
    </View>

    <View style={[styles.divider, compact && styles.dividerCompact]} />

    <View style={[styles.priceSection, compact && styles.priceSectionCompact]}>
      <AppText maxFontSizeMultiplier={1.05} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.65} style={[styles.price, compact && styles.priceCompact]}>{priceLabel}</AppText>
      <AppText maxFontSizeMultiplier={1.05} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.72} style={[styles.duration, compact && styles.durationCompact]}>{durationLabel}</AppText>
    </View>

    {selected && <View style={styles.selectionMark}><Check size={19} color="#FFFFFF" strokeWidth={3.2} /></View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  card: {
    width: '100%', alignSelf: 'stretch', height: 106, flexGrow: 0, flexShrink: 0,
    flexDirection: 'row', alignItems: 'center', borderRadius: 21, borderWidth: 1,
    borderColor: '#DDE6F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    paddingVertical: 8, overflow: 'visible', shadowColor: '#001B4E', shadowOpacity: .075,
    shadowRadius: 11, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardCompact: { height: 94, borderRadius: 19, paddingHorizontal: 9, paddingVertical: 6 },
  cardSelected: { borderWidth: 2, borderColor: colors.electricBlue, backgroundColor: '#EFF7FF', shadowColor: colors.electricBlue, shadowOpacity: .13, elevation: 5 },
  cardUnavailable: { opacity: .46 },
  cardPressed: { transform: [{ scale: .992 }], opacity: .94 },

  imageSection: { flexBasis: '27%', maxWidth: 105, minWidth: 82, height: 78, flexShrink: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 8 },
  imageSectionCompact: { minWidth: 70, height: 66, marginRight: 6 },
  vehicleImage: { width: '100%', height: 70 },
  vehicleImageCompact: { height: 57 },

  informationSection: { flex: 1, minWidth: 0, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: { color: colors.navy, fontSize: 19, lineHeight: 23, fontWeight: '900', letterSpacing: -.2 },
  titleCompact: { fontSize: 17, lineHeight: 21 },
  description: { color: '#50637F', fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  descriptionCompact: { fontSize: 11.3, lineHeight: 15 },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  passengers: { color: '#50637F', fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  passengersCompact: { fontSize: 11.3, lineHeight: 14 },

  divider: { width: 1, height: 62, flexShrink: 0, backgroundColor: '#D5E0EC', marginHorizontal: 8 },
  dividerCompact: { height: 52, marginHorizontal: 6 },

  priceSection: { flexBasis: '29%', maxWidth: 116, minWidth: 96, height: 72, flexShrink: 1, alignItems: 'flex-end', justifyContent: 'center' },
  priceSectionCompact: { minWidth: 82, height: 62 },
  price: { width: '100%', color: colors.navy, fontSize: 17.5, lineHeight: 22, fontWeight: '900', textAlign: 'right', letterSpacing: -.3 },
  priceCompact: { fontSize: 15.5, lineHeight: 20 },
  duration: { width: '100%', color: '#50637F', fontSize: 11.5, lineHeight: 16, fontWeight: '600', textAlign: 'right', marginTop: 5 },
  durationCompact: { fontSize: 10.3, lineHeight: 14, marginTop: 3 },

  selectionMark: { position: 'absolute', right: -2, top: -9, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.electricBlue, alignItems: 'center', justifyContent: 'center', shadowColor: colors.electricBlue, shadowOpacity: .24, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
});

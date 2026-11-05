import { useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, shadows, spacing } from '@/theme';

type Vehicle = { id: string; image: ImageSourcePropType; name: string; brand: string; model: string; description: string; arrival: string; seats: number; price: string; badge?: string };

const DEMO_VEHICLES: Vehicle[] = [
  { id: 'eco', image: require('@/assets/images/vehicle-yaris.png'), name: 'Kazi Éco', brand: 'Toyota', model: 'Yaris', description: 'Simple et économique', arrival: '3 min', seats: 4, price: '1 800 FCFA' },
  { id: 'comfort', image: require('@/assets/images/vehicle-corolla.png'), name: 'Kazi Confort', brand: 'Toyota', model: 'Corolla', description: 'Plus d’espace et de confort', arrival: '5 min', seats: 4, price: '2 600 FCFA', badge: 'RECOMMANDÉ' },
  { id: 'xl', image: require('@/assets/images/vehicle-hiace.png'), name: 'Kazi XL', brand: 'Toyota', model: 'Hiace', description: 'Pour les groupes', arrival: '7 min', seats: 6, price: '3 800 FCFA' },
];

export function VehicleSelector() {
  const [selected, setSelected] = useState('comfort');
  return <View style={styles.wrapper}>
    <View style={styles.heading}><View><AppText variant="h3">Choisissez votre trajet</AppText><AppText variant="bodySmall" color={colors.textMuted}>Prix et disponibilités d’exemple</AppText></View><AppText variant="caption" color={colors.orange}>DÉMO</AppText></View>
    {DEMO_VEHICLES.map((vehicle) => <VehicleOption key={vehicle.id} vehicle={vehicle} selected={vehicle.id === selected} onPress={() => setSelected(vehicle.id)} />)}
    <View style={styles.payment}><AppText variant="bodySmall" color={colors.textMuted}>Paiement</AppText><AppText variant="button">Espèces</AppText></View>
  </View>;
}

function VehicleOption({ vehicle, selected, onPress }: { vehicle: Vehicle; selected: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => Animated.spring(scale, { toValue: value, speed: 26, bounciness: 5, useNativeDriver: true }).start();
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable onPress={onPress} onPressIn={() => animate(0.985)} onPressOut={() => animate(1)} style={[styles.option, selected && styles.selected]}>
    {vehicle.badge ? <View style={styles.badge}><AppText variant="caption" color={colors.navy}>{vehicle.badge}</AppText></View> : null}
    <View style={[styles.vehicleIcon, selected && styles.vehicleIconSelected]}><Image source={vehicle.image} resizeMode="contain" style={styles.vehicleImage} /></View>
    <View style={styles.details}><View style={styles.nameRow}><AppText variant="button">{vehicle.name}</AppText><AppText variant="caption" color={colors.textMuted}>{vehicle.seats} places</AppText></View><AppText variant="bodySmall" color={colors.text}>{vehicle.brand} {vehicle.model}</AppText><AppText variant="caption" color={colors.textMuted}>{vehicle.description}</AppText><AppText variant="caption" color={selected ? colors.electricBlue : colors.textMuted}>Arrivée dans {vehicle.arrival}</AppText></View>
    <View style={styles.price}><AppText variant="button">{vehicle.price}</AppText><View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View></View>
  </Pressable></Animated.View>;
}

const styles = StyleSheet.create({ wrapper: { gap: spacing[3], backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing[4], ...shadows.card }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }, option: { minHeight: 118, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.white }, selected: { borderWidth: 2, borderColor: colors.electricBlue, backgroundColor: colors.surfaceMuted }, badge: { position: 'absolute', top: -9, left: 88, borderRadius: radius.full, backgroundColor: colors.gold, paddingHorizontal: spacing[2], paddingVertical: 2 }, vehicleIcon: { width: 100, height: 72, borderRadius: radius.md, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, vehicleIconSelected: { backgroundColor: colors.white }, vehicleImage: { width: 96, height: 68 }, details: { flex: 1, gap: 2 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] }, price: { alignItems: 'flex-end', gap: spacing[3] }, radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, radioSelected: { borderColor: colors.electricBlue }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.electricBlue }, payment: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[2], paddingTop: spacing[4], flexDirection: 'row', justifyContent: 'space-between' } });

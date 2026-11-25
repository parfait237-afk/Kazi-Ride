import { Crown, Leaf, UsersRound } from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';
import { RideOptionBox } from './RideOptionBox';
import { colors } from '@/theme';
import type { RideCategoryQuote } from '@/types/ride.types';

const images: Record<RideCategoryQuote['code'], ImageSourcePropType> = {
  ECO: require('@/assets/images/vehicle-yaris.png'),
  COMFORT: require('@/assets/images/vehicle-corolla.png'),
  VAN: require('@/assets/images/vehicle-hiace.png'),
};
const presentation = {
  ECO: { icon: Leaf, color: '#16A34A' },
  COMFORT: { icon: Crown, color: '#F5A400' },
  VAN: { icon: UsersRound, color: colors.electricBlue },
} as const;

export function VehicleCategoryCard({ quote, selected, compact = false, onPress }: { quote: RideCategoryQuote; selected: boolean; compact?: boolean; onPress: () => void }) {
  const category = presentation[quote.code];
  return <RideOptionBox
    image={images[quote.code]}
    title={quote.name}
    description={quote.description}
    passengerLabel={`${quote.minPassengers}–${quote.maxPassengers} passagers`}
    priceLabel={`${new Intl.NumberFormat('fr-FR').format(quote.price)} FCFA`}
    durationLabel={quote.driverEtaMinutes == null ? `Trajet ≈ ${quote.tripDurationMinutes} min` : `Arrivée ≈ ${quote.driverEtaMinutes} min`}
    categoryIcon={category.icon}
    categoryColor={category.color}
    selected={selected}
    available={quote.available}
    compact={compact}
    onPress={onPress}
  />;
}

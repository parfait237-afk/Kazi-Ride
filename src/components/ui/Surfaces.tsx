import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, shadows, spacing } from '@/theme';

export function AppCard({ style, ...props }: ViewProps) { return <View {...props} style={[styles.card, style]} />; }
export function BottomSheet({ style, ...props }: ViewProps) { return <View {...props} style={[styles.sheet, style]} />; }
export function LoadingIndicator({ label = 'Chargement…' }: { label?: string }) { return <View style={styles.state}><ActivityIndicator color={colors.electricBlue} /><AppText color={colors.textMuted}>{label}</AppText></View>; }
export function ErrorMessage({ message }: { message: string }) { return <AppText variant="bodySmall" color={colors.error}>{message}</AppText>; }
export function EmptyState({ title, description }: { title: string; description: string }) { return <View style={styles.state}><AppText variant="h3">{title}</AppText><AppText color={colors.textMuted} style={styles.center}>{description}</AppText></View>; }
export function LocationShortcut({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  const lift = useRef(new Animated.Value(0)).current;
  const animate = (toValue: number) => Animated.spring(lift, { toValue, useNativeDriver: true, speed: 25, bounciness: 5 }).start();
  return <Animated.View style={{ transform: [{ translateY: lift }] }}><Pressable onPress={onPress} onPressIn={() => animate(-4)} onPressOut={() => animate(0)} style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.8 }]}><AppText variant="h3">{icon}</AppText><AppText variant="bodySmall">{label}</AppText></Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[4], ...shadows.card },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing[5], ...shadows.floating },
  state: { alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[6] },
  center: { textAlign: 'center' },
  shortcut: { minWidth: 96, minHeight: 72, paddingHorizontal: spacing[4], borderRadius: radius.md, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', gap: spacing[1] },
});


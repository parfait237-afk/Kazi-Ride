import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppLogo } from './AppLogo';
import { AppText } from '@/components/ui/AppText';
import { colors, componentSizes, spacing } from '@/theme';

export function BackButton() {
  const rotation = useRef(new Animated.Value(0)).current;
  const press = () => Animated.sequence([Animated.timing(rotation, { toValue: 1, duration: 120, useNativeDriver: true }), Animated.timing(rotation, { toValue: 0, duration: 120, useNativeDriver: true })]).start(() => router.back());
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-18deg'] });
  return <Pressable accessibilityLabel="Retour" onPress={press} style={styles.back}><Animated.View style={{ transform: [{ rotate }] }}><AppText variant="h2">‹</AppText></Animated.View></Pressable>;
}

export function AppHeader({ title, subtitle, back = true, logo = true }: { title?: string; subtitle?: string; back?: boolean; logo?: boolean }) {
  return <View style={styles.wrapper}><View style={styles.row}>{back ? <BackButton /> : <View style={styles.spacer} />}{logo ? <AppLogo width={52} height={44} /> : null}<View style={styles.spacer} /></View>{title ? <AppText variant="h1">{title}</AppText> : null}{subtitle ? <AppText color={colors.textMuted}>{subtitle}</AppText> : null}</View>;
}

const styles = StyleSheet.create({ wrapper: { gap: spacing[3], marginBottom: spacing[6] }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: componentSizes.touchTarget, height: componentSizes.touchTarget, alignItems: 'center', justifyContent: 'center' }, spacer: { width: componentSizes.touchTarget } });


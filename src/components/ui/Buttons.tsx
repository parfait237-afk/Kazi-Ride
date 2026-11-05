import { ActivityIndicator, Animated, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { useRef } from 'react';
import { AppText } from './AppText';
import { colors, componentSizes, opacity, radius, spacing } from '@/theme';

type ButtonProps = PressableProps & { label: string; loading?: boolean };

function BaseButton({ label, loading, disabled, style, variant, ...props }: ButtonProps & { variant: 'primary' | 'secondary' | 'outline' }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (toValue: number) => Animated.spring(scale, { toValue, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      {...props}
      onPressIn={(event) => { animate(0.97); props.onPressIn?.(event); }}
      onPressOut={(event) => { animate(1); props.onPressOut?.(event); }}
      style={(state) => [styles.base, styles[variant], (disabled || loading) && styles.disabled, state.pressed && styles.pressed, typeof style === 'function' ? style(state) : style]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.white : colors.electricBlue} /> : <AppText variant="button" color={variant === 'primary' ? colors.white : colors.electricBlue}>{label}</AppText>}
    </Pressable>
    </Animated.View>
  );
}

export const PrimaryButton = (props: ButtonProps) => <BaseButton {...props} variant="primary" />;
export const SecondaryButton = (props: ButtonProps) => <BaseButton {...props} variant="secondary" />;
export const OutlineButton = (props: ButtonProps) => <BaseButton {...props} variant="outline" />;

const styles = StyleSheet.create({
  base: { minHeight: componentSizes.button, borderRadius: radius.lg, paddingHorizontal: spacing[6], alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  primary: { backgroundColor: colors.electricBlue, borderColor: colors.electricBlue },
  secondary: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
  outline: { backgroundColor: colors.white, borderColor: colors.electricBlue },
  disabled: { opacity: opacity.disabled },
  pressed: { opacity: opacity.pressed },
});


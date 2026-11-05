import { useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { colors, componentSizes, radius, spacing, typography } from '@/theme';

type AppInputProps = TextInputProps & { label?: string; error?: string; helper?: string; prefix?: string; indicatorColor?: string };

export function AppInput({ label, error, helper, prefix, indicatorColor, style, ...props }: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const focusScale = useRef(new Animated.Value(1)).current;
  const animateFocus = (active: boolean) => Animated.spring(focusScale, { toValue: active ? 1.012 : 1, useNativeDriver: true, speed: 26, bounciness: 4 }).start();
  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="bodySmall" style={styles.label}>{label}</AppText> : null}
      <Animated.View style={[styles.field, focused && styles.fieldFocused, error && styles.fieldError, { transform: [{ scale: focusScale }] }]}>
        {indicatorColor ? <View style={[styles.indicator, { backgroundColor: indicatorColor }]} /> : null}
        {prefix ? <View style={styles.prefix}><AppText variant="bodySmall" style={styles.prefixText}>{prefix}</AppText></View> : null}
        <TextInput placeholderTextColor={colors.textMuted} {...props} onFocus={(event) => { setFocused(true); animateFocus(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); animateFocus(false); props.onBlur?.(event); }} style={[styles.input, style]} />
      </Animated.View>
      {error ? <AppText variant="caption" color={colors.error}>{error}</AppText> : null}
      {!error && helper ? <AppText variant="caption" color={colors.textMuted}>{helper}</AppText> : null}
    </View>
  );
}

export const PhoneInput = (props: AppInputProps) => <AppInput prefix="CM  +237" keyboardType="phone-pad" placeholder="6XX XXX XXX" {...props} />;
export const EmailInput = (props: AppInputProps) => <AppInput keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="exemple@email.com" {...props} />;
export const SearchInput = (props: AppInputProps) => <AppInput returnKeyType="search" placeholder="Rechercher" {...props} />;
export const LocationInput = ({ destination, ...props }: AppInputProps & { destination?: boolean }) => <AppInput indicatorColor={destination ? colors.gold : colors.electricBlue} {...props} />;

const styles = StyleSheet.create({
  wrapper: { gap: spacing[2] },
  label: { fontWeight: '700', marginLeft: spacing[1] },
  field: { minHeight: componentSizes.input, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[3], borderWidth: 1, borderColor: 'transparent', borderRadius: radius.lg, backgroundColor: colors.canvas },
  fieldError: { borderColor: colors.error },
  fieldFocused: { borderColor: colors.electricBlue, borderWidth: 2, backgroundColor: colors.white },
  prefix: { minHeight: 40, justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.border, paddingRight: spacing[3] },
  prefixText: { fontWeight: '700' },
  indicator: { width: 10, height: 10, borderRadius: 5 },
  input: { ...typography.body, color: colors.text, flex: 1, paddingVertical: spacing[4] },
});


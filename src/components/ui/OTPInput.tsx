import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ElementRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type OTPInputHandle = { focus: () => void };

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: 4 | 6 | 8;
  error?: boolean;
  disabled?: boolean;
  appearance?: 'light' | 'dark';
};

type AnimatedCellProps = { digit: string; width: number; children: ReactNode };

function AnimatedCell({ digit, width, children }: AnimatedCellProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!digit) return;
    scale.setValue(0.82); translateY.setValue(8);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 8, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 22, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, [digit, scale, translateY]);
  return <Animated.View style={{ width, transform: [{ scale }, { translateY }] }}>{children}</Animated.View>;
}

export const OTPInput = forwardRef<OTPInputHandle, OTPInputProps>(function OTPInput({
  value, onChange, length = 4, error = false, disabled = false, appearance = 'light',
}, forwardedRef) {
  const inputRef = useRef<ElementRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const characters = Array.from({ length }, (_, index) => value[index] ?? '');
  const width = length === 4 ? 60 : length === 6 ? 48 : 40;
  const activeIndex = Math.min(value.length, length - 1);

  useImperativeHandle(forwardedRef, () => ({ focus: () => inputRef.current?.focus() }), []);
  const update = (input: string) => onChange(input.replace(/\D/g, '').slice(0, length));

  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Code de vérification à ${length} chiffres`}
    onPress={() => !disabled && inputRef.current?.focus()}
    style={styles.wrapper}
  >
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={update}
      editable={!disabled}
      autoFocus
      keyboardType="number-pad"
      inputMode="numeric"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      maxLength={length}
      caretHidden
      contextMenuHidden={false}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={styles.hiddenInput}
    />
    <View pointerEvents="none" style={styles.row}>
      {characters.map((digit, index) => {
        const active = focused && index === activeIndex && !disabled;
        return <AnimatedCell key={index} digit={digit} width={width}>
          <View style={[styles.box, appearance === 'dark' && styles.boxDark, active && styles.active, error && styles.error, disabled && styles.disabled]}>
            <Text style={[styles.digit, appearance === 'dark' && styles.digitDark]}>{digit}</Text>
          </View>
        </AnimatedCell>;
      })}
    </View>
  </Pressable>;
});

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0, left: '50%', top: '50%' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2] },
  box: { height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  boxDark: { borderColor: '#31517A', backgroundColor: '#08275B' },
  active: { borderColor: colors.electricBlue, borderWidth: 2 },
  error: { borderColor: colors.error, borderWidth: 1.5 },
  disabled: { opacity: .72 },
  digit: { ...typography.h2, color: colors.text, textAlign: 'center' },
  digitDark: { color: colors.white },
});

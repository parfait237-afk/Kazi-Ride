import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { OTPInput } from './OTPInput';
import { PrimaryButton } from './Buttons';
import { colors, radius, shadows, spacing } from '@/theme';

type Props = { visible: boolean; length: 4 | 6 | 8; onClose: () => void };

export function OTPVerificationSheet({ visible, length, onClose }: Props) {
  const [mounted, setMounted] = useState(visible);
  const [code, setCode] = useState('');
  const translateY = useRef(new Animated.Value(520)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true); setCode(''); translateY.setValue(520); backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, speed: 18, bounciness: 5, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 520, duration: 240, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [backdrop, mounted, translateY, visible]);

  if (!mounted) return null;
  return <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}><Pressable accessibilityLabel="Fermer" style={styles.fill} onPress={onClose} /></Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} /><Pressable accessibilityLabel="Fermer" onPress={onClose} style={styles.close}><AppText variant="h3" color={colors.white}>×</AppText></Pressable>
        <AppText variant="h2" color={colors.white} style={styles.center}>Vérifiez votre numéro</AppText>
        <AppText color="#AFC4DD" style={styles.center}>Nous avons envoyé un code à {length} chiffres sur votre téléphone. Il sera vérifié une fois saisi.</AppText>
        <OTPInput value={code} onChange={setCode} length={length} appearance="dark" />
        <PrimaryButton label="Vérifier le code" disabled={code.length !== length} />
        <AppText variant="bodySmall" color="#AFC4DD" style={styles.center}>Code non reçu ? <AppText variant="button" color={colors.gold}>Renvoyer</AppText></AppText>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: 'flex-end' }, fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 10, 30, 0.72)' }, sheet: { backgroundColor: colors.navy, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing[6], paddingBottom: spacing[10], gap: spacing[5], ...shadows.floating }, handle: { width: 48, height: 5, borderRadius: radius.full, backgroundColor: '#7892B2', alignSelf: 'center' }, close: { position: 'absolute', right: spacing[5], top: spacing[5], width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, center: { textAlign: 'center' } });

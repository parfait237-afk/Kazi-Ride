import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppLogo } from '@/components/common/AppLogo';
import { AppText, OTPInput } from '@/components/ui';
import type { OTPInputHandle } from '@/components/ui/OTPInput';
import { useAuth } from '@/hooks/useAuth';
import { ApiClientError } from '@/services/api';
import { colors } from '@/theme';

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ challengeId?: string; email?: string }>();
  const { verifyOtp, resendOtp } = useAuth();
  const [challengeId, setChallengeId] = useState(params.challengeId ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [success, setSuccess] = useState<string | null>(null);
  const lastSubmittedCode = useRef('');
  const verifyingRef = useRef(false);
  const otpInputRef = useRef<OTPInputHandle>(null);

  useEffect(() => {
    if (!challengeId) router.replace('/auth' as never);
  }, [challengeId]);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const submit = async (otpCode: string) => {
    if (otpCode.length !== 6 || verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true); setError(null); setSuccess(null);
    try {
      await verifyOtp(challengeId, otpCode);
      setSuccess('Vérification réussie ! Bienvenue sur KaziRide.');
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.replace('/home' as never);
    } catch (requestError) {
      const apiError = requestError instanceof ApiClientError ? requestError : null;
      if (apiError?.code === 'OTP_INVALID') {
        setError('Code de vérification incorrect. Veuillez réessayer.');
        setCode('');
        lastSubmittedCode.current = '';
        setTimeout(() => otpInputRef.current?.focus(), 80);
      } else if (apiError?.code === 'OTP_EXPIRED') {
        setError('Ce code a expiré. Demandez un nouveau code.');
        setCode('');
        lastSubmittedCode.current = '';
      } else if (apiError?.code === 'OTP_MAX_ATTEMPTS') {
        setError('Trop de tentatives. Veuillez demander un nouveau code.');
        setCode('');
        lastSubmittedCode.current = '';
      } else if (apiError?.code === 'NETWORK_ERROR' || apiError?.code === 'API_TIMEOUT' || apiError?.code === 'BACKEND_TIMEOUT' || apiError?.code === 'BACKEND_UNREACHABLE') {
        setError('Connexion impossible. Vérifiez votre connexion Internet et réessayez.');
      } else if (apiError?.code === 'OTP_ALREADY_USED' || apiError?.code === 'OTP_INVALIDATED' || apiError?.code === 'CHALLENGE_NOT_FOUND') {
        setError('Ce code n’est plus valide. Demandez un nouveau code.');
        setCode('');
        lastSubmittedCode.current = '';
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    setError(null);
    if (value.length < 6) {
      lastSubmittedCode.current = '';
      return;
    }
    if (!challengeId || lastSubmittedCode.current === value || verifyingRef.current) return;
    lastSubmittedCode.current = value;
    Keyboard.dismiss();
    void submit(value);
  };
  const resend = async () => {
    if (seconds > 0 || resending || verifyingRef.current) return;
    setResending(true); setError(null); setSuccess(null);
    try {
      const response = await resendOtp(challengeId);
      lastSubmittedCode.current = '';
      setChallengeId(response.challengeId); setCode(''); setSeconds(60);
      setSuccess('Un nouveau code a été envoyé à votre adresse e-mail.');
      setTimeout(() => otpInputRef.current?.focus(), 80);
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : 'Impossible de renvoyer le code.');
    } finally { setResending(false); }
  };

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}><AppText style={styles.backLabel}>‹</AppText></Pressable>
      <AppLogo width={74} height={66} />
    </View>
    <View style={styles.content}>
      <View style={styles.badge}><View style={styles.mail}><View style={styles.foldA} /><View style={styles.foldB} /></View></View>
      <AppText style={styles.title}>Vérifiez votre adresse e-mail</AppText>
      <AppText style={styles.copy}>Un code à 6 chiffres a été envoyé à</AppText>
      <AppText style={styles.email}>{params.email}</AppText>
      {error && <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText>}
      {success && <View style={styles.successRow}><View style={styles.successCheck}><View style={styles.successCheckMark} /></View><AppText accessibilityRole="alert" style={styles.success}>{success}</AppText></View>}
      <View style={styles.otp}><OTPInput ref={otpInputRef} value={code} onChange={handleCodeChange} length={6} error={Boolean(error)} disabled={loading} /></View>
      {loading && <View style={styles.verifying}><ActivityIndicator color={colors.electricBlue} /><AppText style={styles.verifyingText}>Vérification en cours…</AppText></View>}
      <Pressable disabled={seconds > 0 || resending || loading} onPress={resend} style={styles.resend}>
        <AppText style={[styles.resendText, (seconds > 0 || loading) && styles.resendDisabled]}>{resending ? 'Envoi en cours…' : seconds > 0 ? `Renvoyer dans ${seconds} s` : 'Renvoyer le code'}</AppText>
      </Pressable>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white }, header: { height: 150, paddingTop: Platform.OS === 'ios' ? 54 : 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAFF' }, back: { position: 'absolute', left: 20, top: Platform.OS === 'ios' ? 58 : 29, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }, backLabel: { color: colors.navy, fontSize: 38, lineHeight: 40, marginTop: -5 },
  content: { flex: 1, marginTop: -20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.white, paddingHorizontal: 22, paddingTop: 35, alignItems: 'center' }, badge: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#EDF5FF', alignItems: 'center', justifyContent: 'center' }, mail: { width: 40, height: 30, borderWidth: 3, borderColor: colors.electricBlue, borderRadius: 6, overflow: 'hidden' }, foldA: { position: 'absolute', width: 29, height: 3, backgroundColor: colors.electricBlue, transform: [{ rotate: '35deg' }], top: 7, left: -2 }, foldB: { position: 'absolute', width: 29, height: 3, backgroundColor: colors.electricBlue, transform: [{ rotate: '-35deg' }], top: 7, right: -2 },
  title: { marginTop: 22, color: colors.navy, fontSize: 27, lineHeight: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -.7 }, copy: { marginTop: 12, color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center' }, email: { color: colors.navy, fontSize: 15, lineHeight: 22, fontWeight: '700', textAlign: 'center' }, otp: { marginTop: 30, width: '100%' }, error: { marginTop: 12, color: colors.error, fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' }, successRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 }, successCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }, successCheckMark: { width: 10, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.white, transform: [{ rotate: '-45deg' }], marginTop: -2 }, success: { flexShrink: 1, color: colors.success, fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  verifying: { minHeight: 54, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, verifyingText: { color: colors.navy, fontSize: 14, fontWeight: '700' }, pressed: { opacity: .82 }, resend: { minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, resendText: { color: colors.electricBlue, fontSize: 14, fontWeight: '700' }, resendDisabled: { color: colors.textMuted },
});

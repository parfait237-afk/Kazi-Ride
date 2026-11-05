import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, TextInput, useWindowDimensions, View,
} from 'react-native';
import CountryPicker, { type Country, type CountryCode } from 'react-native-country-picker-modal';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';
import { AppLogo } from '@/components/common/AppLogo';
import { AppText } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ApiClientError } from '@/services/api';
import { colors } from '@/theme';

const schema = z.object({
  phone: z.string().trim().min(6, 'Saisissez un numéro de téléphone valide.'),
  email: z.string().trim().email('Saisissez une adresse e-mail valide.'),
  consent: z.boolean().refine(Boolean, 'Veuillez confirmer l’envoi du code de vérification.'),
});
type FormValues = z.infer<typeof schema>;

export default function PassengerAuthScreen() {
  const { height } = useWindowDimensions();
  const { requestOtp } = useAuth();
  const [countryCode, setCountryCode] = useState<CountryCode>('CM');
  const [callingCode, setCallingCode] = useState('237');
  const [countryOpen, setCountryOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const compact = height < 760;
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { phone: '', email: '', consent: false }, mode: 'onTouched',
  });

  const prefix = useMemo(() => `+${callingCode}`, [callingCode]);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/');
  const selectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0] ?? '237');
    setCountryOpen(false);
  };
  const submit = async (values: FormValues) => {
    setServerError(null);
    const raw = values.phone.replace(/^0+/, '').replace(/\D/g, '');
    const parsed = parsePhoneNumberFromString(`${prefix}${raw}`);
    if (!parsed?.isValid()) {
      setServerError('Le numéro de téléphone n’est pas valide pour le pays sélectionné.');
      return;
    }
    try {
      const normalizedEmail = values.email.trim().toLowerCase();
      const challenge = await requestOtp(normalizedEmail, parsed.number);
      router.push({ pathname: '/auth/verify-otp', params: { challengeId: challenge.challengeId, email: normalizedEmail } } as never);
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : 'Impossible d’envoyer le code. Vérifiez votre connexion.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
        <ImageBackground source={require('@/assets/images/exec-61cbd00d-7ca1-47ad-a90a-2c439c4b1b71.png')} resizeMode="cover" style={[styles.hero, compact && styles.heroCompact]} imageStyle={styles.heroImage}>
          <View style={styles.heroWash} />
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <View style={styles.backArrow}><View style={styles.backArrowTop} /><View style={styles.backArrowBottom} /></View>
          </Pressable>
          <View style={styles.brand} pointerEvents="none">
            <AppLogo width={88} height={78} />
            <AppText style={styles.brandName}><AppText style={styles.brandDark}>Kazi</AppText><AppText style={styles.brandBlue}>Ride</AppText></AppText>
          </View>
        </ImageBackground>

        <View style={styles.panel}>
          <View style={styles.handle} />
          <AppText style={styles.title}>Bienvenue sur <AppText style={styles.titleDark}>Kazi</AppText><AppText style={styles.titleBlue}>Ride</AppText></AppText>
          <AppText style={styles.description}>Entrez vos informations pour recevoir votre code de vérification.</AppText>

          <View style={styles.form}>
            <View>
              <AppText style={styles.label}>Numéro de téléphone</AppText>
              <View style={[styles.inputShell, errors.phone && styles.inputError]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Choisir le pays" onPress={() => setCountryOpen(true)} style={styles.countryButton}>
                  <Image accessibilityLabel={`Drapeau ${countryCode}`} source={{ uri: `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png` }} resizeMode="cover" style={styles.countryFlag} />
                  <View style={styles.countryChevron}><View style={styles.chevronLeft} /><View style={styles.chevronRight} /></View>
                </Pressable>
                <View style={styles.hiddenPicker}><CountryPicker countryCode={countryCode} withFilter withFlag withCallingCode withFlagButton={false} visible={countryOpen} onSelect={selectCountry} onClose={() => setCountryOpen(false)} /></View>
                <View style={styles.separator} />
                <AppText style={styles.prefix}>{prefix}</AppText>
                <Controller control={control} name="phone" render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={(text) => { const digits = text.replace(/\D/g, ''); onChange(digits.startsWith(callingCode) ? digits.slice(callingCode.length) : digits); }} onBlur={onBlur} placeholder="6 71 23 45 67" placeholderTextColor="#8290A8" keyboardType="phone-pad" inputMode="tel" autoComplete="tel" style={styles.phoneInput} />
                )} />
              </View>
              {errors.phone && <AppText style={styles.errorText}>{errors.phone.message}</AppText>}
            </View>

            <View>
              <AppText style={styles.label}>Adresse e-mail</AppText>
              <View style={[styles.inputShell, errors.email && styles.inputError]}>
                <View style={styles.mailIcon}><View style={styles.mailBody} /><View style={styles.mailFoldLeft} /><View style={styles.mailFoldRight} /></View>
                <Controller control={control} name="email" render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="votreemail@exemple.com" placeholderTextColor="#8290A8" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" style={styles.emailInput} />
                )} />
              </View>
              {errors.email && <AppText style={styles.errorText}>{errors.email.message}</AppText>}
            </View>

            <Controller control={control} name="consent" render={({ field: { value, onChange } }) => (
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} accessibilityLabel="Autoriser l’envoi du code de vérification" onPress={() => onChange(!value)} style={({ pressed }) => [styles.securityBox, value && styles.securityBoxChecked, errors.consent && styles.consentError, pressed && styles.pressed]}>
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>{value && <><View style={styles.checkShort} /><View style={styles.checkLong} /></>}</View>
                <AppText style={styles.securityText}>J’accepte que ces informations soient utilisées pour m’envoyer un code de vérification sécurisé.</AppText>
              </Pressable>
            )} />
            {errors.consent && <AppText style={styles.consentErrorText}>{errors.consent.message}</AppText>}
            {serverError && <AppText accessibilityRole="alert" style={styles.serverError}>{serverError}</AppText>}
            <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => void handleSubmit(submit)()} style={({ pressed }) => [pressed && styles.buttonPressed]}>
              <LinearGradient colors={['#1387FF', '#0066FF', '#0052D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.continueButton}>
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <><AppText style={styles.buttonLabel}>Continuer</AppText><View style={styles.forwardArrow}><View style={styles.forwardLine} /><View style={styles.forwardTop} /><View style={styles.forwardBottom} /></View></>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white }, scroll: { flexGrow: 1, backgroundColor: colors.white },
  hero: { height: 385, width: '100%', maxWidth: 620, alignSelf: 'center', justifyContent: 'flex-start', overflow: 'hidden' }, heroCompact: { height: 315 }, heroImage: { transform: [{ scale: 1.02 }] }, heroWash: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(255,255,255,0.12)' },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 58 : 30, left: 22, width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#DCE7F5', backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#061B46', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  backArrow: { width: 22, height: 20, justifyContent: 'center' }, backArrowTop: { position: 'absolute', width: 13, height: 3, borderRadius: 2, backgroundColor: colors.navy, transform: [{ rotate: '-45deg' }], left: 0, top: 5 }, backArrowBottom: { position: 'absolute', width: 13, height: 3, borderRadius: 2, backgroundColor: colors.navy, transform: [{ rotate: '45deg' }], left: 0, bottom: 4 },
  brand: { alignSelf: 'center', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 55 : 28 }, brandName: { marginTop: -16, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1.2 }, brandDark: { color: colors.navy, fontSize: 34, lineHeight: 40, fontWeight: '800' }, brandBlue: { color: colors.electricBlue, fontSize: 34, lineHeight: 40, fontWeight: '800' },
  panel: { flex: 1, marginTop: -24, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: colors.white, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28, shadowColor: '#061B46', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 8 }, handle: { width: 50, height: 5, borderRadius: 3, backgroundColor: '#CDD3DC', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 29, lineHeight: 36,textAlign: 'center', fontWeight: '800', letterSpacing: -1, color: colors.navy }, titleDark: { fontSize: 29, lineHeight: 36, fontWeight: '800', color: colors.navy }, titleBlue: { fontSize: 29, lineHeight: 36, fontWeight: '800', color: colors.electricBlue }, description: { marginTop: 5, color: colors.textMuted,textAlign: 'center', fontSize: 16, lineHeight: 23, maxWidth: 430 }, form: { marginTop: 23, gap: 17 }, label: { color: colors.navy, fontSize: 15, lineHeight: 20, fontWeight: '700', marginBottom: 8 },
  inputShell: { height: 66, borderWidth: 1.5, borderColor: '#CBD9EB', borderRadius: 18, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, shadowColor: '#315B91', shadowOpacity: .06, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, inputError: { borderColor: colors.error }, countryButton: { width: 68, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, countryFlag: { width: 34, height: 23, borderRadius: 5, borderWidth: 1, borderColor: '#D7E1EF' }, countryChevron: { width: 12, height: 8 }, chevronLeft: { position: 'absolute', width: 8, height: 2, borderRadius: 2, backgroundColor: '#385273', transform: [{ rotate: '40deg' }], left: 0, top: 3 }, chevronRight: { position: 'absolute', width: 8, height: 2, borderRadius: 2, backgroundColor: '#385273', transform: [{ rotate: '-40deg' }], right: 0, top: 3 }, hiddenPicker: { width: 0, height: 0, overflow: 'hidden' }, separator: { width: 1, height: 34, backgroundColor: '#D8E3F0', marginLeft: 2, marginRight: 14 }, prefix: { color: colors.navy, fontSize: 17, lineHeight: 22, fontWeight: '800', marginRight: 9 }, phoneInput: { flex: 1, height: '100%', color: colors.navy, fontSize: 17, lineHeight: 22, fontWeight: '600', paddingVertical: 0 },
  mailIcon: { width: 28, height: 23, marginRight: 15, borderWidth: 2, borderColor: '#526A8B', borderRadius: 5, overflow: 'hidden' }, mailBody: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, mailFoldLeft: { position: 'absolute', width: 18, height: 2, backgroundColor: '#526A8B', transform: [{ rotate: '35deg' }], left: -1, top: 5 }, mailFoldRight: { position: 'absolute', width: 18, height: 2, backgroundColor: '#526A8B', transform: [{ rotate: '-35deg' }], right: -1, top: 5 }, emailInput: { flex: 1, height: '100%', color: colors.navy, fontSize: 17, lineHeight: 22, fontWeight: '600', paddingVertical: 0 }, errorText: { color: colors.error, fontSize: 13, lineHeight: 18, marginTop: 6, marginLeft: 4 },
  securityBox: { minHeight: 78, borderRadius: 18, borderWidth: 1.5, borderColor: '#D6E6FA', backgroundColor: '#F3F8FF', flexDirection: 'row', alignItems: 'center', padding: 15 }, securityBoxChecked: { borderColor: '#9FC7FF', backgroundColor: '#EDF5FF' }, consentError: { borderColor: colors.error }, checkbox: { width: 30, height: 30, borderRadius: 9, borderWidth: 2, borderColor: '#9EB3CE', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, checkboxChecked: { borderColor: colors.electricBlue, backgroundColor: colors.electricBlue }, checkShort: { position: 'absolute', width: 8, height: 3, borderRadius: 2, backgroundColor: colors.white, transform: [{ rotate: '45deg' }], left: 6, top: 15 }, checkLong: { position: 'absolute', width: 14, height: 3, borderRadius: 2, backgroundColor: colors.white, transform: [{ rotate: '-45deg' }], left: 11, top: 13 }, securityText: { flex: 1, color: '#52647F', fontSize: 10, lineHeight: 21, fontWeight: '500' }, consentErrorText: { color: colors.error, fontSize: 13, lineHeight: 18, marginTop: -11, marginLeft: 4 }, serverError: { color: colors.error, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: -4 },
  continueButton: { height: 62, borderRadius: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: colors.electricBlue, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, buttonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, buttonLabel: { color: colors.white, fontSize: 18, lineHeight: 23, fontWeight: '800' }, forwardArrow: { position: 'absolute', right: 26, width: 26, height: 20 }, forwardLine: { position: 'absolute', width: 25, height: 3, borderRadius: 2, backgroundColor: colors.white, top: 9 }, forwardTop: { position: 'absolute', width: 12, height: 3, borderRadius: 2, backgroundColor: colors.white, transform: [{ rotate: '45deg' }], right: -1, top: 5 }, forwardBottom: { position: 'absolute', width: 12, height: 3, borderRadius: 2, backgroundColor: colors.white, transform: [{ rotate: '-45deg' }], right: -1, bottom: 4 },
});

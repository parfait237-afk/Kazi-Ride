import { ActivityIndicator, ImageBackground, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppLogo } from '@/components/common/AppLogo';
import { AppText } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/theme';
import { useAuth } from '@/hooks/useAuth';

export default function WelcomeScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  useEffect(() => { if (!isLoading && isAuthenticated) router.replace('/home' as never); }, [isAuthenticated, isLoading]);
  if (isLoading || isAuthenticated) return <View style={styles.loading}><ActivityIndicator color={colors.electricBlue} /></View>;
  return (
    <View style={styles.page}>
      <ImageBackground
        accessibilityLabel="KaziRide en ville avec véhicule"
        source={require('@/assets/images/exec-61cbd00d-7ca1-47ad-a90a-2c439c4b1b71.png')}
        resizeMode="cover"
        style={styles.screen}
        imageStyle={styles.cityImage}
      >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandBlock}>
          <AppLogo width={118} height={108} />
          <AppText style={styles.brandName}>
            <AppText style={styles.brandDark}>Kazi</AppText>
            <AppText style={styles.brandBlue}>Ride</AppText>
          </AppText>
          <AppText style={styles.tagline}>Votre trajet en toute sérénité</AppText>
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.scrimStrong} />
          <View style={styles.scrimSoft} />
          <View style={styles.actions}>
           
            <View style={styles.secondaryButtonSurface}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Créer un compte"
                onPress={() => router.push('/auth' as never)}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              >
                <AppText style={styles.secondaryButtonLabel}>Créer un compte</AppText>
              </Pressable>
            </View>
          </View>
          <AppText variant="caption" color={colors.white} style={styles.legal}>
            En continuant, vous acceptez nos conditions d’utilisation.
          </AppText>
        </View>
      </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, backgroundColor: colors.navy },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  screen: { flex: 1, width: '100%', maxWidth: 520, minHeight: '100%', alignSelf: 'center', overflow: 'hidden' },
  brandBlock: { alignItems: 'center', paddingTop: spacing[4], paddingBottom: spacing[5] },
  brandName: { marginTop: -spacing[4], fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.5 },
  brandDark: { color: colors.navy, fontSize: 38, lineHeight: 46, fontWeight: '800' },
  brandBlue: { color: colors.electricBlue, fontSize: 38, lineHeight: 46, fontWeight: '800' },
  tagline: { color: colors.navy, fontSize: 16, lineHeight: 22, fontWeight: '600', marginTop: -spacing[1] },
  cityImage: { width: '100%', height: '100%' },
  bottomArea: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], paddingTop: spacing[4] },
  scrimStrong: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, backgroundColor: 'rgba(0,27,78,0.62)' },
  scrimSoft: { position: 'absolute', left: 0, right: 0, bottom: 180, height: 100, backgroundColor: 'rgba(0,27,78,0.12)' },
  actions: { gap: spacing[3] },
  secondaryButtonSurface: {
    width: '100%',
    height: 34,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: '#FFFFFF',
    shadowColor: '#001B4E',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    ...shadows.floating,
  },
  secondaryButton: { flex: 1, width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  secondaryButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  secondaryButtonLabel: { color: colors.electricBlue, fontSize: 18, lineHeight: 24, fontWeight: '800', textAlign: 'center' },
  legal: { textAlign: 'center', lineHeight: 17, marginTop: spacing[3], opacity: 0.82 },
});

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppLogo } from '@/components/common/AppLogo';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { VehicleSelector } from '@/components/booking/VehicleSelector';
import { CameroonRouteMap } from '@/components/map/CameroonRouteMap';
import {
  AppCard,
  AppText,
  EmailInput,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  LocationInput,
  LocationShortcut,
  OTPVerificationSheet,
  OutlineButton,
  PhoneInput,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const palette = [
  ['Bleu électrique', colors.electricBlue],
  ['Cyan', colors.cyan],
  ['Bleu marine', colors.navy],
  ['Jaune doré', colors.gold],
  ['Orange', colors.orange],
  ['Fond clair', colors.canvas],
] as const;

export default function DesignSystemScreen() {
  const [otpLength, setOtpLength] = useState<4 | 6 | 8>(4);
  const [otpVisible, setOtpVisible] = useState(false);

  return (
    <ScreenContainer contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <AppLogo width={120} height={102} />
        <View style={styles.flex}>
          <AppText variant="display">KaziRide</AppText>
          <AppText color={colors.textMuted}>Design System mobile — Passenger App</AppText>
        </View>
      </View>

      <Section title="Couleurs">
        <View style={styles.palette}>{palette.map(([name, color]) => <View key={name} style={styles.swatchItem}><View style={[styles.swatch, { backgroundColor: color }]} /><AppText variant="caption">{name}</AppText><AppText variant="caption" color={colors.textMuted}>{color}</AppText></View>)}</View>
      </Section>

      <Section title="Typographie">
        <AppText variant="display">Display</AppText><AppText variant="h1">Heading 1</AppText><AppText variant="h2">Heading 2</AppText><AppText variant="h3">Heading 3</AppText><AppText variant="bodyLarge">Body Large — Déplacez-vous simplement.</AppText><AppText>Body Regular — Votre trajet en quelques clics.</AppText><AppText variant="bodySmall" color={colors.textMuted}>Body Small — Informations secondaires</AppText><AppText variant="caption" color={colors.textMuted}>CAPTION / MÉTADONNÉES</AppText>
      </Section>

      <Section title="Boutons">
        <PrimaryButton label="Bouton principal" /><SecondaryButton label="Bouton secondaire" /><OutlineButton label="Bouton contour" /><PrimaryButton label="État désactivé" disabled /><PrimaryButton label="Chargement" loading />
      </Section>

      <Section title="Champs de saisie">
        <PhoneInput label="Numéro de téléphone" /><EmailInput label="Adresse e-mail" /><SearchInput label="Recherche" placeholder="Rechercher une adresse" /><LocationInput label="Point de départ" placeholder="Ma position actuelle" /><LocationInput destination label="Destination" placeholder="Où allez-vous ?" /><EmailInput label="État d’erreur" value="adresse-invalide" error="Saisissez une adresse e-mail valide." />
      </Section>

      <Section title="Code OTP">
        <AppText color={colors.textMuted} style={styles.center}>Choisissez la longueur, puis ouvrez le panneau de vérification animé.</AppText>
        <View style={styles.otpOptions}>{([4, 6, 8] as const).map((length) => <SecondaryButton key={length} label={`${length} chiffres`} onPress={() => setOtpLength(length)} />)}</View>
        <PrimaryButton label="Afficher l’animation OTP" onPress={() => setOtpVisible(true)} />
        <AppText variant="caption" color={colors.textMuted} style={styles.center}>Le panneau monte depuis le bas uniquement après pression sur le bouton.</AppText>
      </Section>

      <Section title="Choix du véhicule et prix">
        <VehicleSelector />
      </Section>

      <Section title="Simulation du trajet sur Google Maps">
        <CameroonRouteMap />
      </Section>

      <Section title="Cartes et raccourcis">
        <AppCard><AppText variant="h3">Carte KaziRide</AppText><AppText color={colors.textMuted}>Surface principale avec rayon et ombre officiels.</AppText></AppCard><View style={styles.row}><LocationShortcut icon="M" label="Maison" /><LocationShortcut icon="T" label="Travail" /></View>
      </Section>

      <Section title="États système">
        <LoadingIndicator label="Recherche d’un trajet…" /><ErrorMessage message="Une erreur est survenue. Réessayez." /><EmptyState title="Aucun trajet" description="Votre activité apparaîtra ici." />
      </Section>
      <OTPVerificationSheet visible={otpVisible} length={otpLength} onClose={() => setOtpVisible(false)} />
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><AppText variant="h2">{title}</AppText><View style={styles.sectionContent}>{children}</View></View>;
}

const styles = StyleSheet.create({
  page: { gap: spacing[10], maxWidth: 760, width: '100%', alignSelf: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[4] },
  flex: { flex: 1 },
  section: { gap: spacing[5] },
  sectionContent: { gap: spacing[4] },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
  swatchItem: { width: 100, gap: spacing[1] },
  swatch: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: spacing[3] },
  otpOptions: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2] },
  center: { textAlign: 'center' },
});

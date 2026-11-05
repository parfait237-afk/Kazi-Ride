import { Image, type ImageResizeMode, type ImageStyle, type StyleProp } from 'react-native';

type AppLogoProps = {
  width?: number;
  height?: number;
  resizeMode?: ImageResizeMode;
  style?: StyleProp<ImageStyle>;
};

export function AppLogo({
  width = 180,
  height = 180,
  resizeMode = 'contain',
  style,
}: AppLogoProps) {
  return (
    <Image
      accessibilityLabel="Logo KaziRide"
      source={require('@/assets/images/kaziride-logo.png')}
      resizeMode={resizeMode}
      style={[{ width, height }, style]}
    />
  );
}

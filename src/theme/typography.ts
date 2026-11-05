import { Platform, type TextStyle } from 'react-native';

const family = Platform.select({ ios: 'Inter', android: 'sans-serif', default: 'system-ui' });

export const typography = {
  display: { fontFamily: family, fontSize: 36, lineHeight: 42, fontWeight: '800' },
  h1: { fontFamily: family, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  h2: { fontFamily: family, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  h3: { fontFamily: family, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  bodyLarge: { fontFamily: family, fontSize: 18, lineHeight: 26, fontWeight: '400' },
  body: { fontFamily: family, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySmall: { fontFamily: family, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontFamily: family, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  button: { fontFamily: family, fontSize: 16, lineHeight: 20, fontWeight: '700' },
} satisfies Record<string, TextStyle>;


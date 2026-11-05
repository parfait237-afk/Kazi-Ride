import { Platform } from 'react-native';

export const shadows = {
  card: Platform.select({
    ios: { shadowColor: '#001B4E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    android: { elevation: 5 },
    default: { boxShadow: '0 8px 24px rgba(0,27,78,0.12)' },
  }),
  floating: Platform.select({
    ios: { shadowColor: '#001B4E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
    android: { elevation: 8 },
    default: { boxShadow: '0 4px 16px rgba(0,27,78,0.18)' },
  }),
} as const;


import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'kaziride.refreshToken';
let webToken: string | null = null;

export const secureStorage = {
  async getRefreshToken() {
    if (Platform.OS === 'web') return webToken;
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string) {
    if (Platform.OS === 'web') { webToken = token; return; }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clearRefreshToken() {
    if (Platform.OS === 'web') { webToken = null; return; }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

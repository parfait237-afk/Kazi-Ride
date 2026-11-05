import type { AuthTokensResponse, AuthUser, OtpChallengeResponse } from '@/types/auth.types';
import { secureStorage } from '@/utils/secure-storage';
import { apiRequest, setAccessToken } from './api';

async function persistSession(response: AuthTokensResponse) {
  setAccessToken(response.accessToken);
  await secureStorage.setRefreshToken(response.refreshToken);
  return response.user;
}

export const authService = {
  requestOtp(email: string, phone: string) {
    return apiRequest<OtpChallengeResponse>('/api/auth/request-otp', {
      method: 'POST', body: JSON.stringify({ email, phone }),
    });
  },
  async verifyOtp(challengeId: string, code: string) {
    const response = await apiRequest<AuthTokensResponse>('/api/auth/verify-otp', {
      method: 'POST', body: JSON.stringify({ challengeId, code }),
    });
    return persistSession(response);
  },
  resendOtp(challengeId: string) {
    return apiRequest<OtpChallengeResponse>('/api/auth/resend-otp', {
      method: 'POST', body: JSON.stringify({ challengeId }),
    });
  },
  async refreshSession(): Promise<AuthUser | null> {
    const refreshToken = await secureStorage.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const response = await apiRequest<AuthTokensResponse>('/api/auth/refresh', {
        method: 'POST', body: JSON.stringify({ refreshToken }),
      });
      return persistSession(response);
    } catch (error) {
      setAccessToken(null);
      await secureStorage.clearRefreshToken();
      throw error;
    }
  },
  async logout() {
    const refreshToken = await secureStorage.getRefreshToken();
    try {
      if (refreshToken) await apiRequest<void>('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
    } finally {
      setAccessToken(null);
      await secureStorage.clearRefreshToken();
    }
  },
  async getCurrentUser() {
    const response = await apiRequest<{ user: AuthUser }>('/api/auth/me');
    return response.user;
  },
};

export const requestOtp = authService.requestOtp;
export const verifyOtp = authService.verifyOtp;
export const refreshSession = authService.refreshSession;
export const logout = authService.logout;
export const getCurrentUser = authService.getCurrentUser;

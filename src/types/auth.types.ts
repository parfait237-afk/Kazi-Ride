export type AuthUser = {
  id: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'PASSENGER';
  createdAt: string;
};

export type AuthTokensResponse = { user: AuthUser; accessToken: string; refreshToken: string };
export type OtpChallengeResponse = { challengeId: string; expiresInSeconds: number };
export type AuthState = { user: AuthUser | null; isLoading: boolean; isAuthenticated: boolean };

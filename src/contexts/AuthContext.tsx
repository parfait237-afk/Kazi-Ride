import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authService } from '@/services/auth.service';
import type { AuthState, AuthUser } from '@/types/auth.types';

type AuthContextValue = AuthState & {
  requestOtp: typeof authService.requestOtp;
  resendOtp: typeof authService.resendOtp;
  verifyOtp(challengeId: string, code: string): Promise<AuthUser>;
  refreshSession(): Promise<AuthUser | null>;
  logout(): Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const restored = await authService.refreshSession();
    setUser(restored);
    return restored;
  }, []);

  useEffect(() => {
    refreshSession().catch(() => setUser(null)).finally(() => setIsLoading(false));
  }, [refreshSession]);

  const verifyOtp = useCallback(async (challengeId: string, code: string) => {
    const authenticatedUser = await authService.verifyOtp(challengeId, code);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, isLoading, isAuthenticated: Boolean(user), requestOtp: authService.requestOtp,
    resendOtp: authService.resendOtp, verifyOtp, refreshSession, logout,
  }), [user, isLoading, verifyOtp, refreshSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

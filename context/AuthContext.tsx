'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  type Profile,
  type DriverApplicationInput,
  localSignUp,
  localSignIn,
  localSignOut,
  localChangePassword,
  localGetProfile,
  localGetSession,
  localSubmitDriverApplication,
} from '@/lib/localAuth';

interface AuthContextValue {
  loading: boolean;
  session: string | null;
  profile: Profile | null;
  demoMode: boolean;
  signUp: (fullName: string, mobile: string, role?: 'rider' | 'driver', email?: string) => Promise<{ error: string | null }>;
  signIn: (mobile: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  submitDriverApplication: (userId: string, data: DriverApplicationInput) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const sid = localGetSession();
    setSession(sid);
    if (sid) setProfile(localGetProfile());
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfile(localGetProfile());
  }, []);

  const signUp = useCallback(async (fullName: string, mobile: string, role: 'rider' | 'driver' = 'rider', email?: string) => {
    const result = localSignUp(fullName, mobile, role, email);
    if (!result.error) {
      setSession(result.userId);
      setProfile(localGetProfile());
    }
    return { error: result.error };
  }, []);

  const signIn = useCallback(async (mobile: string, password: string) => {
    const result = localSignIn(mobile, password);
    if (!result.error) {
      setSession(localGetSession());
      setProfile(localGetProfile());
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    localSignOut();
    setSession(null);
    setProfile(null);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const result = localChangePassword(newPassword);
    if (!result.error) await refreshProfile();
    return result;
  }, [refreshProfile]);

  const submitDriverApplication = useCallback(async (userId: string, data: DriverApplicationInput) => {
    return localSubmitDriverApplication(userId, data);
  }, []);

  return (
    <AuthContext.Provider value={{
      loading,
      session,
      profile,
      demoMode: false,
      signUp,
      signIn,
      signOut,
      changePassword,
      submitDriverApplication,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

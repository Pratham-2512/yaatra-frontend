'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  type Profile,
  type DriverApplicationInput,
  getProfile,
  signOut as _signOut,
  signUpUser,
  signIn as _signIn,
  changePassword as _changePassword,
  submitDriverApplication as _submitDriver,
} from '@/lib/supabaseAuth';

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  demoMode: boolean;
  signUp: (fullName: string, mobile: string, role?: 'rider' | 'driver') => Promise<{ error: string | null }>;
  signIn: (mobile: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  submitDriverApplication: (userId: string, data: DriverApplicationInput) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const demoMode = !supabase;
  const [loading, setLoading] = useState(!demoMode);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    const p = await getProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    if (demoMode) return;

    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) getProfile().then(setProfile);
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [demoMode]);

  const signUp = useCallback(async (fullName: string, mobile: string, role: 'rider' | 'driver' = 'rider') => {
    const result = await signUpUser(fullName, mobile, role);
    if (!result.error) {
      const p = await getProfile();
      setProfile(p);
    }
    return { error: result.error };
  }, []);

  const signIn = useCallback(async (mobile: string, password: string) => {
    const result = await _signIn(mobile, password);
    if (!result.error) {
      const p = await getProfile();
      setProfile(p);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await _signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const result = await _changePassword(newPassword);
    if (!result.error) await refreshProfile();
    return result;
  }, [refreshProfile]);

  const submitDriverApplication = useCallback(async (userId: string, data: DriverApplicationInput) => {
    return _submitDriver(userId, data);
  }, []);

  return (
    <AuthContext.Provider value={{
      loading,
      session,
      profile,
      demoMode,
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

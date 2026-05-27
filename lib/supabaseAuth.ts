import { supabase } from './supabase';

export type UserRole = 'rider' | 'driver';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  mobile: string;
  password_changed: boolean;
  created_at: string;
}

export interface DriverApplicationInput {
  full_name: string;
  mobile: string;
  email: string;
  address: string;
  vehicle_type: string;
  vehicle_number: string;
  rc_url: string;
  license_url: string;
  aadhaar_url: string;
  photo_url: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
}

function toEmail(mobile: string): string {
  return `${mobile.replace(/\D/g, '')}@yaatra.app`;
}

export async function signUpUser(
  fullName: string,
  mobile: string,
  role: UserRole
): Promise<{ userId: string | null; error: string | null }> {
  if (!supabase) return { userId: null, error: null };

  const { data, error } = await supabase.auth.signUp({
    email: toEmail(mobile),
    password: '123456',
  });

  if (error) return { userId: null, error: error.message };
  if (!data.user) return { userId: null, error: 'Signup failed — try again.' };

  // Email confirmation is still enabled in Supabase → no session after signup
  if (!data.session) {
    return {
      userId: null,
      error: 'Email confirmation is enabled. Go to Supabase → Auth → Providers → Email → disable "Confirm email", then retry.',
    };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    role,
    full_name: fullName,
    mobile,
    password_changed: false,
  });

  if (profileError) return { userId: null, error: profileError.message };
  return { userId: data.user.id, error: null };
}

export async function signIn(
  mobile: string,
  password: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(mobile),
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login')) return { error: 'Mobile number or password is incorrect.' };
    if (error.message.includes('Email not confirmed')) return { error: 'Account not confirmed. Disable email confirmation in Supabase Auth settings.' };
    return { error: error.message };
  }
  return { error: null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function changePassword(newPassword: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').update({ password_changed: true }).eq('id', user.id);
  }
  return { error: null };
}

export async function getProfile(): Promise<Profile | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (data as Profile) ?? null;
}

export async function submitDriverApplication(
  userId: string,
  input: DriverApplicationInput
): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };

  const { error } = await supabase.from('driver_applications').insert({
    user_id: userId,
    ...input,
    status: 'pending_verification',
  });

  return { error: error?.message ?? null };
}

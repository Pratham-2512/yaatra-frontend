export type UserRole = 'rider' | 'driver';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  mobile: string;
  email?: string;
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

interface StoredUser {
  id: string;
  mobile: string;
  password: string;
  profile: Profile;
}

const USERS_KEY = 'yaatra_users';
const SESSION_KEY = 'yaatra_session';
const DRIVER_APPS_KEY = 'yaatra_driver_apps';

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]'); }
  catch { return []; }
}

function saveUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

function setSessionId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

function uid(): string {
  return `usr_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function localSignUp(
  fullName: string,
  mobile: string,
  role: UserRole,
  email?: string
): { userId: string | null; error: string | null } {
  const users = getUsers();
  const norm = mobile.replace(/\D/g, '');
  if (users.find((u) => u.mobile === norm)) {
    return { userId: null, error: 'An account with this mobile number already exists.' };
  }
  if (email) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) return { userId: null, error: 'Enter a valid email address.' };
    if (users.find((u) => u.profile.email?.toLowerCase() === email.toLowerCase())) {
      return { userId: null, error: 'An account with this email already exists.' };
    }
  }
  const id = uid();
  const profile: Profile = {
    id, role, full_name: fullName, mobile: norm,
    ...(email ? { email: email.toLowerCase() } : {}),
    password_changed: false, created_at: new Date().toISOString(),
  };
  saveUsers([...users, { id, mobile: norm, password: '123456', profile }]);
  setSessionId(id);
  return { userId: id, error: null };
}

export function localSignIn(
  mobile: string,
  password: string
): { error: string | null } {
  const users = getUsers();
  const norm = mobile.replace(/\D/g, '');
  const user = users.find((u) => u.mobile === norm);
  if (!user || user.password !== password) {
    return { error: 'Mobile number or password is incorrect.' };
  }
  setSessionId(user.id);
  return { error: null };
}

export function localSignOut(): void {
  setSessionId(null);
}

export function localChangePassword(newPassword: string): { error: string | null } {
  const id = getSessionId();
  if (!id) return { error: 'Not authenticated.' };
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return { error: 'User not found.' };
  users[idx].password = newPassword;
  users[idx].profile.password_changed = true;
  saveUsers(users);
  return { error: null };
}

export function localGetProfile(): Profile | null {
  const id = getSessionId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id)?.profile ?? null;
}

export function localGetSession(): string | null {
  return getSessionId();
}

export function localSubmitDriverApplication(
  _userId: string,
  input: DriverApplicationInput
): { error: string | null } {
  if (typeof window === 'undefined') return { error: null };
  try {
    const apps = JSON.parse(localStorage.getItem(DRIVER_APPS_KEY) ?? '[]');
    apps.push({ ...input, status: 'pending_verification', created_at: new Date().toISOString() });
    localStorage.setItem(DRIVER_APPS_KEY, JSON.stringify(apps));
    return { error: null };
  } catch {
    return { error: 'Failed to save application.' };
  }
}

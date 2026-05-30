'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { btnPrimary, btnGhost, inputField, labelCaps } from '@/components/ui/styles';
import type { DriverApplicationInput } from '@/lib/localAuth';
import { FileUploadField } from '@/components/auth/FileUploadField';

// ── Shared layout ─────────────────────────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05080f] p-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_-10%,rgba(255,107,53,0.10),transparent),radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(34,211,238,0.07),transparent)]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-lg shadow-lg shadow-orange-600/30 ring-1 ring-orange-400/20">
            य
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">YAATRA</h1>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">
              Mobility intelligence
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCaps}>{label}</label>
      {children}
    </div>
  );
}

// ── Login / Rider signup ───────────────────────────────────────────────────────
function LoginView({ onDriverApply }: { onDriverApply: () => void }) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || !password.trim()) { setError('Enter mobile number and password.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await signIn(mobile.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) { setError('Enter your full name and mobile number.'); return; }
    if (mobile.replace(/\D/g, '').length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await signUp(fullName.trim(), mobile.trim(), 'rider', email.trim() || undefined);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <AuthShell>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/40 backdrop-blur-xl">
        {/* Tabs */}
        <div className="mb-5 flex rounded-xl border border-white/[0.06] bg-[#0a1020]/60 p-1">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                tab === t
                  ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-white ring-1 ring-orange-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <Field label="Mobile Number">
              <input type="tel" placeholder="98XXXXXXXX" value={mobile}
                onChange={(e) => setMobile(e.target.value)} className={inputField} />
            </Field>
            <Field label="Password">
              <input type="password" placeholder="••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} className={inputField} />
            </Field>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <button type="submit" disabled={loading} className={`${btnPrimary} mt-1`}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <Field label="Full Name">
              <input type="text" placeholder="Rahul Sharma" value={fullName}
                onChange={(e) => setFullName(e.target.value)} className={inputField} />
            </Field>
            <Field label="Mobile Number">
              <input type="tel" placeholder="98XXXXXXXX" value={mobile}
                onChange={(e) => setMobile(e.target.value)} className={inputField} />
            </Field>
            <Field label="Email Address (optional)">
              <input type="email" placeholder="rahul@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputField} />
            </Field>
            <p className="text-[10px] text-slate-500">
              Sign in uses your <span className="text-slate-400">mobile number</span>. Default password is <span className="font-mono text-slate-400">123456</span> &mdash; you&apos;ll be asked to change it after signup.
            </p>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <button type="submit" disabled={loading} className={`${btnPrimary} mt-1`}>
              {loading ? 'Creating account…' : 'Create rider account →'}
            </button>
          </form>
        )}
      </div>

      {/* Driver CTA */}
      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
        <p className="mb-2 text-xs text-slate-400">Want to become a Driver Partner?</p>
        <button type="button" onClick={onDriverApply} className={`${btnGhost} w-full text-xs`}>
          Apply as Driver Partner 🛺
        </button>
      </div>
    </AuthShell>
  );
}

// ── Forced password change ────────────────────────────────────────────────────
function PasswordChangeView() {
  const { changePassword, profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await changePassword(newPassword);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <AuthShell>
      <div className="rounded-2xl border border-orange-500/20 bg-white/[0.03] p-6 shadow-xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400">
            Security required
          </p>
          <h2 className="mt-0.5 text-base font-bold text-white">
            Set your password, {profile?.full_name?.split(' ')[0] ?? 'there'}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Choose a new password before accessing the app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="New Password">
            <input type="password" placeholder="Min. 6 characters" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className={inputField} />
          </Field>
          <Field label="Confirm Password">
            <input type="password" placeholder="Repeat password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} className={inputField} />
          </Field>
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Saving…' : 'Set password & continue →'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

// ── Driver onboarding (4-step) ────────────────────────────────────────────────
const VEHICLE_TYPES_DRIVER = ['Bike', 'Auto', 'Sedan', 'SUV', 'Mini Truck'];

function DriverOnboardingView({ onBack }: { onBack: () => void }) {
  const { signUp, submitDriverApplication, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Personal
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Step 2 — Vehicle
  const [vehicleType, setVehicleType] = useState('Auto');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Step 3 — Documents (files in state; public URLs written to Supabase Storage)
  const [rcFile,      setRcFile]      = useState<File | null>(null);
  const [rcUrl,       setRcUrl]       = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl,  setLicenseUrl]  = useState('');
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarUrl,  setAadhaarUrl]  = useState('');
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [photoUrl,    setPhotoUrl]    = useState('');

  // Step 4 — Bank
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      if (!fullName.trim() || !mobile.trim()) { setError('Name and mobile are required.'); return; }
      if (mobile.replace(/\D/g, '').length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    }
    if (step === 2 && !vehicleNumber.trim()) { setError('Vehicle number is required.'); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolder.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setError('All bank details are required.'); return;
    }
    setError(''); setSubmitting(true);

    const { error: signUpErr } = await signUp(fullName.trim(), mobile.trim(), 'driver', email.trim() || undefined);
    if (signUpErr) { setError(signUpErr); setSubmitting(false); return; }

    // Get userId after signup — profile was just created
    const userId = profile?.id;
    if (userId) {
      const appData: DriverApplicationInput = {
        full_name: fullName, mobile, email, address,
        vehicle_type: vehicleType, vehicle_number: vehicleNumber,
        rc_url: rcUrl || rcFile?.name || '', license_url: licenseUrl || licenseFile?.name || '', aadhaar_url: aadhaarUrl || aadhaarFile?.name || '', photo_url: photoUrl || photoFile?.name || '',
        account_holder: accountHolder, account_number: accountNumber, ifsc_code: ifscCode,
      };
      await submitDriverApplication(userId, appData);
    }

    setSubmitting(false);
    setDone(true);
  };

  const STEPS = ['Personal', 'Vehicle', 'Documents', 'Bank'];

  if (done) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.03] p-6 text-center shadow-xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-3 text-3xl">✅</div>
          <h2 className="mb-1 text-base font-bold text-white">Application submitted</h2>
          <p className="text-xs text-slate-400">
            Your driver application is under review. Status: <span className="font-semibold text-amber-400">Pending verification</span>
          </p>
          <p className="mt-3 text-[11px] text-slate-500">
            You&apos;ll be asked to set a new password on your next step.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl shadow-black/40 backdrop-blur-xl">
        {/* Header + back */}
        <div className="mb-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-[11px] text-slate-500 hover:text-slate-300">
            ← Back
          </button>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400">
              Driver partner
            </p>
            <h2 className="text-sm font-bold text-white">Onboarding — Step {step} of 4</h2>
          </div>
        </div>

        {/* Step pills */}
        <div className="mb-5 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                i + 1 < step ? 'bg-orange-500' : i + 1 === step ? 'bg-orange-500/60' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={next} className="space-y-3">
            <p className="mb-3 text-xs font-semibold text-slate-300">Personal Information</p>
            <Field label="Full Name">
              <input type="text" placeholder="Rahul Sharma" value={fullName}
                onChange={(e) => setFullName(e.target.value)} className={inputField} />
            </Field>
            <Field label="Mobile Number">
              <input type="tel" placeholder="98XXXXXXXX" value={mobile}
                onChange={(e) => setMobile(e.target.value)} className={inputField} />
            </Field>
            <Field label="Email (optional)">
              <input type="email" placeholder="rahul@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputField} />
              <p className="mt-1 text-[10px] text-slate-500">Sign-in uses your <span className="text-slate-400">mobile number</span>. Email is for contact only.</p>
            </Field>
            <Field label="Address">
              <input type="text" placeholder="Your city / area" value={address}
                onChange={(e) => setAddress(e.target.value)} className={inputField} />
            </Field>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <button type="submit" className={btnPrimary}>Next: Vehicle →</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={next} className="space-y-3">
            <p className="mb-3 text-xs font-semibold text-slate-300">Vehicle Information</p>
            <Field label="Vehicle Type">
              <div className="grid grid-cols-3 gap-1.5">
                {VEHICLE_TYPES_DRIVER.map((vt) => (
                  <button
                    key={vt} type="button"
                    onClick={() => setVehicleType(vt)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                      vehicleType === vt
                        ? 'border-orange-500/50 bg-orange-500/15 text-white'
                        : 'border-white/[0.06] text-slate-400 hover:border-white/15'
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Vehicle Number">
              <input type="text" placeholder="HR 26 AB 1234" value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} className={inputField} />
            </Field>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className={`${btnGhost} flex-1`}>← Back</button>
              <button type="submit" className={`${btnPrimary} flex-[2]`}>Next: Documents →</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={next} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-300">Upload Documents</p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                JPG · PNG · PDF &nbsp;·&nbsp; Max 5 MB each &nbsp;·&nbsp; Stored locally for demo
              </p>
            </div>

            <FileUploadField
              label="Profile Photo"
              hint="JPG or PNG · Your face should be clearly visible"
              file={photoFile}
              onSelect={(f, url) => { setPhotoFile(f); if (url) setPhotoUrl(url); }}
              onRemove={() => { setPhotoFile(null); setPhotoUrl(''); }}
              showPreview
              required
              fieldName="photo"
              mobile={mobile}
            />

            <FileUploadField
              label="RC Book"
              hint="Registration certificate · JPG, PNG or PDF"
              file={rcFile}
              onSelect={(f, url) => { setRcFile(f); if (url) setRcUrl(url); }}
              onRemove={() => { setRcFile(null); setRcUrl(''); }}
              required
              fieldName="rc_book"
              mobile={mobile}
            />

            <FileUploadField
              label="Driver License"
              hint="Front side · JPG, PNG or PDF"
              file={licenseFile}
              onSelect={(f, url) => { setLicenseFile(f); if (url) setLicenseUrl(url); }}
              onRemove={() => { setLicenseFile(null); setLicenseUrl(''); }}
              required
              fieldName="license"
              mobile={mobile}
            />

            <FileUploadField
              label="Aadhaar Card"
              hint="Front side · JPG, PNG or PDF"
              file={aadhaarFile}
              onSelect={(f, url) => { setAadhaarFile(f); if (url) setAadhaarUrl(url); }}
              onRemove={() => { setAadhaarFile(null); setAadhaarUrl(''); }}
              required
              fieldName="aadhaar"
              mobile={mobile}
            />

            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className={`${btnGhost} flex-1`}>← Back</button>
              <button type="submit" className={`${btnPrimary} flex-[2]`}>Next: Bank →</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="mb-3 text-xs font-semibold text-slate-300">Bank Details</p>
            <Field label="Account Holder Name">
              <input type="text" placeholder="As on bank account" value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)} className={inputField} />
            </Field>
            <Field label="Account Number">
              <input type="text" placeholder="XXXXXXXXXXXX" value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)} className={inputField} />
            </Field>
            <Field label="IFSC Code">
              <input type="text" placeholder="SBIN0001234" value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())} className={inputField} />
            </Field>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(3)} className={`${btnGhost} flex-1`}>← Back</button>
              <button type="submit" disabled={submitting} className={`${btnPrimary} flex-[2]`}>
                {submitting ? 'Submitting…' : 'Submit application →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

// ── Gate ──────────────────────────────────────────────────────────────────────
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, demoMode } = useAuth();
  const [screen, setScreen] = useState<'login' | 'driver-apply'>('login');

  // Demo mode: skip auth entirely
  if (demoMode) return <>{children}</>;

  // Initial session check
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05080f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Unauthenticated
  if (!session) {
    if (screen === 'driver-apply') {
      return <DriverOnboardingView onBack={() => setScreen('login')} />;
    }
    return <LoginView onDriverApply={() => setScreen('driver-apply')} />;
  }

  // Authenticated but profile loading / not yet set
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05080f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Authenticated but must change default password
  if (!profile.password_changed) {
    return <PasswordChangeView />;
  }

  // Fully authenticated
  return <>{children}</>;
}

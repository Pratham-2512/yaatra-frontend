'use client';

import { NAV_ITEMS } from '@/lib/constants';
import type { NavRole } from '@/lib/types';
import { glass } from '@/components/ui/styles';

export function AppShell({
  userType,
  setUserType,
  sidebarOpen,
  setSidebarOpen,
  title,
  subtitle,
  children,
}: {
  userType: NavRole;
  setUserType: (r: NavRole) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const wide = userType === 'admin';

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#05080f]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_15%_-5%,rgba(255,107,53,0.12),transparent),radial-gradient(ellipse_50%_40%_at_95%_90%,rgba(34,211,238,0.08),transparent),linear-gradient(180deg,#05080f_0%,#0a1020_50%,#05080f_100%)]" />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(272px,88vw)] flex-col border-r border-white/[0.06] bg-[#080d18]/98 backdrop-blur-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-[260px] lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/[0.06] px-5 py-5">
          <div className="flex items-center gap-3">
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
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const active = userType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setUserType(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  active
                    ? 'bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-cyan-500/5 text-white ring-1 ring-orange-500/25 shadow-lg shadow-orange-900/20'
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-base">
                  {item.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-[10px] opacity-60">{item.sub}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className={`${glass} p-3`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-slate-400">Network</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
              ASP.NET · Supabase · MapLibre OSM
            </p>
          </div>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#080d18]/90 px-4 py-2.5 backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-slate-400 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
                {subtitle}
              </p>
              <h2 className="text-sm font-semibold text-white md:text-[15px]">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-slate-500 md:inline">
              IST{' '}
              {new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/10 text-xs ring-1 ring-white/10">
              👤
            </div>
          </div>
        </header>

        <main
          className={`relative min-h-0 flex-1 overflow-hidden ${
            wide ? '' : 'mx-auto w-full max-w-6xl'
          }`}
        >
          {children}
        </main>

        <nav className="flex shrink-0 gap-0.5 border-t border-white/[0.06] bg-[#080d18]/95 p-1.5 backdrop-blur-xl lg:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setUserType(item.id)}
              className={`flex flex-1 flex-col items-center rounded-lg py-2 text-[9px] font-semibold uppercase tracking-wide transition ${
                userType === item.id
                  ? 'bg-orange-500/12 text-orange-300'
                  : 'text-slate-600'
              }`}
            >
              <span className="mb-0.5 text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

'use client';

import type { GpsSyncStatus } from '@/lib/types';

const GPS_LABELS: Record<GpsSyncStatus, { label: string; className: string }> = {
  synced: { label: 'GPS synced', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' },
  syncing: { label: 'Syncing route…', className: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300 animate-pulse' },
  fallback: { label: 'Smart route', className: 'border-amber-500/25 bg-amber-500/10 text-amber-300' },
  offline: { label: 'Reconnecting', className: 'border-slate-500/25 bg-white/5 text-slate-400' },
};

export function GpsStatusChip({ status }: { status: GpsSyncStatus }) {
  const cfg = GPS_LABELS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${cfg.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

export function LoadingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className="h-full w-1/3 animate-[shimmer_1.2s_ease_infinite] rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
    </div>
  );
}

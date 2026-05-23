'use client';

import { useToast } from '@/context/ToastContext';
import type { ToastType } from '@/lib/types';

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '!',
  info: '◆',
  warning: '⚠',
};

export function ToastHost() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-slide-up glass-card flex gap-3 rounded-xl border p-3 shadow-2xl ${styles[t.type]}`}
          role="status"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30 text-sm font-bold">
            {icons[t.type]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{t.title}</p>
            {t.message && <p className="mt-0.5 text-xs opacity-80">{t.message}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-xs opacity-50 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { getTrips, type StoredTrip } from '@/lib/localAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import { useAuth } from '@/context/AuthContext';

function TripStatusBadge({ status }: { status: StoredTrip['status'] }) {
  const cls =
    status === 'completed'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/25';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: 56 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-orange-500 to-cyan-400 transition-all duration-500"
            style={{ height: `${Math.round((d.value / max) * 48)}px`, minHeight: d.value > 0 ? 3 : 0 }}
          />
          <span className="font-mono text-[8px] text-slate-600">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RiderHistory({ tabBar }: { tabBar?: React.ReactNode }) {
  const { session } = useAuth();
  const trips = useMemo(() => getTrips(session ?? ''), [session]);

  const stats = useMemo(() => {
    const completed = trips.filter((t) => t.status === 'completed');
    const cancelled = trips.filter((t) => t.status === 'cancelled');
    return {
      total: trips.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalSpent: completed.reduce((s, t) => s + t.fare, 0),
      avgRating: completed.length
        ? Math.round((completed.reduce((s, t) => s + t.rating, 0) / completed.length) * 10) / 10
        : 0,
    };
  }, [trips]);

  const monthlySpend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthTrips = trips.filter((t) => {
        const td = new Date(t.createdAt);
        return (
          t.status === 'completed' &&
          td.getFullYear() === d.getFullYear() &&
          td.getMonth() === d.getMonth()
        );
      });
      return {
        label: d.toLocaleString('en-IN', { month: 'short' }),
        value: monthTrips.reduce((s, t) => s + t.fare, 0),
      };
    });
  }, [trips]);

  const monthlyTrips = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const count = trips.filter((t) => {
        const td = new Date(t.createdAt);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      }).length;
      return { label: d.toLocaleString('en-IN', { month: 'short' }), value: count };
    });
  }, [trips]);

  return (
    <div className="scrollbar-thin z-10 flex h-full w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] p-4 lg:max-w-md lg:border-l lg:border-t-0">
      {tabBar}

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">Compliance</p>
        <h2 className="text-base font-bold text-white">Trip History</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiWidget label="Total trips" value={stats.total} accent="orange" />
        <KpiWidget label="Completed" value={stats.completed} accent="emerald" />
        <KpiWidget label="Cancelled" value={stats.cancelled} accent="rose" />
        <KpiWidget label="Total spent" value={`₹${stats.totalSpent}`} accent="cyan" />
      </div>
      {stats.avgRating > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
          Avg rating given: <span className="font-bold">★ {stats.avgRating}</span>
        </div>
      )}

      {/* Charts */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly spending (₹)
        </p>
        <MiniBarChart data={monthlySpend} />
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly trips
        </p>
        <MiniBarChart data={monthlyTrips} />
      </GlassCard>

      {/* Trip list */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          All trips
        </p>
        {trips.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-600">
            No trips yet. Book your first ride!
          </p>
        ) : (
          <div className="space-y-3">
            {trips.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <TripStatusBadge status={t.status} />
                  <span className="font-mono text-[10px] text-slate-600">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </span>
                </div>
                <div className="mb-2 space-y-0.5 text-xs text-slate-400">
                  <p className="flex gap-1.5">
                    <span className="text-orange-400">●</span>
                    <span className="truncate">{t.pickup}</span>
                  </p>
                  <p className="flex gap-1.5">
                    <span className="text-cyan-400">●</span>
                    <span className="truncate">{t.dropoff}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded bg-white/5 px-2 py-0.5 capitalize">{t.vehicleType}</span>
                  <span className="rounded bg-white/5 px-2 py-0.5">{t.distanceKm} km</span>
                  <span className="rounded bg-white/5 px-2 py-0.5">{t.durationMin} min</span>
                  {t.status === 'completed' && (
                    <>
                      <span className="rounded bg-orange-500/15 px-2 py-0.5 font-bold text-orange-300">
                        ₹{t.fare}
                      </span>
                      {t.rating > 0 && (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-400">
                          ★ {t.rating}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { getTrips, type StoredTrip } from '@/lib/localAuth';
import { getFavoriteLocations } from '@/lib/demoData';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import { useAuth } from '@/context/AuthContext';
import { useRide } from '@/context/RideContext';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StoredTrip['status'] }) {
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

function BarChart({ data, color = 'orange' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const grad = color === 'orange' ? 'from-orange-500 to-amber-400' : 'from-cyan-500 to-blue-400';
  return (
    <div className="flex items-end gap-1.5" style={{ height: 52 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-sm bg-gradient-to-t ${grad} transition-all duration-500`}
            style={{ height: `${Math.round((d.value / max) * 44)}px`, minHeight: d.value > 0 ? 3 : 0 }}
          />
          <span className="font-mono text-[8px] text-slate-600">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyTrips() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="text-3xl opacity-20">🗺️</span>
      <div>
        <p className="text-xs font-semibold text-slate-400">No trips yet</p>
        <p className="mt-1 text-[10px] text-slate-600">
          Book your first ride to see history here
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RiderHistory({ tabBar }: { tabBar?: React.ReactNode }) {
  const { session } = useAuth();
  const { tripPhase } = useRide();
  const userId = session ?? '';
  const trips = useMemo(() => getTrips(userId), [userId]);

  const stats = useMemo(() => {
    const completed = trips.filter((t) => t.status === 'completed');
    const cancelled = trips.filter((t) => t.status === 'cancelled');
    const totalSpent = completed.reduce((s, t) => s + t.fare, 0);
    const avgRating =
      completed.length
        ? Math.round((completed.reduce((s, t) => s + t.rating, 0) / completed.length) * 10) / 10
        : 0;
    const activeTrip = ['searching', 'assigned', 'arriving', 'inTrip'].includes(tripPhase) ? 1 : 0;
    return { total: trips.length, completed: completed.length, cancelled: cancelled.length, totalSpent, avgRating, activeTrip };
  }, [trips, tripPhase]);

  const monthlySpend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const val = trips
        .filter((t) => {
          const td = new Date(t.createdAt);
          return t.status === 'completed' && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((s, t) => s + t.fare, 0);
      return { label: d.toLocaleString('en-IN', { month: 'short' }), value: val };
    });
  }, [trips]);

  const monthlyCount = useMemo(() => {
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

  const favorites = useMemo(() => getFavoriteLocations(userId), [userId]);

  const recentTrips = trips.slice(0, 8);

  return (
    <div className="scrollbar-thin z-10 flex h-full w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] p-4 lg:max-w-md lg:border-l lg:border-t-0">
      {tabBar}

      {/* Header */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">
          Rider dashboard
        </p>
        <h2 className="text-base font-bold text-white">Trip History</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiWidget label="Total trips"    value={stats.total}              accent="orange" />
        <KpiWidget label="Completed"      value={stats.completed}          accent="emerald" />
        <KpiWidget label="Cancelled"      value={stats.cancelled}          accent="rose" />
        <KpiWidget label="Total spent"    value={`₹${stats.totalSpent}`}   accent="cyan" />
      </div>

      {/* Avg rating + active ride */}
      <div className="flex gap-2">
        {stats.avgRating > 0 && (
          <div className="flex flex-1 items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
            <span className="text-slate-400">Avg rating given</span>
            <span className="font-bold text-amber-400">★ {stats.avgRating}</span>
          </div>
        )}
        {stats.activeTrip > 0 && (
          <div className="flex flex-1 items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs">
            <span className="text-slate-400">Active ride</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
        )}
      </div>

      {/* Monthly analytics */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly spending (₹)
        </p>
        <BarChart data={monthlySpend} color="orange" />
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly ride count
        </p>
        <BarChart data={monthlyCount} color="cyan" />
      </GlassCard>

      {/* Favorite locations */}
      {favorites.length > 0 && (
        <GlassCard className="p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Frequent destinations
          </p>
          <div className="space-y-2">
            {favorites.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#0a1020]/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-cyan-400">★</span>
                  <span className="truncate text-xs text-slate-300">{f.label}</span>
                </div>
                <span className="ml-2 shrink-0 text-[10px] text-slate-600">{f.count}×</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Trip list */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Recent trips
        </p>
        {recentTrips.length === 0 ? (
          <EmptyTrips />
        ) : (
          <div className="space-y-3">
            {recentTrips.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3 transition hover:border-white/10"
              >
                {/* Header row */}
                <div className="mb-2 flex items-center justify-between">
                  <StatusBadge status={t.status} />
                  <span className="font-mono text-[10px] text-slate-600">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                </div>

                {/* Route */}
                <div className="relative mb-2 pl-3">
                  <div className="absolute bottom-1 left-[5px] top-1 w-px bg-gradient-to-b from-orange-500/60 to-cyan-400/60" />
                  <p className="mb-1.5 flex gap-2 text-xs text-slate-400">
                    <span className="absolute left-0 top-1 h-2 w-2 rounded-full bg-orange-500" />
                    <span className="ml-1 truncate">{t.pickup}</span>
                  </p>
                  <p className="flex gap-2 text-xs text-slate-400">
                    <span className="absolute bottom-1 left-0 h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="ml-1 truncate">{t.dropoff}</span>
                  </p>
                </div>

                {/* Tags */}
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

                {/* Driver name */}
                {t.driverName && t.driverName !== 'Fleet Partner' && t.status === 'completed' && (
                  <p className="mt-1.5 text-[10px] text-slate-600">
                    Driver: <span className="text-slate-500">{t.driverName}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

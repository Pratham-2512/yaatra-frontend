'use client';

import { useMemo } from 'react';
import { getTrips } from '@/lib/localAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import { useRide } from '@/context/RideContext';
import { useAuth } from '@/context/AuthContext';

function MiniBarChart({
  data,
  color = 'emerald',
}: {
  data: { label: string; value: number }[];
  color?: 'emerald' | 'orange' | 'cyan';
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const gradient =
    color === 'emerald'
      ? 'from-emerald-500 to-cyan-400'
      : color === 'orange'
        ? 'from-orange-500 to-amber-400'
        : 'from-cyan-500 to-blue-400';
  return (
    <div className="flex items-end gap-1.5" style={{ height: 56 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-sm bg-gradient-to-t ${gradient} transition-all duration-500`}
            style={{ height: `${Math.round((d.value / max) * 48)}px`, minHeight: d.value > 0 ? 3 : 0 }}
          />
          <span className="font-mono text-[8px] text-slate-600">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const PERF_METRICS = [
  { label: 'Acceptance rate', value: '94%', bar: 0.94, color: 'emerald-500' },
  { label: 'On-time arrival', value: '88%', bar: 0.88, color: 'cyan-500' },
  { label: 'Completion rate', value: '97%', bar: 0.97, color: 'orange-500' },
];

export function DriverDashboard({ tabBar }: { tabBar?: React.ReactNode }) {
  const { driverState } = useRide();
  const { session, profile } = useAuth();
  const trips = useMemo(() => getTrips(session ?? ''), [session]);
  const completedTrips = useMemo(() => trips.filter((t) => t.status === 'completed'), [trips]);

  const historicalEarnings = useMemo(
    () => completedTrips.reduce((s, t) => s + t.fare, 0),
    [completedTrips]
  );

  const totalEarnings = historicalEarnings + driverState.earnings;
  const totalTrips = completedTrips.length + driverState.tripsToday;
  const avgEarningPerTrip = totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0;

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const isCurrentMonth =
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      const historical = completedTrips
        .filter((t) => {
          const td = new Date(t.createdAt);
          return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((s, t) => s + t.fare, 0);
      return {
        label: d.toLocaleString('en-IN', { month: 'short' }),
        value: isCurrentMonth ? historical + driverState.earnings : historical,
      };
    });
  }, [completedTrips, driverState.earnings]);

  const monthlyTrips = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const isCurrentMonth =
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      const count = completedTrips.filter((t) => {
        const td = new Date(t.createdAt);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      }).length;
      return {
        label: d.toLocaleString('en-IN', { month: 'short' }),
        value: isCurrentMonth ? count + driverState.tripsToday : count,
      };
    });
  }, [completedTrips, driverState.tripsToday]);

  return (
    <div className="scrollbar-thin z-10 flex h-full w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] p-4 lg:max-w-md lg:border-l lg:border-t-0">
      {tabBar}

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
          Performance
        </p>
        <h2 className="text-base font-bold text-white">
          {profile?.full_name?.split(' ')[0] ?? 'Driver'} &mdash; Earnings & Analytics
        </h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiWidget
          label="Session earnings"
          value={`₹${driverState.earnings}`}
          accent="orange"
          trend="+session"
        />
        <KpiWidget label="Session trips" value={driverState.tripsToday} accent="cyan" />
        <KpiWidget label="Rating" value={driverState.rating} accent="emerald" />
        <KpiWidget label="Total earned" value={`₹${totalEarnings}`} accent="amber" />
      </div>

      {avgEarningPerTrip > 0 && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-300">
          Avg per trip: <span className="font-bold">₹{avgEarningPerTrip}</span>
          <span className="ml-2 text-slate-500">·</span>
          <span className="ml-2 text-slate-400">Total trips: {totalTrips}</span>
        </div>
      )}

      {/* Monthly earnings chart */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly earnings (₹)
        </p>
        <MiniBarChart data={monthlyEarnings} color="emerald" />
      </GlassCard>

      {/* Monthly trips chart */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly trips
        </p>
        <MiniBarChart data={monthlyTrips} color="orange" />
      </GlassCard>

      {/* Performance metrics */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Compliance & performance
        </p>
        <div className="space-y-3">
          {PERF_METRICS.map((m) => (
            <div key={m.label}>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-slate-400">{m.label}</span>
                <span className="font-bold text-white">{m.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-${m.color} transition-all`}
                  style={{ width: `${m.bar * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Trip history */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Trip history
        </p>
        {completedTrips.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-600">
            Complete trips to see your history here.
          </p>
        ) : (
          <div className="space-y-2">
            {completedTrips.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between rounded-xl border border-white/[0.06] bg-[#0a1020]/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1 text-xs text-slate-400">
                  <p className="truncate text-slate-300">
                    {t.pickup} → {t.dropoff}
                  </p>
                  <p className="mt-0.5 text-[10px]">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    · {t.distanceKm} km · {t.vehicleType}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-sm font-bold text-emerald-400">₹{t.fare}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

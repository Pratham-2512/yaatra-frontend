'use client';

import { useMemo } from 'react';
import { getTrips } from '@/lib/localAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import { useRide } from '@/context/RideContext';
import { useAuth } from '@/context/AuthContext';

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart({
  data,
  grad = 'from-emerald-500 to-cyan-400',
}: {
  data: { label: string; value: number }[];
  grad?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
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

// ── Performance metrics ───────────────────────────────────────────────────────

const PERF = [
  { label: 'Acceptance rate', value: '94%', bar: 0.94, cls: 'bg-emerald-500' },
  { label: 'On-time arrival',  value: '88%', bar: 0.88, cls: 'bg-cyan-500'   },
  { label: 'Completion rate',  value: '97%', bar: 0.97, cls: 'bg-orange-500' },
  { label: 'Cancellation rate',value: '6%',  bar: 0.06, cls: 'bg-rose-500'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isWithinDays(dateStr: string, days: number): boolean {
  return Date.now() - new Date(dateStr).getTime() < days * 86_400_000;
}

function earningSummaryRow(label: string, amount: number, trips: number) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#0a1020]/50 px-3 py-2.5">
      <div>
        <p className="text-xs text-slate-300">{label}</p>
        <p className="mt-0.5 text-[10px] text-slate-600">{trips} trip{trips !== 1 ? 's' : ''}</p>
      </div>
      <p className="text-sm font-bold text-emerald-400">₹{amount}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DriverDashboard({ tabBar }: { tabBar?: React.ReactNode }) {
  const { driverState } = useRide();
  const { session, profile } = useAuth();
  const allTrips = useMemo(() => getTrips(session ?? ''), [session]);
  const completedTrips = useMemo(() => allTrips.filter((t) => t.status === 'completed'), [allTrips]);
  const cancelledTrips = useMemo(() => allTrips.filter((t) => t.status === 'cancelled'), [allTrips]);

  // Earnings aggregates
  const historicalTotal = useMemo(() => completedTrips.reduce((s, t) => s + t.fare, 0), [completedTrips]);
  const todayEarnings   = driverState.earnings; // current session
  const totalEarnings   = historicalTotal + todayEarnings;
  const totalTrips      = completedTrips.length + driverState.tripsToday;

  const weekEarnings = useMemo(() => {
    const earned = completedTrips.filter((t) => isWithinDays(t.createdAt, 7)).reduce((s, t) => s + t.fare, 0);
    return earned + (isWithinDays(new Date().toISOString(), 7) ? todayEarnings : 0);
  }, [completedTrips, todayEarnings]);

  const weekTrips = useMemo(
    () => completedTrips.filter((t) => isWithinDays(t.createdAt, 7)).length + driverState.tripsToday,
    [completedTrips, driverState.tripsToday]
  );

  const monthEarnings = useMemo(() => {
    const now = new Date();
    const earned = completedTrips.filter((t) => {
      const td = new Date(t.createdAt);
      return td.getFullYear() === now.getFullYear() && td.getMonth() === now.getMonth();
    }).reduce((s, t) => s + t.fare, 0);
    return earned + todayEarnings;
  }, [completedTrips, todayEarnings]);

  const monthTrips = useMemo(() => {
    const now = new Date();
    return completedTrips.filter((t) => {
      const td = new Date(t.createdAt);
      return td.getFullYear() === now.getFullYear() && td.getMonth() === now.getMonth();
    }).length + driverState.tripsToday;
  }, [completedTrips, driverState.tripsToday]);

  const totalDistanceKm = useMemo(
    () => completedTrips.reduce((s, t) => s + parseFloat(String(t.distanceKm) || '0'), 0).toFixed(1),
    [completedTrips]
  );

  const avgEarningPerTrip = totalTrips > 0 ? Math.round(totalEarnings / totalTrips) : 0;

  // Monthly chart data (last 6 months)
  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const isCurrent = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      const hist = completedTrips
        .filter((t) => { const td = new Date(t.createdAt); return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth(); })
        .reduce((s, t) => s + t.fare, 0);
      return { label: d.toLocaleString('en-IN', { month: 'short' }), value: isCurrent ? hist + todayEarnings : hist };
    });
  }, [completedTrips, todayEarnings]);

  const monthlyTripsData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const isCurrent = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      const cnt = completedTrips.filter((t) => { const td = new Date(t.createdAt); return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth(); }).length;
      return { label: d.toLocaleString('en-IN', { month: 'short' }), value: isCurrent ? cnt + driverState.tripsToday : cnt };
    });
  }, [completedTrips, driverState.tripsToday]);

  return (
    <div className="scrollbar-thin z-10 flex h-full w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] p-4 lg:max-w-md lg:border-l lg:border-t-0">
      {tabBar}

      {/* Header */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
          Driver dashboard
        </p>
        <h2 className="text-base font-bold text-white">
          {profile?.full_name ?? 'Driver'} — Performance
        </h2>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiWidget label="Total earnings"    value={`₹${totalEarnings}`}      accent="orange" />
        <KpiWidget label="Total trips"       value={totalTrips}                accent="cyan"   />
        <KpiWidget label="Avg rating"        value={`★ ${driverState.rating}`} accent="emerald" />
        <KpiWidget label="Cancelled"         value={cancelledTrips.length}     accent="rose"   />
      </div>

      {/* Earning summary: today / week / month */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Earnings breakdown
        </p>
        <div className="space-y-2">
          {earningSummaryRow('Today (session)', todayEarnings, driverState.tripsToday)}
          {earningSummaryRow('This week',        weekEarnings,  weekTrips)}
          {earningSummaryRow('This month',       monthEarnings, monthTrips)}
          {earningSummaryRow('All time',         totalEarnings, totalTrips)}
        </div>
        {avgEarningPerTrip > 0 && (
          <p className="mt-3 text-center text-[10px] text-slate-600">
            Avg per trip: <span className="font-bold text-slate-400">₹{avgEarningPerTrip}</span>
          </p>
        )}
      </GlassCard>

      {/* Distance covered */}
      <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Distance covered</p>
          <p className="mt-0.5 text-xl font-bold text-cyan-400">{totalDistanceKm} km</p>
        </div>
        <span className="text-3xl opacity-30">🛣️</span>
      </div>

      {/* Charts */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly earnings (₹)
        </p>
        <BarChart data={monthlyEarnings} grad="from-emerald-500 to-cyan-400" />
      </GlassCard>

      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Monthly trips
        </p>
        <BarChart data={monthlyTripsData} grad="from-orange-500 to-amber-400" />
      </GlassCard>

      {/* Performance metrics */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Performance metrics
        </p>
        <div className="space-y-3">
          {PERF.map((m) => (
            <div key={m.label}>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-slate-400">{m.label}</span>
                <span className="font-bold text-white">{m.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${m.cls} transition-all`} style={{ width: `${m.bar * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Trip history */}
      <GlassCard className="p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Recent trip history
        </p>
        {completedTrips.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="text-3xl opacity-20">🚗</span>
            <p className="text-xs text-slate-600">Complete trips to see history here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedTrips.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between rounded-xl border border-white/[0.06] bg-[#0a1020]/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-300">
                    {t.pickup} → {t.dropoff}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' · '}{t.distanceKm} km · {t.vehicleType}
                  </p>
                </div>
                <p className="ml-3 shrink-0 text-sm font-bold text-emerald-400">₹{t.fare}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

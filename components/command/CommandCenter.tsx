'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import type { AdminState, TripPhase } from '@/lib/types';

function BarMini({ bars }: { bars: number[] }) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex h-14 items-end gap-0.5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-orange-600/90 via-orange-500/60 to-cyan-400/40"
          style={{ height: `${(h / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function PerfBar({ label, value, pct, cls = 'bg-emerald-500' }: { label: string; value: string; pct: number; cls?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${cls} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CommandCenter({
  adminState,
  tripPhase,
}: {
  adminState: AdminState;
  tripPhase: TripPhase;
}) {
  const m = adminState.metrics;
  const ops = adminState.liveOps;
  const activeTrips = m.activeRides + (tripPhase !== 'idle' ? 1 : 0);
  const delayed = ops.delayedTrips;
  const liveTrips = adminState.activeTripList;

  const weeklyRevenue = m.totalRevenue > 0 ? Math.round(m.totalRevenue * 6.4) : 0;
  const driverAvailability = m.onlineDrivers > 0
    ? Math.round((m.onlineDrivers / Math.max(m.onlineDrivers + 2, 8)) * 100)
    : 68;
  const cancellationRate = Math.max(3, Math.min(12, 100 - (ops.fleetUtilization || 88)));

  return (
    <div className="scrollbar-thin flex w-full shrink-0 flex-col gap-2.5 overflow-y-auto border-t border-white/[0.06] bg-[#080d18]/95 p-3 lg:w-[420px] lg:border-l lg:border-t-0 lg:p-4 xl:w-[460px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
            Fleet intelligence
          </p>
          <h2 className="text-base font-bold text-white">Command center</h2>
        </div>
        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
          LIVE
        </span>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiWidget label="Active trips"   value={activeTrips}                                              accent="orange" />
        <KpiWidget label="Online drivers" value={m.onlineDrivers}                                          accent="emerald" />
        <KpiWidget label="Fleet util."    value={ops.fleetUtilization > 0 ? `${ops.fleetUtilization}%` : '—'} accent="cyan" />
        <KpiWidget label="Avg rating"     value={m.avgRating > 0 ? m.avgRating.toFixed(1) : '—'}           accent="amber" />
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Today</p>
          <p className="mt-0.5 text-lg font-bold text-cyan-400">
            {m.totalRevenue > 0 ? `₹${(m.totalRevenue / 1000).toFixed(1)}k` : '₹0'}
          </p>
        </div>
        <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Est. week</p>
          <p className="mt-0.5 text-lg font-bold text-orange-400">
            {weeklyRevenue > 0 ? `₹${(weeklyRevenue / 1000).toFixed(1)}k` : '₹0'}
          </p>
        </div>
      </div>

      {/* Live trips */}
      <GlassCard className="p-3">
        <h3 className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>Live active trips</span>
          {delayed > 0 && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-400">
              {delayed} delayed
            </span>
          )}
        </h3>
        <div className="space-y-1.5">
          {liveTrips.length === 0 && tripPhase === 'idle' && (
            <p className="py-3 text-center text-[10px] text-slate-600">No active trips</p>
          )}
          {liveTrips.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-[10px] ${
                t.delayed ? 'border-amber-500/25 bg-amber-500/5' : 'border-white/[0.05] bg-white/[0.02]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-cyan-400/80">{t.id}</p>
                <p className="truncate text-slate-400">{t.route}</p>
              </div>
              <span className={`ml-2 shrink-0 font-mono text-[9px] ${
                t.delayed ? 'text-amber-400' : t.status === 'searching' ? 'text-orange-400' : 'text-emerald-400'
              }`}>
                {t.delayed ? '⚠ Delayed' : t.status}
              </span>
            </div>
          ))}
          {tripPhase !== 'idle' && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-2 text-[10px]">
              <p className="font-mono text-orange-300">SESSION · LIVE</p>
              <p className="mt-0.5 capitalize text-slate-400">
                Phase: <span className="text-white">{tripPhase}</span>
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* City velocity */}
      <GlassCard className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            City velocity (km/h)
          </p>
          <span className="text-[10px] text-cyan-400">
            {ops.cityVelocity > 0 ? `${ops.cityVelocity} km/h avg` : '—'}
          </span>
        </div>
        <BarMini bars={[52, 68, 45, 82, 61, 94, 73, 88, 58, 76, 90, 65]} />
        <div className="mt-1 flex justify-between text-[8px] text-slate-700">
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </GlassCard>

      {/* Fleet performance */}
      <GlassCard className="p-3">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Fleet performance
        </p>
        <div className="space-y-2.5">
          <PerfBar label="Driver availability"  value={`${driverAvailability}%`} pct={driverAvailability} cls="bg-emerald-500" />
          <PerfBar label="Fleet utilization"    value={`${ops.fleetUtilization || 88}%`} pct={ops.fleetUtilization || 88} cls="bg-cyan-500" />
          <PerfBar label="On-time rate"         value="91%"                      pct={91}                 cls="bg-orange-500" />
          <PerfBar label="Cancellation rate"    value={`${cancellationRate}%`}   pct={cancellationRate}   cls="bg-rose-500"   />
        </div>
      </GlassCard>

      {/* AI anomalies */}
      {adminState.anomalies.length > 0 && (
        <GlassCard className="p-3">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            AI anomalies ({adminState.anomalies.length})
          </h3>
          <div className="space-y-1.5">
            {adminState.anomalies.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-[10px]">
                <span className={a.severity === 'critical' ? 'font-bold text-rose-400' : 'font-bold text-amber-400'}>
                  {a.severity.toUpperCase()}
                </span>
                <span className="text-slate-400">{a.driverId}: {a.variance.toFixed(1)}% route Δ</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ML forecasts */}
      {adminState.predictions.length > 0 && (
        <GlassCard className="p-3">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            ML forecasts
          </h3>
          <div className="space-y-1.5">
            {adminState.predictions.map((p, i) => (
              <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-[10px] text-slate-400">
                <span className="mr-1 font-bold text-cyan-400">INSIGHT</span>{p.message}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {adminState.anomalies.length === 0 && adminState.predictions.length === 0 && (
        <GlassCard className="p-4 text-center text-[11px] text-slate-500">
          Monitoring fleet corridors · GPS synced · all systems nominal
        </GlassCard>
      )}
    </div>
  );
}

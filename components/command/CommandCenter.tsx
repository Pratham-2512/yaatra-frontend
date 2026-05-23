'use client';

import { useRide } from '@/context/RideContext';
import { MapPanel } from '@/components/map/MapPanel';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import { DEMO_OPS } from '@/lib/constants';
import { DEMO_ACTIVE_TRIPS } from '@/mock/fleet';
import type { AdminState, TripPhase } from '@/lib/types';

export function CommandCenter({
  adminState,
  tripPhase,
}: {
  adminState: AdminState;
  tripPhase: TripPhase;
}) {
  const { route, pickupCoords, dropoffCoords, driverMapPosition } = useRide();
  const m = adminState.metrics;
  const ops = adminState.liveOps;
  const activeTrips = Math.max(m.activeRides, DEMO_OPS.activeTrips, tripPhase !== 'idle' ? 1 : 0);
  const utilization = ops.fleetUtilization || DEMO_OPS.fleetUtilization;
  const delayed = ops.delayedTrips || DEMO_OPS.delayedRides;
  const liveTrips =
    adminState.activeTripList.length > 0 ? adminState.activeTripList : DEMO_ACTIVE_TRIPS;

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="relative min-h-[240px] flex-1 lg:min-h-0">
        <MapPanel
          mode="command"
          showRoute={route.length > 0}
          routeCoords={route.length ? route : undefined}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          driverPosition={driverMapPosition}
          showFleet
          showHeatmap
          showHotspots
          className="absolute inset-0 h-full"
        />
        <div className="pointer-events-none absolute left-3 top-3 hidden lg:block">
          <GlassCard className="px-3 py-2 text-[10px]">
            <p className="font-bold text-cyan-400">Mobility war room</p>
            <p className="text-slate-500">Heatmap · Congestion · Live GPS</p>
          </GlassCard>
        </div>
      </div>

      <div className="scrollbar-thin flex w-full flex-col gap-2.5 overflow-y-auto border-t border-white/[0.06] bg-[#080d18]/95 p-3 lg:w-[400px] lg:border-l lg:border-t-0 lg:p-4 xl:w-[440px]">
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

        <div className="grid grid-cols-2 gap-2">
          <KpiWidget label="Active trips" value={activeTrips} accent="orange" trend="↑" />
          <KpiWidget
            label="Revenue"
            value={`₹${(m.totalRevenue / 1000 || 128).toFixed(0)}k`}
            accent="cyan"
          />
          <KpiWidget label="Fleet util." value={`${utilization}%`} accent="emerald" />
          <KpiWidget label="Online drivers" value={m.onlineDrivers || 312} accent="cyan" />
        </div>

        <GlassCard className="p-3">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Live active trips
          </h3>
          <div className="space-y-1.5">
            {liveTrips.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-[10px] ${
                  t.delayed
                    ? 'border-amber-500/25 bg-amber-500/5'
                    : 'border-white/[0.05] bg-white/[0.02]'
                }`}
              >
                <div>
                  <p className="font-mono text-cyan-400/80">{t.id}</p>
                  <p className="text-slate-400">{t.route}</p>
                </div>
                <span
                  className={
                    t.delayed
                      ? 'text-amber-400'
                      : t.status === 'searching' || t.status === 'matching'
                        ? 'text-orange-400'
                        : 'text-emerald-400'
                  }
                >
                  {t.delayed ? 'Delayed' : t.status}
                </span>
              </div>
            ))}
            {tripPhase !== 'idle' && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-2.5 py-2 text-[10px]">
                <p className="font-mono text-orange-300">SESSION</p>
                <p className="text-slate-400 capitalize">Phase: {tripPhase}</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="border-amber-500/15 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400">Congestion alerts</h3>
            <span className="text-sm font-bold text-amber-300">{delayed}</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">MG Road · Cyber Hub · peak +18%</p>
        </GlassCard>

        <GlassCard className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              City velocity
            </p>
            <span className="text-[10px] text-cyan-400">{ops.cityVelocity || DEMO_OPS.cityVelocity} km/h</span>
          </div>
          <div className="flex h-14 items-end gap-0.5">
            {[52, 68, 45, 82, 61, 94, 73, 88, 58, 76, 90, 65].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-orange-600/90 via-orange-500/60 to-cyan-400/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </GlassCard>

        {adminState.anomalies.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-xs font-bold text-amber-400">AI anomalies</h3>
            {adminState.anomalies.map((a, i) => (
              <GlassCard key={i} className="mb-1.5 p-2.5 text-[10px]">
                <span className={a.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}>
                  {a.severity.toUpperCase()}
                </span>
                <p className="mt-1 text-slate-400">
                  {a.driverId}: {a.variance.toFixed(1)}% route Δ
                </p>
              </GlassCard>
            ))}
          </section>
        )}

        {adminState.predictions.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-xs font-bold text-cyan-400">ML forecasts</h3>
            {adminState.predictions.map((p, i) => (
              <GlassCard key={i} className="mb-1.5 p-2.5 text-[10px] text-slate-400">
                <span className="font-bold text-cyan-400">INSIGHT </span>
                {p.message}
              </GlassCard>
            ))}
          </section>
        )}

        {adminState.anomalies.length === 0 && adminState.predictions.length === 0 && (
          <GlassCard className="p-4 text-center text-[11px] text-slate-500">
            Monitoring 6 NCR corridors · fleet GPS synced
          </GlassCard>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRide } from '@/context/RideContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { KpiWidget } from '@/components/ui/KpiWidget';
import { btnPrimary } from '@/components/ui/styles';
import { DEMAND_ZONES } from '@/lib/geo';
import { ChatToggleButton } from '@/components/chat/TripChat';

export function DriverHome({ tabBar }: { tabBar?: React.ReactNode }) {
  const { driverState, toggleOnline, acceptRide, rejectRide } = useRide();

  return (
    <div className="scrollbar-thin flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] p-3 md:p-4 lg:w-80 lg:border-l lg:border-t-0 lg:p-4">
      {tabBar}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/90">
            Fleet partner
          </p>
          <h2 className="text-base font-bold text-white">Raj Kumar</h2>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
            driverState.online
              ? 'bg-emerald-500/15 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.25)] ring-1 ring-emerald-500/40'
              : 'border border-white/10 bg-white/[0.04] text-slate-500'
          }`}
        >
          {driverState.online ? '● Online' : 'Go online'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <KpiWidget label="Earnings" value={`₹${driverState.earnings}`} accent="cyan" trend="+12%" />
        <KpiWidget label="Trips" value={driverState.tripsToday} accent="orange" />
        <KpiWidget label="Score" value={driverState.rating} accent="emerald" />
      </div>

      <GlassCard className="p-4">
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Live demand zones
        </h3>
        <div className="space-y-2">
          {DEMAND_ZONES.map((z) => (
            <div
              key={z.name}
              className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#0a1020]/50 px-3 py-2"
            >
              <span className="text-xs text-slate-300">{z.name}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-cyan-400"
                    style={{ width: `${z.intensity * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-cyan-400">
                  {Math.round(z.intensity * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {driverState.incomingRides.length > 0 && (
        <GlassCard className="animate-slide-up border-orange-500/25 p-4 ring-1 ring-orange-500/15">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Incoming · synced with rider
          </h3>
          {driverState.incomingRides.map((ride) => (
            <div key={ride.id} className="space-y-3">
              <div className="text-xs text-slate-400">
                <p>📍 {ride.pickup}</p>
                <p className="mt-1">🎯 {ride.dropoff}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded-md bg-white/5 px-2 py-0.5">{ride.distance} km</span>
                <span className="rounded-md bg-orange-500/15 px-2 py-0.5 font-bold text-orange-300">
                  {ride.fare}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => rejectRide(ride.id)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/10"
                >
                  Decline
                </button>
                <button type="button" onClick={() => acceptRide(ride.id)} className={`${btnPrimary} flex-[2]`}>
                  Accept ride
                </button>
              </div>
            </div>
          ))}
        </GlassCard>
      )}

      {driverState.online && !driverState.incomingRides.length && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-300">Scanning for ride requests…</p>
              <p className="mt-0.5 text-[10px] text-slate-600">
                A ride request will arrive shortly. Stay online to accept.
              </p>
            </div>
          </div>
          <div className="mt-3 h-px bg-white/[0.05]" />
          <p className="mt-2.5 text-center text-[9px] text-slate-700">
            Tip: ride requests arrive within 7–12 seconds of going online
          </p>
        </GlassCard>
      )}
    </div>
  );
}

export function DriverPickup() {
  const { driverState, driverStartTrip } = useRide();
  const ride = driverState.acceptedRide;
  if (!ride) return null;

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            Navigate to pickup
          </p>
          <p className="mt-0.5 text-sm text-slate-300">
            Passenger: <span className="text-white">{ride.passenger}</span>
          </p>
        </div>
        <ChatToggleButton />
      </div>
      <div className="mb-4 text-xs text-slate-400">
        <p>📍 {ride.pickup}</p>
        <p className="mt-1">🎯 {ride.dropoff}</p>
      </div>
      <button type="button" onClick={driverStartTrip} className={btnPrimary}>
        Passenger onboard — start trip
      </button>
    </GlassCard>
  );
}

export function DriverInTrip() {
  const { driverState, completeDriverTrip } = useRide();
  const ride = driverState.acceptedRide;

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Trip active · synced
        </p>
        <ChatToggleButton />
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
          style={{ width: `${Math.min(driverState.progress, 100)}%` }}
        />
      </div>
      <div className="mb-3 text-xs text-slate-400">
        <p>📍 {ride?.pickup}</p>
        <p className="mt-1">🎯 {ride?.dropoff}</p>
      </div>
      <button type="button" onClick={completeDriverTrip} className={btnPrimary}>
        Complete trip
      </button>
    </GlassCard>
  );
}

'use client';

import { useRide } from '@/context/RideContext';
import { GpsStatusChip, LoadingBar } from '@/components/common/StatusChip';
import { MapPanel } from '@/components/map/MapPanel';
import { GlassCard } from '@/components/ui/GlassCard';
import { btnGhost, btnPrimary, inputField, labelCaps } from '@/components/ui/styles';
import { useMapProps } from '@/hooks/useMapProps';
import { VEHICLE_TYPES } from '@/lib/constants';
import { VEHICLE_PRICING, getVehicleQuote } from '@/services/pricing';

export function RiderHome() {
  const {
    riderState,
    setRiderState,
    estimateFare,
    isEstimating,
    gpsStatus,
    route,
    routeSource,
  } = useRide();
  const mapProps = useMapProps('rider');
  const dist = route.length ? parseFloat(riderState.distance ?? '5') || 5 : 5;

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <MapPanel {...mapProps} className="lg:min-h-0 lg:flex-[1.2]" />
      <GlassCard className="animate-slide-up z-10 flex shrink-0 flex-col border-t border-white/10 p-4 lg:max-w-md lg:border-l lg:border-t-0 lg:p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
              NCR · Live pricing
            </p>
            <h2 className="text-base font-bold text-white">Plan your trip</h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <GpsStatusChip status={gpsStatus} />
            {routeSource === 'simulated' && route.length > 0 && (
              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] text-cyan-300">
                NCR fallback route
              </span>
            )}
          </div>
        </div>
        <LoadingBar active={isEstimating} />

        <div className="relative mb-3 mt-3 pl-4">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-orange-500 via-cyan-500/50 to-cyan-400" />
          <div className="relative mb-3">
            <span className="absolute -left-4 top-3 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(255,107,53,0.8)]" />
            <label className={labelCaps}>Pickup</label>
            <input
              type="text"
              placeholder="Sector 22, Cyber Hub…"
              value={riderState.pickup}
              onChange={(e) => setRiderState((p) => ({ ...p, pickup: e.target.value }))}
              className={inputField}
            />
          </div>
          <div className="relative">
            <span className="absolute -left-4 top-3 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
            <label className={labelCaps}>Dropoff</label>
            <input
              type="text"
              placeholder="Huda City Center, Sector 43…"
              value={riderState.dropoff}
              onChange={(e) => setRiderState((p) => ({ ...p, dropoff: e.target.value }))}
              className={inputField}
            />
          </div>
        </div>

        <p className={`${labelCaps} mb-2`}>Select vehicle</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {VEHICLE_TYPES.map((type) => {
            const p = VEHICLE_PRICING[type];
            const active = riderState.vehicleType === type;
            const quote = getVehicleQuote(type, dist);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setRiderState((s) => ({ ...s, vehicleType: type }))}
                className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${
                  active
                    ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-transparent ring-1 ring-orange-500/30 shadow-lg shadow-orange-900/40 scale-[1.02]'
                    : 'border-white/[0.06] bg-[#0a1020]/60 hover:border-white/12'
                }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent animate-pulse" />
                )}
                <span className="relative text-xl">{p.icon}</span>
                <p className={`relative mt-1 text-xs font-bold ${active ? 'text-orange-100' : 'text-slate-300'}`}>
                  {p.label}
                </p>
                <p className="relative text-sm font-bold text-white">₹{quote.fare}</p>
                <p className="relative text-[10px] text-cyan-400/90">
                  {quote.etaMin} min · {quote.description}
                </p>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={estimateFare}
          disabled={isEstimating}
          className={btnPrimary}
        >
          {isEstimating ? 'Calculating route…' : 'Get fare estimate →'}
        </button>
      </GlassCard>
    </div>
  );
}

export function RiderConfirm() {
  const { riderState, bookRide, retryEstimate, isEstimating, resetToHome } = useRide();
  const mapProps = useMapProps('rider', 0);

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <MapPanel {...mapProps} />
      <GlassCard className="z-10 shrink-0 p-4 lg:max-w-md lg:border-l lg:p-5">
        <button type="button" onClick={resetToHome} className={`${btnGhost} mb-3 w-auto text-xs`}>
          ← Edit trip
        </button>
        <div className="mb-3 space-y-2 rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3 text-xs">
          <div className="flex gap-2 text-slate-300">
            <span className="text-orange-400">●</span>
            <span className="flex-1">{riderState.pickup}</span>
          </div>
          <div className="flex gap-2 text-slate-300">
            <span className="text-cyan-400">●</span>
            <span className="flex-1">{riderState.dropoff}</span>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-400">
            {riderState.distance} km
          </span>
          <span className="rounded-lg border border-cyan-500/20 px-2.5 py-1 text-cyan-300">
            ETA {riderState.duration} min
          </span>
        </div>
        <div className="mb-4 rounded-xl border border-orange-500/15 bg-gradient-to-br from-[#0f1629] to-[#0a1020] p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Fare estimate
          </p>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Base</span>
              <span>₹{riderState.fare?.base ?? 50}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance</span>
              <span>₹{riderState.fare?.distanceCharge ?? 0}</span>
            </div>
            {(riderState.fare?.surge ?? 0) > 0 && (
              <div className="flex justify-between text-amber-400/80">
                <span>Peak</span>
                <span>₹{riderState.fare?.surge}</span>
              </div>
            )}
          </div>
          <div className="my-3 h-px bg-white/10" />
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total</span>
            <span className="text-orange-400">₹{riderState.fare?.totalFare ?? 0}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={retryEstimate} className={`${btnGhost} flex-1 text-xs`}>
            Retry route
          </button>
          <button type="button" onClick={bookRide} disabled={isEstimating} className={`${btnPrimary} flex-[2]`}>
            Book ride
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

export function RiderSearching() {
  const { cancelSearch } = useRide();
  const mapProps = useMapProps('searching');

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <MapPanel {...mapProps} className="absolute inset-0" />
      <div className="relative z-10 flex flex-1 items-center justify-center p-6">
        <GlassCard className="max-w-sm p-8 text-center">
          <div className="relative mx-auto mb-6 h-24 w-24">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-cyan-500/20"
                style={{
                  animation: `pulse-ring 2s ease ${i * 0.4}s infinite`,
                  transform: `scale(${1 + i * 0.25})`,
                }}
              />
            ))}
            <div className="absolute inset-4 animate-spin-slow rounded-full border-2 border-orange-500/30 border-t-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-white">Finding your driver</h2>
          <p className="mt-2 text-sm text-slate-400">
            Broadcasting to 6 active zones · Gurgaon corridor
          </p>
          <button type="button" onClick={cancelSearch} className={`${btnGhost} mt-6`}>
            Cancel request
          </button>
        </GlassCard>
      </div>
    </div>
  );
}

export function RiderDriverArriving() {
  const { riderState, startTrip } = useRide();
  const mapProps = useMapProps('rider', 12);
  const driver = riderState.driver;
  if (!driver) return null;

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <MapPanel {...mapProps} />
      <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Driver assigned
        </p>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/40 to-cyan-500/20 text-xl font-bold ring-1 ring-white/10">
            {driver.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-white">{driver.name}</h3>
            <p className="text-xs text-slate-400">
              ⭐ {driver.rating} · {driver.vehicle}
            </p>
            <p className="mt-1 text-lg font-bold text-amber-400">{driver.eta} min ETA</p>
          </div>
        </div>
        <p className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-center text-xs text-cyan-200">
          Live vehicle movement on map
        </p>
        <button type="button" onClick={startTrip} className={btnPrimary}>
          I&apos;m here — start ride
        </button>
      </GlassCard>
    </div>
  );
}

export function RiderInTrip() {
  const { riderState } = useRide();
  const mapProps = useMapProps('trip', riderState.progress);
  const driver = riderState.driver;
  if (!driver) return null;

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <MapPanel {...mapProps} />
      <GlassCard className="z-10 shrink-0 p-4 lg:max-w-xs lg:border-l lg:p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          Trip in progress
        </p>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-orange-400 transition-all duration-700"
            style={{ width: `${Math.min(riderState.progress, 100)}%` }}
          />
        </div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 font-bold">
            {driver.name[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">{driver.name}</p>
            <p className="text-xs text-slate-500">{Math.round(riderState.progress)}% complete</p>
          </div>
          <span className="text-lg font-bold text-orange-400">₹{riderState.fare?.totalFare ?? 0}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {['Call', 'Chat', 'SOS'].map((a) => (
            <button
              key={a}
              type="button"
              className="rounded-lg border border-white/10 py-2.5 text-[10px] font-semibold text-slate-400"
            >
              {a}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function RiderPayment() {
  const { riderState, completePayment } = useRide();

  return (
    <div className="flex h-full items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white">Payment summary</h2>
        <p className="text-xs text-slate-500">UPI · Cards · Corporate wallet</p>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Distance</span>
            <span className="text-white">{riderState.distance} km</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Duration</span>
            <span className="text-white">{riderState.duration} min</span>
          </div>
        </div>
        <div className="my-4 h-px bg-white/10" />
        <div className="mb-6 flex justify-between text-xl font-bold">
          <span className="text-white">Paid</span>
          <span className="text-orange-400">₹{riderState.fare?.totalFare ?? 0}</span>
        </div>
        <button type="button" onClick={completePayment} className={btnPrimary}>
          Continue to rating
        </button>
      </GlassCard>
    </div>
  );
}

export function RiderRating() {
  const { riderState, setRiderState, submitRating } = useRide();
  const driver = riderState.driver;
  if (!driver) return null;

  return (
    <div className="flex h-full items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <h2 className="text-lg font-bold text-white">Rate your trip</h2>
        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/40 to-cyan-500/20 text-2xl font-bold">
          {driver.name[0]}
        </div>
        <p className="mt-2 text-slate-300">{driver.name}</p>
        <div className="mt-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRiderState((p) => ({ ...p, rating: star }))}
              className="text-2xl transition hover:scale-110"
            >
              {star <= riderState.rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <textarea
          placeholder="Fleet quality feedback…"
          value={riderState.feedback}
          onChange={(e) => setRiderState((p) => ({ ...p, feedback: e.target.value }))}
          className={`${inputField} mt-5 min-h-[80px] resize-none`}
        />
        <button type="button" onClick={submitRating} className={`${btnPrimary} mt-4`}>
          Submit
        </button>
      </GlassCard>
    </div>
  );
}

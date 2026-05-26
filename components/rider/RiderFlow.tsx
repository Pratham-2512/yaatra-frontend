'use client';

import { useRide } from '@/context/RideContext';

import {
  GpsStatusChip,
  LoadingBar,
} from '@/components/common/StatusChip';

import {
  GlassCard,
} from '@/components/ui/GlassCard';

import {
  btnGhost,
  btnPrimary,
  inputField,
  labelCaps,
} from '@/components/ui/styles';

import {
  VEHICLE_TYPES,
} from '@/lib/constants';

import {
  VEHICLE_PRICING,
  getVehicleQuote,
} from '@/services/pricing';

export function RiderHome() {
  const {
    riderState,
    setRiderState,
    estimateFare,
    isEstimating,
    gpsStatus,
  } = useRide();

  const dist =
    parseFloat(
      riderState.distance ?? '5'
    ) || 5;

  return (
    <GlassCard className="animate-slide-up z-10 flex shrink-0 flex-col border-t border-white/10 p-4 lg:max-w-md lg:border-l lg:border-t-0 lg:p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
            NCR · Live pricing
          </p>

          <h2 className="text-base font-bold text-white">
            Plan your trip
          </h2>
        </div>

        <GpsStatusChip
          status={gpsStatus}
        />
      </div>

      <LoadingBar
        active={isEstimating}
      />

      <div className="relative mb-3 mt-3 pl-4">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-orange-500 via-cyan-500/50 to-cyan-400" />

        <div className="relative mb-3">
          <span className="absolute -left-4 top-3 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(255,107,53,0.8)]" />

          <label className={labelCaps}>
            Pickup
          </label>

          <input
            type="text"
            placeholder="Sector 22, Gurgaon"
            value={
              riderState.pickup
            }
            onChange={(e) =>
              setRiderState(
                (p) => ({
                  ...p,
                  pickup:
                    e.target.value,
                })
              )
            }
            className={inputField}
          />
        </div>

        <div className="relative">
          <span className="absolute -left-4 top-3 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />

          <label className={labelCaps}>
            Dropoff
          </label>

          <input
            type="text"
            placeholder="Sector 18, Gurgaon"
            value={
              riderState.dropoff
            }
            onChange={(e) =>
              setRiderState(
                (p) => ({
                  ...p,
                  dropoff:
                    e.target.value,
                })
              )
            }
            className={inputField}
          />
        </div>
      </div>

      <p className={`${labelCaps} mb-2`}>
        Select vehicle
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {VEHICLE_TYPES.map(
          (type) => {
            const p =
              VEHICLE_PRICING[
                type
              ];

            const active =
              riderState.vehicleType ===
              type;

            const quote =
              getVehicleQuote(
                type,
                dist
              );

            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setRiderState(
                    (s) => ({
                      ...s,
                      vehicleType:
                        type,
                    })
                  )
                }
                className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${
                  active
                    ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-transparent ring-1 ring-orange-500/30 shadow-lg shadow-orange-900/40 scale-[1.02]'
                    : 'border-white/[0.06] bg-[#0a1020]/60 hover:border-white/12'
                }`}
              >
                <span className="relative text-xl">
                  {p.icon}
                </span>

                <p className="relative mt-1 text-xs font-bold text-slate-300">
                  {p.label}
                </p>

                <p className="relative text-sm font-bold text-white">
                  ₹{quote.fare}
                </p>

                <p className="relative text-[10px] text-cyan-400/90">
                  {
                    quote.etaMin
                  }{' '}
                  min ·{' '}
                  {
                    quote.description
                  }
                </p>
              </button>
            );
          }
        )}
      </div>

      <button
        type="button"
        onClick={estimateFare}
        disabled={isEstimating}
        className={btnPrimary}
      >
        {isEstimating
          ? 'Calculating route…'
          : 'Get fare estimate →'}
      </button>
    </GlassCard>
  );
}

export function RiderConfirm() {
  const {
    riderState,
    bookRide,
    retryEstimate,
    isEstimating,
    resetToHome,
  } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-md lg:border-l lg:p-5">
      <button
        type="button"
        onClick={resetToHome}
        className={`${btnGhost} mb-3 w-auto text-xs`}
      >
        ← Edit trip
      </button>

      <div className="mb-3 space-y-2 rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3 text-xs">
        <div className="flex gap-2 text-slate-300">
          <span className="text-orange-400">
            ●
          </span>

          <span className="flex-1">
            {
              riderState.pickup
            }
          </span>
        </div>

        <div className="flex gap-2 text-slate-300">
          <span className="text-cyan-400">
            ●
          </span>

          <span className="flex-1">
            {
              riderState.dropoff
            }
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-400">
          {
            riderState.distance
          }{' '}
          km
        </span>

        <span className="rounded-lg border border-cyan-500/20 px-2.5 py-1 text-cyan-300">
          ETA{' '}
          {
            riderState.duration
          }{' '}
          min
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-orange-500/15 bg-gradient-to-br from-[#0f1629] to-[#0a1020] p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Fare estimate
        </p>

        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Base</span>

            <span>
              ₹
              {
                riderState.fare
                  ?.base ??
                  50
              }
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              Distance
            </span>

            <span>
              ₹
              {
                riderState.fare
                  ?.distanceCharge ??
                  0
              }
            </span>
          </div>
        </div>

        <div className="my-3 h-px bg-white/10" />

        <div className="flex justify-between text-lg font-bold text-white">
          <span>Total</span>

          <span className="text-orange-400">
            ₹
            {
              riderState.fare
                ?.totalFare ??
                0
            }
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={
            retryEstimate
          }
          className={`${btnGhost} flex-1 text-xs`}
        >
          Retry route
        </button>

        <button
          type="button"
          onClick={bookRide}
          disabled={
            isEstimating
          }
          className={`${btnPrimary} flex-[2]`}
        >
          Book ride
        </button>
      </div>
    </GlassCard>
  );
}

export function RiderSearching() {
  const { riderState, cancelSearch } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-400">
        Matching driver
      </p>
      <h2 className="mb-3 text-base font-bold text-white">Finding a nearby partner</h2>
      <LoadingBar active />
      <div className="my-4 space-y-2 rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3 text-xs text-slate-400">
        <p>{riderState.pickup}</p>
        <p>{riderState.dropoff}</p>
      </div>
      <button type="button" onClick={cancelSearch} className={btnGhost}>
        Cancel request
      </button>
    </GlassCard>
  );
}

export function RiderDriverArriving() {
  const { riderState, startTrip, cancelSearch } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
        Driver en route
      </p>
      <h2 className="text-base font-bold text-white">{riderState.driver?.name ?? 'Driver assigned'}</h2>
      <p className="mb-4 text-xs text-slate-400">
        {riderState.driver?.vehicle ?? 'Vehicle'} · {riderState.driver?.plate ?? 'Plate pending'}
      </p>
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3">
          <p className="text-slate-500">ETA</p>
          <p className="font-bold text-white">{riderState.driver?.eta ?? 4} min</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3">
          <p className="text-slate-500">Rating</p>
          <p className="font-bold text-white">{riderState.driver?.rating ?? 4.9}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={cancelSearch} className={`${btnGhost} flex-1 text-xs`}>
          Cancel
        </button>
        <button type="button" onClick={startTrip} className={`${btnPrimary} flex-[2]`}>
          Start trip
        </button>
      </div>
    </GlassCard>
  );
}

export function RiderInTrip() {
  const { riderState } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
        Trip active
      </p>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
          style={{ width: `${Math.min(riderState.progress, 100)}%` }}
        />
      </div>
      <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#0a1020]/50 p-3 text-xs text-slate-400">
        <p>{riderState.pickup}</p>
        <p>{riderState.dropoff}</p>
      </div>
    </GlassCard>
  );
}

export function RiderPayment() {
  const { riderState, completePayment } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-400">
        Payment
      </p>
      <div className="mb-4 rounded-xl border border-orange-500/15 bg-[#0a1020]/60 p-4">
        <p className="text-xs text-slate-500">Trip total</p>
        <p className="text-2xl font-bold text-orange-400">₹{riderState.fare?.totalFare ?? 0}</p>
      </div>
      <button type="button" onClick={completePayment} className={btnPrimary}>
        Pay and continue
      </button>
    </GlassCard>
  );
}

export function RiderRating() {
  const { riderState, setRiderState, submitRating } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-5 lg:max-w-sm lg:border-l">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
        Rate your trip
      </p>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setRiderState((prev) => ({ ...prev, rating }))}
            className={`h-10 flex-1 rounded-xl border text-sm font-bold ${
              riderState.rating >= rating
                ? 'border-orange-500/50 bg-orange-500/20 text-orange-300'
                : 'border-white/10 bg-white/[0.04] text-slate-500'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <textarea
        value={riderState.feedback}
        onChange={(event) =>
          setRiderState((prev) => ({
            ...prev,
            feedback: event.target.value,
          }))
        }
        placeholder="Feedback"
        className={`${inputField} mb-3 min-h-24 resize-none`}
      />
      <button type="button" onClick={submitRating} className={btnPrimary}>
        Submit rating
      </button>
    </GlassCard>
  );
}

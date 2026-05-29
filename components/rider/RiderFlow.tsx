'use client';

import { useMemo, useState } from 'react';
import { useRide } from '@/context/RideContext';
import { ChatToggleButton } from '@/components/chat/TripChat';

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
  getSurgeFactor,
} from '@/services/pricing';

// ── Skeleton card shown while route is calculating ────────────────────────────
function VehicleCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/[0.06] bg-[#0a1020]/60 p-3">
      <div className="mb-2 h-6 w-7 rounded-lg bg-white/10" />
      <div className="mb-1.5 h-3 w-14 rounded bg-white/10" />
      <div className="mb-1 h-5 w-16 rounded bg-white/10" />
      <div className="h-3 w-24 rounded bg-white/10" />
    </div>
  );
}

export function RiderHome({ tabBar }: { tabBar?: React.ReactNode }) {
  const {
    riderState,
    setRiderState,
    estimateFare,
    isEstimating,
    gpsStatus,
  } = useRide();

  const hasPickup = riderState.pickup.trim().length > 0;
  const hasDropoff = riderState.dropoff.trim().length > 0;
  const bothLocations = hasPickup && hasDropoff;

  // Surge factor is read once per render — stable for the session duration.
  const surgeFactor = useMemo(() => getSurgeFactor(), []);
  const surgeActive = surgeFactor > 1;
  const surgeLabel = surgeFactor === 1.3 ? '6–10 PM peak' : '8–10 AM peak';

  return (
    <GlassCard className="animate-slide-up z-10 flex shrink-0 flex-col border-t border-white/10 p-4 lg:max-w-md lg:border-l lg:border-t-0 lg:p-5">
      {tabBar}

      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
            NCR · Live pricing
          </p>
          <h2 className="text-base font-bold text-white">Plan your trip</h2>
        </div>
        <GpsStatusChip status={gpsStatus} />
      </div>

      <LoadingBar active={isEstimating} />

      {/* Location inputs */}
      <div className="relative mb-3 mt-3 pl-4">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-orange-500 via-cyan-500/50 to-cyan-400" />

        <div className="relative mb-3">
          <span className="absolute -left-4 top-3 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(255,107,53,0.8)]" />
          <label className={labelCaps}>Pickup</label>
          <input
            type="text"
            placeholder="Sector 22, Gurgaon"
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
            placeholder="Cyber Hub, Gurgaon"
            value={riderState.dropoff}
            onChange={(e) => setRiderState((p) => ({ ...p, dropoff: e.target.value }))}
            className={inputField}
          />
        </div>
      </div>

      {/* Vehicle selector — only shown once both locations are filled */}
      {bothLocations ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className={labelCaps}>Select vehicle</p>
            {surgeActive && (
              <span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-400">
                ⚡ {surgeFactor}× surge · {surgeLabel}
              </span>
            )}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            {isEstimating
              ? VEHICLE_TYPES.map((t) => <VehicleCardSkeleton key={t} />)
              : VEHICLE_TYPES.map((type) => {
                  const p = VEHICLE_PRICING[type];
                  const active = riderState.vehicleType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRiderState((s) => ({ ...s, vehicleType: type }))}
                      className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 ${
                        active
                          ? 'scale-[1.03] border-orange-500/60 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent shadow-lg shadow-orange-900/40 ring-1 ring-orange-500/40'
                          : 'border-white/[0.06] bg-[#0a1020]/60 hover:scale-[1.01] hover:border-white/15 hover:bg-[#0a1020]/80'
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{p.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
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
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-center">
          <span className="mb-2 text-2xl opacity-40">🗺️</span>
          <p className="text-xs font-semibold text-slate-400">
            {!hasPickup && !hasDropoff
              ? 'Enter pickup & dropoff to see vehicles and fares'
              : !hasPickup
                ? 'Enter your pickup location'
                : 'Enter your dropoff location'}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">Fares are calculated after route is known</p>
        </div>
      )}
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

  const hasSurge = (riderState.fare?.surgeFactor ?? 1) > 1;

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-md lg:border-l lg:p-5">
      <button type="button" onClick={resetToHome} className={`${btnGhost} mb-3 w-auto text-xs`}>
        ← Edit trip
      </button>

      {/* Route summary */}
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

      {/* Distance + ETA chips */}
      <div className="mb-4 flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-400">
          {riderState.distance} km
        </span>
        <span className="rounded-lg border border-cyan-500/20 px-2.5 py-1 text-cyan-300">
          ETA {riderState.duration} min
        </span>
        {hasSurge && (
          <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 font-bold text-orange-400">
            ⚡ {riderState.fare?.surgeFactor}× surge
          </span>
        )}
      </div>

      {/* Fare breakdown */}
      <div className="mb-4 rounded-xl border border-orange-500/15 bg-gradient-to-br from-[#0f1629] to-[#0a1020] p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Fare estimate
        </p>

        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Base fare</span>
            <span>₹{riderState.fare?.base ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Distance ({riderState.distance} km)</span>
            <span>₹{riderState.fare?.distanceCharge ?? 0}</span>
          </div>
          {hasSurge && (
            <div className="flex justify-between text-orange-400/80">
              <span>Surge ({riderState.fare?.surgeFactor}×)</span>
              <span>+₹{riderState.fare?.surge ?? 0}</span>
            </div>
          )}
        </div>

        <div className="my-3 h-px bg-white/10" />

        <div className="flex justify-between text-lg font-bold text-white">
          <span>Total</span>
          <span className="text-orange-400">~₹{riderState.fare?.totalFare ?? 0}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={retryEstimate}
          className={`${btnGhost} flex-1 text-xs`}
        >
          Retry route
        </button>
        <button
          type="button"
          onClick={bookRide}
          disabled={isEstimating}
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
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            Driver en route
          </p>
          <h2 className="text-base font-bold text-white">
            {riderState.driver?.name ?? 'Driver assigned'}
          </h2>
          <p className="text-xs text-slate-400">
            {riderState.driver?.vehicle ?? 'Vehicle'} · {riderState.driver?.plate ?? 'Plate pending'}
          </p>
        </div>
        <ChatToggleButton />
      </div>
      <div className="mb-4 mt-3" />
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
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Trip active
        </p>
        <ChatToggleButton />
      </div>
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

type PayMethod = 'upi' | 'cash' | 'card' | 'wallet';

const PAY_METHODS: { id: PayMethod; label: string; icon: string; sub: string }[] = [
  { id: 'upi',    label: 'UPI',    icon: '📱', sub: 'PhonePe · GPay · Paytm' },
  { id: 'cash',   label: 'Cash',   icon: '💵', sub: 'Pay driver directly'    },
  { id: 'card',   label: 'Card',   icon: '💳', sub: 'Debit / Credit card'    },
  { id: 'wallet', label: 'Wallet', icon: '👛', sub: 'Yaatra wallet balance'   },
];

export function RiderPayment() {
  const { riderState, completePayment } = useRide();
  const [method, setMethod] = useState<PayMethod>('upi');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 800));
    completePayment();
  };

  const fare = riderState.fare?.totalFare ?? 0;

  return (
    <GlassCard className="z-10 shrink-0 p-4 lg:max-w-sm lg:border-l lg:p-5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-orange-400">
        Payment
      </p>

      {/* Fare total */}
      <div className="mb-4 rounded-xl border border-orange-500/15 bg-gradient-to-br from-[#0f1629] to-[#0a1020] p-4">
        <p className="text-xs text-slate-500">Trip total</p>
        <p className="text-2xl font-bold text-orange-400">₹{fare}</p>
        <p className="mt-1 text-[10px] text-slate-600">
          {riderState.pickup} → {riderState.dropoff}
        </p>
      </div>

      {/* Payment methods */}
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Select payment method
      </p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {PAY_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                active
                  ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/15 to-transparent ring-1 ring-orange-500/30'
                  : 'border-white/[0.06] bg-[#0a1020]/60 hover:border-white/15'
              }`}
            >
              <span className="mb-1 text-lg">{m.icon}</span>
              <p className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>
                {m.label}
              </p>
              <p className="text-[9px] text-slate-600">{m.sub}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={paying}
        className={btnPrimary}
      >
        {paying
          ? 'Processing…'
          : `Pay ₹${fare} via ${PAY_METHODS.find((m) => m.id === method)?.label} →`}
      </button>
    </GlassCard>
  );
}

export function RiderRating() {
  const { riderState, setRiderState, submitRating } = useRide();

  return (
    <GlassCard className="z-10 shrink-0 p-5 lg:max-w-sm lg:border-l">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
        Rate your trip
      </p>
      <p className="mb-3 text-[11px] text-slate-500">
        How was your ride with {riderState.driver?.name ?? 'your driver'}?
      </p>

      {/* Star selector */}
      <div className="mb-1 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRiderState((prev) => ({ ...prev, rating: star }))}
            className={`h-10 flex-1 rounded-xl border text-base font-bold transition-all ${
              riderState.rating >= star
                ? 'border-orange-500/50 bg-orange-500/20 text-orange-300 scale-105'
                : 'border-white/10 bg-white/[0.04] text-slate-500 hover:border-white/20'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {riderState.rating > 0 && (
        <p className="mb-3 text-center text-[10px] text-slate-500">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][riderState.rating]}
        </p>
      )}

      {/* Optional feedback */}
      <textarea
        value={riderState.feedback}
        onChange={(e) => setRiderState((prev) => ({ ...prev, feedback: e.target.value }))}
        placeholder="Add feedback (optional)…"
        className={`${inputField} mb-3 min-h-20 resize-none`}
      />

      <button type="button" onClick={submitRating} className={`${btnPrimary} mb-2`}>
        Submit rating →
      </button>
      <button
        type="button"
        onClick={submitRating}
        className={`${btnGhost} w-full text-xs text-slate-500`}
      >
        Skip — continue without rating
      </button>
    </GlassCard>
  );
}

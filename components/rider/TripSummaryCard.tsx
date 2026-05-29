'use client';

import { useRide } from '@/context/RideContext';

export function TripSummaryCard({ paymentMethod }: { paymentMethod?: string }) {
  const { riderState } = useRide();
  const { fare, driver, pickup, dropoff, distance, duration, vehicleType } = riderState;
  if (!pickup && !dropoff) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a1020]/60 p-3 text-xs">
      {/* Route */}
      <div className="mb-2 space-y-1">
        <div className="flex gap-2">
          <span className="mt-px shrink-0 text-orange-400">●</span>
          <span className="flex-1 truncate text-slate-300">{pickup}</span>
        </div>
        <div className="ml-2.5 h-3 w-px bg-white/10" />
        <div className="flex gap-2">
          <span className="mt-px shrink-0 text-cyan-400">●</span>
          <span className="flex-1 truncate text-slate-300">{dropoff}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-2 flex flex-wrap gap-1.5 text-[10px]">
        {distance && (
          <span className="rounded bg-white/5 px-2 py-0.5 text-slate-400">{distance} km</span>
        )}
        {duration != null && (
          <span className="rounded bg-white/5 px-2 py-0.5 text-slate-400">{duration} min</span>
        )}
        <span className="rounded bg-white/5 px-2 py-0.5 capitalize text-slate-400">{vehicleType}</span>
      </div>

      {/* Driver */}
      {driver && (
        <>
          <div className="my-2 h-px bg-white/[0.05]" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-cyan-500/10 text-[11px] font-bold text-white ring-1 ring-white/10">
              {driver.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white">{driver.name}</p>
              <p className="truncate text-[9px] text-slate-600">
                {driver.vehicle} · {driver.plate}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-amber-400">★ {driver.rating}</span>
          </div>
        </>
      )}

      {/* Fare breakdown */}
      {fare && (
        <>
          <div className="my-2 h-px bg-white/[0.05]" />
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Base fare</span>
              <span className="text-slate-400">₹{fare.base}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Distance ({distance} km)</span>
              <span className="text-slate-400">₹{fare.distanceCharge}</span>
            </div>
            {(fare.surge ?? 0) > 0 && (
              <div className="flex justify-between text-orange-400/70">
                <span>Surge ({fare.surgeFactor}×)</span>
                <span>+₹{fare.surge}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/[0.05] pt-1 text-xs font-bold">
              <span className="text-slate-300">Total</span>
              <span className="text-orange-400">₹{fare.totalFare}</span>
            </div>
          </div>
        </>
      )}

      {/* Payment method */}
      {paymentMethod && (
        <>
          <div className="my-2 h-px bg-white/[0.05]" />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Paid via</span>
            <span className="font-semibold capitalize text-cyan-300">{paymentMethod}</span>
          </div>
        </>
      )}
    </div>
  );
}

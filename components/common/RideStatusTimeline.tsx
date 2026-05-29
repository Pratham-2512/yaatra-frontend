'use client';

import { useRide } from '@/context/RideContext';
import type { TripPhase } from '@/lib/types';

const STEPS = [
  { label: 'Searching' },
  { label: 'Arriving'  },
  { label: 'At Pickup' },
  { label: 'In Trip'   },
  { label: 'Done'      },
];

function phaseToStep(phase: TripPhase): number {
  switch (phase) {
    case 'searching':          return 0;
    case 'assigned':
    case 'arriving':           return 1;
    case 'reached':            return 2;
    case 'inTrip':             return 3;
    case 'payment':
    case 'rating':             return 4;
    default:                   return -1;
  }
}

export function RideStatusTimeline() {
  const { tripPhase } = useRide();
  const current = phaseToStep(tripPhase);
  if (current < 0) return null;

  return (
    <div className="mb-4 flex items-start">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            {i > 0 && (
              <div
                className={`h-px flex-1 transition-all duration-700 ${
                  i <= current ? 'bg-orange-500' : 'bg-white/10'
                }`}
              />
            )}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-500 ${
                i < current
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : i === current
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-[0_0_12px_rgba(255,107,53,0.5)] animate-pulse'
                    : 'border-white/15 bg-white/5 text-slate-700'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 transition-all duration-700 ${
                  i < current ? 'bg-orange-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
          <p
            className={`mt-1 text-[8px] font-semibold transition-all ${
              i === current
                ? 'text-orange-400'
                : i < current
                  ? 'text-slate-500'
                  : 'text-slate-700'
            }`}
          >
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}

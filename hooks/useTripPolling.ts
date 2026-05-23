'use client';

import { useEffect, useRef } from 'react';
import { tripApi, type TripDto } from '@/services/tripApi';
import type { DriverInfo, TripPhase } from '@/types';

function statusToPhase(status: string): TripPhase | null {
  switch (status.toLowerCase()) {
    case 'searching':
      return 'searching';
    case 'assigned':
    case 'arriving':
      return 'arriving';
    case 'inprogress':
      return 'inTrip';
    case 'completed':
      return 'payment';
    default:
      return null;
  }
}

export interface TripPollHandlers {
  rideId: string | null;
  tripPhase: TripPhase;
  onTripUpdate: (trip: TripDto) => void;
  onDriverPosition: (lat: number, lng: number) => void;
  onProgress: (progress: number, eta: number) => void;
  onPhaseSync: (phase: TripPhase) => void;
}

export function useTripPolling({
  rideId,
  tripPhase,
  onTripUpdate,
  onDriverPosition,
  onProgress,
  onPhaseSync,
}: TripPollHandlers) {
  const active = Boolean(rideId) && !['idle', 'rating', 'payment'].includes(tripPhase);
  const handlersRef = useRef({ onTripUpdate, onDriverPosition, onProgress, onPhaseSync });
  handlersRef.current = { onTripUpdate, onDriverPosition, onProgress, onPhaseSync };

  useEffect(() => {
    if (!active || !rideId) return;

    const poll = async () => {
      try {
        const trip = await tripApi.getTrip(rideId);
        handlersRef.current.onTripUpdate(trip);
        handlersRef.current.onProgress(trip.progress, trip.etaMin);
        if (trip.driverLat != null && trip.driverLng != null) {
          handlersRef.current.onDriverPosition(trip.driverLat, trip.driverLng);
        }
        const phase = statusToPhase(trip.status);
        if (phase) handlersRef.current.onPhaseSync(phase);
      } catch {
        /* offline — local simulation continues */
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [active, rideId]);
}

export function tripDtoToDriver(trip: TripDto): DriverInfo {
  return {
    name: trip.driverName ?? 'Fleet Partner',
    rating: 4.9,
    vehicle: trip.vehicleType === 'bike' ? 'Honda Activa' : trip.vehicleType === 'auto' ? 'Bajaj RE' : 'Maruti Ertiga',
    plate: 'KA-02-AB-1234',
    eta: trip.etaMin,
  };
}

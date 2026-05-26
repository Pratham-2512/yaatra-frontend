'use client';

import { useMemo } from 'react';
import { useRide } from '@/contexts/RideStateContext';
import type { MapMode } from '@/lib/types';

export function useMapProps(mode: MapMode = 'rider', progress?: number) {
  const {
    route,
    pickupCoords,
    dropoffCoords,
    driverMapPosition,
    driverState,
  } = useRide();

  return useMemo(() => {
    return {
      pickup: pickupCoords
        ? { lat: pickupCoords.lat, lng: pickupCoords.lng }
        : undefined,
      dropoff: dropoffCoords
        ? { lat: dropoffCoords.lat, lng: dropoffCoords.lng }
        : undefined,
      route,
      mode,
      progress,
      driverPosition:
        driverMapPosition ??
        (mode === 'driver' ? driverState.currentLocation : undefined),
    };
  }, [
    dropoffCoords,
    driverMapPosition,
    driverState.currentLocation,
    mode,
    pickupCoords,
    progress,
    route,
  ]);
}

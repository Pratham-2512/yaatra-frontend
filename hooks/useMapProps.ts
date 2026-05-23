'use client';

import { useRide } from '@/context/RideContext';
import type { MapMode } from '@/lib/types';

export function useMapProps(mode: MapMode, progress?: number) {
  const {
    route,
    pickupCoords,
    dropoffCoords,
    driverMapPosition,
    riderState,
    tripPhase,
  } = useRide();

  return {
    mode: tripPhase === 'searching' ? 'searching' : mode,
    routeCoords: route.length ? route : undefined,
    pickupCoords,
    dropoffCoords,
    driverPosition: driverMapPosition,
    tripProgress: progress ?? riderState.progress,
    showRoute: route.length > 0 || mode !== 'searching',
    showFleet: true,
    showHotspots: true,
  };
}

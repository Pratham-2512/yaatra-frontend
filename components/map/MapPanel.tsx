'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const FleetMap = dynamic(
  () => import('./FleetMap'),
  {
    ssr: false,
  }
);

interface MapPanelProps {
  mode?: string;
  showRoute?: boolean;
  pickup?: {
    lat: number;
    lng: number;
  };
  dropoff?: {
    lat: number;
    lng: number;
  };
  route?: {
    lat: number;
    lng: number;
  }[];
  routeCoords?: {
    lat: number;
    lng: number;
  }[];
  pickupCoords?: {
    lat: number;
    lng: number;
  } | null;
  dropoffCoords?: {
    lat: number;
    lng: number;
  } | null;
  driverPosition?: {
    lat: number;
    lng: number;
  } | null;
  showFleet?: boolean;
  showHeatmap?: boolean;
  showHotspots?: boolean;
  showDebug?: boolean;
  className?: string;
  height?: string;
  progress?: number;
}

export default function MapPanel({
  showRoute,
  pickup,
  dropoff,
  route = [],
  routeCoords,
  pickupCoords,
  dropoffCoords,
  driverPosition,
  showFleet = false,
  showHeatmap = false,
  showHotspots = false,
  showDebug = false,
  className = '',
  height = 'h-full',
}: MapPanelProps) {
  const resolvedRoute = routeCoords ?? route;
  const shouldShowRoute = showRoute ?? resolvedRoute.length > 1;

  const fleetMapRoute = useMemo<[number, number][]>(
    () => (shouldShowRoute ? resolvedRoute.map((p) => [p.lng, p.lat]) : []),
    [shouldShowRoute, resolvedRoute]
  );

  return (
    <div
      className={`relative flex-1 ${height} ${className}`}
    >
      <FleetMap
        pickup={pickupCoords ?? pickup}
        dropoff={dropoffCoords ?? dropoff}
        route={fleetMapRoute}
        driverPosition={driverPosition}
        showFleet={showFleet}
        showHeatmap={showHeatmap}
        showHotspots={showHotspots}
        showDebug={showDebug}
      />
    </div>
  );
}

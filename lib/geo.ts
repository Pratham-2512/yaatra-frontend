import type { LngLat } from './types';

/** NCR corridor anchor — Gurgaon / Delhi NCR */
export const NCR_CENTER: LngLat = {
  lng: 77.1025,
  lat: 28.4595,
};

export const NCR_CORRIDORS = [
  { id: 'gurgaon', name: 'Gurgaon CBD', lng: 77.0689, lat: 28.4595 },
  { id: 'cyber', name: 'Cyber Hub', lng: 77.0825, lat: 28.4942 },
  { id: 'ncr-metro', name: 'Huda City', lng: 77.0728, lat: 28.4591 },
  { id: 'dwarka', name: 'Dwarka Exp', lng: 77.0402, lat: 28.5921 },
  { id: 'cp', name: 'Connaught Pl', lng: 77.209, lat: 28.6315 },
  { id: 'noida', name: 'Noida Sec-18', lng: 77.324, lat: 28.5706 },
];

export const DEFAULT_ROUTE: LngLat[] = [
  { lng: 77.0825, lat: 28.4942 },
  { lng: 77.0780, lat: 28.4850 },
  { lng: 77.0750, lat: 28.4720 },
  { lng: 77.0728, lat: 28.4591 },
];

export const DEMAND_ZONES = [
  {
    name: 'Cyber Hub',
    lng: 77.0825,
    lat: 28.4942,
    intensity: 0.95,
  },
  {
    name: 'MG Road',
    lng: 77.0680,
    lat: 28.4810,
    intensity: 0.72,
  },
  {
    name: 'IFFCO Chowk',
    lng: 77.0720,
    lat: 28.4720,
    intensity: 0.68,
  },
  {
    name: 'Sohna Rd',
    lng: 77.0550,
    lat: 28.4380,
    intensity: 0.55,
  },
];

export const FLEET_SEED: {
  id: string;
  lng: number;
  lat: number;
  heading: number;
  type: string;
}[] = [
  {
    id: 'v1',
    lng: 77.0790,
    lat: 28.4880,
    heading: 45,
    type: 'auto',
  },
  {
    id: 'v2',
    lng: 77.0710,
    lat: 28.4650,
    heading: 120,
    type: 'sedan',
  },
  {
    id: 'v3',
    lng: 77.0850,
    lat: 28.4780,
    heading: 200,
    type: 'bike',
  },
  {
    id: 'v4',
    lng: 77.0640,
    lat: 28.4520,
    heading: 310,
    type: 'suv',
  },
  {
    id: 'v5',
    lng: 77.0760,
    lat: 28.4910,
    heading: 15,
    type: 'auto',
  },
  {
    id: 'v6',
    lng: 77.0690,
    lat: 28.4710,
    heading: 90,
    type: 'sedan',
  },
];

export function interpolateRoute(
  route: LngLat[],
  progress: number
): LngLat {
  const t = Math.min(Math.max(progress, 0), 100) / 100;

  const segments = route.length - 1;

  const pos = t * segments;

  const idx = Math.min(Math.floor(pos), segments - 1);

  const frac = pos - idx;

  const a = route[idx];

  const b = route[idx + 1] ?? route[idx];

  return {
    lng: a.lng + (b.lng - a.lng) * frac,
    lat: a.lat + (b.lat - a.lat) * frac,
  };
}

export function fleetToGeoJSON(
  vehicles: {
    id: string;
    lng: number;
    lat: number;
    type: string;
  }[]
) {
  return {
    type: 'FeatureCollection' as const,

    features: vehicles.map((v) => ({
      type: 'Feature' as const,

      properties: {
        id: v.id,
        type: v.type,
      },

      geometry: {
        type: 'Point' as const,
        coordinates: [v.lng, v.lat],
      },
    })),
  };
}

export function routeToGeoJSON(route: LngLat[]) {
  return {
    type: 'Feature' as const,

    properties: {},

    geometry: {
      type: 'LineString' as const,
      coordinates: route.map((p) => [p.lng, p.lat]),
    },
  };
}

export function hotspotsToGeoJSON() {
  return {
    type: 'FeatureCollection' as const,

    features: DEMAND_ZONES.map((z, i) => ({
      type: 'Feature' as const,

      properties: {
        name: z.name,
        intensity: z.intensity,
        id: i,
      },

      geometry: {
        type: 'Point' as const,
        coordinates: [z.lng, z.lat],
      },
    })),
  };
}

/**
 * Stable heatmap points
 * Removed random movement generation
 * Improves performance and realism
 */
export function heatmapToGeoJSON() {
  const points = [
    { lng: 77.0825, lat: 28.4942, w: 0.95 },
    { lng: 77.0780, lat: 28.4890, w: 0.90 },
    { lng: 77.0740, lat: 28.4840, w: 0.85 },

    { lng: 77.0680, lat: 28.4810, w: 0.72 },
    { lng: 77.0650, lat: 28.4780, w: 0.68 },

    { lng: 77.0720, lat: 28.4720, w: 0.68 },
    { lng: 77.0700, lat: 28.4680, w: 0.62 },

    { lng: 77.0550, lat: 28.4380, w: 0.55 },
    { lng: 77.0580, lat: 28.4420, w: 0.50 },
  ];

  return {
    type: 'FeatureCollection' as const,

    features: points.map((p, i) => ({
      type: 'Feature' as const,

      properties: {
        weight: p.w,
        id: i,
      },

      geometry: {
        type: 'Point' as const,
        coordinates: [p.lng, p.lat],
      },
    })),
  };
}
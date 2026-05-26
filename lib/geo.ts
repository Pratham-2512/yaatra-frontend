import type { LngLat } from './types';

/** NCR corridor anchor */
export const NCR_CENTER: LngLat = {
  lng: 77.1025,
  lat: 28.4595,
};

export const NCR_CORRIDORS = [
  {
    id: 'gurgaon',
    name: 'Gurgaon CBD',
    lng: 77.0689,
    lat: 28.4595,
  },

  {
    id: 'cyber',
    name: 'Cyber Hub',
    lng: 77.0825,
    lat: 28.4942,
  },

  {
    id: 'metro',
    name: 'Huda City',
    lng: 77.0728,
    lat: 28.4591,
  },

  {
    id: 'dwarka',
    name: 'Dwarka Exp',
    lng: 77.0402,
    lat: 28.5921,
  },

  {
    id: 'cp',
    name: 'Connaught Place',
    lng: 77.209,
    lat: 28.6315,
  },
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
    lng: 77.068,
    lat: 28.481,
    intensity: 0.72,
  },

  {
    name: 'IFFCO Chowk',
    lng: 77.072,
    lat: 28.472,
    intensity: 0.68,
  },

  {
    name: 'Sohna Road',
    lng: 77.055,
    lat: 28.438,
    intensity: 0.55,
  },
];

export const FLEET_SEED = [
  {
    id: 'v1',
    lng: 77.079,
    lat: 28.488,
    heading: 45,
    type: 'auto',
  },

  {
    id: 'v2',
    lng: 77.071,
    lat: 28.465,
    heading: 120,
    type: 'sedan',
  },

  {
    id: 'v3',
    lng: 77.085,
    lat: 28.478,
    heading: 200,
    type: 'bike',
  },

  {
    id: 'v4',
    lng: 77.064,
    lat: 28.452,
    heading: 310,
    type: 'suv',
  },
];

export function interpolateRoute(
  route: LngLat[],
  progress: number
): LngLat {
  const t =
    Math.min(Math.max(progress, 0), 100) /
    100;

  const segments = route.length - 1;

  const pos = t * segments;

  const idx = Math.min(
    Math.floor(pos),
    segments - 1
  );

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

export function routeToGeoJSON(
  route: LngLat[]
) {
  return {
    type: 'Feature' as const,

    properties: {},

    geometry: {
      type: 'LineString' as const,

      coordinates: route.map((p) => [
        p.lng,
        p.lat,
      ]),
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

export function heatmapToGeoJSON() {
  const points = [
    {
      lng: 77.0825,
      lat: 28.4942,
      w: 0.95,
    },

    {
      lng: 77.078,
      lat: 28.489,
      w: 0.9,
    },

    {
      lng: 77.074,
      lat: 28.484,
      w: 0.85,
    },

    {
      lng: 77.068,
      lat: 28.481,
      w: 0.72,
    },

    {
      lng: 77.065,
      lat: 28.478,
      w: 0.68,
    },
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
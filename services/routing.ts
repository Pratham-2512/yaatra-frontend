import type { LngLat } from '@/lib/types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

interface NominatimPlace {
  lat: string;
  lon: string;
  display_name: string;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
}

interface OsrmResponse {
  routes?: OsrmRoute[];
}

export interface ResolvedRoute {
  pickup: {
    normalized: string;
    coords: LngLat;
  };
  dropoff: {
    normalized: string;
    coords: LngLat;
  };
  distanceKm: number;
  durationMin: number;
  route: LngLat[];
  source: 'osrm';
}

async function geocodePlace(query: string): Promise<{ normalized: string; coords: LngLat }> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'in',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed for "${query}"`);
  }

  const data = (await response.json()) as NominatimPlace[];
  const place = data[0];

  if (!place) {
    throw new Error(`Location not found: ${query}`);
  }

  return {
    normalized: place.display_name || query,
    coords: {
      lat: Number(place.lat),
      lng: Number(place.lon),
    },
  };
}

async function fetchOsrmRoute(pickup: LngLat, dropoff: LngLat): Promise<OsrmRoute> {
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
  });
  const response = await fetch(
    `${OSRM_URL}/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?${params}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch route');
  }

  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    throw new Error('No route found');
  }

  return route;
}

export async function resolveRoute(
  pickupText: string,
  dropoffText: string
): Promise<ResolvedRoute> {
  const [pickup, dropoff] = await Promise.all([
    geocodePlace(pickupText),
    geocodePlace(dropoffText),
  ]);

  const route = await fetchOsrmRoute(pickup.coords, dropoff.coords);

  return {
    pickup,
    dropoff,
    distanceKm: route.distance / 1000,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    route: route.geometry.coordinates.map(([lng, lat]) => ({ lng, lat })),
    source: 'osrm',
  };
}

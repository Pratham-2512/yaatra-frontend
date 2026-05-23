import { MapsService } from '@/lib/api';
import type { LngLat } from '@/lib/types';
import { distanceKm, estimateDurationMin } from '@/utils/distance';
import { approximateRoutePath, normalizeNcrLocation } from '@/utils/ncr-geocoding';

export type RouteSource = 'google' | 'simulated' | 'cached';

export interface RouteResult {
  pickup: ReturnType<typeof normalizeNcrLocation>;
  dropoff: ReturnType<typeof normalizeNcrLocation>;
  distanceKm: number;
  durationMin: number;
  route: LngLat[];
  source: RouteSource;
  usedFallback: boolean;
}

const MAX_RETRIES = 2;

async function tryGoogleDirections(
  maps: MapsService,
  pickup: ReturnType<typeof normalizeNcrLocation>,
  dropoff: ReturnType<typeof normalizeNcrLocation>
): Promise<{ distance: number; duration: number } | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const api = await maps.getDirections(pickup.normalized, dropoff.normalized);
      if (api && api.distance > 0) return { distance: api.distance, duration: Math.ceil(api.duration) };
    } catch {
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

export async function resolveRoute(
  pickupInput: string,
  dropoffInput: string,
  maps?: MapsService
): Promise<RouteResult> {
  const pickup = normalizeNcrLocation(pickupInput);
  const dropoff = normalizeNcrLocation(dropoffInput);

  let distance = distanceKm(pickup.coords, dropoff.coords);
  let duration = estimateDurationMin(distance);
  let source: RouteSource = 'simulated';
  let usedFallback = !pickup.matched || !dropoff.matched;

  if (maps) {
    const google = await tryGoogleDirections(maps, pickup, dropoff);
    if (google) {
      distance = google.distance;
      duration = google.duration;
      source = 'google';
      usedFallback = false;
    }
  }

  if (distance < 0.5) {
    distance = 2.5;
    usedFallback = true;
  }

  const pointCount = Math.max(10, Math.min(32, Math.round(distance * 3)));
  const route = approximateRoutePath(pickup.coords, dropoff.coords, pointCount);

  return {
    pickup,
    dropoff,
    distanceKm: distance,
    durationMin: duration,
    route,
    source: usedFallback ? 'simulated' : source,
    usedFallback,
  };
}

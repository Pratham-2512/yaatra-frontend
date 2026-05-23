import type { LngLat } from '@/lib/types';

/** Haversine distance in km */
export function distanceKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Urban NCR average speed ~22 km/h */
export function estimateDurationMin(distance: number): number {
  return Math.max(3, Math.ceil((distance / 22) * 60));
}

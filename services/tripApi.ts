import type { AdminMetrics, RouteAnomaly, MLPrediction } from '@/types';

const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:5089/api';

// ── Backend availability guard ─────────────────────────────────────────────
// When the app is deployed (e.g. Vercel) but NEXT_PUBLIC_API_URL is not set,
// API_BASE defaults to localhost:5089. Calling localhost from a remote browser
// causes net::ERR_CONNECTION_REFUSED errors in the console.
// Detect this mismatch and skip all network calls — the frontend simulation
// handles everything, so the UX is unaffected.

function isBackendReachable(): boolean {
  // Server-side rendering: assume reachable (Next.js SSR runs on same host)
  if (typeof window === 'undefined') return true;

  const apiIsLocal =
    API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');

  const appIsRemote =
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1') &&
    window.location.hostname !== '';

  // Localhost API + remote deployment = backend is NOT reachable
  return !(apiIsLocal && appIsRemote);
}

// ── HTTP client ────────────────────────────────────────────────────────────

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Skip instantly — no fetch, no browser console error
  if (!isBackendReachable()) {
    throw new Error('backend-offline');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000); // 4 s timeout

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json() as Promise<T>;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface TripDto {
  id: string;
  pickup: string;
  dropoff: string;
  vehicleType: string;
  status: string;
  driverId?: string;
  driverName?: string;
  distanceKm: number;
  durationMin: number;
  totalFare: number;
  baseFare: number;
  surgeFare: number;
  progress: number;
  etaMin: number;
  driverLat?: number;
  driverLng?: number;
  createdAt: string;
}

export interface LiveMetricsResponse {
  activeTrips: number;
  onlineDrivers: number;
  revenueToday: number;
  avgRating: number;
  delayedTrips: number;
  fleetUtilization: number;
  cityVelocityKmh: number;
  activeTripList: { id: string; route: string; status: string; delayed: boolean }[];
  anomalies: RouteAnomaly[];
  predictions: MLPrediction[];
}

// ── API surface ────────────────────────────────────────────────────────────

export const tripApi = {
  getActiveTrips: () => request<TripDto[]>('GET', '/trips/active'),
  getTrip: (id: string) => request<TripDto>('GET', `/trips/${id}`),
  createTrip: (pickup: string, dropoff: string, vehicleType: string) =>
    request<TripDto>('POST', '/trips/create', { pickup, dropoff, vehicleType }),
  assignTrip: (tripId: string, driverId: string, driverName?: string) =>
    request<TripDto>('POST', `/trips/${tripId}/assign`, { driverId, driverName }),
  startTrip: (tripId: string) => request<TripDto>('POST', `/trips/${tripId}/start`),
  completeTrip: (tripId: string, rating?: number, feedback?: string) =>
    request<TripDto>('POST', '/trips/complete', { tripId, rating, feedback }),
  estimateFare: (pickup: string, dropoff: string, vehicleType: string) =>
    request<{
      totalFare: number;
      base: number;
      distanceCharge: number;
      surge: number;
      distanceKm: number;
      durationMin: number;
    }>('POST', '/trips/estimate-fare', { pickup, dropoff, vehicleType }),
  getOnlineDrivers: () =>
    request<
      {
        id: string;
        name: string;
        vehicle: string;
        plate: string;
        rating: number;
        online: boolean;
        lat: number;
        lng: number;
      }[]
    >('GET', '/drivers/online'),
  getLiveMetrics: () => request<LiveMetricsResponse>('GET', '/metrics/live'),
  getAdminMetrics: () => request<LiveMetricsResponse>('GET', '/admin/metrics'),
};

// ── Admin state mapper ─────────────────────────────────────────────────────

export function metricsToAdminState(m: LiveMetricsResponse): {
  metrics: AdminMetrics;
  anomalies: RouteAnomaly[];
  predictions: MLPrediction[];
  activeTrips: LiveMetricsResponse['activeTripList'];
} {
  return {
    metrics: {
      activeRides: m.activeTrips,
      totalRevenue: m.revenueToday,
      avgRating: m.avgRating,
      onlineDrivers: m.onlineDrivers,
    },
    anomalies: m.anomalies,
    predictions: m.predictions,
    activeTrips: m.activeTripList,
  };
}

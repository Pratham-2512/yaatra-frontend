import type { AdminMetrics, RouteAnomaly, MLPrediction } from '@/types';

const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:5089/api';

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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

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

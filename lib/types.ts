export interface FareEstimate {
  totalFare?: number;
  base?: number;
  distanceCharge?: number;
  surge?: number;
}

export interface DriverInfo {
  name: string;
  rating: number;
  vehicle: string;
  plate: string;
  eta: number;
}

export type TripPhase =
  | 'idle'
  | 'estimating'
  | 'confirm'
  | 'searching'
  | 'assigned'
  | 'arriving'
  | 'inTrip'
  | 'payment'
  | 'rating';

export type GpsSyncStatus = 'synced' | 'syncing' | 'fallback' | 'offline';

export interface RiderState {
  screen: string;
  pickup: string;
  dropoff: string;
  vehicleType: string;
  pickupLocation: { lat: number; lng: number; address?: string } | null;
  dropoffLocation: { lat: number; lng: number; address?: string } | null;
  fare: FareEstimate | null;
  distance: string | null;
  duration: number | null;
  rideId: string | null;
  driver: DriverInfo | null;
  progress: number;
  rating: number;
  feedback: string;
}

export interface IncomingRide {
  id: string;
  pickup: string;
  dropoff: string;
  distance: number;
  fare: string;
  passenger: string;
  rating: number;
  vehicleType?: string;
}

export interface DriverState {
  screen: string;
  online: boolean;
  earnings: number;
  tripsToday: number;
  rating: number;
  acceptedRide: IncomingRide | null;
  incomingRides: IncomingRide[];
  currentLocation: { lat: number; lng: number };
  progress: number;
}

export interface AdminMetrics {
  activeRides: number;
  totalRevenue: number;
  avgRating: number;
  onlineDrivers: number;
}

export interface RouteAnomaly {
  severity: string;
  driverId: string;
  expectedDistance: number;
  actualDistance: number;
  variance: number;
}

export interface MLPrediction {
  message: string;
}

export interface FraudAlert {
  message: string;
}

export interface ActiveTripSummary {
  id: string;
  route: string;
  status: string;
  delayed: boolean;
}

export interface LiveOpsState {
  delayedTrips: number;
  fleetUtilization: number;
  cityVelocity: number;
}

export interface AdminState {
  metrics: AdminMetrics;
  fraudAlerts: FraudAlert[];
  anomalies: RouteAnomaly[];
  predictions: MLPrediction[];
  routes: unknown[];
  liveOps: LiveOpsState;
  activeTripList: ActiveTripSummary[];
}

export type NavRole = 'rider' | 'driver' | 'admin';

export type MapMode = 'rider' | 'driver' | 'command' | 'searching' | 'trip';

export interface LngLat {
  lng: number;
  lat: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

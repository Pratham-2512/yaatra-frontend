import type { AdminState, DriverState, NavRole, RiderState } from './types';

export const NAV_ITEMS: { id: NavRole; label: string; sub: string; icon: string }[] = [
  { id: 'rider', label: 'Rider', sub: 'Book & track', icon: '🧑' },
  { id: 'driver', label: 'Driver', sub: 'Fleet partner', icon: '🛺' },
  { id: 'admin', label: 'Command', sub: 'Ops intelligence', icon: '📊' },
];

export type VehicleType = 'bike' | 'auto' | 'sedan' | 'suv';

export const VEHICLE_TYPES: VehicleType[] = ['bike', 'auto', 'sedan', 'suv'];

export const SCREEN_TITLES: Record<string, string> = {
  home: 'Book a ride',
  confirm: 'Confirm trip',
  searching: 'Matching driver',
  driverArriving: 'Driver en route',
  inTrip: 'Trip in progress',
  payment: 'Payment',
  rating: 'Rate your trip',
  command: 'Operations command',
  pickup: 'Navigate to pickup',
};

export const initialRiderState: RiderState = {
  screen: 'home',
  pickup: '',
  dropoff: '',
  vehicleType: 'sedan',
  pickupLocation: null,
  dropoffLocation: null,
  fare: null,
  distance: null,
  duration: null,
  rideId: null,
  driver: null,
  progress: 0,
  rating: 0,
  feedback: '',
  paymentMethod: 'upi',
};

export const initialDriverState: DriverState = {
  screen: 'home',
  online: false,
  earnings: 4250,
  tripsToday: 18,
  rating: 4.9,
  acceptedRide: null,
  incomingRides: [],
  currentLocation: { lat: 28.4595, lng: 77.0266 },
  progress: 0,
};

export const initialAdminState: AdminState = {
  metrics: {
    activeRides: 0,
    totalRevenue: 0,
    avgRating: 0,
    onlineDrivers: 0,
  },
  fraudAlerts: [],
  anomalies: [],
  predictions: [],
  routes: [],
  liveOps: {
    delayedTrips: 0,
    fleetUtilization: 0,
    cityVelocity: 0,
  },
  activeTripList: [],
};

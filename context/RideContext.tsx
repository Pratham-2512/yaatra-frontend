'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MapsService } from '@/lib/api';
import { tripApi, metricsToAdminState } from '@/services/tripApi';
import { useTripPolling, tripDtoToDriver } from '@/hooks/useTripPolling';
import {
  initialAdminState,
  initialDriverState,
  initialRiderState,
} from '@/lib/constants';
import type {
  AdminMetrics,
  AdminState,
  DriverInfo,
  DriverState,
  GpsSyncStatus,
  IncomingRide,
  LngLat,
  MLPrediction,
  NavRole,
  RiderState,
  RouteAnomaly,
  TripPhase,
} from '@/lib/types';
import { calculateFare, VEHICLE_PRICING, type VehicleType } from '@/services/pricing';
import { resolveRoute } from '@/services/routing';
import { interpolateRoute } from '@/lib/geo';
import { useToast } from './ToastContext';

const DEFAULT_DRIVER: DriverInfo = {
  name: 'Raj Kumar',
  rating: 4.9,
  vehicle: 'Maruti Ertiga',
  plate: 'KA-02-AB-1234',
  eta: 4,
};

function phaseToRiderScreen(phase: TripPhase): string {
  switch (phase) {
    case 'confirm':
      return 'confirm';
    case 'searching':
      return 'searching';
    case 'assigned':
    case 'arriving':
      return 'driverArriving';
    case 'inTrip':
      return 'inTrip';
    case 'payment':
      return 'payment';
    case 'rating':
      return 'rating';
    default:
      return 'home';
  }
}

interface RideContextValue {
  userType: NavRole;
  setUserType: (r: NavRole) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;

  riderState: RiderState;
  setRiderState: React.Dispatch<React.SetStateAction<RiderState>>;
  driverState: DriverState;
  adminState: AdminState;

  tripPhase: TripPhase;
  route: LngLat[];
  pickupCoords: LngLat | null;
  dropoffCoords: LngLat | null;
  driverMapPosition: LngLat | null;
  gpsStatus: GpsSyncStatus;
  isEstimating: boolean;
  routeSource: string;

  estimateFare: () => Promise<void>;
  retryEstimate: () => Promise<void>;
  bookRide: () => Promise<void>;
  startTrip: () => void;
  completePayment: () => void;
  submitRating: () => Promise<void>;
  cancelSearch: () => void;
  resetToHome: () => void;

  toggleOnline: () => void;
  acceptRide: (rideId: string) => Promise<void>;
  rejectRide: (rideId: string) => void;
  driverStartTrip: () => void;
  completeDriverTrip: () => void;
  liveOps: import('@/lib/types').LiveOpsState;
  activeTripList: import('@/lib/types').ActiveTripSummary[];
}

const RideContext = createContext<RideContextValue | null>(null);

const DRIVER_ID = 'DRV-001';

export function RideProvider({ children }: { children: React.ReactNode }) {
  const mapsRef = useRef(new MapsService());
  const autoAssignRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { push: toast } = useToast();
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driverMoveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [userType, setUserType] = useState<NavRole>('rider');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [riderState, setRiderState] = useState<RiderState>(initialRiderState);
  const [driverState, setDriverState] = useState<DriverState>(initialDriverState);
  const [adminState, setAdminState] = useState<AdminState>(initialAdminState);

  const [tripPhase, setTripPhase] = useState<TripPhase>('idle');
  const [route, setRoute] = useState<LngLat[]>([]);
  const [pickupCoords, setPickupCoords] = useState<LngLat | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LngLat | null>(null);
  const [driverMapPosition, setDriverMapPosition] = useState<LngLat | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsSyncStatus>('synced');
  const [isEstimating, setIsEstimating] = useState(false);
  const [routeSource, setRouteSource] = useState('simulated');

  const syncRiderScreen = useCallback((phase: TripPhase) => {
    setRiderState((p) => ({ ...p, screen: phaseToRiderScreen(phase) }));
  }, []);

  const clearAnimations = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current);
    if (driverMoveRef.current) clearInterval(driverMoveRef.current);
    animRef.current = null;
    driverMoveRef.current = null;
  }, []);

  useEffect(() => {
    if (userType !== 'admin') return;
    const poll = async () => {
      try {
        const live = await tripApi.getLiveMetrics();
        const mapped = metricsToAdminState(live);
        setAdminState((prev) => ({
          ...prev,
          metrics: mapped.metrics,
          anomalies: mapped.anomalies,
          predictions: mapped.predictions,
          activeTripList: mapped.activeTrips,
          liveOps: {
            delayedTrips: live.delayedTrips,
            fleetUtilization: live.fleetUtilization,
            cityVelocity: live.cityVelocityKmh,
          },
        }));
      } catch {
        /* demo metrics stay */
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [userType]);

  useEffect(() => {
    return () => clearAnimations();
  }, [clearAnimations]);

  const runEstimate = useCallback(async () => {
    if (!riderState.pickup.trim() || !riderState.dropoff.trim()) {
      toast('warning', 'Add locations', 'Enter pickup and dropoff in NCR.');
      return;
    }
    setIsEstimating(true);
    setGpsStatus('syncing');
    setTripPhase('estimating');

    try {
      const result = await resolveRoute(
        riderState.pickup,
        riderState.dropoff,
        mapsRef.current
      );

      setRoute(result.route);
      setPickupCoords(result.pickup.coords);
      setDropoffCoords(result.dropoff.coords);
      setRouteSource(result.source);
      setGpsStatus(result.usedFallback ? 'fallback' : 'synced');

      const vt = riderState.vehicleType as VehicleType;
      const fare = calculateFare(vt, result.distanceKm, result.durationMin);

      try {
        const apiFare = await tripApi.estimateFare(
          result.pickup.normalized,
          result.dropoff.normalized,
          vt
        );
        if (apiFare?.totalFare) {
          fare.totalFare = apiFare.totalFare;
          fare.base = apiFare.base;
          fare.distanceCharge = apiFare.distanceCharge;
          fare.surge = apiFare.surge;
        }
      } catch {
        /* local pricing */
      }

      setRiderState((prev) => ({
        ...prev,
        screen: 'confirm',
        pickup: result.pickup.normalized,
        dropoff: result.dropoff.normalized,
        pickupLocation: { ...result.pickup.coords, address: result.pickup.normalized },
        dropoffLocation: { ...result.dropoff.coords, address: result.dropoff.normalized },
        distance: result.distanceKm.toFixed(1),
        duration: result.durationMin,
        fare,
      }));
      setTripPhase('confirm');

      toast(
        result.usedFallback ? 'info' : 'success',
        result.usedFallback ? 'Smart NCR fallback route' : 'Route ready',
        result.usedFallback
          ? 'Using smart NCR fallback route — sector mapping active for Gurgaon.'
          : `${result.distanceKm.toFixed(1)} km · ~${result.durationMin} min`
      );
    } catch (e) {
      console.error(e);
      setTripPhase('idle');
      setGpsStatus('offline');
      toast('error', 'Estimate failed', 'Tap retry — NCR fallback will still work.');
    } finally {
      setIsEstimating(false);
    }
  }, [riderState.pickup, riderState.dropoff, riderState.vehicleType, toast]);

  const startDriverMovement = useCallback(
    (fromProgress: number, toProgress: number, onDone?: () => void) => {
      if (!route.length) return;
      let p = fromProgress;
      driverMoveRef.current = setInterval(() => {
        p += 1.2;
        if (p >= toProgress) {
          p = toProgress;
          if (driverMoveRef.current) clearInterval(driverMoveRef.current);
          onDone?.();
        }
        const pos = interpolateRoute(route, p);
        setDriverMapPosition(pos);
        setRiderState((prev) => ({
          ...prev,
          driver: prev.driver
            ? { ...prev.driver, eta: Math.max(1, Math.ceil((toProgress - p) / 4)) }
            : prev.driver,
        }));
      }, 400);
    },
    [route]
  );

  const bookRide = useCallback(async () => {
    const vt = riderState.vehicleType as VehicleType;
    const fareStr = `₹${riderState.fare?.totalFare ?? VEHICLE_PRICING[vt].priceFrom}`;
    let rideId = `RIDE-${Date.now().toString(36).slice(-6).toUpperCase()}`;

    try {
      const rideData = await tripApi.createTrip(riderState.pickup, riderState.dropoff, vt);
      rideId = rideData.id;
    } catch {
      /* simulated ride id */
    }

    const incoming: IncomingRide = {
      id: rideId,
      pickup: riderState.pickup,
      dropoff: riderState.dropoff,
      distance: Number(riderState.distance) || 5,
      fare: fareStr,
      passenger: 'Rider',
      rating: 4.9,
      vehicleType: vt,
    };

    setRiderState((prev) => ({
      ...prev,
      screen: 'searching',
      rideId,
    }));
    setTripPhase('searching');

    if (driverState.online) {
      setDriverState((prev) => ({
        ...prev,
        incomingRides: [incoming],
      }));
      toast('info', 'Ride requested', 'Fleet partners notified in your zone.');
    } else {
      toast('info', 'Finding driver', 'Matching nearest partner across NCR…');
      setTimeout(() => {
        setDriverState((prev) => ({
          ...prev,
          incomingRides: prev.incomingRides.length ? prev.incomingRides : [incoming],
        }));
      }, 1500);
    }

    setAdminState((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        activeRides: prev.metrics.activeRides + 1,
      },
    }));

    if (autoAssignRef.current) clearTimeout(autoAssignRef.current);
    autoAssignRef.current = setTimeout(() => {
      setDriverState((prev) => {
        if (prev.incomingRides.some((r) => r.id === rideId) || prev.acceptedRide) return prev;
        return {
          ...prev,
          incomingRides: [
            {
              id: rideId,
              pickup: riderState.pickup,
              dropoff: riderState.dropoff,
              distance: Number(riderState.distance) || 5,
              fare: fareStr,
              passenger: 'Rider',
              rating: 4.9,
              vehicleType: vt,
            },
          ],
        };
      });
    }, 6000);

    if (!driverState.online) {
      autoAssignRef.current = setTimeout(async () => {
        try {
          await tripApi.assignTrip(rideId, DRIVER_ID, DEFAULT_DRIVER.name);
          const driver = { ...DEFAULT_DRIVER, eta: 4 };
          setRiderState((prev) => ({
            ...prev,
            screen: 'driverArriving',
            driver,
          }));
          setTripPhase('arriving');
          toast('success', 'Driver assigned', `${driver.name} · fleet auto-match`);
          if (route.length) {
            setDriverMapPosition(interpolateRoute(route, 0));
            startDriverMovement(0, 18);
          }
        } catch {
          /* driver app accept */
        }
      }, 10000);
    }
  }, [riderState, driverState.online, route, startDriverMovement, toast]);

  const acceptRide = useCallback(
    async (rideId: string) => {
      if (autoAssignRef.current) clearTimeout(autoAssignRef.current);
      try {
        await tripApi.assignTrip(rideId, DRIVER_ID, DEFAULT_DRIVER.name);
      } catch {
        /* simulated accept */
      }

      const ride = driverState.incomingRides.find((r) => r.id === rideId);
      if (!ride) return;

      const driver: DriverInfo = {
        ...DEFAULT_DRIVER,
        vehicle:
          ride.vehicleType === 'bike'
            ? 'Honda Activa'
            : ride.vehicleType === 'auto'
              ? 'Bajaj RE'
              : DEFAULT_DRIVER.vehicle,
        eta: 4,
      };

      setDriverState((prev) => ({
        ...prev,
        acceptedRide: ride,
        incomingRides: [],
        screen: 'pickup',
      }));

      setRiderState((prev) => ({
        ...prev,
        screen: 'driverArriving',
        driver,
        rideId,
      }));
      setTripPhase('arriving');
      toast('success', 'Driver assigned', `${driver.name} is en route · ${driver.eta} min`);

      if (route.length) {
        setDriverMapPosition(interpolateRoute(route, 0));
        startDriverMovement(0, 18);
      }
    },
    [driverState.incomingRides, route, startDriverMovement, toast]
  );

  const rejectRide = useCallback(
    (rideId: string) => {
      setDriverState((prev) => ({
        ...prev,
        incomingRides: prev.incomingRides.filter((r) => r.id !== rideId),
      }));
      toast('info', 'Ride declined', 'Request returned to matching pool.');
    },
    [toast]
  );

  const startTrip = useCallback(() => {
    clearAnimations();
    if (riderState.rideId) {
      tripApi.startTrip(riderState.rideId).catch(() => {});
    }
    setTripPhase('inTrip');
    syncRiderScreen('inTrip');
    setRiderState((prev) => ({ ...prev, screen: 'inTrip', progress: 0 }));
    setDriverState((prev) => ({ ...prev, screen: 'inTrip', progress: 0 }));
    toast('success', 'Trip started', 'Live GPS tracking active.');

    animRef.current = setInterval(() => {
      setRiderState((prev) => {
        if (prev.progress >= 100) {
          if (animRef.current) clearInterval(animRef.current);
          setTimeout(() => {
            setTripPhase('payment');
            syncRiderScreen('payment');
            setDriverState((d) => ({ ...d, screen: 'home', acceptedRide: null }));
            toast('info', 'Trip completed', 'Proceed to payment.');
          }, 800);
          return prev;
        }
        const next = Math.min(100, prev.progress + 4 + Math.random() * 8);
        return { ...prev, progress: next };
      });
      setDriverState((prev) => ({
        ...prev,
        progress: Math.min(100, prev.progress + 4 + Math.random() * 8),
      }));
      setRiderState((prev) => {
        const pos = interpolateRoute(route, prev.progress);
        setDriverMapPosition(pos);
        return prev;
      });
    }, 1200);
  }, [route, riderState.rideId, clearAnimations, syncRiderScreen, toast]);

  useTripPolling({
    rideId: riderState.rideId,
    tripPhase,
    onTripUpdate: (trip) => {
      if (trip.driverName && tripPhase === 'arriving') {
        setRiderState((p) => ({
          ...p,
          driver: tripDtoToDriver(trip),
        }));
      }
    },
    onDriverPosition: (lat, lng) => setDriverMapPosition({ lat, lng }),
    onProgress: (progress, eta) => {
      setRiderState((p) => ({
        ...p,
        progress,
        driver: p.driver ? { ...p.driver, eta } : p.driver,
      }));
      setDriverState((d) => ({ ...d, progress }));
    },
    onPhaseSync: (phase) => {
      if (phase !== tripPhase && phase !== 'idle') {
        setTripPhase(phase);
        syncRiderScreen(phase);
      }
    },
  });

  const driverStartTrip = useCallback(() => {
    startTrip();
  }, [startTrip]);

  const completePayment = useCallback(() => {
    setTripPhase('rating');
    syncRiderScreen('rating');
  }, [syncRiderScreen]);

  const submitRating = useCallback(async () => {
    if (!riderState.rideId) return;
    try {
      await tripApi.completeTrip(riderState.rideId, riderState.rating, riderState.feedback);
    } catch {
      /* simulated */
    }
    clearAnimations();
    setTripPhase('idle');
    setRoute([]);
    setDriverMapPosition(null);
    setRiderState({
      ...initialRiderState,
    });
    setDriverState((prev) => ({
      ...prev,
      screen: 'home',
      acceptedRide: null,
      incomingRides: [],
      earnings: prev.earnings + (riderState.fare?.totalFare ?? 285),
      tripsToday: prev.tripsToday + 1,
    }));
    toast('success', 'Thanks for riding', 'Trip closed · fleet quality updated.');
  }, [riderState, clearAnimations, toast]);

  const cancelSearch = useCallback(() => {
    clearAnimations();
    setTripPhase('idle');
    setDriverState((prev) => ({ ...prev, incomingRides: [] }));
    setRiderState((prev) => ({ ...prev, screen: 'home', rideId: null, driver: null }));
    toast('info', 'Request cancelled', 'You can book again anytime.');
  }, [clearAnimations, toast]);

  const resetToHome = useCallback(() => {
    setTripPhase('idle');
    setRiderState((prev) => ({ ...prev, screen: 'home' }));
  }, []);

  const toggleOnline = useCallback(() => {
    const goingOnline = !driverState.online;
    setDriverState((prev) => ({ ...prev, online: goingOnline }));
    toast(
      goingOnline ? 'success' : 'info',
      goingOnline ? 'You are online' : 'You are offline',
      goingOnline ? 'Receiving demand from NCR hotspots.' : 'You will not get new requests.'
    );
    if (goingOnline && tripPhase === 'searching' && riderState.rideId) {
      const incoming: IncomingRide = {
        id: riderState.rideId,
        pickup: riderState.pickup,
        dropoff: riderState.dropoff,
        distance: Number(riderState.distance) || 5,
        fare: `₹${riderState.fare?.totalFare ?? 280}`,
        passenger: 'Rider',
        rating: 4.9,
        vehicleType: riderState.vehicleType,
      };
      setDriverState((prev) => ({
        ...prev,
        incomingRides: [incoming],
      }));
    }
  }, [driverState.online, tripPhase, riderState, toast]);

  const completeDriverTrip = useCallback(() => {
    clearAnimations();
    const fare = driverState.acceptedRide?.fare ?? '₹285';
    const amount = parseInt(fare.replace(/\D/g, ''), 10) || 285;
    setDriverState((prev) => ({
      ...prev,
      screen: 'home',
      acceptedRide: null,
      progress: 0,
      earnings: prev.earnings + amount,
      tripsToday: prev.tripsToday + 1,
    }));
    setDriverMapPosition(null);
    toast('success', 'Trip completed', `+${fare} added to earnings.`);
  }, [driverState.acceptedRide, clearAnimations, toast]);

  const value = useMemo(
    () => ({
      userType,
      setUserType,
      sidebarOpen,
      setSidebarOpen,
      riderState,
      setRiderState,
      driverState,
      adminState,
      tripPhase,
      route,
      pickupCoords,
      dropoffCoords,
      driverMapPosition,
      gpsStatus,
      isEstimating,
      routeSource,
      estimateFare: runEstimate,
      retryEstimate: runEstimate,
      bookRide,
      startTrip,
      completePayment,
      submitRating,
      cancelSearch,
      resetToHome,
      toggleOnline,
      acceptRide,
      rejectRide,
      driverStartTrip,
      completeDriverTrip,
      liveOps: adminState.liveOps,
      activeTripList: adminState.activeTripList,
    }),
    [
      userType,
      sidebarOpen,
      riderState,
      driverState,
      adminState,
      tripPhase,
      route,
      pickupCoords,
      dropoffCoords,
      driverMapPosition,
      gpsStatus,
      isEstimating,
      routeSource,
      runEstimate,
      bookRide,
      startTrip,
      completePayment,
      submitRating,
      cancelSearch,
      resetToHome,
      toggleOnline,
      acceptRide,
      rejectRide,
      driverStartTrip,
      completeDriverTrip,
      adminState.liveOps,
      adminState.activeTripList,
    ]
  );

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used within RideProvider');
  return ctx;
}

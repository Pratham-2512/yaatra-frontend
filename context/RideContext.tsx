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
import { tripApi, metricsToAdminState } from '@/services/tripApi';
import { useTripPolling, tripDtoToDriver } from '@/hooks/useTripPolling';
import {
  initialAdminState,
  initialDriverState,
  initialRiderState,
} from '@/lib/constants';
import type {
  AdminState,
  ChatMessage,
  DriverInfo,
  DriverState,
  GpsSyncStatus,
  IncomingRide,
  LngLat,
  NavRole,
  RiderState,
  TripPhase,
} from '@/lib/types';
import { useAuth } from './AuthContext';
import { calculateFare, VEHICLE_PRICING, type VehicleType } from '@/services/pricing';
import { resolveRoute } from '@/services/routing';
import { interpolateRoute } from '@/lib/geo';
import { insertRide } from '@/lib/supabaseRides';
import { saveTrip, localGetSession } from '@/lib/localAuth';
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
    case 'reached':
      return 'reached';
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
  acceptRide: (rideId: string) => void;
  rejectRide: (rideId: string) => void;
  driverStartTrip: () => void;
  completeDriverTrip: () => void;
  liveOps: import('@/lib/types').LiveOpsState;
  activeTripList: import('@/lib/types').ActiveTripSummary[];

  chatMessages: ChatMessage[];
  chatOpen: boolean;
  chatTyping: boolean;
  setChatOpen: (v: boolean) => void;
  sendChatMessage: (text: string) => void;
  unreadChatCount: number;
}

const RideContext = createContext<RideContextValue | null>(null);

const DRIVER_ID = 'DRV-001';

const DRIVER_AUTO_REPLIES = [
  'Got it! 👍',
  'Ok, on my way!',
  'I can see you on the map.',
  'Be there in a moment!',
  'Sure, no problem.',
];

const RIDER_AUTO_REPLIES = [
  'Thank you!',
  'Got it, I\'ll wait here.',
  'Ok, see you soon! 👋',
  'Sounds good.',
  'Perfect, thank you!',
];

// Simulated incoming rides for drivers (demo mode — no real rider needed)
const SIM_RIDES: IncomingRide[] = [
  { id: 'SIM-001', pickup: 'Cyber Hub, DLF Cyber City', dropoff: 'MG Road Metro, Gurgaon',   distance: 3.2, fare: '₹180', passenger: 'Priya S.',  rating: 4.8, vehicleType: 'sedan' },
  { id: 'SIM-002', pickup: 'Sector 22, Gurgaon',        dropoff: 'Huda City Centre Metro',    distance: 5.8, fare: '₹235', passenger: 'Rahul M.',  rating: 4.7, vehicleType: 'auto'  },
  { id: 'SIM-003', pickup: 'Golf Course Road, Gurgaon', dropoff: 'IFFCO Chowk, Gurgaon',     distance: 4.1, fare: '₹200', passenger: 'Amit K.',   rating: 4.9, vehicleType: 'sedan' },
  { id: 'SIM-004', pickup: 'DLF Phase 1, Gurgaon',      dropoff: 'Sector 29, Gurgaon',       distance: 2.9, fare: '₹165', passenger: 'Sneha R.',  rating: 4.6, vehicleType: 'mini'  },
  { id: 'SIM-005', pickup: 'Sohna Road, Gurgaon',       dropoff: 'Ambience Mall, Gurgaon',   distance: 6.3, fare: '₹260', passenger: 'Vikram P.', rating: 4.9, vehicleType: 'suv'   },
];

let simRideIndex = 0;

export function RideProvider({ children }: { children: React.ReactNode }) {
  const autoAssignRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reachedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simRideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { push: toast } = useToast();
  const { profile } = useAuth();
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driverMoveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [userType, setUserType] = useState<NavRole>('rider');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTyping, setChatTyping] = useState(false);
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
  const [routeSource, setRouteSource] = useState('none');

  const syncRiderScreen = useCallback((phase: TripPhase) => {
    setRiderState((p) => ({ ...p, screen: phaseToRiderScreen(phase) }));
  }, []);

  const clearAnimations = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current);
    if (driverMoveRef.current) clearInterval(driverMoveRef.current);
    animRef.current = null;
    driverMoveRef.current = null;
  }, []);

  const unreadChatCount = chatMessages.filter(
    (m) => !m.read && m.sender !== (userType === 'driver' ? 'driver' : 'rider')
  ).length;

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const isDriver = userType === 'driver';
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sender: isDriver ? 'driver' : 'rider',
        senderName: profile?.full_name ?? (isDriver ? 'Driver' : 'Rider'),
        text: text.trim(),
        timestamp: now,
        read: true,
      };
      setChatMessages((prev) => [...prev, msg]);
      setChatOpen(true);

      // Simulate typing indicator then reply from counterpart
      const replies = isDriver ? RIDER_AUTO_REPLIES : DRIVER_AUTO_REPLIES;
      const replyName = isDriver
        ? 'Rider'
        : (chatMessages.find((m) => m.sender === 'driver')?.senderName ?? 'Driver');
      setTimeout(() => setChatTyping(true), 600);
      setTimeout(() => {
        setChatTyping(false);
        const reply: ChatMessage = {
          id: `${Date.now()}-auto`,
          sender: isDriver ? 'rider' : 'driver',
          senderName: replyName,
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        setChatMessages((prev) => [...prev, reply]);
      }, 1800 + Math.random() * 600);
    },
    [userType, profile, chatMessages]
  );

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
      toast('warning', 'Add locations', 'Enter pickup and dropoff to get a fare estimate.');
      return;
    }
    setIsEstimating(true);
    setGpsStatus('syncing');
    setTripPhase('estimating');

    try {
      const result = await resolveRoute(
        riderState.pickup,
        riderState.dropoff
      );

      setRoute(result.route);
      setPickupCoords(result.pickup.coords);
      setDropoffCoords(result.dropoff.coords);
      setRouteSource(result.source);
      setGpsStatus('synced');

      const vt = riderState.vehicleType as VehicleType;
      const fare = calculateFare(vt, result.distanceKm);

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

      toast('success', 'Route ready', `${result.distanceKm.toFixed(1)} km · ~${result.durationMin} min`);
    } catch (e) {
      console.error(e);
      setTripPhase('idle');
      setGpsStatus('offline');
      toast('error', 'Estimate failed', 'Check the locations and try again.');
    } finally {
      setIsEstimating(false);
    }
  }, [riderState.pickup, riderState.dropoff, riderState.vehicleType, toast]);

  const startDriverMovement = useCallback(
    (fromProgress: number, toProgress: number, onDone?: () => void) => {
      if (route.length < 2) return;
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
    const fareStr = `₹${riderState.fare?.totalFare ?? VEHICLE_PRICING[vt].baseFare}`;
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

    insertRide({
      ride_id: rideId,
      pickup: riderState.pickup,
      dropoff: riderState.dropoff,
      distance_km: Number(riderState.distance) || 0,
      duration_min: riderState.duration ?? 0,
      fare: riderState.fare?.totalFare ?? VEHICLE_PRICING[vt].baseFare,
      vehicle_type: vt,
      status: 'searching',
    }).catch(() => {});

    if (driverState.online) {
      setDriverState((prev) => ({
        ...prev,
        incomingRides: [incoming],
      }));
      toast('info', 'Ride requested', 'Fleet partners notified in your zone.');
    } else {
      toast('info', 'Finding driver', 'Matching nearest available partner…');
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
    (rideId: string) => {
      if (autoAssignRef.current) clearTimeout(autoAssignRef.current);

      // Find the ride BEFORE any async work so we never hit a stale-closure miss
      const ride = driverState.incomingRides.find((r) => r.id === rideId);
      if (!ride) return;

      // Fire-and-forget the backend call — SIM ride IDs don't exist there, don't block UI
      tripApi.assignTrip(rideId, DRIVER_ID, DEFAULT_DRIVER.name).catch(() => {});

      const VEHICLE_MAP: Record<string, string> = {
        bike: 'Honda Activa', auto: 'Bajaj RE', mini: 'Maruti Swift', suv: 'Toyota Innova', premium: 'Mercedes E-Class',
      };
      const driver: DriverInfo = {
        ...DEFAULT_DRIVER,
        name: profile?.full_name ?? DEFAULT_DRIVER.name,
        vehicle: VEHICLE_MAP[ride.vehicleType ?? ''] ?? DEFAULT_DRIVER.vehicle,
        eta: 4,
      };

      // Update all state synchronously
      setDriverState((prev) => ({ ...prev, acceptedRide: ride, incomingRides: [], screen: 'pickup' }));
      setRiderState((prev) => ({ ...prev, screen: 'driverArriving', driver, rideId }));
      setTripPhase('arriving');
      toast('success', 'Ride accepted! 🚗', `Navigate to ${ride.pickup}`);

      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setChatMessages([{
        id: 'seed-0',
        sender: 'driver',
        senderName: driver.name,
        text: `Hi! I'm on my way. I'll be there in ${driver.eta} minutes. 🚗`,
        timestamp: now,
        read: false,
      }]);

      if (route.length >= 2) {
        // Real route available — animate driver movement
        setDriverMapPosition(interpolateRoute(route, 0));
        startDriverMovement(0, 18, () => {
          if (reachedTimerRef.current) clearTimeout(reachedTimerRef.current);
          reachedTimerRef.current = setTimeout(() => {
            setTripPhase((prev) => (prev === 'arriving' ? 'reached' : prev));
            syncRiderScreen('reached');
            toast('info', 'Arrived at pickup 📍', 'Waiting for passenger to board.');
          }, 800);
        });
      } else {
        // SIM ride — no route; trigger reached after a fixed delay
        if (reachedTimerRef.current) clearTimeout(reachedTimerRef.current);
        reachedTimerRef.current = setTimeout(() => {
          setTripPhase((prev) => (prev === 'arriving' ? 'reached' : prev));
          syncRiderScreen('reached');
          toast('info', 'Arrived at pickup 📍', 'Waiting for passenger to board.');
        }, 6000);
      }
    },
    [driverState.incomingRides, route, startDriverMovement, syncRiderScreen, toast]
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
    setDriverMapPosition(route.length > 1 ? interpolateRoute(route, 0) : pickupCoords);
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
      if (route.length > 1) {
        setRiderState((prev) => {
          setDriverMapPosition(interpolateRoute(route, prev.progress));
          return prev;
        });
      }
    }, 1200);
  }, [route, pickupCoords, riderState.rideId, clearAnimations, syncRiderScreen, toast]);

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
    const userId = localGetSession();
    if (userId) {
      saveTrip(userId, {
        pickup: riderState.pickup,
        dropoff: riderState.dropoff,
        vehicleType: riderState.vehicleType,
        fare: riderState.fare?.totalFare ?? 0,
        distanceKm: riderState.distance ?? '0',
        durationMin: riderState.duration ?? 0,
        status: 'completed',
        driverName: riderState.driver?.name ?? 'Fleet Partner',
        rating: riderState.rating,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
    clearAnimations();
    setTripPhase('idle');
    setRoute([]);
    setPickupCoords(null);
    setDropoffCoords(null);
    setRouteSource('none');
    setDriverMapPosition(null);
    setChatMessages([]);
    setChatOpen(false);
    setChatTyping(false);
    if (reachedTimerRef.current) clearTimeout(reachedTimerRef.current);
    setRiderState({ ...initialRiderState });
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
    setRoute([]);
    setPickupCoords(null);
    setDropoffCoords(null);
    setRouteSource('none');
    setDriverMapPosition(null);
    setChatMessages([]);
    setChatOpen(false);
    setChatTyping(false);
    if (reachedTimerRef.current) clearTimeout(reachedTimerRef.current);
    setDriverState((prev) => ({ ...prev, incomingRides: [] }));
    setRiderState((prev) => ({
      ...prev,
      screen: 'home',
      rideId: null,
      driver: null,
      fare: null,
      distance: null,
      duration: null,
      pickupLocation: null,
      dropoffLocation: null,
    }));
    toast('info', 'Request cancelled', 'You can book again anytime.');
  }, [clearAnimations, toast]);

  const resetToHome = useCallback(() => {
    setTripPhase('idle');
    setRiderState((prev) => ({ ...prev, screen: 'home' }));
  }, []);

  const toggleOnline = useCallback(() => {
    const goingOnline = !driverState.online;
    setDriverState((prev) => ({ ...prev, online: goingOnline }));

    if (!goingOnline) {
      // Clear pending sim ride when going offline
      if (simRideTimerRef.current) clearTimeout(simRideTimerRef.current);
      toast('info', 'You are offline', 'You will not receive new requests.');
      return;
    }

    toast('success', 'You are online', 'Scanning nearby hotspots for ride requests…');

    // If there is already a live ride being searched (rider in same session), surface it
    if (tripPhase === 'searching' && riderState.rideId) {
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
      setDriverState((prev) => ({ ...prev, incomingRides: [incoming] }));
      return;
    }

    // No live rider — simulate an incoming request after a realistic delay
    const delay = 7000 + Math.random() * 5000; // 7–12 s
    simRideTimerRef.current = setTimeout(() => {
      const ride = { ...SIM_RIDES[simRideIndex % SIM_RIDES.length] };
      ride.id = `SIM-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      simRideIndex += 1;
      setDriverState((prev) => {
        if (!prev.online || prev.incomingRides.length || prev.acceptedRide) return prev;
        return { ...prev, incomingRides: [ride] };
      });
      toast('info', 'New ride request! 🚀', `${ride.pickup} → ${ride.dropoff}`);
    }, delay);
  }, [driverState.online, tripPhase, riderState, toast]);

  const completeDriverTrip = useCallback(() => {
    clearAnimations();
    if (simRideTimerRef.current) clearTimeout(simRideTimerRef.current);
    const fare = driverState.acceptedRide?.fare ?? '₹285';
    const amount = parseInt(fare.replace(/\D/g, ''), 10) || 285;
    const userId = localGetSession();
    if (userId && driverState.acceptedRide) {
      saveTrip(userId, {
        pickup: driverState.acceptedRide.pickup,
        dropoff: driverState.acceptedRide.dropoff,
        vehicleType: driverState.acceptedRide.vehicleType ?? 'sedan',
        fare: amount,
        distanceKm: String(driverState.acceptedRide.distance),
        durationMin: 0,
        status: 'completed',
        driverName: 'Self',
        rating: 0,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
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
      chatMessages,
      chatOpen,
      chatTyping,
      setChatOpen,
      sendChatMessage,
      unreadChatCount,
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
      chatMessages,
      chatOpen,
      chatTyping,
      sendChatMessage,
      unreadChatCount,
    ]
  );

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used within RideProvider');
  return ctx;
}

import { saveTrip, getTrips } from './localAuth';

const NCR_PICKUPS = [
  'Sector 22, Gurgaon', 'Cyber Hub, DLF Cyber City', 'Huda City Centre Metro',
  'IFFCO Chowk, Gurgaon', 'Sector 29, Gurgaon', 'Sohna Road, Gurgaon',
  'Connaught Place, New Delhi', 'Karol Bagh, New Delhi', 'Lajpat Nagar, Delhi',
  'Noida Sector 18', 'Dwarka Sector 21', 'Indira Gandhi Airport T3',
];

const NCR_DROPS = [
  'Golf Course Road, Gurgaon', 'DLF Phase 1, Gurgaon', 'MG Road Metro, Gurgaon',
  'Saket Select Citywalk', 'Nehru Place, Delhi', 'Rajiv Chowk Metro, Delhi',
  'Unitech Cyber Park, Gurgaon', 'Ambience Mall, Gurgaon', 'Medanta Hospital, Gurgaon',
  'Sector 14, Gurgaon', 'Gurugram Bus Stand', 'Rapid Metro Sikanderpur',
];

const VEHICLES = ['bike', 'auto', 'sedan', 'suv'] as const;
const DRIVER_NAMES = ['Raj Kumar', 'Suresh Yadav', 'Vikram Patel', 'Amit Singh', 'Ravi Sharma', 'Deepak Nair'];

const BASE: Record<string, number> = { bike: 35, auto: 45, sedan: 80, suv: 120 };
const PER_KM: Record<string, number> = { bike: 8, auto: 10, sedan: 14, suv: 18 };

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function seedDemoTrips(userId: string, role: 'rider' | 'driver'): void {
  if (typeof window === 'undefined') return;
  const key = `yaatra_demo_seeded_${userId}`;
  if (localStorage.getItem(key)) return;

  const now = new Date();
  const count = role === 'driver' ? 28 : 16;

  for (let i = 0; i < count; i++) {
    const r = (n: number) => seededRandom(i * 17 + n);
    const daysAgo = Math.floor(r(0) * 85) + 1;
    const date = new Date(now.getTime() - daysAgo * 86_400_000);

    const pickupIdx = Math.floor(r(1) * NCR_PICKUPS.length);
    const dropoffIdx = Math.floor(r(2) * NCR_DROPS.length);
    const vehicle = VEHICLES[Math.floor(r(3) * VEHICLES.length)];
    const distKm = (3 + r(4) * 18).toFixed(1);
    const dur = Math.max(5, Math.round((Number(distKm) / 28) * 60));
    const fare = Math.round((BASE[vehicle] + Number(distKm) * PER_KM[vehicle]) * (r(5) > 0.8 ? 1.3 : 1));
    const status: 'completed' | 'cancelled' = r(6) > 0.18 ? 'completed' : 'cancelled';
    const rating = status === 'completed' ? Math.floor(3 + r(7) * 3) : 0;

    saveTrip(userId, {
      pickup: NCR_PICKUPS[pickupIdx],
      dropoff: NCR_DROPS[dropoffIdx],
      vehicleType: vehicle,
      fare: status === 'completed' ? fare : 0,
      distanceKm: distKm,
      durationMin: dur,
      status,
      driverName: role === 'driver' ? 'Self' : DRIVER_NAMES[Math.floor(r(8) * DRIVER_NAMES.length)],
      rating,
      createdAt: date.toISOString(),
      completedAt: date.toISOString(),
    });
  }

  localStorage.setItem(key, '1');
}

export function getFavoriteLocations(userId: string): { label: string; count: number }[] {
  const trips = getTrips(userId).filter((t) => t.status === 'completed');
  const freq: Record<string, number> = {};
  trips.forEach((t) => {
    freq[t.dropoff] = (freq[t.dropoff] ?? 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
}

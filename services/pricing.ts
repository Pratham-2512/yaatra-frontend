import type { VehicleType } from '@/lib/constants';

export type { VehicleType };

export interface VehicleConfig {
  label: string;
  icon: string;
  baseFare: number;
  perKm: number;
  avgSpeedKmh: number;
  description: string;
  category: 'economy' | 'standard' | 'premium';
}

export const VEHICLE_PRICING: Record<VehicleType, VehicleConfig> = {
  bike:    { label: 'Bike',    icon: '🏍️', baseFare: 35,  perKm: 8,  avgSpeedKmh: 32, description: 'Fastest through traffic', category: 'economy'  },
  auto:    { label: 'Auto',    icon: '🛺', baseFare: 45,  perKm: 10, avgSpeedKmh: 24, description: 'Budget city ride',        category: 'economy'  },
  mini:    { label: 'Mini',    icon: '🚕', baseFare: 65,  perKm: 12, avgSpeedKmh: 28, description: 'Compact & affordable',    category: 'economy'  },
  sedan:   { label: 'Sedan',   icon: '🚗', baseFare: 80,  perKm: 14, avgSpeedKmh: 28, description: 'Comfort commute',         category: 'standard' },
  suv:     { label: 'SUV',     icon: '🚙', baseFare: 120, perKm: 18, avgSpeedKmh: 25, description: 'Group travel',            category: 'standard' },
  premium: { label: 'Premium', icon: '🚘', baseFare: 150, perKm: 22, avgSpeedKmh: 30, description: 'Business class ride',     category: 'premium'  },
};

// 6 PM–10 PM: 1.3×  |  8 AM–10 AM: 1.15×  |  otherwise 1×
export function getSurgeFactor(): number {
  const h = new Date().getHours();
  if (h >= 18 && h < 22) return 1.3;
  if (h >= 8  && h < 10) return 1.15;
  return 1.0;
}

export function calculateFare(
  vehicleType: VehicleType,
  distanceKm: number
): {
  totalFare: number;
  base: number;
  distanceCharge: number;
  surge: number;
  surgeFactor: number;
  platformFee: number;
  tax: number;
} {
  const v = VEHICLE_PRICING[vehicleType];
  const surgeFactor = getSurgeFactor();
  const base = v.baseFare;
  const distanceCharge = Math.round(distanceKm * v.perKm);
  const subtotal = base + distanceCharge;
  const surged = Math.round(subtotal * surgeFactor);
  const surge = surged - subtotal;
  const platformFee = 15;
  const tax = Math.round((surged + platformFee) * 0.05);
  const totalFare = surged + platformFee + tax;
  return { totalFare, base, distanceCharge, surge, surgeFactor, platformFee, tax };
}

export function getVehicleQuote(
  vehicleType: VehicleType,
  distanceKm: number
): {
  fare: number;
  etaMin: number;
  label: string;
  icon: string;
  description: string;
  surgeFactor: number;
  category: string;
} {
  const v = VEHICLE_PRICING[vehicleType];
  const { totalFare, surgeFactor } = calculateFare(vehicleType, distanceKm);
  const etaMin = Math.max(1, Math.ceil((distanceKm / v.avgSpeedKmh) * 60));
  return { fare: totalFare, etaMin, label: v.label, icon: v.icon, description: v.description, surgeFactor, category: v.category };
}

export function estimatePriceFromKm(vehicleType: VehicleType, distanceKm: number): number {
  return calculateFare(vehicleType, distanceKm).totalFare;
}

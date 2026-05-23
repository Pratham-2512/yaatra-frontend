import type { VehicleType } from '@/lib/constants';

export type { VehicleType };

export interface VehiclePricing {
  label: string;
  icon: string;
  baseFare: number;
  perKm: number;
  etaMin: number;
  priceFrom: number;
  description: string;
}

export const VEHICLE_PRICING: Record<VehicleType, VehiclePricing> = {
  bike: { label: 'Bike', icon: '🏍️', baseFare: 25, perKm: 8, etaMin: 3, priceFrom: 89, description: 'Fastest' },
  auto: { label: 'Auto', icon: '🛺', baseFare: 35, perKm: 12, etaMin: 5, priceFrom: 140, description: 'Affordable' },
  sedan: { label: 'Sedan', icon: '🚗', baseFare: 50, perKm: 18, etaMin: 7, priceFrom: 280, description: 'Comfort' },
  suv: { label: 'SUV', icon: '🚙', baseFare: 80, perKm: 28, etaMin: 10, priceFrom: 420, description: 'Group ride' },
};

export function trafficMultiplier(durationMin: number, hour = new Date().getHours()): number {
  let m = 1;
  if (durationMin > 25) m += 0.12;
  if (hour >= 8 && hour <= 11) m += 0.08;
  if (hour >= 17 && hour <= 21) m += 0.15;
  return m;
}

export function surgeFactor(durationMin: number): number {
  return durationMin > 25 ? 1.15 : 1;
}

export function calculateFare(
  vehicleType: VehicleType,
  distanceKm: number,
  durationMin: number,
  trafficMult?: number
): { totalFare: number; base: number; distanceCharge: number; surge: number } {
  const p = VEHICLE_PRICING[vehicleType];
  const base = p.baseFare;
  const mult = trafficMult ?? trafficMultiplier(durationMin);
  const distanceCharge = Math.round(distanceKm * p.perKm * mult);
  const surge =
    durationMin > 25 ? Math.round(base * 0.15 * surgeFactor(durationMin)) : mult > 1.1 ? Math.round(base * 0.08) : 0;
  const totalFare = base + distanceCharge + surge;
  return { totalFare, base, distanceCharge, surge };
}

export function getVehicleQuote(
  vehicleType: VehicleType,
  distanceKm: number
): { fare: number; etaMin: number; label: string; description: string } {
  const p = VEHICLE_PRICING[vehicleType];
  const duration = estimateDurationFromKm(distanceKm);
  const fare = calculateFare(vehicleType, distanceKm, duration).totalFare;
  return { fare, etaMin: p.etaMin, label: p.label, description: p.description };
}

export function estimatePriceFromKm(vehicleType: VehicleType, distanceKm: number): number {
  return calculateFare(vehicleType, distanceKm, estimateDurationFromKm(distanceKm)).totalFare;
}

function estimateDurationFromKm(km: number): number {
  return Math.max(3, Math.ceil((km / 22) * 60));
}

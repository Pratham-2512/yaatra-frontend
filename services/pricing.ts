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

// Flat ₹50 base + ₹5 per km across all vehicle types.
// total = baseFare + (distanceKm × perKm)
// Example: 10 km → ₹50 + ₹50 = ₹100
export const VEHICLE_PRICING: Record<VehicleType, VehiclePricing> = {
  bike:  { label: 'Bike',  icon: '🏍️', baseFare: 50, perKm: 5, etaMin: 3,  priceFrom: 50, description: 'Fastest'    },
  auto:  { label: 'Auto',  icon: '🛺', baseFare: 50, perKm: 5, etaMin: 5,  priceFrom: 50, description: 'Affordable' },
  sedan: { label: 'Sedan', icon: '🚗', baseFare: 50, perKm: 5, etaMin: 7,  priceFrom: 50, description: 'Comfort'    },
  suv:   { label: 'SUV',   icon: '🚙', baseFare: 50, perKm: 5, etaMin: 10, priceFrom: 50, description: 'Group ride' },
};

export function calculateFare(
  vehicleType: VehicleType,
  distanceKm: number
): { totalFare: number; base: number; distanceCharge: number; surge: number } {
  const p = VEHICLE_PRICING[vehicleType];
  const base = p.baseFare;
  const distanceCharge = Math.round(distanceKm * p.perKm);
  const surge = 0;
  return { totalFare: base + distanceCharge, base, distanceCharge, surge };
}

export function getVehicleQuote(
  vehicleType: VehicleType,
  distanceKm: number
): { fare: number; etaMin: number; label: string; description: string } {
  const p = VEHICLE_PRICING[vehicleType];
  const { totalFare } = calculateFare(vehicleType, distanceKm);
  return { fare: totalFare, etaMin: p.etaMin, label: p.label, description: p.description };
}

export function estimatePriceFromKm(vehicleType: VehicleType, distanceKm: number): number {
  return calculateFare(vehicleType, distanceKm).totalFare;
}

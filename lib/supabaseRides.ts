// Trip history is persisted in localStorage via lib/localAuth.saveTrip.
// The Supabase `rides` table does not exist, so these are intentional no-ops.

export interface RideInsert {
  ride_id: string;
  pickup: string;
  dropoff: string;
  distance_km: number;
  duration_min: number;
  fare: number;
  vehicle_type: string;
  status: string;
}

export async function insertRide(_ride: RideInsert): Promise<void> {}

export async function updateRideStatus(_rideId: string, _status: string): Promise<void> {}

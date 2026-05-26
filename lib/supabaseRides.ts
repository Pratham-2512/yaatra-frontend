import { supabase } from './supabase';

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

/**
 * Persists a ride record to Supabase.
 * Never throws — Supabase being unavailable must not block the UI.
 */
export async function insertRide(ride: RideInsert): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('rides').insert({
    ...ride,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[supabase] ride insert failed:', error.message, '— ride_id:', ride.ride_id);
  } else {
    console.debug('[supabase] ride persisted:', ride.ride_id);
  }
}

/**
 * Updates the status of an existing ride row.
 * Silent on failure — backend is source of truth.
 */
export async function updateRideStatus(
  rideId: string,
  status: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('rides')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('ride_id', rideId);

  if (error) {
    console.error('[supabase] ride status update failed:', error.message);
  }
}

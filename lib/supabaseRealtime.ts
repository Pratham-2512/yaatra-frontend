import { type RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface DriverRow {
  id: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'in_trip';
  vehicle_type: 'bike' | 'auto' | 'sedan' | 'suv';
  heading?: number;
  updated_at?: string;
}

// Module-level channel ref — prevents duplicate subscriptions across renders
let driversChannel: RealtimeChannel | null = null;

/**
 * Subscribes to live driver position updates from the Supabase `drivers` table.
 * Returns a cleanup function — call it in useEffect cleanup or on unmount.
 * Safe to call multiple times; removes any existing channel first.
 */
export function subscribeToDrivers(onUpdate: (driver: DriverRow) => void): () => void {
  if (!supabase) {
    console.debug('[supabase] realtime not configured — driver sync disabled');
    return () => {};
  }

  // Remove stale channel before creating a new one
  if (driversChannel) {
    supabase.removeChannel(driversChannel);
    driversChannel = null;
  }

  driversChannel = supabase
    .channel('yaatra-drivers-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'drivers' },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onUpdate(payload.new as DriverRow);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.debug('[supabase] drivers realtime channel active');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[supabase] drivers realtime channel error');
      }
    });

  return () => {
    if (driversChannel && supabase) {
      supabase.removeChannel(driversChannel);
      driversChannel = null;
      console.debug('[supabase] drivers realtime channel removed');
    }
  };
}

/**
 * Subscribes to ride status changes for a specific ride_id.
 * Returns a cleanup function.
 */
export function subscribeToRide(
  rideId: string,
  onUpdate: (row: Record<string, unknown>) => void
): () => void {
  if (!supabase || !rideId) return () => {};

  const channel = supabase
    .channel(`yaatra-ride-${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => {
        if (payload.new) onUpdate(payload.new as Record<string, unknown>);
      }
    )
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}

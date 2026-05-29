'use client';

import { useEffect, useState } from 'react';
import { CommandCenter } from '@/components/command/CommandCenter';
import { ToastHost } from '@/components/common/ToastHost';
import { TripChat } from '@/components/chat/TripChat';
import { DriverHome, DriverInTrip, DriverPickup } from '@/components/driver/DriverFlow';
import { DriverDashboard } from '@/components/driver/DriverDashboard';
import { AppShell } from '@/components/layout/AppShell';
import MapPanel from '@/components/map/MapPanel';
import {
  RiderConfirm,
  RiderDriverArriving,
  RiderDriverReached,
  RiderHome,
  RiderInTrip,
  RiderPayment,
  RiderRating,
  RiderSearching,
} from '@/components/rider/RiderFlow';
import { RiderHistory } from '@/components/rider/RiderHistory';
import { useMapProps } from '@/hooks/useMapProps';
import { RideProvider, useRide } from '@/contexts/RideStateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { SCREEN_TITLES } from '@/lib/constants';
import type { MapMode, NavRole } from '@/lib/types';

// ── Shared tab bar used for both rider and driver ─────────────────────────────
function SubTabBar({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-3 flex rounded-xl border border-white/[0.06] bg-[#0a1020]/60 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
            value === opt.id
              ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-white ring-1 ring-orange-500/30'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const RIDER_TABS = [
  { id: 'book', label: '🗺 Plan trip' },
  { id: 'history', label: '📋 My trips' },
];

const DRIVER_TABS = [
  { id: 'drive', label: '🛺 Drive' },
  { id: 'earnings', label: '📊 Earnings' },
];

// ── Main shell ────────────────────────────────────────────────────────────────
function YaatraShell() {
  const { profile, session } = useAuth();
  const {
    userType,
    setUserType,
    sidebarOpen,
    setSidebarOpen,
    riderState,
    driverState,
    adminState,
    tripPhase,
  } = useRide();

  const [riderTab, setRiderTab] = useState<'book' | 'history'>('book');
  const [driverTab, setDriverTab] = useState<'drive' | 'earnings'>('drive');

  // Force userType to match the authenticated role
  useEffect(() => {
    if (profile?.role === 'rider') setUserType('rider');
    else if (profile?.role === 'driver') setUserType('driver');
    // admin has no profile role restriction — can switch freely
  }, [profile, setUserType]);

  // Reset sub-tabs when switching roles
  useEffect(() => {
    setRiderTab('book');
    setDriverTab('drive');
  }, [userType]);

  // When a trip starts, switch back to the booking tab
  useEffect(() => {
    if (tripPhase !== 'idle' && riderTab === 'history') setRiderTab('book');
  }, [tripPhase, riderTab]);

  // Allowed nav items based on role
  const allowedNavIds: string[] =
    profile?.role === 'rider'
      ? ['rider']
      : profile?.role === 'driver'
        ? ['driver']
        : ['rider', 'driver', 'admin'];

  const currentScreen =
    userType === 'rider'
      ? riderState.screen
      : userType === 'driver'
        ? driverState.screen
        : 'command';

  const currentTitle = () => {
    if (userType === 'rider') {
      if (riderTab === 'history') return 'My trips';
      return SCREEN_TITLES[riderState.screen] ?? 'Book a ride';
    }
    if (userType === 'driver') {
      if (driverTab === 'earnings') return 'Earnings & analytics';
      return SCREEN_TITLES[driverState.screen] ?? 'Drive';
    }
    return SCREEN_TITLES.command;
  };

  const subtitle =
    userType === 'admin'
      ? 'Command center'
      : userType === 'driver'
        ? 'Fleet partner'
        : 'Rider';

  const mapMode: MapMode = userType === 'driver' ? 'driver' : 'rider';
  const mapProps = useMapProps(mapMode);
  const isAdmin = userType === 'admin';

  // Tab bar for the home screens
  const riderTabBar =
    riderState.screen === 'home' || riderTab === 'history' ? (
      <SubTabBar options={RIDER_TABS} value={riderTab} onChange={(id) => setRiderTab(id as 'book' | 'history')} />
    ) : null;

  const driverTabBar =
    driverState.screen === 'home' || driverTab === 'earnings' ? (
      <SubTabBar options={DRIVER_TABS} value={driverTab} onChange={(id) => setDriverTab(id as 'drive' | 'earnings')} />
    ) : null;

  const renderContent = () => {
    if (userType === 'rider') {
      if (riderTab === 'history') return <RiderHistory tabBar={riderTabBar} />;
      switch (riderState.screen) {
        case 'confirm':      return <RiderConfirm />;
        case 'searching':    return <RiderSearching />;
        case 'driverArriving': return <RiderDriverArriving />;
        case 'reached':        return <RiderDriverReached />;
        case 'inTrip':       return <RiderInTrip />;
        case 'payment':      return <RiderPayment />;
        case 'rating':       return <RiderRating />;
        default:             return <RiderHome tabBar={riderTabBar} />;
      }
    }
    if (userType === 'driver') {
      if (driverTab === 'earnings') return <DriverDashboard tabBar={driverTabBar} />;
      if (driverState.screen === 'inTrip') return <DriverInTrip />;
      if (driverState.screen === 'pickup') return <DriverPickup />;
      return <DriverHome tabBar={driverTabBar} />;
    }
    return <CommandCenter adminState={adminState} tripPhase={tripPhase} />;
  };

  return (
    <>
      <AppShell
        userType={userType}
        setUserType={setUserType}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        title={currentTitle()}
        subtitle={subtitle}
        allowedNavIds={allowedNavIds}
      >
        <div className="flex h-full min-h-0 animate-fade-in flex-col lg:flex-row">
          <MapPanel
            {...mapProps}
            showFleet={isAdmin}
            showHeatmap={isAdmin}
            showHotspots={isAdmin}
            showDebug={isAdmin}
            className="lg:min-h-0 lg:flex-[1.2]"
          />
          {renderContent()}
        </div>
      </AppShell>
      <TripChat />
      <ToastHost />
    </>
  );
}

export default function YaatraApp() {
  return (
    <AuthProvider>
      <AuthGate>
        <ToastProvider>
          <RideProvider>
            <YaatraShell />
          </RideProvider>
        </ToastProvider>
      </AuthGate>
    </AuthProvider>
  );
}

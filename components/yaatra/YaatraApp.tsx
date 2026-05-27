'use client';

import { CommandCenter } from '@/components/command/CommandCenter';
import { ToastHost } from '@/components/common/ToastHost';
import { DriverHome, DriverInTrip, DriverPickup } from '@/components/driver/DriverFlow';
import { AppShell } from '@/components/layout/AppShell';
import MapPanel from '@/components/map/MapPanel';
import {
  RiderConfirm,
  RiderDriverArriving,
  RiderHome,
  RiderInTrip,
  RiderPayment,
  RiderRating,
  RiderSearching,
} from '@/components/rider/RiderFlow';
import { useMapProps } from '@/hooks/useMapProps';
import { RideProvider, useRide } from '@/contexts/RideStateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { SCREEN_TITLES } from '@/lib/constants';
import type { MapMode } from '@/lib/types';

function YaatraShell() {
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

  const currentScreen =
    userType === 'rider'
      ? riderState.screen
      : userType === 'driver'
        ? driverState.screen
        : 'command';

  const subtitle =
    userType === 'admin'
      ? 'Command center'
      : userType === 'driver'
        ? 'Fleet partner'
        : 'Rider';

  const mapMode: MapMode = userType === 'driver' ? 'driver' : 'rider';
  const mapProps = useMapProps(mapMode);
  const isAdmin = userType === 'admin';

  const renderContent = () => {
    if (userType === 'rider') {
      switch (riderState.screen) {
        case 'confirm':
          return <RiderConfirm />;
        case 'searching':
          return <RiderSearching />;
        case 'driverArriving':
          return <RiderDriverArriving />;
        case 'inTrip':
          return <RiderInTrip />;
        case 'payment':
          return <RiderPayment />;
        case 'rating':
          return <RiderRating />;
        default:
          return <RiderHome />;
      }
    }
    if (userType === 'driver') {
      if (driverState.screen === 'inTrip') return <DriverInTrip />;
      if (driverState.screen === 'pickup') return <DriverPickup />;
      return <DriverHome />;
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
        title={SCREEN_TITLES[currentScreen] ?? SCREEN_TITLES.command}
        subtitle={subtitle}
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

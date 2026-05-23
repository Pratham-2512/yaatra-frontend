'use client';

import { CommandCenter } from '@/components/command/CommandCenter';
import { ToastHost } from '@/components/common/ToastHost';
import { DriverHome, DriverInTrip, DriverPickup } from '@/components/driver/DriverFlow';
import { AppShell } from '@/components/layout/AppShell';
import {
  RiderConfirm,
  RiderDriverArriving,
  RiderHome,
  RiderInTrip,
  RiderPayment,
  RiderRating,
  RiderSearching,
} from '@/components/rider/RiderFlow';
import { RideProvider, useRide } from '@/contexts/RideStateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SCREEN_TITLES } from '@/lib/constants';

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
        <div className="h-full min-h-0 animate-fade-in">{renderContent()}</div>
      </AppShell>
      <ToastHost />
    </>
  );
}

export default function YaatraApp() {
  return (
    <ToastProvider>
      <RideProvider>
        <YaatraShell />
      </RideProvider>
    </ToastProvider>
  );
}

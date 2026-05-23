import type { ActiveTripSummary } from '@/types';

export const DEMO_ACTIVE_TRIPS: ActiveTripSummary[] = [
  { id: 'T-8841', route: 'Cyber Hub → Huda City', status: 'inprogress', delayed: false },
  { id: 'T-8840', route: 'Sector 22 → MG Road', status: 'arriving', delayed: true },
  { id: 'T-8839', route: 'IFFCO → Sohna Rd', status: 'searching', delayed: false },
];

export const CONGESTION_ALERTS = [
  { corridor: 'MG Road', severity: 'high', delayMin: 12 },
  { corridor: 'Sohna Road', severity: 'medium', delayMin: 7 },
  { corridor: 'Cyber Hub', severity: 'low', delayMin: 3 },
];

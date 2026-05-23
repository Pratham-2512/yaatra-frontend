import type { LngLat } from '@/lib/types';

export interface ResolvedLocation {
  raw: string;
  normalized: string;
  coords: LngLat;
  zoneId: string | null;
  matched: boolean;
}

interface NcrZone {
  id: string;
  keywords: string[];
  address: string;
  lng: number;
  lat: number;
}

const GURGAON_SUFFIX = ', Gurgaon, Haryana, India';
const DELHI_SUFFIX = ', Delhi, India';
const NCR_SUFFIX = ', National Capital Region, India';

const NCR_ZONES: NcrZone[] = [
  { id: 'cyber-hub', keywords: ['cyber hub', 'dlf cyber', 'cyberhub'], address: 'Cyber Hub' + GURGAON_SUFFIX, lng: 77.0825, lat: 28.4942 },
  { id: 'huda-city', keywords: ['huda city', 'huda metro', 'huda city center'], address: 'Huda City Centre Metro' + GURGAON_SUFFIX, lng: 77.0728, lat: 28.4591 },
  { id: 'mg-road', keywords: ['mg road gurgaon', 'mg road'], address: 'MG Road' + GURGAON_SUFFIX, lng: 77.068, lat: 28.481 },
  { id: 'iffco', keywords: ['iffco', 'iffco chowk'], address: 'IFFCO Chowk' + GURGAON_SUFFIX, lng: 77.072, lat: 28.472 },
  { id: 'golf-course', keywords: ['golf course road', 'gcr'], address: 'Golf Course Road' + GURGAON_SUFFIX, lng: 77.095, lat: 28.455 },
  { id: 'sohna-road', keywords: ['sohna road', 'sohna rd'], address: 'Sohna Road' + GURGAON_SUFFIX, lng: 77.055, lat: 28.438 },
  { id: 'udyog-vihar', keywords: ['udyog vihar'], address: 'Udyog Vihar' + GURGAON_SUFFIX, lng: 77.085, lat: 28.502 },
  { id: 'sector-29', keywords: ['sector 29', 'sec 29'], address: 'Sector 29' + GURGAON_SUFFIX, lng: 77.078, lat: 28.465 },
  { id: 'sector-14', keywords: ['sector 14', 'sec 14'], address: 'Sector 14' + GURGAON_SUFFIX, lng: 77.042, lat: 28.474 },
  { id: 'sector-22', keywords: ['sector 22', 'sec 22'], address: 'Sector 22' + GURGAON_SUFFIX, lng: 77.048, lat: 28.508 },
  { id: 'sector-23', keywords: ['sector 23', 'sec 23'], address: 'Sector 23' + GURGAON_SUFFIX, lng: 77.052, lat: 28.512 },
  { id: 'sector-43', keywords: ['sector 43', 'sec 43'], address: 'Sector 43' + GURGAON_SUFFIX, lng: 77.09, lat: 28.448 },
  { id: 'sector-44', keywords: ['sector 44', 'sec 44'], address: 'Sector 44' + GURGAON_SUFFIX, lng: 77.095, lat: 28.452 },
  { id: 'sector-56', keywords: ['sector 56', 'sec 56'], address: 'Sector 56' + GURGAON_SUFFIX, lng: 77.098, lat: 28.418 },
  { id: 'gurgaon-railway', keywords: ['gurgaon station', 'gurgaon railway'], address: 'Gurgaon Railway Station' + GURGAON_SUFFIX, lng: 77.028, lat: 28.485 },
  { id: 'connaught', keywords: ['connaught', 'cp delhi', 'rajiv chowk'], address: 'Connaught Place' + DELHI_SUFFIX, lng: 77.209, lat: 28.6315 },
  { id: 'dwarka', keywords: ['dwarka'], address: 'Dwarka' + DELHI_SUFFIX, lng: 77.0402, lat: 28.5921 },
  { id: 'noida-18', keywords: ['noida sec 18', 'sector 18 noida', 'noida'], address: 'Sector 18, Noida' + NCR_SUFFIX, lng: 77.324, lat: 28.5706 },
  { id: 'aerocity', keywords: ['aerocity', 'igi'], address: 'Aerocity' + DELHI_SUFFIX, lng: 77.12, lat: 28.556 },
  { id: 'nehru-place', keywords: ['nehru place'], address: 'Nehru Place' + DELHI_SUFFIX, lng: 77.25, lat: 28.549 },
];

const SECTOR_REGEX = /sector\s*(\d+)|sec\.?\s*(\d+)/i;

export function normalizeNcrLocation(input: string): ResolvedLocation {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return {
      raw,
      normalized: 'Gurgaon, Haryana, India',
      coords: { lng: 77.1025, lat: 28.4595 },
      zoneId: 'gurgaon-default',
      matched: false,
    };
  }

  for (const zone of NCR_ZONES) {
    if (zone.keywords.some((k) => lower.includes(k))) {
      return {
        raw,
        normalized: zone.address,
        coords: { lng: zone.lng, lat: zone.lat },
        zoneId: zone.id,
        matched: true,
      };
    }
  }

  const sectorMatch = lower.match(SECTOR_REGEX);
  if (sectorMatch) {
    const num = sectorMatch[1] || sectorMatch[2];
    const address = `Sector ${num}${GURGAON_SUFFIX}`;
    const offset = (parseInt(num, 10) % 20) * 0.002;
    return {
      raw,
      normalized: address,
      coords: { lng: 77.04 + offset, lat: 28.45 + offset * 0.8 },
      zoneId: `sector-${num}`,
      matched: true,
    };
  }

  if (lower.includes('gurgaon') || lower.includes('gurugram')) {
    return {
      raw,
      normalized: raw.includes('India') ? raw : `${raw}${GURGAON_SUFFIX}`,
      coords: { lng: 77.0689, lat: 28.4595 },
      zoneId: 'gurgaon-generic',
      matched: true,
    };
  }

  if (lower.includes('delhi')) {
    return {
      raw,
      normalized: raw.includes('India') ? raw : `${raw}${DELHI_SUFFIX}`,
      coords: { lng: 77.209, lat: 28.6139 },
      zoneId: 'delhi-generic',
      matched: true,
    };
  }

  return {
    raw,
    normalized: `${raw}${GURGAON_SUFFIX}`,
    coords: { lng: 77.08 + (raw.length % 10) * 0.003, lat: 28.46 + (raw.length % 8) * 0.002 },
    zoneId: null,
    matched: false,
  };
}

/** Build interpolated route polyline between two points */
export function approximateRoutePath(from: LngLat, to: LngLat, points = 12): LngLat[] {
  const path: LngLat[] = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const curve = Math.sin(t * Math.PI) * 0.003;
    path.push({
      lng: from.lng + (to.lng - from.lng) * t + curve,
      lat: from.lat + (to.lat - from.lat) * t - curve * 0.5,
    });
  }
  return path;
}

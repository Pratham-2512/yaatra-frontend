import { type NextRequest, NextResponse } from 'next/server';

// NCR lookup table — mirrors backend/Helpers/NcrGeocoding.cs
// Returns Nominatim-compatible shape: [{ lat, lon, display_name }]
const ZONES: { keywords: string[]; lng: number; lat: number; address: string }[] = [
  // ── Gurgaon / Gurugram ────────────────────────────────────────────────────
  { keywords: ['cyber hub', 'cyberhub', 'dlf cyber hub'], lng: 77.0825, lat: 28.4942, address: 'Cyber Hub, Gurgaon' },
  { keywords: ['cyber city', 'dlf cyber city'],           lng: 77.0875, lat: 28.4960, address: 'DLF Cyber City, Gurgaon' },
  { keywords: ['huda city', 'huda metro'],                lng: 77.0728, lat: 28.4591, address: 'Huda City Centre, Gurgaon' },
  { keywords: ['mg road', 'm.g. road'],                   lng: 77.0680, lat: 28.4810, address: 'MG Road, Gurgaon' },
  { keywords: ['iffco chowk', 'iffco'],                   lng: 77.0720, lat: 28.4720, address: 'IFFCO Chowk, Gurgaon' },
  { keywords: ['sohna road', 'sohna'],                    lng: 77.0300, lat: 28.4230, address: 'Sohna Road, Gurgaon' },
  { keywords: ['golf course road', 'golf course ext'],    lng: 77.1000, lat: 28.4500, address: 'Golf Course Road, Gurgaon' },
  { keywords: ['dlf phase 1', 'dlf 1'],                   lng: 77.0891, lat: 28.4726, address: 'DLF Phase 1, Gurgaon' },
  { keywords: ['dlf phase 2', 'dlf 2'],                   lng: 77.0918, lat: 28.4690, address: 'DLF Phase 2, Gurgaon' },
  { keywords: ['dlf phase 3', 'dlf 3'],                   lng: 77.0950, lat: 28.4930, address: 'DLF Phase 3, Gurgaon' },
  { keywords: ['dlf phase 4', 'dlf 4'],                   lng: 77.0895, lat: 28.4626, address: 'DLF Phase 4, Gurgaon' },
  { keywords: ['dlf phase 5', 'dlf 5'],                   lng: 77.1000, lat: 28.4570, address: 'DLF Phase 5, Gurgaon' },
  { keywords: ['palam vihar', 'palam'],                   lng: 77.0100, lat: 28.5200, address: 'Palam Vihar, Gurgaon' },
  { keywords: ['manesar'],                                lng: 76.9380, lat: 28.3580, address: 'Manesar, Gurgaon' },
  { keywords: ['sector 14', 'sec 14'],                    lng: 77.0350, lat: 28.4700, address: 'Sector 14, Gurgaon' },
  { keywords: ['sector 15', 'sec 15'],                    lng: 77.0380, lat: 28.4680, address: 'Sector 15, Gurgaon' },
  { keywords: ['sector 18', 'sec 18'],                    lng: 77.0400, lat: 28.4650, address: 'Sector 18, Gurgaon' },
  { keywords: ['sector 22', 'sec 22'],                    lng: 77.0480, lat: 28.5080, address: 'Sector 22, Gurgaon' },
  { keywords: ['sector 29', 'sec 29'],                    lng: 77.0560, lat: 28.4760, address: 'Sector 29, Gurgaon' },
  { keywords: ['sector 31', 'sec 31'],                    lng: 77.0580, lat: 28.4600, address: 'Sector 31, Gurgaon' },
  { keywords: ['sector 43', 'sec 43'],                    lng: 77.0900, lat: 28.4480, address: 'Sector 43, Gurgaon' },
  { keywords: ['sector 44', 'sec 44'],                    lng: 77.0920, lat: 28.4460, address: 'Sector 44, Gurgaon' },
  { keywords: ['sector 45', 'sec 45'],                    lng: 77.0940, lat: 28.4440, address: 'Sector 45, Gurgaon' },
  { keywords: ['sector 46', 'sec 46'],                    lng: 77.0960, lat: 28.4410, address: 'Sector 46, Gurgaon' },
  { keywords: ['sector 47', 'sec 47'],                    lng: 77.0980, lat: 28.4390, address: 'Sector 47, Gurgaon' },
  { keywords: ['sector 48', 'sec 48'],                    lng: 77.1000, lat: 28.4370, address: 'Sector 48, Gurgaon' },
  { keywords: ['sector 56', 'sec 56'],                    lng: 77.1100, lat: 28.4250, address: 'Sector 56, Gurgaon' },
  // ── Delhi ─────────────────────────────────────────────────────────────────
  { keywords: ['connaught place', 'connaught', 'cp delhi', 'cp'],
                                                          lng: 77.2090, lat: 28.6315, address: 'Connaught Place, New Delhi' },
  { keywords: ['india gate'],                             lng: 77.2295, lat: 28.6129, address: 'India Gate, New Delhi' },
  { keywords: ['lajpat nagar', 'lajpat'],                 lng: 77.2432, lat: 28.5671, address: 'Lajpat Nagar, Delhi' },
  { keywords: ['south ext', 'south extension'],           lng: 77.2185, lat: 28.5720, address: 'South Extension, Delhi' },
  { keywords: ['saket'],                                  lng: 77.2144, lat: 28.5249, address: 'Saket, Delhi' },
  { keywords: ['vasant kunj', 'vasant'],                  lng: 77.1587, lat: 28.5214, address: 'Vasant Kunj, Delhi' },
  { keywords: ['janakpuri'],                              lng: 77.0838, lat: 28.6250, address: 'Janakpuri, Delhi' },
  { keywords: ['dwarka sector 21', 'dwarka 21'],          lng: 77.0502, lat: 28.5525, address: 'Dwarka Sector 21, Delhi' },
  { keywords: ['dwarka'],                                 lng: 77.0402, lat: 28.5921, address: 'Dwarka, Delhi' },
  { keywords: ['rohini'],                                 lng: 77.1000, lat: 28.7300, address: 'Rohini, Delhi' },
  { keywords: ['pitampura'],                              lng: 77.1310, lat: 28.7020, address: 'Pitampura, Delhi' },
  { keywords: ['airport', 'igi', 't1', 't2', 't3'],       lng: 77.0886, lat: 28.5562, address: 'IGI Airport, Delhi' },
  { keywords: ['new delhi railway', 'ndls', 'new delhi station'],
                                                          lng: 77.2090, lat: 28.6420, address: 'New Delhi Railway Station' },
  // ── Noida ─────────────────────────────────────────────────────────────────
  { keywords: ['sector 18 noida', 'noida sector 18'],     lng: 77.3240, lat: 28.5706, address: 'Sector 18, Noida' },
  { keywords: ['sector 62 noida', 'noida sector 62'],     lng: 77.3660, lat: 28.6270, address: 'Sector 62, Noida' },
  { keywords: ['sector 15 noida', 'noida sector 15'],     lng: 77.3120, lat: 28.5850, address: 'Sector 15, Noida' },
  { keywords: ['sector 128', 'noida expressway'],         lng: 77.3270, lat: 28.5270, address: 'Noida Expressway, Noida' },
  { keywords: ['noida'],                                  lng: 77.3910, lat: 28.5355, address: 'Noida, Uttar Pradesh' },
  // ── Faridabad / Ghaziabad ─────────────────────────────────────────────────
  { keywords: ['faridabad'],                              lng: 77.3178, lat: 28.4089, address: 'Faridabad, Haryana' },
  { keywords: ['ghaziabad'],                              lng: 77.4538, lat: 28.6692, address: 'Ghaziabad, Uttar Pradesh' },
];

interface GeoResult {
  lat: string;
  lon: string;
  display_name: string;
}

function resolve(input: string): GeoResult | null {
  const lower = input.trim().toLowerCase();
  if (!lower) return null;

  // Exact zone match
  for (const zone of ZONES) {
    if (zone.keywords.some((k) => lower.includes(k))) {
      return { lat: String(zone.lat), lon: String(zone.lng), display_name: zone.address };
    }
  }

  // Generic sector pattern: "sector 34" / "sec 34" (Gurgaon grid offset)
  const sectorMatch = lower.match(/sector\s*(\d+)|sec\.?\s*(\d+)/);
  if (sectorMatch) {
    const num = parseInt(sectorMatch[1] ?? sectorMatch[2], 10);
    const offset = (num % 20) * 0.002;
    return {
      lat: String((28.45 + offset * 0.8).toFixed(5)),
      lon: String((77.04 + offset).toFixed(5)),
      display_name: `Sector ${num}, Gurgaon`,
    };
  }

  // City-level fallbacks
  if (lower.includes('gurgaon') || lower.includes('gurugram'))
    return { lat: '28.4595', lon: '77.0689', display_name: `${input.trim()}, Gurgaon` };
  if (lower.includes('delhi'))
    return { lat: '28.6139', lon: '77.2090', display_name: `${input.trim()}, Delhi` };
  if (lower.includes('noida'))
    return { lat: '28.5355', lon: '77.3910', display_name: `${input.trim()}, Noida` };

  // Last-resort jitter within NCR so the map at least shows something
  const seed = lower.length;
  return {
    lat: String((28.46 + (seed % 8) * 0.002).toFixed(5)),
    lon: String((77.08 + (seed % 10) * 0.003).toFixed(5)),
    display_name: `${input.trim()}, NCR`,
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q?.trim()) return NextResponse.json([], { status: 200 });

  const result = resolve(q);
  if (!result) return NextResponse.json([], { status: 200 });

  return NextResponse.json([result], {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}

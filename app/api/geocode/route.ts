import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  const params = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'in' });

  let res: Response;
  try {
    res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'Yaatra/1.0 (ride-hailing demo; contact: demo@yaatra.app)',
        Accept: 'application/json',
      },
    });
  } catch (err) {
    console.error('[geocode] Nominatim unreachable:', err);
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  });
}

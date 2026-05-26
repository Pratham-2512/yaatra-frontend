import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const coords = request.nextUrl.searchParams.get('coords');
  if (!coords) return NextResponse.json({ error: 'coords is required' }, { status: 400 });

  let res: Response;
  try {
    res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { headers: { Accept: 'application/json' } }
    );
  } catch (err) {
    console.error('[osrm] router unreachable:', err);
    return NextResponse.json({ error: 'Routing service unavailable' }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Routing failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

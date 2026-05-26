'use client';

import { useEffect, useMemo, useRef } from 'react';
import maplibregl, { Marker, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEMAND_ZONES, FLEET_SEED } from '@/lib/geo';

interface MapPoint {
  lat: number;
  lng: number;
}

interface FleetMapProps {
  pickup?: MapPoint | null;
  dropoff?: MapPoint | null;
  driverPosition?: MapPoint | null;
  route?: [number, number][];
  showFleet?: boolean;
  showHeatmap?: boolean;
  showHotspots?: boolean;
  showDebug?: boolean;
}

const ROUTE_SOURCE_ID = 'yaatra-route';
const ROUTE_LAYER_ID = 'yaatra-route-line';
const HEAT_SOURCE_ID = 'yaatra-heat';
const HEAT_LAYER_ID = 'yaatra-heat-layer';
const HOTSPOT_SOURCE_ID = 'yaatra-hotspots';
const HOTSPOT_LAYER_ID = 'yaatra-hotspots-layer';

// Runtime-safe validators — typed as `unknown` so they guard against
// malformed API payloads, NaN, Infinity, partial tuples, or string coercions
// that TypeScript types alone cannot prevent at runtime.
function isValidCoord(coord: unknown): coord is [number, number] {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number' &&
    Number.isFinite(coord[0]) &&
    Number.isFinite(coord[1])
  );
}

function isValidPoint(p: unknown): p is MapPoint {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.lng === 'number' &&
    typeof obj.lat === 'number' &&
    Number.isFinite(obj.lng) &&
    Number.isFinite(obj.lat)
  );
}

function pointToLngLat(point: MapPoint): [number, number] {
  return [point.lng, point.lat];
}

function makeMarker(color: string) {
  return new Marker({ color });
}

function fmt(n: number): string {
  return n.toFixed(5);
}

export default function FleetMap({
  pickup,
  dropoff,
  driverPosition,
  route = [],
  showFleet = false,
  showHeatmap = false,
  showHotspots = false,
  showDebug = false,
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef(false);
  const pickupMarkerRef = useRef<Marker | null>(null);
  const dropoffMarkerRef = useRef<Marker | null>(null);
  const driverMarkerRef = useRef<Marker | null>(null);
  const fleetMarkersRef = useRef<Marker[]>([]);
  const debugElRef = useRef<HTMLDivElement | null>(null);

  // Each sync ref holds the latest-closure sync function for its domain.
  // The single map.once('load', ...) in the init effect calls these,
  // eliminating duplicate once registrations and stale closures: no matter
  // how many renders happen before the map loads, the ref always points to
  // the closure that captured the most-recent prop values.
  const syncMarkersRef = useRef<(() => void) | null>(null);
  const syncRouteRef = useRef<(() => void) | null>(null);
  const syncFleetRef = useRef<(() => void) | null>(null);
  const syncHeatmapRef = useRef<(() => void) | null>(null);
  const syncHotspotsRef = useRef<(() => void) | null>(null);
  const syncBoundsRef = useRef<(() => void) | null>(null);

  // Read at init-effect time without making showDebug a dep of that effect,
  // which would cause a full map teardown on every debug toggle.
  const showDebugRef = useRef(showDebug);

  const routeKey = useMemo(
    () =>
      route
        .filter((c): c is [number, number] => isValidCoord(c))
        .map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
        .join('|'),
    [route]
  );

  // Toggle debug overlay visibility without remounting the map.
  useEffect(() => {
    showDebugRef.current = showDebug;
    if (debugElRef.current) {
      debugElRef.current.style.display = showDebug ? 'block' : 'none';
    }
  }, [showDebug]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: 'OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
      },
      center: [77.1025, 28.4595],
      zoom: 11,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Debug overlay — imperative DOM mutations so map events never trigger
    // React re-renders; the div is always created but hidden when showDebug=false.
    const debugEl = document.createElement('div');
    debugEl.style.cssText = [
      'position:absolute',
      'bottom:10px',
      'left:10px',
      'z-index:100',
      'font:10px/1.7 "SF Mono",ui-monospace,monospace',
      'color:#22d3ee',
      'background:rgba(8,13,24,0.88)',
      'border:1px solid rgba(34,211,238,0.18)',
      'border-radius:6px',
      'padding:5px 9px',
      'pointer-events:none',
      'white-space:pre',
      'letter-spacing:0.03em',
    ].join(';');
    debugEl.style.display = showDebugRef.current ? 'block' : 'none';
    mapContainer.current.appendChild(debugEl);
    debugElRef.current = debugEl;

    const writeDebug = (cursorLat?: number, cursorLng?: number) => {
      const c = map.getCenter();
      const z = map.getZoom().toFixed(1);
      const lines: string[] = [];
      if (cursorLat !== undefined && cursorLng !== undefined) {
        lines.push(`cur  ${fmt(cursorLat)} / ${fmt(cursorLng)}`);
      }
      lines.push(`ctr  ${fmt(c.lat)} / ${fmt(c.lng)}`);
      lines.push(`zoom ${z}`);
      debugEl.textContent = lines.join('\n');
    };

    map.on('move', () => writeDebug());
    map.on('mousemove', (e) => writeDebug(e.lngLat.lat, e.lngLat.lng));
    map.on('mouseout', () => writeDebug());

    // Single load handler — reads sync fns from refs at fire time so it always
    // applies the latest prop values regardless of how many renders preceded it.
    map.once('load', () => {
      isLoadedRef.current = true;
      writeDebug();
      syncMarkersRef.current?.();
      syncRouteRef.current?.();
      syncFleetRef.current?.();
      syncHeatmapRef.current?.();
      syncHotspotsRef.current?.();
      syncBoundsRef.current?.();
    });

    mapRef.current = map;

    return () => {
      debugElRef.current?.remove();
      debugElRef.current = null;
      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      driverMarkerRef.current?.remove();
      fleetMarkersRef.current.forEach((m) => m.remove());
      fleetMarkersRef.current = [];
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      driverMarkerRef.current = null;
      isLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Markers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    syncMarkersRef.current = () => {
      const map = mapRef.current;
      if (!map) return;

      if (isValidPoint(pickup)) {
        if (!pickupMarkerRef.current) {
          pickupMarkerRef.current = makeMarker('#ff7a00').addTo(map);
        }
        pickupMarkerRef.current.setLngLat(pointToLngLat(pickup));
      } else {
        pickupMarkerRef.current?.remove();
        pickupMarkerRef.current = null;
      }

      if (isValidPoint(dropoff)) {
        if (!dropoffMarkerRef.current) {
          dropoffMarkerRef.current = makeMarker('#00d4ff').addTo(map);
        }
        dropoffMarkerRef.current.setLngLat(pointToLngLat(dropoff));
      } else {
        dropoffMarkerRef.current?.remove();
        dropoffMarkerRef.current = null;
      }

      if (isValidPoint(driverPosition)) {
        if (!driverMarkerRef.current) {
          driverMarkerRef.current = makeMarker('#22c55e').addTo(map);
        }
        driverMarkerRef.current.setLngLat(pointToLngLat(driverPosition));
      } else {
        driverMarkerRef.current?.remove();
        driverMarkerRef.current = null;
      }
    };

    if (isLoadedRef.current) syncMarkersRef.current();
  }, [pickup, dropoff, driverPosition]);

  // ── Route ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    syncRouteRef.current = () => {
      const map = mapRef.current;
      if (!map) return;

      const validRoute = route.filter((c): c is [number, number] => isValidCoord(c));

      if (!validRoute.length) {
        if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
        if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
        return;
      }

      const data: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: validRoute },
      };

      const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
        return;
      }

      map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ff7a00',
          'line-width': 5,
          'line-opacity': 0.92,
        },
      });
    };

    if (isLoadedRef.current) syncRouteRef.current();
  }, [route, routeKey]);

  // ── Fleet markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    syncFleetRef.current = () => {
      const map = mapRef.current;
      if (!map) return;

      fleetMarkersRef.current.forEach((m) => m.remove());
      fleetMarkersRef.current = [];

      if (!showFleet) return;

      fleetMarkersRef.current = FLEET_SEED.map((vehicle) =>
        makeMarker(
          vehicle.type === 'bike' ? '#22c55e' : vehicle.type === 'auto' ? '#f59e0b' : '#38bdf8'
        )
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map)
      );
    };

    if (isLoadedRef.current) syncFleetRef.current();
  }, [showFleet]);

  // ── Heatmap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    syncHeatmapRef.current = () => {
      const map = mapRef.current;
      if (!map) return;

      if (!showHeatmap) {
        if (map.getLayer(HEAT_LAYER_ID)) map.removeLayer(HEAT_LAYER_ID);
        if (map.getSource(HEAT_SOURCE_ID)) map.removeSource(HEAT_SOURCE_ID);
        return;
      }

      if (!map.getSource(HEAT_SOURCE_ID)) {
        map.addSource(HEAT_SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: DEMAND_ZONES.map((zone) => ({
              type: 'Feature',
              properties: { weight: zone.intensity },
              geometry: {
                type: 'Point',
                coordinates: [zone.lng, zone.lat],
              },
            })),
          },
        });
      }

      if (!map.getLayer(HEAT_LAYER_ID)) {
        map.addLayer({
          id: HEAT_LAYER_ID,
          type: 'heatmap',
          source: HEAT_SOURCE_ID,
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 1.2,
            'heatmap-radius': 34,
            'heatmap-opacity': 0.45,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(8,13,24,0)',
              0.35,
              'rgba(34,211,238,0.45)',
              0.7,
              'rgba(249,115,22,0.65)',
              1,
              'rgba(248,113,113,0.8)',
            ],
          },
        });
      }
    };

    if (isLoadedRef.current) syncHeatmapRef.current();
  }, [showHeatmap]);

  // ── Hotspots ──────────────────────────────────────────────────────────────
  useEffect(() => {
    syncHotspotsRef.current = () => {
      const map = mapRef.current;
      if (!map) return;

      if (!showHotspots) {
        if (map.getLayer(HOTSPOT_LAYER_ID)) map.removeLayer(HOTSPOT_LAYER_ID);
        if (map.getSource(HOTSPOT_SOURCE_ID)) map.removeSource(HOTSPOT_SOURCE_ID);
        return;
      }

      if (!map.getSource(HOTSPOT_SOURCE_ID)) {
        map.addSource(HOTSPOT_SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: DEMAND_ZONES.map((zone) => ({
              type: 'Feature',
              properties: { name: zone.name },
              geometry: {
                type: 'Point',
                coordinates: [zone.lng, zone.lat],
              },
            })),
          },
        });
      }

      if (!map.getLayer(HOTSPOT_LAYER_ID)) {
        map.addLayer({
          id: HOTSPOT_LAYER_ID,
          type: 'circle',
          source: HOTSPOT_SOURCE_ID,
          paint: {
            'circle-color': '#22d3ee',
            'circle-radius': 6,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.6,
            'circle-stroke-width': 1,
            'circle-opacity': 0.85,
          },
        });
      }
    };

    if (isLoadedRef.current) syncHotspotsRef.current();
  }, [showHotspots]);

  // ── Fit bounds ────────────────────────────────────────────────────────────
  // driverPosition is intentionally excluded: it updates every ~1.2 s during
  // an active trip, and the driver always moves within the already-visible
  // route corridor. Including it would cause continuous camera animation.
  useEffect(() => {
    syncBoundsRef.current = () => {
      const map = mapRef.current;
      if (!map) return;

      const points: [number, number][] = [];
      if (isValidPoint(pickup)) points.push(pointToLngLat(pickup));
      if (isValidPoint(dropoff)) points.push(pointToLngLat(dropoff));
      const validRoutePoints = route.filter((c): c is [number, number] => isValidCoord(c));
      if (validRoutePoints.length > 1) points.push(...validRoutePoints);

      if (!points.length) return;

      const bounds = points.reduce(
        (b, p) => b.extend(p),
        new maplibregl.LngLatBounds(points[0], points[0])
      );
      map.fitBounds(bounds, {
        padding: 72,
        maxZoom: points.length === 1 ? 14 : 15,
        duration: 700,
      });
    };

    if (isLoadedRef.current) syncBoundsRef.current();
  }, [pickup, dropoff, route, routeKey]);

  return (
    <div
      ref={mapContainer}
      className="map-dark-tiles relative h-full w-full overflow-hidden rounded-2xl"
    />
  );
}

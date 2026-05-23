'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  DEFAULT_ROUTE,
  FLEET_SEED,
  NCR_CENTER,
  NCR_CORRIDORS,
  fleetToGeoJSON,
  heatmapToGeoJSON,
  hotspotsToGeoJSON,
  interpolateRoute,
  routeToGeoJSON,
} from '@/lib/geo';
import type { LngLat, MapMode } from '@/lib/types';

export interface FleetMapProps {
  mode?: MapMode;
  className?: string;
  showRoute?: boolean;
  showFleet?: boolean;
  showHeatmap?: boolean;
  showHotspots?: boolean;
  tripProgress?: number;
  interactive?: boolean;
  routeCoords?: LngLat[];
  pickupCoords?: LngLat | null;
  dropoffCoords?: LngLat | null;
  driverPosition?: LngLat | null;
}

const DARK_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export function FleetMap({
  mode = 'rider',
  className = '',
  showRoute = true,
  showFleet = true,
  showHeatmap = false,
  showHotspots = true,
  tripProgress = 0,
  interactive = true,
  routeCoords,
  pickupCoords,
  dropoffCoords,
  driverPosition,
}: FleetMapProps) {
  const activeRoute = routeCoords?.length ? routeCoords : DEFAULT_ROUTE;
  const activePickup = pickupCoords ?? activeRoute[0];
  const activeDropoff = dropoffCoords ?? activeRoute[activeRoute.length - 1];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const fleetRef = useRef(FLEET_SEED.map((v) => ({ ...v })));
  const animRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_MAP_STYLE,
      center: [NCR_CENTER.lng, NCR_CENTER.lat],
      zoom: mode === 'command' ? 10.8 : 12.4,
      pitch: mode === 'command' ? 28 : 42,
      bearing: -12,
      attributionControl: false,
      interactive,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.on('load', () => {
      map.setPaintProperty('osm', 'raster-opacity', 0.85);

      if (showRoute) {
        map.addSource('route', { type: 'geojson', data: routeToGeoJSON(activeRoute) });
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#22d3ee',
            'line-width': 10,
            'line-opacity': 0.2,
            'line-blur': 4,
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#ff6b35',
            'line-width': 4,
            'line-opacity': 0.9,
            'line-dasharray': [2, 1.5],
          },
        });
        map.addSource('route-progress', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: DEFAULT_ROUTE.map((p) => [p.lng, p.lat]),
            },
          },
        });
        map.addLayer({
          id: 'route-done',
          type: 'line',
          source: 'route-progress',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#34d399', 'line-width': 5, 'line-opacity': 0.95 },
        });
      }

      map.addSource('pickup', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { label: 'Pickup' },
          geometry: { type: 'Point', coordinates: [activePickup.lng, activePickup.lat] },
        },
      });
      map.addSource('dropoff', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { label: 'Drop' },
          geometry: { type: 'Point', coordinates: [activeDropoff.lng, activeDropoff.lat] },
        },
      });
      map.addSource('assigned-driver', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'assigned-driver-glow',
        type: 'circle',
        source: 'assigned-driver',
        paint: {
          'circle-radius': 18,
          'circle-color': '#fbbf24',
          'circle-opacity': 0.25,
          'circle-blur': 0.5,
        },
      });
      map.addLayer({
        id: 'assigned-driver',
        type: 'circle',
        source: 'assigned-driver',
        paint: {
          'circle-radius': 7,
          'circle-color': '#fbbf24',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'pickup-pulse',
        type: 'circle',
        source: 'pickup',
        paint: {
          'circle-radius': 22,
          'circle-color': '#ff6b35',
          'circle-opacity': 0.12,
          'circle-blur': 0.4,
        },
      });
      map.addLayer({
        id: 'pickup',
        type: 'circle',
        source: 'pickup',
        paint: {
          'circle-radius': 7,
          'circle-color': '#ff6b35',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: 'dropoff',
        type: 'circle',
        source: 'dropoff',
        paint: {
          'circle-radius': 7,
          'circle-color': '#22d3ee',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      if (showHotspots) {
        map.addSource('hotspots', { type: 'geojson', data: hotspotsToGeoJSON() });
        map.addLayer({
          id: 'hotspot-glow',
          type: 'circle',
          source: 'hotspots',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0.5,
              18,
              1,
              36,
            ],
            'circle-color': '#ff6b35',
            'circle-opacity': 0.08,
            'circle-blur': 1,
          },
        });
        map.addLayer({
          id: 'hotspot-core',
          type: 'circle',
          source: 'hotspots',
          paint: {
            'circle-radius': 6,
            'circle-color': '#f59e0b',
            'circle-opacity': 0.7,
          },
        });
      }

      if (showFleet) {
        map.addSource('fleet', {
          type: 'geojson',
          data: fleetToGeoJSON(fleetRef.current),
        });
        map.addLayer({
          id: 'fleet-glow',
          type: 'circle',
          source: 'fleet',
          paint: {
            'circle-radius': 14,
            'circle-color': '#22d3ee',
            'circle-opacity': 0.15,
            'circle-blur': 0.6,
          },
        });
        map.addLayer({
          id: 'fleet',
          type: 'circle',
          source: 'fleet',
          paint: {
            'circle-radius': 5,
            'circle-color': '#22d3ee',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0f172a',
          },
        });
      }

      if (showHeatmap) {
        map.addSource('heatmap', { type: 'geojson', data: heatmapToGeoJSON() });
        map.addLayer({
          id: 'heatmap',
          type: 'heatmap',
          source: 'heatmap',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 1.2,
            'heatmap-radius': 28,
            'heatmap-opacity': 0.65,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(15,23,42,0)',
              0.3,
              'rgba(255,107,53,0.4)',
              0.6,
              'rgba(245,158,11,0.6)',
              1,
              'rgba(34,211,238,0.85)',
            ],
          },
        });
      }

      const labels = {
        type: 'FeatureCollection' as const,
        features: NCR_CORRIDORS.map((c) => ({
          type: 'Feature' as const,
          properties: { name: c.name },
          geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
        })),
      };
      map.addSource('corridors', { type: 'geojson', data: labels });
      map.addLayer({
        id: 'corridor-labels',
        type: 'symbol',
        source: 'corridors',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': '#94a3b8',
          'text-halo-color': '#070b14',
          'text-halo-width': 1.5,
        },
      });

      setLoaded(true);
    });

    mapRef.current = map;

    let tick = 0;
    const animate = () => {
      tick += 1;
      if (mapRef.current?.getSource('fleet') && showFleet) {
        fleetRef.current = fleetRef.current.map((v) => ({
          ...v,
          lng: v.lng + Math.sin(tick * 0.02 + v.heading) * 0.0004,
          lat: v.lat + Math.cos(tick * 0.018 + v.heading) * 0.0003,
        }));
        (mapRef.current.getSource('fleet') as maplibregl.GeoJSONSource).setData(
          fleetToGeoJSON(fleetRef.current)
        );
      }
      if (mapRef.current?.getLayer('route-line')) {
        const phase = (tick % 120) / 120;
        mapRef.current.setPaintProperty('route-line', 'line-opacity', 0.55 + Math.sin(phase * Math.PI * 2) * 0.35);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    if (showRoute && map.getSource('route')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData(routeToGeoJSON(activeRoute));
    }
    if (map.getSource('pickup') && activePickup) {
      (map.getSource('pickup') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: { label: 'Pickup' },
        geometry: { type: 'Point', coordinates: [activePickup.lng, activePickup.lat] },
      });
    }
    if (map.getSource('dropoff') && activeDropoff) {
      (map.getSource('dropoff') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: { label: 'Drop' },
        geometry: { type: 'Point', coordinates: [activeDropoff.lng, activeDropoff.lat] },
      });
    }

    if (activeRoute.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      activeRoute.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 600 });
    }
  }, [activeRoute, activePickup, activeDropoff, loaded, showRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !showRoute) return;

    const doneCoords = activeRoute
      .slice(0, Math.max(2, Math.ceil((tripProgress / 100) * activeRoute.length)))
      .map((p) => [p.lng, p.lat] as [number, number]);
    const src = map.getSource('route-progress') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: doneCoords },
      });
    }

    const pos =
      driverPosition ?? (tripProgress > 0 ? interpolateRoute(activeRoute, tripProgress) : null);
    if (pos && map.getSource('assigned-driver')) {
      (map.getSource('assigned-driver') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [pos.lng, pos.lat] },
      });
    }
  }, [tripProgress, loaded, showRoute, activeRoute, driverPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    if (mode === 'command') {
      map.easeTo({ zoom: 10.8, pitch: 28, bearing: -8, duration: 800 });
    } else if (mode === 'trip') {
      map.easeTo({ zoom: 13.2, pitch: 48, duration: 600 });
    } else {
      map.easeTo({ zoom: 12.4, pitch: 42, duration: 600 });
    }
  }, [mode, loaded]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="map-dark-tiles h-full min-h-[inherit] w-full"
        style={{ minHeight: 'inherit' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070b14]/60 via-transparent to-[#070b14]/90" />
      <div className="gps-scan pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#070b14]/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-lg border border-orange-500/25 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-orange-200/90 backdrop-blur-md">
            NCR corridor
          </span>
          <span className="rounded-lg border border-cyan-500/25 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-cyan-300/90 backdrop-blur-md">
            OSM · Live fleet
          </span>
        </div>
        {mode === 'searching' && (
          <span className="animate-pulse rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">
            Scanning demand…
          </span>
        )}
      </div>
    </div>
  );
}

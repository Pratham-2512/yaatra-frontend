'use client';

import dynamic from 'next/dynamic';
import type { FleetMapProps } from './FleetMap';

const FleetMap = dynamic(() => import('./FleetMap').then((m) => m.FleetMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[220px] items-center justify-center bg-[#0a1020] md:min-h-[280px]">
      <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
    </div>
  ),
});

export function MapPanel(props: FleetMapProps & { height?: string }) {
  const { height = 'min-h-[240px] md:min-h-[300px]', className = '', ...rest } = props;
  return (
    <div className={`relative flex-1 ${height} ${className}`}>
      <FleetMap className="absolute inset-0 h-full w-full" {...rest} />
    </div>
  );
}

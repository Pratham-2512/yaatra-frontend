import type { ReactNode } from 'react';
import { glass } from './styles';

type Accent = 'orange' | 'cyan' | 'amber' | 'emerald' | 'rose';

const accentMap: Record<Accent, string> = {
  orange: 'from-orange-500/25 to-transparent text-orange-400',
  cyan: 'from-cyan-500/25 to-transparent text-cyan-400',
  amber: 'from-amber-500/25 to-transparent text-amber-400',
  emerald: 'from-emerald-500/25 to-transparent text-emerald-400',
  rose: 'from-rose-500/25 to-transparent text-rose-400',
};

export function KpiWidget({
  label,
  value,
  sub,
  accent = 'orange',
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: Accent;
  trend?: string;
}) {
  return (
    <div className={`${glass} relative overflow-hidden p-3.5 transition hover:border-cyan-500/20 md:p-4`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[accent]} opacity-70`} />
      <p className="relative text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="relative mt-0.5 text-lg font-bold text-white md:text-xl">{value}</p>
      {(sub || trend) && (
        <p className="relative mt-1 text-[10px] text-slate-500">
          {trend && <span className="text-emerald-400">{trend} </span>}
          {sub}
        </p>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import { glass } from './styles';

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${glass} ${className}`}>{children}</div>;
}

'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import type { ReportSeverity } from '@/features/reports/use-reports';

export type SlaState = 'breached' | 'near' | 'ok';

const NEAR_BREACH_SECONDS = 4 * 3600; // <4h

/** Classifies remaining SLA time. Near-breach is reserved for HIGH severity (F-8.6). */
export function slaState(remainingSeconds: number | null, severity: ReportSeverity): SlaState {
  if (remainingSeconds == null) return 'ok';
  if (remainingSeconds <= 0) return 'breached';
  if (remainingSeconds < NEAR_BREACH_SECONDS && severity === 'HIGH') return 'near';
  return 'ok';
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return 'تخطّت SLA';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}س ${m}د`;
  if (m > 0) return `${m}د ${s}ث`;
  return `${s}ث`;
}

interface SlaCountdownProps {
  remainingSeconds: number | null;
  severity: ReportSeverity;
  /** Resolved/dismissed reports have no live SLA — show a dash. */
  inactive?: boolean;
}

export function SlaCountdown({ remainingSeconds, severity, inactive }: SlaCountdownProps) {
  const [secs, setSecs] = useState(remainingSeconds ?? 0);

  // Re-sync when the source value changes (e.g. list refetch).
  useEffect(() => {
    setSecs(remainingSeconds ?? 0);
  }, [remainingSeconds]);

  // Tick once per second while the window is still open.
  useEffect(() => {
    if (inactive || remainingSeconds == null) return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [inactive, remainingSeconds]);

  if (inactive || remainingSeconds == null) {
    return <span className="text-muted">—</span>;
  }

  const state = slaState(secs, severity);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[12px] font-medium tabular-nums',
        state === 'breached' && 'bg-red-50 text-red',
        state === 'near' && 'bg-amber-50 text-amber',
        state === 'ok' && 'text-muted',
      )}
      aria-label={`الوقت المتبقي ${formatRemaining(secs)}`}
    >
      <Icon name="clock" size={12} />
      {formatRemaining(secs)}
    </span>
  );
}

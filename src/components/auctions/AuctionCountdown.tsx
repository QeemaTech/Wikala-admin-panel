'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

export type CountdownTone = 'normal' | 'amber' | 'red' | 'ended';

const RED_SECONDS = 10 * 60; // < 10 min
const AMBER_SECONDS = 60 * 60; // < 1 h

export function countdownTone(secondsLeft: number): CountdownTone {
  if (secondsLeft <= 0) return 'ended';
  if (secondsLeft < RED_SECONDS) return 'red';
  if (secondsLeft < AMBER_SECONDS) return 'amber';
  return 'normal';
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'انتهى';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}ي ${h}س`;
  if (h > 0) return `${h}س ${m}د`;
  if (m > 0) return `${m}د ${s}ث`;
  return `${s}ث`;
}

function secondsUntil(endTime: string | null): number {
  if (!endTime) return 0;
  return Math.max(0, Math.round((new Date(endTime).getTime() - Date.now()) / 1000));
}

interface AuctionCountdownProps {
  endTime: string | null;
  /** Closed auctions show a static dash instead of a ticking timer. */
  inactive?: boolean;
}

/** Live, urgency-coloured time-remaining timer (design `.timer`). */
export function AuctionCountdown({ endTime, inactive }: AuctionCountdownProps) {
  const [secs, setSecs] = useState(() => secondsUntil(endTime));

  // Re-sync when end-time changes (e.g. auto-extend pushes it out live).
  useEffect(() => {
    setSecs(secondsUntil(endTime));
  }, [endTime]);

  useEffect(() => {
    if (inactive || !endTime) return;
    const id = setInterval(() => setSecs(secondsUntil(endTime)), 1000);
    return () => clearInterval(id);
  }, [inactive, endTime]);

  if (inactive || !endTime) {
    return <span className="text-muted">—</span>;
  }

  const tone = countdownTone(secs);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[12px] font-medium tabular-nums',
        tone === 'red' && 'bg-red-50 text-red',
        tone === 'amber' && 'bg-amber-50 text-amber',
        tone === 'normal' && 'text-ink-2',
        tone === 'ended' && 'text-muted',
      )}
      aria-label={`الوقت المتبقي ${formatCountdown(secs)}`}
    >
      <Icon name="clock" size={12} />
      {formatCountdown(secs)}
    </span>
  );
}

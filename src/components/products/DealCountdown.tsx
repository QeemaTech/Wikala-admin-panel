'use client';

import { useEffect, useState } from 'react';
import { Chip } from '@/components/ui/Chip';

const pad = (n: number) => String(n).padStart(2, '0');

/** Remaining time as HH:MM:SS, or null once the deal has lapsed. */
function remaining(endsAt: string): string | null {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  return `${pad(h)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * The same countdown the app shows on a Flash card. An expired deal drops off
 * the rail through the list query, so this is how staff can tell at a glance
 * that a product has quietly stopped being promoted.
 */
export function DealCountdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState<string | null>(() => remaining(endsAt));

  useEffect(() => {
    setLeft(remaining(endsAt));
    const t = setInterval(() => setLeft(remaining(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!left) return <Chip tone="red">انتهى العرض</Chip>;
  return (
    <Chip tone="amber">
      <span className="font-mono" dir="ltr">
        {left}
      </span>
    </Chip>
  );
}

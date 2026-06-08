'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { cn } from '@/lib/utils';

interface RouteLoaderProps {
  /** Minimum time the loader stays visible, in ms. */
  durationMs?: number;
}

/**
 * Branded loading overlay shown on initial load and on every route change,
 * held for a visible minimum then faded out. Lives in the dashboard layout
 * (which persists across navigations) so it reacts to each pathname change.
 */
export function RouteLoader({ durationMs = 500 }: RouteLoaderProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setVisible(true);
    setFading(false);
    const fadeAt = window.setTimeout(() => setFading(true), durationMs);
    const hideAt = window.setTimeout(() => setVisible(false), durationMs + 350);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(hideAt);
    };
  }, [pathname, durationMs]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] grid place-items-center bg-bg transition-opacity duration-300',
        fading ? 'opacity-0' : 'opacity-100',
      )}
      aria-hidden={fading}
    >
      <BrandLoader />
    </div>
  );
}

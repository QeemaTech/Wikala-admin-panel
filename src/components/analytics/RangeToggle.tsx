'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Segmented } from '@/components/ui/Segmented';
import type { AnalyticsRange } from '@/features/analytics/use-analytics';

export const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 أيام' },
  { value: '30d', label: '30 يوم' },
  { value: '90d', label: '90 يوم' },
];

export const RANGE_LABEL: Record<AnalyticsRange, string> = {
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يوم',
  '90d': 'آخر 90 يوم',
};

const DEFAULT_RANGE: AnalyticsRange = '30d';

function isRange(v: string | null): v is AnalyticsRange {
  return v === '7d' || v === '30d' || v === '90d';
}

/**
 * Range selection synced to the `?range=` query param so the analytics and
 * dashboard pages keep a consistent, shareable/bookmarkable range. Defaults to
 * `30d` when the param is absent or invalid.
 */
export function useRangeParam(): [AnalyticsRange, (next: AnalyticsRange) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get('range');
  const range: AnalyticsRange = isRange(raw) ? raw : DEFAULT_RANGE;

  const setRange = useCallback(
    (next: AnalyticsRange) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === DEFAULT_RANGE) params.delete('range');
      else params.set('range', next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return [range, setRange];
}

interface RangeToggleProps {
  value: AnalyticsRange;
  onChange: (next: AnalyticsRange) => void;
  className?: string;
}

/** Shared 7/30/90-day segmented control used by analytics + dashboard. */
export function RangeToggle({ value, onChange, className }: RangeToggleProps) {
  return (
    <Segmented
      options={RANGE_OPTIONS}
      value={value}
      onChange={(v) => onChange(v as AnalyticsRange)}
      className={className}
    />
  );
}

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { AudienceQuery } from './use-campaigns';

/** Debounce any serializable value by `delay` ms. */
function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export interface AudienceEstimate {
  /** Users matching the filter. */
  matched: number;
  /** Of those, how many have a registered device — the only ones a push can reach. */
  reachable: number;
}

/**
 * Live audience-size estimate — POST /admin/push-campaigns/preview-audience.
 * Debounces the query so rapid filter changes don't spam the backend.
 *
 * Returns **two** numbers on purpose. A push arrives at a device, not at an
 * account: a user who has never opened the app on a phone that registered an
 * FCM token cannot receive anything, however well they match the filter.
 * Showing only `matched` is what let a campaign report "353 users" and deliver
 * to nobody, with nothing on screen to hint at why.
 */
export function useAudiencePreview(audienceQuery: AudienceQuery) {
  const debounced = useDebouncedValue(audienceQuery, 400);
  return useQuery({
    queryKey: ['audience-preview', debounced],
    queryFn: () =>
      post<{ targetCountEstimate: number; reachableCount?: number }>(
        '/admin/push-campaigns/preview-audience',
        { audienceQuery: debounced }
      ),
    staleTime: 30_000,
    select: (d): AudienceEstimate => ({
      matched: d.targetCountEstimate,
      // An older backend omits it. Fall back to the matched count rather than
      // to 0, so a panel talking to a stale API does not cry wolf about an
      // unreachable audience it simply cannot measure.
      reachable: d.reachableCount ?? d.targetCountEstimate,
    }),
  });
}

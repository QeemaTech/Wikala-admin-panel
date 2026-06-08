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

/**
 * Live audience-size estimate — POST /admin/push-campaigns/preview-audience.
 * Debounces the query so rapid filter changes don't spam the backend.
 */
export function useAudiencePreview(audienceQuery: AudienceQuery) {
  const debounced = useDebouncedValue(audienceQuery, 400);
  return useQuery({
    queryKey: ['audience-preview', debounced],
    queryFn: () =>
      post<{ targetCountEstimate: number }>('/admin/push-campaigns/preview-audience', {
        audienceQuery: debounced,
      }),
    staleTime: 30_000,
    select: (d) => d.targetCountEstimate,
  });
}

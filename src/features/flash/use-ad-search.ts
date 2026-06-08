import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export interface AdSearchResult {
  id: string;
  title: string;
  coverUrl: string | null;
  priceMinor: number | null;
  currency: string;
}

/**
 * Type-ahead search of ACTIVE ads for the flash-sale product picker
 * (`GET /admin/flash-sales/ad-search`). Only fires for queries ≥ 2 chars.
 */
export function useAdSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ['flash-ad-search', term],
    queryFn: async () => {
      const data = await get<{ items: AdSearchResult[] }>(`/admin/flash-sales/ad-search?q=${encodeURIComponent(term)}`);
      return data.items;
    },
    enabled: term.length >= 2,
    staleTime: 10_000,
  });
}

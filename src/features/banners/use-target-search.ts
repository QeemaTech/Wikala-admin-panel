import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type DestinationType = 'URL' | 'AD' | 'PRODUCT' | 'CATEGORY' | 'AUCTION' | 'PAGE' | 'SEARCH' | 'NONE';

export const DESTINATION_TYPES: DestinationType[] = ['URL', 'AD', 'PRODUCT', 'CATEGORY', 'AUCTION', 'PAGE', 'SEARCH', 'NONE'];

/** Searchable types that need the target-search endpoint. */
export const SEARCHABLE_TYPES: DestinationType[] = ['AD', 'PRODUCT', 'CATEGORY', 'AUCTION'];

export const DESTINATION_LABELS: Record<DestinationType, string> = {
  URL: 'رابط خارجي',
  AD: 'إعلان',
  PRODUCT: 'منتج',
  CATEGORY: 'قسم',
  AUCTION: 'مزاد',
  PAGE: 'صفحة',
  SEARCH: 'بحث',
  NONE: 'بدون',
};

export interface TargetSearchResult {
  id: string;
  label: string;
  sublabel: string | null;
  slug: string | null;
  thumbUrl: string | null;
}

/**
 * Type-ahead search of banner targets.
 * Only fires for queries >= 2 chars on searchable destination types.
 */
export function useTargetSearch(type: DestinationType, q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ['banner-target-search', type, term],
    queryFn: async () => {
      const data = await get<{ items: TargetSearchResult[] }>(
        `/admin/banners/target-search?type=${encodeURIComponent(type)}&q=${encodeURIComponent(term)}`
      );
      return data.items;
    },
    enabled: SEARCHABLE_TYPES.includes(type) && term.length >= 2,
    staleTime: 10_000,
  });
}

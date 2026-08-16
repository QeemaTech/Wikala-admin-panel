'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import type { PageMeta } from '@/lib/api/client';
import { composeSearchQuery, type SearchFilters } from '@/features/search/use-search-filters';
import type { SearchFacets } from '@/features/search/use-search';
import type { AdStatus } from './use-ads';

/** Admin ad list row — AdCardDTO + status (so the grid picks the right action). */
export interface AdminAdCard {
  id: string;
  slug: string;
  title: string;
  priceMinor: number | null;
  currency: string;
  coverUrl: string | null;
  governorate: string | null;
  district: string | null;
  condition: string | null;
  publishedAt: string | null;
  status: AdStatus;
}

export type AdminAdStatusScope =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'EXPIRED'
  /** Created by the seller but never published — in no moderation queue. */
  | 'DRAFT'
  /** PENDING_AI · PENDING_HUMAN · FLAGGED — awaiting or stalled in review. */
  | 'PENDING'
  | 'ALL';

export interface AdminAdsResponse {
  items: AdminAdCard[];
  meta: PageMeta;
  facets: SearchFacets;
}

/** `GET /admin/ads` — staff ad browse with status scope + search facets. */
export function useAdminAds(
  filters: SearchFilters,
  status: AdminAdStatusScope,
  page = 1,
  pageSize = 24,
) {
  const qs = composeSearchQuery(filters, { status, page, pageSize });
  return useQuery({
    queryKey: ['admin-ads', qs],
    queryFn: () => get<AdminAdsResponse>(`/admin/ads${qs ? `?${qs}` : ''}`),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

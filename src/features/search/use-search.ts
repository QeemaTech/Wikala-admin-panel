'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import type { PageMeta } from '@/lib/api/client';
import { composeSearchQuery, type SearchFilters } from './use-search-filters';

/** Single map-pin / card row from search (subset of AdCardDTO). */
export interface SearchAdCard {
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
}

/**
 * Server-driven facet counts. NOTE: the backend currently emits
 * `categoryCounts / conditionCounts / governorateCounts` — the contract's
 * §7.11 `brandCounts` is NOT produced, so there is no count source for brand or
 * district facets. Coded to the real response shape (see Week 6 gap analysis).
 */
export interface SearchFacets {
  categoryCounts: { categoryId: string; count: number }[];
  conditionCounts: { condition: string; count: number }[];
  governorateCounts: { governorate: string; count: number }[];
}

export interface SearchResponse {
  items: SearchAdCard[];
  meta: PageMeta;
  facets: SearchFacets;
}

export const EMPTY_FACETS: SearchFacets = {
  categoryCounts: [],
  conditionCounts: [],
  governorateCounts: [],
};

/**
 * Calls `GET /api/v1/search` (app-facing, status:ACTIVE-only). Used by the
 * admin's active-ads browse view where server-driven facet counts are valid —
 * NOT the moderation queue (which is non-ACTIVE and has no facets).
 */
export function useSearch(filters: SearchFilters, page = 1, pageSize = 24, enabled = true) {
  const qs = composeSearchQuery(filters, { page, pageSize });
  return useQuery({
    queryKey: ['search', qs],
    queryFn: () => get<SearchResponse>(`/search${qs ? `?${qs}` : ''}`),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    enabled,
  });
}

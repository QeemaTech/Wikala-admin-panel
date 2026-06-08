'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

/**
 * Per-category analytics row from `GET /admin/analytics/categories`.
 * NOTE: the endpoint takes `?days=7|30|90` (NOT `range`) and returns a bare
 * array. It provides ad-volume sparkline + totalAds ONLY — per-category
 * conversion/session metrics do not exist server-side (overview is global).
 */
export interface CategoryAnalyticsRow {
  categoryId: string;
  nameAr: string;
  nameEn: string | null;
  totalAds: number;
  sparkline: { date: string; count: number }[];
}

export type AnalyticsRangeDays = 7 | 30 | 90;

export function useCategoryAnalytics(days: AnalyticsRangeDays, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'categories', days],
    queryFn: () => get<CategoryAnalyticsRow[]>(`/admin/analytics/categories?days=${days}`),
    staleTime: 60_000,
    enabled,
  });
}

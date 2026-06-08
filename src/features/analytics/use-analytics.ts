import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type AnalyticsRange = '7d' | '30d' | '90d';

// ── Overview (§7.40 GET /admin/analytics/overview) ──────────────────────────
export interface AnalyticsOverview {
  kpis: {
    /** Avg sessions/day from AppSession over the range. */
    dailySessions: number;
    /** Avg recorded session duration in seconds; null when no sessions. */
    avgSessionSec: number | null;
    /** Σ contact_count / Σ view_count across listed ads; null when no views. */
    conversionRate: number | null;
    /** Ads published ÷ sessions in range; null when no sessions. */
    listingRatePerViewer: number | null;
  };
  deltas: {
    dailySessions: number | null;
    avgSessionSec: number | null;
    conversionRate: number | null;
    listingRatePerViewer: number | null;
  };
  range: AnalyticsRange;
  days: number;
}

// ── Users — new vs returning (§7.40 GET /admin/analytics/users) ──────────────
export interface AnalyticsUsers {
  series: { date: string; newUsers: number }[];
  totals: { newUsers: number; returningUsers: number };
  range: AnalyticsRange;
}

// ── Acquisition (§7.40 GET /admin/analytics/acquisition) ─────────────────────
export interface AcquisitionSource {
  source: string;
  count: number;
  percentage: number;
}
export interface AnalyticsAcquisition {
  sources: AcquisitionSource[];
  /** false until signup-source/UTM attribution is instrumented on the backend. */
  tracked: boolean;
  range: AnalyticsRange;
}

// ── Revenue / business growth (§7.40 GET /admin/analytics/revenue) ───────────
export interface AnalyticsRevenue {
  ads: {
    newInRange: number;
    delta: number | null;
    series: { labels: string[]; values: number[] };
  };
  subscriptions: {
    activePaid: number;
    newInRange: number;
    delta: number | null;
  };
  revenue: {
    plansMinor: number;
    boostsMinor: number;
    totalMinor: number;
    plansDelta: number | null;
    boostsDelta: number | null;
    totalDelta: number | null;
  };
  currency: string;
  range: AnalyticsRange;
  days: number;
}

// ── Categories (§7.40 GET /admin/analytics/categories) ───────────────────────
export interface CategoryPerformance {
  categoryId: string;
  nameAr: string;
  nameEn: string | null;
  totalAds: number;
  sessions: number;
  conversionRate: number | null;
  avgPriceMinor: number | null;
  priceCurrency: string | null;
  sparkline: { date: string; count: number }[];
}

const STALE = 5 * 60_000;

export function useAnalyticsOverview(range: AnalyticsRange) {
  return useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => get<AnalyticsOverview>(`/admin/analytics/overview?range=${range}`),
    staleTime: STALE,
  });
}

export function useAnalyticsUsers(range: AnalyticsRange) {
  return useQuery({
    queryKey: ['analytics', 'users', range],
    queryFn: () => get<AnalyticsUsers>(`/admin/analytics/users?range=${range}`),
    staleTime: STALE,
  });
}

export function useAnalyticsAcquisition(range: AnalyticsRange) {
  return useQuery({
    queryKey: ['analytics', 'acquisition', range],
    queryFn: () => get<AnalyticsAcquisition>(`/admin/analytics/acquisition?range=${range}`),
    staleTime: STALE,
  });
}

export function useAnalyticsCategories(range: AnalyticsRange) {
  return useQuery({
    queryKey: ['analytics', 'categories', range],
    queryFn: () => get<CategoryPerformance[]>(`/admin/analytics/categories?range=${range}`),
    staleTime: STALE,
  });
}

export function useAnalyticsRevenue(range: AnalyticsRange) {
  return useQuery({
    queryKey: ['analytics', 'revenue', range],
    queryFn: () => get<AnalyticsRevenue>(`/admin/analytics/revenue?range=${range}`),
    staleTime: STALE,
  });
}

import { useQuery, useQueries } from '@tanstack/react-query';
import { get, getPaged } from '@/lib/api/client';
import type { ModerationItemDTO, ModerationTab, AiVerdict, PageMeta } from '@/features/ads/use-ads';

export {
  type ModerationTab,
  type ModerationRisk,
  type ModerationItemDTO,
  type AiVerdict,
  type PageMeta,
} from '@/features/ads/use-ads';

/** Extended params — includes core filters + advanced filter panel fields. */
export interface ModerationListParams {
  tab?: ModerationTab;
  risk?: string;
  search?: string;
  page?: number;
  categoryId?: string;
  sellerTier?: string;
  dateFrom?: string;
  dateTo?: string;
  aiVerdict?: AiVerdict;
}

function buildQuery(params: ModerationListParams): string {
  const q = new URLSearchParams();
  if (params.tab) q.set('tab', params.tab);
  if (params.risk && params.risk !== 'ALL') q.set('risk', params.risk);
  if (params.search) q.set('search', params.search);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.sellerTier) q.set('sellerTier', params.sellerTier);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.aiVerdict) q.set('aiVerdict', params.aiVerdict as string);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useModerationQueue(params: ModerationListParams = {}) {
  return useQuery({
    queryKey: ['moderation', params],
    queryFn: () => getPaged<ModerationItemDTO>(`/admin/moderation${buildQuery(params)}`),
    staleTime: 15_000,
  });
}

/** Header-strip metrics — GET /admin/moderation/stats (API §7.26). */
export interface ModerationStatsDTO {
  queueSize: number;
  avgReviewSeconds: number;
  aiAutoHandledPct: number;
}

export function useModerationStats() {
  return useQuery({
    queryKey: ['moderation', 'stats'],
    queryFn: () => get<ModerationStatsDTO>('/admin/moderation/stats'),
    staleTime: 30_000,
  });
}

const ALL_TABS = ['QUEUE', 'FLAGGED', 'APPROVED', 'REJECTED'] as const satisfies readonly ModerationTab[];

/** Runs 4 parallel lightweight queries to get live per-tab counts from meta.total. */
export function useTabCounts(): Partial<Record<ModerationTab, number>> {
  const results = useQueries({
    queries: ALL_TABS.map((tab) => ({
      queryKey: ['moderation-count', tab],
      queryFn: () => getPaged<ModerationItemDTO>(`/admin/moderation?tab=${tab}`),
      staleTime: 30_000,
    })),
  });

  return Object.fromEntries(
    ALL_TABS.map((tab, i) => [tab, (results[i] as { data?: { meta?: { total?: number } } }).data?.meta?.total]),
  ) as Partial<Record<ModerationTab, number>>;
}

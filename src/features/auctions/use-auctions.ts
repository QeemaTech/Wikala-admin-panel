import { useQuery, useQueries } from '@tanstack/react-query';
import { get, getPaged, type PageMeta } from '@/lib/api/client';

export type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED_WON' | 'ENDED_NO_BIDS';
export type BidStatus = 'WINNING' | 'OUTBID' | 'WON' | 'LOST';

/** UI tab → backend `?tab=` filter (Contract §7.34 Admin Auctions). */
export type AuctionTab = 'ACTIVE' | 'ENDING_TODAY' | 'PENDING' | 'CLOSED';

/** Ad mini joined onto each admin auction row (title + thumbnail). */
export interface AuctionAdMini {
  id: string;
  title: string;
  coverUrl: string | null;
}

/** Admin auction row — AuctionDTO (§9) enriched with `ad` for the monitor table. */
export interface AuctionDTO {
  id: string;
  adId: string | null;
  sellerId: string | null;
  status: AuctionStatus;
  startTime: string | null;
  endTime: string | null;
  startingPriceMinor: number;
  currentPriceMinor: number;
  minIncrementMinor: number;
  currency: string;
  bidCount: number;
  leadingBidId: string | null;
  leadingUserId: string | null;
  autoExtend: boolean;
  winnerId: string | null;
  endedAt: string | null;
  ad: AuctionAdMini | null;
}

export interface BidDTO {
  id: string;
  auctionId: string | null;
  userId: string | null;
  userMini: { name: string; avatarUrl: string | null; tier: string } | null;
  amountMinor: number;
  currency: string;
  placedAt: string | null;
  status: BidStatus;
}

export interface AuctionsKpi {
  active: number;
  endingSoon: number;
  todayBids: number;
  closedToday: number;
  totalValueMinor: number;
}

export interface AuctionsListParams {
  tab?: AuctionTab;
  page?: number;
}

export function buildAuctionsQuery(params: AuctionsListParams): string {
  const q = new URLSearchParams();
  if (params.tab) q.set('tab', params.tab);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useAdminAuctions(params: AuctionsListParams = {}) {
  return useQuery({
    queryKey: ['auctions', params],
    queryFn: () => getPaged<AuctionDTO>(`/admin/auctions${buildAuctionsQuery(params)}`),
    staleTime: 10_000,
  });
}

export function useAuctionsKpi() {
  return useQuery({
    queryKey: ['auctions', 'kpi'],
    queryFn: () => get<AuctionsKpi>('/admin/auctions/kpi'),
    staleTime: 30_000,
  });
}

/** Bid history for one auction (newest/highest first), §7.34. */
export function useAuctionBids(auctionId: string | null) {
  return useQuery({
    queryKey: ['auctions', 'bids', auctionId],
    queryFn: () => get<BidDTO[]>(`/admin/auctions/${auctionId}/bids`),
    enabled: !!auctionId,
    staleTime: 5_000,
  });
}

const ALL_TABS: AuctionTab[] = ['ACTIVE', 'ENDING_TODAY', 'PENDING', 'CLOSED'];

/** Live per-tab counts from each tab's meta.total. */
export function useAuctionTabCounts(): Partial<Record<AuctionTab, number>> {
  const results = useQueries({
    queries: ALL_TABS.map((tab) => ({
      queryKey: ['auctions-count', tab],
      queryFn: () => getPaged<AuctionDTO>(`/admin/auctions?tab=${tab}`),
      staleTime: 30_000,
    })),
  });
  return Object.fromEntries(
    ALL_TABS.map((tab, i) => [tab, (results[i] as { data?: { meta?: { total?: number } } }).data?.meta?.total]),
  ) as Partial<Record<AuctionTab, number>>;
}

export type { PageMeta };

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type CampaignType = 'PROMO' | 'AUCTION_REMINDER' | 'GEO' | 'PLATFORM';
export type CampaignPriority = 'NORMAL' | 'HIGH_BYPASS_QUIET';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'ARCHIVED';

export interface AudienceQuery {
  tier?: string[];
  governorate?: string[];
  categoryId?: string;
  lastActiveWithinDays?: number;
}

export interface CampaignStats {
  delivered: number;
  opened: number;
  ctr: number;
  /** Sends FCM refused — a dead or malformed token. */
  failed?: number;
  /** Targeted users who had no registered device at all. */
  unreachable?: number;
}

/** PushCampaignDTO — Contract §7.39 Admin Push Campaigns. */
export interface CampaignDTO {
  id: string;
  title: string;
  body: string;
  type: CampaignType;
  priority: CampaignPriority;
  audienceQuery: AudienceQuery;
  targetCountEstimate: number;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: CampaignStats;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CampaignsPage {
  items: CampaignDTO[];
  total: number;
  page: number;
  pages: number;
}

export const CAMPAIGN_TYPE_LABEL: Record<CampaignType, string> = {
  PROMO: 'عرض ترويجي',
  AUCTION_REMINDER: 'تذكير مزاد',
  GEO: 'إشعار جغرافي',
  PLATFORM: 'تحديث منصة',
};

export const CAMPAIGN_PRIORITY_LABEL: Record<CampaignPriority, string> = {
  NORMAL: 'عادية',
  HIGH_BYPASS_QUIET: 'مرتفعة (تجاوز Quiet Hours)',
};

/** Tone per campaign type for the table chips. */
export const CAMPAIGN_TYPE_TONE: Record<CampaignType, 'blue' | 'amber' | 'teal' | 'violet'> = {
  PROMO: 'amber',
  AUCTION_REMINDER: 'blue',
  GEO: 'teal',
  PLATFORM: 'violet',
};

export function campaignTypeLabel(type: string): string {
  return CAMPAIGN_TYPE_LABEL[type as CampaignType] ?? type;
}

/** Paginated campaign list filtered by status — the list endpoint uses `status`. */
export function useCampaigns(status: CampaignStatus, page = 1) {
  const qs = new URLSearchParams({ status });
  if (page > 1) qs.set('page', String(page));
  return useQuery({
    queryKey: ['campaigns', status, page],
    queryFn: () => get<CampaignsPage>(`/admin/push-campaigns?${qs.toString()}`),
    staleTime: 15_000,
  });
}

/** Sent + scheduled totals for the tab counters (page-1 totals only). */
export function useCampaignCounts() {
  const sent = useQuery({
    queryKey: ['campaigns', 'SENT', 1],
    queryFn: () => get<CampaignsPage>('/admin/push-campaigns?status=SENT'),
    staleTime: 30_000,
    select: (d) => d.total,
  });
  const scheduled = useQuery({
    queryKey: ['campaigns', 'SCHEDULED', 1],
    queryFn: () => get<CampaignsPage>('/admin/push-campaigns?status=SCHEDULED'),
    staleTime: 30_000,
    select: (d) => d.total,
  });
  return {
    sent: sent.data ?? null,
    scheduled: scheduled.data ?? null,
  };
}

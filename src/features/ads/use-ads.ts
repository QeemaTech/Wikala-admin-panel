import { useQuery } from '@tanstack/react-query';
import { getPaged, type PageMeta } from '@/lib/api/client';

export type ModerationTab = 'QUEUE' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
export type ModerationRisk = 'ALL' | 'HIGH' | 'MED' | 'LOW' | 'AUCTIONS';
export type AdStatus =
  | 'DRAFT' | 'PENDING_AI' | 'FLAGGED' | 'PENDING_HUMAN'
  | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED' | 'REJECTED';
export type AdType = 'SELL' | 'RENT' | 'TRADE' | 'AUCTION';
export type AdCondition = 'NEW' | 'PRELOVED' | 'REFURBISHED';
export type AiVerdict = 'APPROVE' | 'FLAG' | 'REJECT' | null;

export interface AdMediaDTO {
  id?: string;
  cloudinaryPublicId: string;
  originalUrl: string | null;
  variants: { w1080: string | null; w720: string | null; thumb: string | null };
  mimeType: string | null;
  width: number | null;
  height: number | null;
  order: number;
}

export interface AdSellerMini {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  governorate: string | null;
  district: string | null;
  tier: string[] | string | null;
}

export interface AdModerationBlock {
  aiRiskScore: number | null;
  aiReasons: string[];
  aiVerdict: AiVerdict;
  humanDecision: 'APPROVE' | 'REJECT' | 'ESCALATE' | null;
  reviewerId: string | null;
  decidedAt: string | null;
}

export interface AdAdminDTO {
  id: string;
  slug: string;
  seller: AdSellerMini | null;
  categoryId: string | null;
  subCategoryId: string | null;
  type: AdType;
  title: string;
  description: string;
  priceMinor: number | null;
  currency: string;
  condition: AdCondition;
  dynamicFields: Record<string, unknown>;
  location: { lng: number; lat: number } | null;
  governorate: string | null;
  district: string | null;
  status: AdStatus;
  media: AdMediaDTO[];
  expiresAt: string | null;
  publishedAt: string | null;
  viewCount: number;
  favCount: number;
  contactCount: number;
  dedupHash: string | null;
  rejectionReason: string | null;
  moderation: AdModerationBlock;
}

export interface ModerationItemDTO {
  id: string;
  ad: AdAdminDTO;
  aiRiskScore: number | null;
  aiReasons: string[];
  aiVerdict: AiVerdict;
  humanDecision: 'APPROVE' | 'REJECT' | 'ESCALATE' | null;
  reviewerId: string | null;
  decidedAt: string | null;
  status: 'PENDING_HUMAN' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  createdAt: string | null;
}

export interface ModerationListParams {
  tab?: ModerationTab;
  risk?: ModerationRisk;
  search?: string;
  page?: number;
}

function buildQuery(params: ModerationListParams): string {
  const q = new URLSearchParams();
  if (params.tab) q.set('tab', params.tab);
  if (params.risk && params.risk !== 'ALL') q.set('risk', params.risk);
  if (params.search) q.set('search', params.search);
  if (params.page && params.page > 1) q.set('page', String(params.page));
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

export type { PageMeta };

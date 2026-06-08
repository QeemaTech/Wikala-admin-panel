import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '@/lib/api/client';

/**
 * GET /admin/settings/auction returns the raw `system_settings.auction`
 * subdocument (snake_case — there is no global snake→camel transform on this
 * endpoint), so the read shape and the write shape differ.
 */
export interface AuctionRulesRaw {
  default_duration_days: number;
  max_duration_days: number;
  min_bid_increment_minor: number;
  auto_extend_seconds: number;
  auto_extend_enabled: boolean;
  verified_only: boolean;
  outbid_push_enabled: boolean;
}

/**
 * PUT body — camelCase, and the field names MUST match the service's
 * destructuring (`autoExtendEnabled`/`outbidPushEnabled`), NOT the contract
 * DTO's `autoExtend`/`outbidPush`, or the toggles are silently dropped.
 */
export interface AuctionRulesPatch {
  defaultDurationDays?: number;
  maxDurationDays?: number;
  minBidIncrementMinor?: number;
  autoExtendSeconds?: number;
  autoExtendEnabled?: boolean;
  verifiedOnly?: boolean;
  outbidPushEnabled?: boolean;
}

export function useAuctionRules() {
  return useQuery({
    queryKey: ['auction-rules'],
    queryFn: () => get<AuctionRulesRaw>('/admin/settings/auction'),
    staleTime: 60_000,
  });
}

export function useUpdateAuctionRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: AuctionRulesPatch) => put<AuctionRulesRaw>('/admin/settings/auction', patch),
    onSuccess: (data) => {
      qc.setQueryData(['auction-rules'], data);
    },
  });
}

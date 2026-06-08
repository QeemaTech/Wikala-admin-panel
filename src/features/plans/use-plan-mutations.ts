import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch, post } from '@/lib/api/client';
import type {
  AdminPlanDTO,
  SearchPlacement,
  AnalyticsLevel,
  SupportLevel,
} from './use-plans';

/** Structured entitlement fields shared by create + update. */
export interface PlanWritePayload {
  name: string;
  priceMinor: number;
  currency: string;
  adQuotaTotal: number;
  dealRadarLimit: number;
  searchPlacement: SearchPlacement;
  analyticsLevel: AnalyticsLevel;
  supportLevel: SupportLevel;
  verifiedBadge: boolean;
  marketingBullets: string[];
  popular: boolean;
}

/** Create payload also carries the immutable machine code. */
export interface PlanCreatePayload extends PlanWritePayload {
  plan: string;
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin-plans'] });
  qc.invalidateQueries({ queryKey: ['subscription-plans'] });
}

/** POST /admin/plans — Contract §7.38 (create a new plan). */
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlanCreatePayload) => post<AdminPlanDTO>('/admin/plans', payload),
    onSuccess: () => invalidate(qc),
  });
}

/** PATCH /admin/plans/:plan — Contract §7.38. */
export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plan, payload }: { plan: string; payload: Partial<PlanWritePayload> }) =>
      patch<AdminPlanDTO>(`/admin/plans/${plan}`, payload),
    onSuccess: () => invalidate(qc),
  });
}

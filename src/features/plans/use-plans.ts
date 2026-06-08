import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type SearchPlacement = 'STANDARD' | 'BOOSTED' | 'TOP';
export type AnalyticsLevel = 'BASIC' | 'ADVANCED';
export type SupportLevel = 'EMAIL' | 'PRIORITY';

export interface PlanDTO {
  plan: string;
  /** Human display name (Arabic) — falls back to the code for legacy/unnamed plans. */
  name: string;
  adQuotaTotal: number;
  priceMinor: number;
  currency: string;
  active: boolean;
  popular: boolean;
  // Structured entitlements — the source of truth for the advantages list.
  dealRadarLimit: number; // 0 = unlimited
  searchPlacement: SearchPlacement;
  analyticsLevel: AnalyticsLevel;
  supportLevel: SupportLevel;
  verifiedBadge: boolean;
  marketingBullets: string[];
  /** Derived display bullets (generated server-side from the structured fields). */
  advantages: string[];
}

/** AdminPlanDTO — Contract §7.38 `GET /admin/plans` (full admin shape with stats). */
export interface AdminPlanDTO extends PlanDTO {
  cycle: string;
  activeSubscribers: number;
  newLast7d: number;
  mrrMinor: number;
}

export type SubscriptionStatus =
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED';

export interface SubscriberUser {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  joinedAt: string | null;
}

/** SubscriberDTO — Contract §7.38 subscribers list (cross-plan or per-plan). */
export interface SubscriberDTO {
  subscriptionId: string;
  plan: string;
  status: SubscriptionStatus;
  user: SubscriberUser | null;
  periodStart: string | null;
  periodEnd: string | null;
  nextRenewal: string | null;
  amountMinor: number;
  currency: string;
  adQuotaUsed: number;
  adQuotaTotal: number;
}

/** Page shape exposed to tables — mirrors `UsersPage` (meta-in-data, `pages`). */
export interface SubscribersPage {
  items: SubscriberDTO[];
  total: number;
  page: number;
  pages: number;
}

const PLAN_LABEL_AR: Record<string, string> = {
  BASIC: 'الأساسية',
  PRO: 'الاحترافية',
};

export function planLabelAr(plan: string): string {
  return PLAN_LABEL_AR[plan] ?? plan;
}

/**
 * Resolves a plan CODE → its API-provided display `name`, falling back to
 * planLabelAr for legacy/unnamed plans. Use this at code-only sites (tables,
 * badges, selects) so dynamically-created plans show their real Arabic name
 * instead of the raw code — the name is never hardcoded. Shares the
 * `subscription-plans` query cache, so it adds no extra request.
 */
export function usePlanLabel(): (plan: string) => string {
  const { data } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => get<PlanDTO[]>('/admin/plans'),
    staleTime: 5 * 60_000,
  });
  const nameByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of data ?? []) if (p.name) m[p.plan] = p.name;
    return m;
  }, [data]);
  return (plan: string) => nameByCode[plan] || planLabelAr(plan);
}

/** Stable order matching the prototype (Basic → Pro). */
const PLAN_ORDER = ['BASIC', 'PRO'];

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => get<PlanDTO[]>('/admin/plans'),
    staleTime: 5 * 60_000,
    select: (plans) => plans.filter((p) => p.active),
  });
}

/** Full admin plans list (with subscriber/MRR stats) for the /plans page. */
export function useAdminPlans() {
  return useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => get<AdminPlanDTO[]>('/admin/plans'),
    staleTime: 60_000,
    select: (plans) =>
      [...plans].sort((a, b) => {
        const ai = PLAN_ORDER.indexOf(a.plan);
        const bi = PLAN_ORDER.indexOf(b.plan);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }),
  });
}

/** Backend envelope for paginated subscribers (meta nested in `data`). */
interface SubscribersEnvelope {
  items: SubscriberDTO[];
  meta: { page: number; pageSize: number; total: number; pages: number };
}

function toPage(env: SubscribersEnvelope): SubscribersPage {
  return { items: env.items, total: env.meta.total, page: env.meta.page, pages: env.meta.pages };
}

/**
 * Recent subscribers — cross-plan by default, or scoped to a single plan.
 * Cross-plan → `GET /admin/plans/subscribers`; scoped → `GET /admin/plans/:plan/subscribers`.
 */
export function useRecentSubscribers(params: { plan?: string; page?: number } = {}) {
  const { plan, page = 1 } = params;
  const path = plan
    ? `/admin/plans/${plan}/subscribers`
    : '/admin/plans/subscribers';
  const qs = page > 1 ? `?page=${page}` : '';
  return useQuery({
    queryKey: ['recent-subscribers', plan ?? 'ALL', page],
    queryFn: () => get<SubscribersEnvelope>(`${path}${qs}`),
    staleTime: 30_000,
    select: toPage,
  });
}

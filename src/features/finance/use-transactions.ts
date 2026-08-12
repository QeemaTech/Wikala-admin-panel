import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type TransactionKind = 'BOOST' | 'SUBSCRIPTION' | 'ORDER';
export type TransactionStatus = 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

/** TransactionDTO — Contract §8 Payments. */
export interface TransactionDTO {
  id: string;
  userId: string | null;
  kind: TransactionKind;
  refId: string | null;
  amountMinor: number;
  currency: string;
  provider: string;
  providerIntentId: string | null;
  status: TransactionStatus;
  createdAt: string | null;
  capturedAt: string | null;
  refundedAt: string | null;
}

export interface TransactionsPage {
  items: TransactionDTO[];
  total: number;
  page: number;
  pages: number;
}

interface TransactionsEnvelope {
  items: TransactionDTO[];
  meta: { page: number; pageSize: number; total: number; pages: number };
}

/** Arabic label per ledger kind — shared by every payments surface. */
export const KIND_LABELS: Record<TransactionKind, string> = {
  SUBSCRIPTION: 'اشتراك',
  ORDER: 'طلب منتجات',
  BOOST: 'تعزيز',
};

/**
 * What a transaction was for, resolved server-side to avoid an N+1. The list
 * carries the identifying fields; the detail endpoint fills in the rest.
 */
export interface TransactionReference {
  type: TransactionKind;
  label: string;
  // ORDER
  orderId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  itemCount?: number;
  // SUBSCRIPTION
  subscriptionId?: string;
  subscriptionStatus?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  nextRenewal?: string | null;
  adQuotaTotal?: number;
  adQuotaUsed?: number;
  // BOOST
  boostId?: string;
  boostStatus?: string;
  adId?: string | null;
  adTitle?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
}

/** The payer. `email` and `role` are only populated by the detail endpoint. */
export interface TransactionUser {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  email?: string | null;
  role?: string;
}

/** A row on the unified admin Payments list, and the detail page's payload. */
export interface AdminTransactionDTO extends TransactionDTO {
  user: TransactionUser | null;
  reference: TransactionReference | null;
}

export interface AdminTransactionsMeta {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface TransactionsSummary {
  captured: { totalMinor: number; count: number };
  pending: { totalMinor: number; count: number };
  refunded: { totalMinor: number; count: number };
  failed: { totalMinor: number; count: number };
  byKind: Record<TransactionKind, { totalMinor: number; count: number }>;
  currency: string;
}

export interface AdminTransactionParams {
  kind?: TransactionKind | '';
  status?: TransactionStatus | '';
  search?: string;
  from?: string;
  to?: string;
  page?: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/**
 * The unified Payments ledger — plan subscriptions, product orders and boosts
 * in one list (`GET /admin/transactions`). Tabs are a `kind` filter, not
 * separate endpoints.
 */
export function useAdminTransactions(params: AdminTransactionParams = {}) {
  return useQuery({
    queryKey: ['admin-transactions', params],
    queryFn: () =>
      get<{ items: AdminTransactionDTO[]; meta: AdminTransactionsMeta }>(
        `/admin/transactions${qs({ ...params, page: params.page })}`,
      ),
    staleTime: 30_000,
  });
}

/** One transaction with a fully-resolved reference (`GET /admin/transactions/:id`). */
export function useTransaction(id: string | null) {
  return useQuery({
    queryKey: ['admin-transaction', id],
    queryFn: () => get<AdminTransactionDTO>(`/admin/transactions/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** KPI strip for the Payments page (`GET /admin/transactions/summary`). */
export function useTransactionsSummary(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ['admin-transactions-summary', params],
    queryFn: () => get<TransactionsSummary>(`/admin/transactions/summary${qs(params)}`),
    staleTime: 60_000,
  });
}

/**
 * One user's payment history (admin view) —
 * `GET /admin/users/:id/transactions` (admin variant of §8 `/payments/me/transactions`).
 */
export function useUserTransactions(userId: string | null, params: { page?: number } = {}) {
  const { page = 1 } = params;
  const qs = page > 1 ? `?page=${page}` : '';
  return useQuery({
    queryKey: ['user-transactions', userId, page],
    queryFn: () => get<TransactionsEnvelope>(`/admin/users/${userId}/transactions${qs}`),
    enabled: !!userId,
    staleTime: 30_000,
    select: (env): TransactionsPage => ({
      items: env.items,
      total: env.meta.total,
      page: env.meta.page,
      pages: env.meta.pages,
    }),
  });
}

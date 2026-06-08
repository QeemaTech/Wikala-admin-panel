import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type TransactionKind = 'BOOST' | 'SUBSCRIPTION';
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

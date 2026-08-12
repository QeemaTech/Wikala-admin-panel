'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatAmountMinor } from '@/lib/i18n/format';
import {
  useUserTransactions,
  type TransactionKind,
  type TransactionStatus,
} from '@/features/finance/use-transactions';

const KIND_LABEL: Record<TransactionKind, string> = {
  BOOST: 'تعزيز',
  SUBSCRIPTION: 'اشتراك',
  ORDER: 'طلب منتجات',
};

const STATUS: Record<TransactionStatus, { label: string; tone: 'green' | 'red' | 'amber' | 'gray' }> = {
  CAPTURED: { label: 'مدفوع', tone: 'green' },
  PENDING: { label: 'معلّق', tone: 'amber' },
  FAILED: { label: 'فشل', tone: 'red' },
  REFUNDED: { label: 'مُسترجع', tone: 'gray' },
};

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))
    .replace(BIDI, '');
}

interface TransactionsTableProps {
  userId: string;
}

export function TransactionsTable({ userId }: TransactionsTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useUserTransactions(userId, { page });

  if (isError) {
    return <p className="py-3 text-[13px] text-muted">تعذّر تحميل المعاملات</p>;
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2 py-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-[8px] bg-surface-2" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return <p className="py-3 text-[13px] text-muted">لا توجد معاملات مالية</p>;
  }

  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-2">
      {items.map((tx) => {
        const status = STATUS[tx.status] ?? { label: tx.status, tone: 'gray' as const };
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-surface px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-ink">{KIND_LABEL[tx.kind] ?? tx.kind}</span>
                <span className="text-[11px] text-muted">· {tx.provider}</span>
              </div>
              <div className="text-[11px] text-muted">{fmtDate(tx.createdAt)}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] font-semibold text-ink">
                {formatAmountMinor(tx.amountMinor)}{' '}
                <span className="text-[10.5px] font-normal text-muted">{tx.currency}</span>
              </span>
              <Chip tone={status.tone} dot>{status.label}</Chip>
            </div>
          </div>
        );
      })}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-1 pt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="grid h-7 w-7 place-items-center rounded-[7px] border border-border text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            <Icon name="chevron-end" size={12} />
          </button>
          <span className="px-1 text-[12px] text-muted">{page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="grid h-7 w-7 place-items-center rounded-[7px] border border-border text-ink-2 hover:bg-surface-2 disabled:opacity-40"
          >
            <Icon name="chevron-start" size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

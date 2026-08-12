'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  KIND_LABELS,
  type AdminTransactionDTO,
  type AdminTransactionsMeta,
  type TransactionStatus,
} from '@/features/finance/use-transactions';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(BIDI, '');
}

const STATUS: Record<TransactionStatus, { label: string; tone: 'green' | 'red' | 'amber' | 'gray' }> = {
  CAPTURED: { label: 'مدفوع', tone: 'green' },
  PENDING: { label: 'معلّق', tone: 'amber' },
  FAILED: { label: 'فشل', tone: 'red' },
  REFUNDED: { label: 'مُسترجع', tone: 'gray' },
};

const KIND_TONE = { SUBSCRIPTION: 'violet', ORDER: 'blue', BOOST: 'amber' } as const;

/** Cash on delivery is in the same ledger, so the provider column must name it. */
const PROVIDER_LABELS: Record<string, string> = {
  COD: 'عند الاستلام',
  PAYMOB: 'Paymob',
  STRIPE: 'Stripe',
  MEMORY: 'تجريبي',
};

interface PaymentsTableProps {
  items: AdminTransactionDTO[];
  meta?: AdminTransactionsMeta;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
}

export function PaymentsTable({
  items,
  meta,
  isLoading,
  isError,
  onPageChange,
}: PaymentsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-[10px] bg-surface-2" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
        <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
        <p className="mt-2 text-[13px] text-muted">تعذّر تحميل المعاملات</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
        <Icon name="wallet" size={28} className="mx-auto text-muted" />
        <p className="mt-2 text-[13px] text-muted">لا توجد معاملات مطابقة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-white">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-3 py-2.5 text-start font-medium text-muted">التاريخ</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">المشتري</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">النوع</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">المرجع</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">المبلغ</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">وسيلة الدفع</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">الحالة</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((tx) => {
              const status = STATUS[tx.status] ?? { label: tx.status, tone: 'gray' as const };
              return (
                <tr
                  key={tx.id}
                  onClick={() => router.push(`/payments/${tx.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface/60"
                >
                  <td className="px-3 py-2.5 text-muted">{fmtDate(tx.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    {tx.user ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={tx.user.name} src={tx.user.avatarUrl ?? undefined} size={26} />
                        <div className="min-w-0">
                          <div className="truncate text-ink">{tx.user.name}</div>
                          <div dir="ltr" className="text-start font-mono text-[11px] text-muted">
                            {tx.user.phone}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip tone={KIND_TONE[tx.kind] ?? 'gray'}>{KIND_LABELS[tx.kind] ?? tx.kind}</Chip>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/payments/${tx.id}`} className="font-mono text-ink hover:text-brand">
                      {tx.reference?.label ?? '—'}
                    </Link>
                    {tx.reference?.itemCount != null && (
                      <div className="text-[11px] text-muted">
                        {formatNumber(tx.reference.itemCount)} قطعة
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-semibold text-ink">
                      {formatAmountMinor(tx.amountMinor)}
                    </span>
                    <span className="ms-1 text-[10.5px] text-muted">{tx.currency}</span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">
                    {PROVIDER_LABELS[tx.provider] ?? tx.provider}
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip tone={status.tone} dot>
                      {status.label}
                    </Chip>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/payments/${tx.id}`}
                      className="flex items-center justify-end gap-1 rounded-[5px] px-2 py-1 text-[12px] text-muted hover:bg-surface hover:text-ink"
                    >
                      <Icon name="eye" size={12} /> التفاصيل
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-[12.5px] text-muted">
          <span>
            صفحة {formatNumber(meta.page)} من {formatNumber(meta.pages)} · {formatNumber(meta.total)} معاملة
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="السابق"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-end" size={14} />
            </button>
            <span className="px-2 font-mono">{formatNumber(meta.page)}</span>
            <button
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="التالي"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-start" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

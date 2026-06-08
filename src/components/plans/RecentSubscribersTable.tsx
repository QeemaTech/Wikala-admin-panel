'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import { buildPages } from '@/lib/ui/build-pages';
import {
  usePlanLabel,
  useRecentSubscribers,
  type SubscriberDTO,
  type SubscriptionStatus,
} from '@/features/plans/use-plans';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(iso))
    .replace(BIDI, '');
}

const STATUS: Record<SubscriptionStatus, { label: string; tone: 'green' | 'red' | 'amber' | 'gray' }> = {
  ACTIVE: { label: 'مفعّل', tone: 'green' },
  CANCELLED: { label: 'ملغى', tone: 'red' },
  EXPIRED: { label: 'منتهٍ', tone: 'gray' },
  PAST_DUE: { label: 'متأخر', tone: 'amber' },
  PENDING_PAYMENT: { label: 'معلّق', tone: 'gray' },
};

function planTone(plan: string): 'violet' | 'gray' {
  return plan === 'PRO' ? 'violet' : 'gray';
}

interface RecentSubscribersTableProps {
  /** When set, scopes the list to one plan; otherwise shows all plans. */
  plan?: string;
  onClearPlan?: () => void;
}

export function RecentSubscribersTable({ plan, onClearPlan }: RecentSubscribersTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useRecentSubscribers({ plan, page });
  const planLabel = usePlanLabel();

  const title = plan ? `مشتركو ${planLabel(plan)}` : 'آخر المشتركين';

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-[14px]">
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        {plan && onClearPlan && (
          <button
            type="button"
            onClick={() => {
              setPage(1);
              onClearPlan();
            }}
            className="flex items-center gap-1 rounded-[7px] border border-border px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:bg-surface-2"
          >
            <Icon name="x" size={12} /> عرض الكل
          </button>
        )}
      </div>

      {isError ? (
        <div className="p-8 text-center text-[13px] text-muted">تعذّر تحميل المشتركين</div>
      ) : isLoading ? (
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[56px] border-b border-border last:border-0" />
          ))}
        </div>
      ) : (
        <SubscribersTableBody
          items={data?.items ?? []}
          total={data?.total ?? 0}
          page={data?.page ?? 1}
          pages={data?.pages ?? 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function SubscribersTableBody({
  items,
  total,
  page,
  pages,
  onPageChange,
}: {
  items: SubscriberDTO[];
  total: number;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}) {
  const planLabel = usePlanLabel();
  const from = total === 0 ? 0 : (page - 1) * 20 + 1;
  const to = Math.min(from + items.length - 1, total);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-start font-medium text-muted">المستخدم</th>
            <th className="px-4 py-3 text-start font-medium text-muted">الخطة</th>
            <th className="px-4 py-3 text-start font-medium text-muted">تاريخ الاشتراك</th>
            <th className="px-4 py-3 text-start font-medium text-muted">التجديد القادم</th>
            <th className="px-4 py-3 text-start font-medium text-muted">القيمة المدفوعة</th>
            <th className="px-4 py-3 text-start font-medium text-muted">الحالة</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-muted">
                لا يوجد مشتركون
              </td>
            </tr>
          ) : (
            items.map((sub) => {
              const status = STATUS[sub.status] ?? { label: sub.status, tone: 'gray' as const };
              return (
                <tr key={sub.subscriptionId} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={sub.user?.name ?? '؟'} src={sub.user?.avatarUrl ?? null} size={34} />
                      <div>
                        <p className="font-medium text-ink">{sub.user?.name ?? 'مستخدم محذوف'}</p>
                        {sub.user?.phone && (
                          <p dir="ltr" className="text-start font-mono text-[11px] text-muted">{sub.user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={planTone(sub.plan)}>{planLabel(sub.plan)}</Chip>
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtDate(sub.periodStart)}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(sub.nextRenewal ?? sub.periodEnd)}</td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {formatAmountMinor(sub.amountMinor)}{' '}
                    <span className="text-[11px] text-muted">{sub.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={status.tone} dot>{status.label}</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label="إجراءات"
                      className="grid h-7 w-7 place-items-center rounded-[7px] border border-border text-muted hover:bg-surface-2 hover:text-ink"
                    >
                      <Icon name="more-v" size={14} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-[18px] py-3 text-[12px] text-muted">
          <span>تعرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)} مشترك</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
            >
              <Icon name="chevron-end" size={12} />
            </button>
            {buildPages(page, pages).map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="grid h-7 min-w-[28px] place-items-center text-ink-2">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`grid h-7 min-w-[28px] place-items-center rounded-[7px] border px-1 text-[12px] transition-colors ${
                    p === page
                      ? 'border-brand bg-brand text-white'
                      : 'border-border bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {formatNumber(p)}
                </button>
              ),
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
            >
              <Icon name="chevron-start" size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

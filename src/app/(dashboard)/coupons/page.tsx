'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CouponForm } from '@/components/coupons/CouponForm';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  useCoupons,
  useDeleteCoupon,
  COUPON_TYPE_LABELS,
  type CouponDTO,
} from '@/features/coupons/use-coupons';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))
    .replace(BIDI, '');
}

const FILTERS = [
  { value: '', label: 'الكل' },
  { value: 'true', label: 'مفعّل' },
  { value: 'false', label: 'معطّل' },
];

/** PERCENT stores plain points; FIXED stores minor units. */
function discountLabel(c: CouponDTO): string {
  return c.type === 'PERCENT' ? `${formatNumber(c.value)}٪` : `${formatAmountMinor(c.value)} ${c.currency}`;
}

export default function CouponsPage() {
  const [active, setActive] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formFor, setFormFor] = useState<{ coupon: CouponDTO | null } | null>(null);
  const [deleteFor, setDeleteFor] = useState<CouponDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError } = useCoupons({ active, search, page });
  const remove = useDeleteCoupon();

  const resetTo = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const confirmDelete = () => {
    if (!deleteFor) return;
    setDeleteError(null);
    remove.mutate(deleteFor.id, {
      onSuccess: () => setDeleteFor(null),
      onError: (e) => setDeleteError(e instanceof Error ? e.message : 'تعذّر حذف الكوبون.'),
    });
  };

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="كوبونات الخصم"
        sub="أكواد الخصم التي يطبّقها المشترون على سلة المنتجات"
        actions={
          <button
            type="button"
            onClick={() => setFormFor({ coupon: null })}
            className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
          >
            <Icon name="plus" size={14} /> إنشاء كوبون
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented options={FILTERS} value={active} onChange={(v) => resetTo(() => setActive(v))} />
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted">
            <Icon name="search" size={14} />
          </span>
          <input
            value={search}
            onChange={(e) => resetTo(() => setSearch(e.target.value))}
            placeholder="ابحث برمز الكوبون…"
            dir="ltr"
            className="w-56 rounded-[8px] border border-border bg-surface py-2 pe-3 ps-9 text-start font-mono text-[13px] text-ink outline-none placeholder:font-sans placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-[10px] bg-surface-2" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
          <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
          <p className="mt-2 text-[13px] text-muted">تعذّر تحميل الكوبونات</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
          <Icon name="ticket" size={28} className="mx-auto text-muted" />
          <p className="mt-2 text-[13px] text-muted">لا توجد كوبونات</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2.5 text-start font-medium text-muted">الرمز</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">النوع</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الخصم</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">حد أدنى</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الاستخدام</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الفترة</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الحالة</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td dir="ltr" className="px-3 py-2.5 text-start font-mono font-semibold text-ink">
                    {c.code}
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">{COUPON_TYPE_LABELS[c.type]}</td>
                  <td className="px-3 py-2.5 font-mono text-ink">{discountLabel(c)}</td>
                  <td className="px-3 py-2.5 font-mono text-muted">
                    {c.minSubtotalMinor ? formatAmountMinor(c.minSubtotalMinor) : '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-ink">
                    {formatNumber(c.usedCount)}
                    <span className="text-muted">
                      {' / '}
                      {c.usageLimit ? formatNumber(c.usageLimit) : '∞'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-muted">
                    {fmtDate(c.startsAt)} — {fmtDate(c.endsAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.active ? (
                      <Chip tone="green" dot>
                        مفعّل
                      </Chip>
                    ) : (
                      <Chip tone="gray" dot>
                        معطّل
                      </Chip>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setFormFor({ coupon: c })}
                        className="flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] text-muted hover:bg-surface hover:text-ink"
                      >
                        <Icon name="pencil" size={12} /> تعديل
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteFor(c);
                        }}
                        aria-label="حذف"
                        className="grid h-6 w-6 place-items-center rounded-[5px] text-muted hover:bg-red/10 hover:text-red"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-[12.5px] text-muted">
          <span>
            صفحة {formatNumber(meta.page)} من {formatNumber(meta.pages)} · {formatNumber(meta.total)} كوبون
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="السابق"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-end" size={14} />
            </button>
            <span className="px-2 font-mono">{formatNumber(meta.page)}</span>
            <button
              disabled={meta.page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="التالي"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-start" size={14} />
            </button>
          </div>
        </div>
      )}

      {formFor && <CouponForm coupon={formFor.coupon} onClose={() => setFormFor(null)} />}

      {deleteFor && (
        <ConfirmDialog
          title="حذف الكوبون"
          message={`سيتوقف قبول الرمز «${deleteFor.code}». الطلبات السابقة التي استخدمته لا تتأثر.`}
          confirmLabel="حذف"
          loading={remove.isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteFor(null)}
        />
      )}
    </div>
  );
}

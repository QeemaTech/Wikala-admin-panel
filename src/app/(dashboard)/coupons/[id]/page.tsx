'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { KpiCard } from '@/components/ui/KpiCard';
import { PageHead } from '@/components/ui/PageHead';
import { StatusPill } from '@/components/ui/StatusPill';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Switch } from '@/components/forms/Field';
import { CouponForm } from '@/components/coupons/CouponForm';
import { DetailRow as Row, fmtDateTime } from '@/components/finance/OrderPanel';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  useCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
  COUPON_TYPE_LABELS,
} from '@/features/coupons/use-coupons';

export default function CouponDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: coupon, isLoading, isError } = useCoupon(id);
  const update = useUpdateCoupon();
  const remove = useDeleteCoupon();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] animate-pulse px-7 pb-14 pt-6">
        <div className="mb-6 h-8 w-56 rounded bg-surface" />
        <div className="h-[320px] rounded-[var(--radius)] bg-surface" />
      </div>
    );
  }

  if (isError || !coupon) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
          <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
          <p className="mt-2 text-[13px] text-muted">تعذّر تحميل الكوبون — قد يكون محذوفًا.</p>
          <Link
            href="/coupons"
            className="mt-3 inline-block rounded-[8px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            العودة إلى الكوبونات
          </Link>
        </div>
      </div>
    );
  }

  const toggleActive = (active: boolean) => {
    setError(null);
    update.mutate(
      { id, payload: { active } },
      { onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر تغيير الحالة.') },
    );
  };

  const discount =
    coupon.type === 'PERCENT'
      ? `${formatNumber(coupon.value)}٪`
      : `${formatAmountMinor(coupon.value)} ${coupon.currency}`;

  const remaining = coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : null;
  const now = Date.now();
  const notStarted = !!coupon.startsAt && new Date(coupon.startsAt).getTime() > now;
  const expired = !!coupon.endsAt && new Date(coupon.endsAt).getTime() <= now;
  const exhausted = remaining != null && remaining <= 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <Link
        href="/coupons"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink"
      >
        <Icon name="chevron-start" size={13} /> كل الكوبونات
      </Link>

      <PageHead
        title={coupon.code}
        sub={`${COUPON_TYPE_LABELS[coupon.type]} · خصم ${discount}`}
        actions={
          <div className="flex items-center gap-3">
            <Switch checked={coupon.active} onChange={toggleActive} label="مفعّل" />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
            >
              <Icon name="pencil" size={14} /> تعديل
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="حذف"
              className="grid h-9 w-9 place-items-center rounded-[8px] border border-border text-muted hover:bg-red/10 hover:text-red"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-red/20 bg-red-50 px-4 py-2.5 text-[12.5px] text-red">
          <Icon name="alert-triangle" size={15} /> {error}
        </div>
      )}

      {/* Why a live-looking coupon may still be refused at checkout. */}
      {(!coupon.active || notStarted || expired || exhausted) && (
        <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-amber/30 bg-amber-50 px-4 py-3 text-[12.5px] text-amber">
          <Icon name="alert-triangle" size={15} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">هذا الكوبون لا يعمل حاليًا</p>
            <p className="mt-0.5">
              {!coupon.active
                ? 'الكوبون معطّل.'
                : notStarted
                  ? 'لم يبدأ بعد — تاريخ البدء في المستقبل.'
                  : expired
                    ? 'انتهت صلاحيته.'
                    : 'استُنفد حد الاستخدام الكلي.'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="مرات الاستخدام"
          value={coupon.usedCount}
          icon={<Icon name="ticket" size={18} />}
          tintColor="#226199"
        />
        <KpiCard
          label="الطلبات المحتسبة"
          value={coupon.usage.orderCount}
          icon={<Icon name="archive" size={18} />}
          tintColor="#178a8a"
        />
        <KpiCard
          label="إجمالي الخصم الممنوح"
          value={coupon.usage.totalDiscountMinor}
          formatter={formatAmountMinor}
          unit={coupon.usage.currency}
          icon={<Icon name="arrow-down" size={18} />}
          tintColor="#d44030"
        />
        <KpiCard
          label="إيراد الطلبات المرتبطة"
          value={coupon.usage.totalRevenueMinor}
          formatter={formatAmountMinor}
          unit={coupon.usage.currency}
          icon={<Icon name="wallet" size={18} />}
          tintColor="#1f9c63"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="الشروط">
          <Row
            label="الحالة"
            value={
              coupon.active ? (
                <Chip tone="green" dot>مفعّل</Chip>
              ) : (
                <Chip tone="gray" dot>معطّل</Chip>
              )
            }
          />
          <Row label="نوع الخصم" value={COUPON_TYPE_LABELS[coupon.type]} />
          <Row label="قيمة الخصم" value={<span className="font-mono">{discount}</span>} />
          <Row
            label="حد أدنى للطلب"
            value={
              coupon.minSubtotalMinor ? (
                <span className="font-mono">
                  {formatAmountMinor(coupon.minSubtotalMinor)} {coupon.currency}
                </span>
              ) : (
                'بدون'
              )
            }
          />
          <Row
            label="أقصى خصم"
            value={
              coupon.maxDiscountMinor != null ? (
                <span className="font-mono">
                  {formatAmountMinor(coupon.maxDiscountMinor)} {coupon.currency}
                </span>
              ) : (
                'بدون سقف'
              )
            }
          />
          <Row
            label="حد الاستخدام الكلي"
            value={
              coupon.usageLimit ? (
                <span className="font-mono">
                  {formatNumber(coupon.usedCount)} / {formatNumber(coupon.usageLimit)}
                  {remaining != null && remaining > 0 && (
                    <span className="ms-1.5 text-[11px] text-muted">
                      (متبقٍ {formatNumber(remaining)})
                    </span>
                  )}
                </span>
              ) : (
                'غير محدود'
              )
            }
          />
          <Row label="لكل مستخدم" value={<span className="font-mono">{formatNumber(coupon.perUserLimit)}</span>} />
          <Row label="يبدأ في" value={fmtDateTime(coupon.startsAt)} />
          <Row label="ينتهي في" value={fmtDateTime(coupon.endsAt)} />
          <Row label="أُنشئ في" value={fmtDateTime(coupon.createdAt)} />
        </Card>

        <Card
          title="الطلبات التي استخدمت الكوبون"
          sub={
            coupon.redemptions.length
              ? 'الطلبات الملغاة والمُسترجعة لا تُحتسب في الإجماليات أعلاه'
              : undefined
          }
          className="lg:col-span-2"
        >
          {coupon.redemptions.length === 0 ? (
            <div className="py-10 text-center text-muted">
              <Icon name="ticket" size={26} className="mx-auto" />
              <p className="mt-2 text-[12.5px]">لم يُستخدم هذا الكوبون بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2.5 text-start font-medium text-muted">الطلب</th>
                    <th className="px-3 py-2.5 text-start font-medium text-muted">المشتري</th>
                    <th className="px-3 py-2.5 text-start font-medium text-muted">الخصم</th>
                    <th className="px-3 py-2.5 text-start font-medium text-muted">الإجمالي</th>
                    <th className="px-3 py-2.5 text-start font-medium text-muted">الحالة</th>
                    <th className="px-3 py-2.5 text-start font-medium text-muted">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {coupon.redemptions.map((r) => (
                    <tr key={r.orderId} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 font-mono font-semibold text-ink">{r.orderNo}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-ink">{r.buyer?.name ?? '—'}</div>
                        {r.buyer && (
                          <div dir="ltr" className="text-start font-mono text-[11px] text-muted">
                            {r.buyer.phone ?? '—'}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-green">
                        −{formatAmountMinor(r.discountMinor)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-ink">
                        {formatAmountMinor(r.totalMinor)}
                        <span className="ms-1 text-[10.5px] text-muted">{r.currency}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-muted">
                        {fmtDateTime(r.placedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {editing && <CouponForm coupon={coupon} onClose={() => setEditing(false)} />}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف الكوبون"
          message={`سيتوقف قبول الرمز «${coupon.code}». الطلبات السابقة التي استخدمته لا تتأثر.`}
          confirmLabel="حذف"
          loading={remove.isPending}
          error={error}
          onConfirm={() =>
            remove.mutate(coupon.id, {
              onSuccess: () => router.push('/coupons'),
              onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر حذف الكوبون.'),
            })
          }
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

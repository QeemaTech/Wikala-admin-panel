'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  useOrder,
  useUpdateOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
} from '@/features/orders/use-orders';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDateTime(iso: string | null): string {
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border py-2 last:border-0">
      <span className="shrink-0 text-[12px] text-muted">{label}</span>
      <span className="text-start text-[13px] text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** Cancelling and refunding cannot be undone, so they ask first. */
const NEEDS_CONFIRM: OrderStatus[] = ['CANCELLED', 'REFUNDED'];

/**
 * The order behind an `ORDER` transaction: line items, bill, delivery address,
 * timeline, and the fulfilment actions. The server's transition map is mirrored
 * in `ORDER_TRANSITIONS` so only legal moves are offered.
 */
export function OrderPanel({ orderId }: { orderId: string }) {
  const { data: order, isLoading, isError } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const [confirmFor, setConfirmFor] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const move = (status: OrderStatus) => {
    setError(null);
    updateStatus.mutate(
      { id: orderId, status },
      {
        onSuccess: () => setConfirmFor(null),
        onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر تحديث حالة الطلب.'),
      },
    );
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-[var(--radius)] bg-surface" />;
  }
  if (isError || !order) {
    return (
      <Card title="الطلب">
        <p className="py-6 text-center text-[13px] text-muted">تعذّر تحميل الطلب</p>
      </Card>
    );
  }

  const nextStates = ORDER_TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-4">
      <Card
        title={`الطلب ${order.orderNo}`}
        sub={`${formatNumber(order.items.length)} صنف · ${fmtDateTime(order.placedAt)}`}
        actions={<StatusPill status={order.status} />}
      >
        <div className="space-y-2">
          {order.items.map((it) => (
            <div
              key={it.productId}
              className="flex items-center gap-2.5 rounded-[10px] border border-border px-3 py-2"
            >
              <Thumbnail
                src={it.coverUrl}
                alt={it.title}
                icon="archive"
                className="h-10 w-10 rounded-[8px] bg-surface-2"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-ink">{it.title}</div>
                <div className="font-mono text-[11.5px] text-muted">
                  {formatAmountMinor(it.unitPriceMinor)} × {formatNumber(it.qty)}
                </div>
              </div>
              <span className="font-mono text-[13px] font-semibold text-ink">
                {formatAmountMinor(it.subtotalMinor)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-[10px] border border-border bg-surface px-3 py-1">
          <Row label="المجموع الفرعي" value={<span className="font-mono">{formatAmountMinor(order.subtotalMinor)}</span>} />
          <Row label="رسوم التوصيل" value={<span className="font-mono">{formatAmountMinor(order.deliveryFeeMinor)}</span>} />
          {order.discountMinor > 0 && (
            <Row
              label={`الخصم${order.couponCode ? ` (${order.couponCode})` : ''}`}
              value={<span className="font-mono text-green">−{formatAmountMinor(order.discountMinor)}</span>}
            />
          )}
          <Row
            label="الإجمالي"
            value={
              <span className="font-mono text-[15px] font-bold text-ink">
                {formatAmountMinor(order.totalMinor)}{' '}
                <span className="text-[11px] font-normal text-muted">{order.currency}</span>
              </span>
            }
          />
        </div>

        {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}

        {nextStates.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="me-1 text-[12px] text-muted">نقل الطلب إلى:</span>
            {nextStates.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updateStatus.isPending}
                onClick={() => (NEEDS_CONFIRM.includes(s) ? setConfirmFor(s) : move(s))}
                className={`rounded-[8px] border px-3.5 py-2 text-[13px] font-medium disabled:opacity-50 ${
                  NEEDS_CONFIRM.includes(s)
                    ? 'border-border text-muted hover:text-red'
                    : 'border-brand bg-brand text-white hover:bg-brand/90'
                }`}
              >
                {ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="الدفع">
          <Row label="طريقة الدفع" value={PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} />
          <Row label="حالة الدفع" value={<StatusPill status={order.paymentStatus} />} />
          {order.cancelReason && <Row label="سبب الإلغاء" value={order.cancelReason} />}
        </Card>

        {order.deliveryAddress && (
          <Card title="عنوان التوصيل">
            <Row label="الاسم" value={order.deliveryAddress.fullName} />
            <Row
              label="الهاتف"
              value={
                <span dir="ltr" className="font-mono">
                  {order.deliveryAddress.phone}
                </span>
              }
            />
            <Row
              label="العنوان"
              value={`${order.deliveryAddress.governorate} — ${order.deliveryAddress.district}، ${order.deliveryAddress.street}`}
            />
            {order.deliveryAddress.notes && <Row label="ملاحظات" value={order.deliveryAddress.notes} />}
          </Card>
        )}
      </div>

      {order.timeline.length > 0 && (
        <Card title="سجل الطلب">
          <ol className="space-y-2">
            {order.timeline.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-[12.5px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span className="text-ink">
                  {ORDER_STATUS_LABELS[t.status as OrderStatus] ?? t.status}
                </span>
                <span className="text-[11px] text-muted">{fmtDateTime(t.at)}</span>
                {t.note && <span className="text-[11px] text-muted">— {t.note}</span>}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {confirmFor && (
        <ConfirmDialog
          title={ORDER_STATUS_LABELS[confirmFor]}
          message={
            confirmFor === 'REFUNDED'
              ? 'سيُسترجع المبلغ وتعود الكمية إلى المخزون. لا يمكن التراجع.'
              : 'سيُلغى الطلب وتعود الكمية إلى المخزون. لا يمكن التراجع.'
          }
          confirmLabel="تأكيد"
          loading={updateStatus.isPending}
          error={error}
          onConfirm={() => move(confirmFor)}
          onCancel={() => setConfirmFor(null)}
        />
      )}
    </div>
  );
}

export { fmtDateTime, Row as DetailRow };

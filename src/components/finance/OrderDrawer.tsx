'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
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
    <div className="flex items-baseline justify-between gap-6 py-1.5">
      <span className="shrink-0 text-[12px] text-muted">{label}</span>
      <span className="text-start text-[13px] text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** Destructive moves need a confirmation; forward moves are one click. */
const NEEDS_CONFIRM: OrderStatus[] = ['CANCELLED', 'REFUNDED'];

const ACTION_TONE: Partial<Record<OrderStatus, string>> = {
  CANCELLED: 'border-border text-muted hover:text-red',
  REFUNDED: 'border-border text-muted hover:text-red',
};

interface OrderDrawerProps {
  orderId: string;
  onClose: () => void;
}

export function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const { data: order, isLoading } = useOrder(orderId);
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

  const nextStates = order ? ORDER_TRANSITIONS[order.status] : [];

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-scale-in flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !order ? (
          <div className="animate-pulse space-y-4 p-6">
            <div className="h-6 w-40 rounded bg-surface" />
            <div className="h-24 rounded bg-surface" />
            <div className="h-24 rounded bg-surface" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-[15px] font-bold text-ink">{order.orderNo}</h3>
                  <StatusPill status={order.status} />
                </div>
                <p className="mt-0.5 text-[12px] text-muted">{fmtDateTime(order.placedAt)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {order.buyer && (
                <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-border bg-surface px-3 py-2.5">
                  <Avatar name={order.buyer.name} src={order.buyer.avatarUrl ?? undefined} size={36} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink">{order.buyer.name}</div>
                    <div dir="ltr" className="text-start font-mono text-[11.5px] text-muted">
                      {order.buyer.phone}
                    </div>
                  </div>
                </div>
              )}

              <p className="mb-1.5 text-[11px] font-semibold text-muted">المنتجات</p>
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

              <div className="mt-4 rounded-[10px] border border-border bg-surface px-3 py-2">
                <Row label="المجموع الفرعي" value={<span className="font-mono">{formatAmountMinor(order.subtotalMinor)}</span>} />
                <Row label="رسوم التوصيل" value={<span className="font-mono">{formatAmountMinor(order.deliveryFeeMinor)}</span>} />
                {order.discountMinor > 0 && (
                  <Row
                    label={`الخصم${order.couponCode ? ` (${order.couponCode})` : ''}`}
                    value={<span className="font-mono text-green">−{formatAmountMinor(order.discountMinor)}</span>}
                  />
                )}
                <div className="mt-1 border-t border-border pt-1.5">
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
              </div>

              <p className="mb-1.5 mt-4 text-[11px] font-semibold text-muted">الدفع</p>
              <div className="rounded-[10px] border border-border px-3 py-1">
                <Row label="طريقة الدفع" value={PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} />
                <Row label="حالة الدفع" value={<StatusPill status={order.paymentStatus} />} />
              </div>

              {order.deliveryAddress && (
                <>
                  <p className="mb-1.5 mt-4 text-[11px] font-semibold text-muted">عنوان التوصيل</p>
                  <div className="rounded-[10px] border border-border px-3 py-1">
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
                    {order.deliveryAddress.notes && (
                      <Row label="ملاحظات" value={order.deliveryAddress.notes} />
                    )}
                  </div>
                </>
              )}

              {order.timeline.length > 0 && (
                <>
                  <p className="mb-1.5 mt-4 text-[11px] font-semibold text-muted">سجل الطلب</p>
                  <ol className="space-y-1.5">
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
                </>
              )}

              {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}
            </div>

            {nextStates.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
                {nextStates.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => (NEEDS_CONFIRM.includes(s) ? setConfirmFor(s) : move(s))}
                    className={`rounded-[8px] border px-3.5 py-2 text-[13px] font-medium disabled:opacity-50 ${
                      ACTION_TONE[s] ?? 'border-brand bg-brand text-white hover:bg-brand/90'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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

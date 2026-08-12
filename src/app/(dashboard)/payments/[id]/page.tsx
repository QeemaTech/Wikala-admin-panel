'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PageHead } from '@/components/ui/PageHead';
import { OrderPanel, DetailRow as Row, fmtDateTime } from '@/components/finance/OrderPanel';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  useTransaction,
  KIND_LABELS,
  type TransactionKind,
  type TransactionStatus,
} from '@/features/finance/use-transactions';

const STATUS: Record<TransactionStatus, { label: string; tone: 'green' | 'red' | 'amber' | 'gray' }> = {
  CAPTURED: { label: 'مدفوع', tone: 'green' },
  PENDING: { label: 'معلّق', tone: 'amber' },
  FAILED: { label: 'فشل', tone: 'red' },
  REFUNDED: { label: 'مُسترجع', tone: 'gray' },
};

const KIND_TONE = { SUBSCRIPTION: 'violet', ORDER: 'blue', BOOST: 'amber' } as const;

const PROVIDER_LABELS: Record<string, string> = {
  COD: 'الدفع عند الاستلام',
  PAYMOB: 'Paymob',
  STRIPE: 'Stripe',
  MEMORY: 'تجريبي (بيئة الاختبار)',
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tx, isLoading, isError } = useTransaction(id);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] animate-pulse px-7 pb-14 pt-6">
        <div className="mb-6 h-8 w-64 rounded bg-surface" />
        <div className="h-[360px] rounded-[var(--radius)] bg-surface" />
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
          <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
          <p className="mt-2 text-[13px] text-muted">تعذّر تحميل المعاملة.</p>
          <Link
            href="/payments"
            className="mt-3 inline-block rounded-[8px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            العودة إلى المدفوعات
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS[tx.status] ?? { label: tx.status, tone: 'gray' as const };
  const ref = tx.reference;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <Link
        href="/payments"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink"
      >
        <Icon name="chevron-start" size={13} /> كل المدفوعات
      </Link>

      <PageHead
        title={`${KIND_LABELS[tx.kind as TransactionKind] ?? tx.kind}${ref ? ` — ${ref.label}` : ''}`}
        sub={fmtDateTime(tx.createdAt)}
        actions={
          <div className="flex items-center gap-2">
            <Chip tone={KIND_TONE[tx.kind as keyof typeof KIND_TONE] ?? 'gray'}>
              {KIND_LABELS[tx.kind as TransactionKind] ?? tx.kind}
            </Chip>
            <Chip tone={status.tone} dot>
              {status.label}
            </Chip>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Ledger + payer ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card title="المعاملة">
            <p className="mb-3 font-mono text-[28px] font-bold leading-none text-ink">
              {formatAmountMinor(tx.amountMinor)}
              <span className="ms-1.5 text-[13px] font-normal text-muted">{tx.currency}</span>
            </p>
            <Row label="وسيلة الدفع" value={PROVIDER_LABELS[tx.provider] ?? tx.provider} />
            <Row label="الحالة" value={<Chip tone={status.tone} dot>{status.label}</Chip>} />
            <Row label="أُنشئت في" value={fmtDateTime(tx.createdAt)} />
            <Row label="حُصِّلت في" value={fmtDateTime(tx.capturedAt)} />
            {tx.refundedAt && <Row label="استُرجعت في" value={fmtDateTime(tx.refundedAt)} />}
            <Row
              label="مرجع البوابة"
              value={
                tx.providerIntentId ? (
                  <span dir="ltr" className="break-all text-start font-mono text-[11.5px]">
                    {tx.providerIntentId}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )
              }
            />
            <Row
              label="معرّف المعاملة"
              value={
                <span dir="ltr" className="break-all text-start font-mono text-[11.5px]">
                  {tx.id}
                </span>
              }
            />
          </Card>

          <Card title="الدافع">
            {tx.user ? (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar name={tx.user.name} src={tx.user.avatarUrl ?? undefined} size={40} />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-ink">{tx.user.name}</div>
                    <div dir="ltr" className="text-start font-mono text-[11.5px] text-muted">
                      {tx.user.phone}
                    </div>
                  </div>
                </div>
                {tx.user.email && <Row label="البريد" value={<span dir="ltr" className="text-start">{tx.user.email}</span>} />}
                {tx.user.role && <Row label="الفئة" value={tx.user.role} />}
                <Link
                  href={`/users?q=${encodeURIComponent(tx.user.phone)}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-[8px] border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-surface-2"
                >
                  <Icon name="user" size={13} /> عرض في المستخدمين
                </Link>
              </>
            ) : (
              <p className="py-3 text-[13px] text-muted">
                لا يوجد مستخدم مرتبط — قد يكون الحساب محذوفًا.
              </p>
            )}
          </Card>
        </div>

        {/* ── What it was for ────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {!ref && (
            <Card title="المرجع">
              <p className="py-6 text-center text-[13px] text-muted">
                السجل المرتبط بهذه المعاملة لم يعد موجودًا.
              </p>
            </Card>
          )}

          {ref?.type === 'ORDER' && ref.orderId && <OrderPanel orderId={ref.orderId} />}

          {ref?.type === 'SUBSCRIPTION' && (
            <Card title="الاشتراك" sub={`الخطة ${ref.label}`}>
              <Row label="الخطة" value={<Chip tone="violet">{ref.label}</Chip>} />
              <Row label="حالة الاشتراك" value={ref.subscriptionStatus ?? '—'} />
              <Row label="بداية الفترة" value={fmtDateTime(ref.periodStart ?? null)} />
              <Row label="نهاية الفترة" value={fmtDateTime(ref.periodEnd ?? null)} />
              <Row label="التجديد القادم" value={fmtDateTime(ref.nextRenewal ?? null)} />
              <Row
                label="حصة الإعلانات"
                value={
                  ref.adQuotaTotal != null ? (
                    <span className="font-mono">
                      {formatNumber(ref.adQuotaUsed ?? 0)} / {formatNumber(ref.adQuotaTotal)}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <Link
                href="/plans"
                className="mt-3 inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-surface-2"
              >
                <Icon name="crown" size={13} /> إدارة خطط الاشتراك
              </Link>
            </Card>
          )}

          {ref?.type === 'BOOST' && (
            <Card title="التعزيز" sub={`باقة ${ref.label}`}>
              <Row label="الباقة" value={<Chip tone="amber">{ref.label}</Chip>} />
              <Row label="حالة التعزيز" value={ref.boostStatus ?? '—'} />
              <Row label="الإعلان" value={ref.adTitle ?? '—'} />
              <Row label="يبدأ في" value={fmtDateTime(ref.startsAt ?? null)} />
              <Row label="ينتهي في" value={fmtDateTime(ref.expiresAt ?? null)} />
              <div className="mt-3 flex flex-wrap gap-2">
                {ref.adId && (
                  <Link
                    href={`/ads?q=${ref.adId}`}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-surface-2"
                  >
                    <Icon name="shopping-bag" size={13} /> عرض الإعلان
                  </Link>
                )}
                <Link
                  href="/boosts"
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-surface-2"
                >
                  <Icon name="flame" size={13} /> إدارة باقات التعزيز
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

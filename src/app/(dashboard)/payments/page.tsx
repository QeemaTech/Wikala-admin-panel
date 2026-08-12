'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { KpiCard } from '@/components/ui/KpiCard';
import { Tabs } from '@/components/ui/Tabs';
import { Segmented } from '@/components/ui/Segmented';
import { PaymentsTable } from '@/components/finance/PaymentsTable';
import { OrderDrawer } from '@/components/finance/OrderDrawer';
import { formatAmountMinor } from '@/lib/i18n/format';
import {
  useAdminTransactions,
  useTransactionsSummary,
  type TransactionKind,
  type TransactionStatus,
} from '@/features/finance/use-transactions';

/** Every payment type lives in one ledger — the tabs are just a `kind` filter. */
const KIND_TABS = [
  { id: '', label: 'الكل' },
  { id: 'SUBSCRIPTION', label: 'الاشتراكات' },
  { id: 'ORDER', label: 'المنتجات' },
  { id: 'BOOST', label: 'التعزيزات' },
];

const STATUS_FILTERS = [
  { value: '', label: 'الكل' },
  { value: 'CAPTURED', label: 'مدفوع' },
  { value: 'PENDING', label: 'معلّق' },
  { value: 'REFUNDED', label: 'مُسترجع' },
  { value: 'FAILED', label: 'فشل' },
];

export default function PaymentsPage() {
  const [kind, setKind] = useState<TransactionKind | ''>('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminTransactions({ kind, status, search, from, to, page });
  const summary = useTransactionsSummary({ from, to });
  const s = summary.data;

  const resetTo = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="المدفوعات"
        sub="سجل مالي موحّد — اشتراكات الخطط وطلبات المنتجات وباقات التعزيز في مكان واحد"
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="إجمالي المحصّل"
          value={s?.captured.totalMinor ?? 0}
          formatter={formatAmountMinor}
          unit={s?.currency ?? 'EGP'}
          icon={<Icon name="wallet" size={18} />}
          tintColor="#1f9c63"
        />
        <KpiCard
          label="إيراد المنتجات"
          value={s?.byKind.ORDER.totalMinor ?? 0}
          formatter={formatAmountMinor}
          unit={s?.currency ?? 'EGP'}
          icon={<Icon name="archive" size={18} />}
          tintColor="#226199"
        />
        <KpiCard
          label="إيراد الاشتراكات"
          value={s?.byKind.SUBSCRIPTION.totalMinor ?? 0}
          formatter={formatAmountMinor}
          unit={s?.currency ?? 'EGP'}
          icon={<Icon name="crown" size={18} />}
          tintColor="#7a4cc4"
        />
        <KpiCard
          label="المبالغ المسترجعة"
          value={s?.refunded.totalMinor ?? 0}
          formatter={formatAmountMinor}
          unit={s?.currency ?? 'EGP'}
          icon={<Icon name="refresh" size={18} />}
          tintColor="#d44030"
        />
      </div>

      <Tabs
        items={KIND_TABS}
        value={kind}
        onChange={(id) => resetTo(() => setKind(id as TransactionKind | ''))}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={STATUS_FILTERS}
          value={status}
          onChange={(v) => resetTo(() => setStatus(v as TransactionStatus | ''))}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => resetTo(() => setFrom(e.target.value))}
            aria-label="من تاريخ"
            className="rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => resetTo(() => setTo(e.target.value))}
            aria-label="إلى تاريخ"
            className="rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
          />
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted">
              <Icon name="search" size={14} />
            </span>
            <input
              value={search}
              onChange={(e) => resetTo(() => setSearch(e.target.value))}
              placeholder="اسم المشتري أو رقم الطلب…"
              className="w-60 rounded-[8px] border border-border bg-surface py-2 pe-3 ps-9 text-[13px] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </div>
        </div>
      </div>

      <PaymentsTable
        items={data?.items ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        isError={isError}
        onOpenOrder={setOrderId}
        onPageChange={setPage}
      />

      {orderId && <OrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { PageHead } from '@/components/ui/PageHead';
import { Tabs } from '@/components/ui/Tabs';
import { Icon } from '@/components/ui/Icon';
import { AuctionsKpiStrip } from '@/components/auctions/AuctionsKpiStrip';
import { AuctionsTable } from '@/components/auctions/AuctionsTable';
import { BidHistoryDrawer } from '@/components/auctions/BidHistoryDrawer';
import { AuctionRulesEditor } from '@/components/auctions/AuctionRulesEditor';
import { useAuctionTabCounts, type AuctionDTO, type AuctionTab } from '@/features/auctions/use-auctions';
import { useForceCloseAuction, useApproveAuction } from '@/features/auctions/use-auction-actions';
import { useAuctionMonitorSocket } from '@/features/auctions/use-auction-socket';
import { useAuctionRules } from '@/features/auctions/use-auction-rules';

const TABS: { id: AuctionTab; label: string }[] = [
  { id: 'ACTIVE', label: 'نشطة' },
  { id: 'ENDING_TODAY', label: 'تنتهي اليوم' },
  { id: 'PENDING', label: 'بانتظار الاعتماد' },
  { id: 'CLOSED', label: 'منتهية' },
];

const DURATION_OPTIONS = [3, 7, 14, 30];

export default function AuctionsPage() {
  const [tab, setTab] = useState<AuctionTab>('ACTIVE');
  const [page, setPage] = useState(1);
  const [bidsFor, setBidsFor] = useState<AuctionDTO | null>(null);
  const [forceCloseFor, setForceCloseFor] = useState<AuctionDTO | null>(null);
  const [approveFor, setApproveFor] = useState<AuctionDTO | null>(null);
  const rulesRef = useRef<HTMLDivElement>(null);

  // Live price / bid-count / countdown updates patched into the table cache.
  useAuctionMonitorSocket();

  const tabCounts = useAuctionTabCounts();
  const tabItems = TABS.map((t) => ({ id: t.id, label: t.label, count: tabCounts[t.id] ?? null }));

  const handleTab = (id: string) => { setTab(id as AuctionTab); setPage(1); };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="المزادات"
        sub="إدارة المزادات النشطة، اعتماد جديدة، تحديد المدة والحد الأدنى للمزايدة"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => rulesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
            >
              <Icon name="cog" size={14} /> قواعد المزاد
            </button>
            <Link
              href="/ads?type=AUCTION"
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
            >
              <Icon name="plus" size={14} /> إنشاء مزاد مميز
            </Link>
          </div>
        }
      />

      <div className="mb-4">
        <AuctionsKpiStrip />
      </div>

      <Tabs items={tabItems} value={tab} onChange={handleTab} />

      <AuctionsTable
        params={{ tab, page }}
        onPageChange={setPage}
        onOpenBids={setBidsFor}
        onForceClose={setForceCloseFor}
        onApprove={setApproveFor}
      />

      <div ref={rulesRef} className="mt-4 scroll-mt-6">
        <AuctionRulesEditor />
      </div>

      {bidsFor && <BidHistoryDrawer auction={bidsFor} onClose={() => setBidsFor(null)} />}
      {forceCloseFor && <ForceCloseDialog auction={forceCloseFor} onClose={() => setForceCloseFor(null)} />}
      {approveFor && <ApproveDialog auction={approveFor} onClose={() => setApproveFor(null)} />}
    </div>
  );
}

function ForceCloseDialog({ auction, onClose }: { auction: AuctionDTO; onClose: () => void }) {
  const forceClose = useForceCloseAuction();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    setError(null);
    forceClose.mutate(
      { auctionId: auction.id, reason: reason.trim() || undefined },
      { onSuccess: onClose, onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر إنهاء المزاد.') },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-red-50 text-red">
            <Icon name="alert-triangle" size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">إنهاء المزاد قسريًا</h3>
            <p className="text-[12px] text-muted">سيُنهى المزاد فورًا ويُحدَّد الفائز إن وُجدت مزايدات. لا يمكن التراجع.</p>
          </div>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="سبب الإنهاء (اختياري)"
          className="mb-3 w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
            إلغاء
          </button>
          <button
            onClick={confirm}
            disabled={forceClose.isPending}
            className="rounded-[8px] bg-red px-4 py-2 text-[13px] font-medium text-white hover:bg-red/90 disabled:opacity-50"
          >
            {forceClose.isPending ? 'جارٍ الإنهاء...' : 'تأكيد الإنهاء'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveDialog({ auction, onClose }: { auction: AuctionDTO; onClose: () => void }) {
  const approve = useApproveAuction();
  const { data: rules } = useAuctionRules();
  const [error, setError] = useState<string | null>(null);

  // Only offer durations the backend will accept (≤ configured max).
  const maxDays = rules?.max_duration_days ?? 30;
  const options = DURATION_OPTIONS.filter((d) => d <= maxDays);
  const defaultDays = rules?.default_duration_days ?? 7;
  const [durationDays, setDurationDays] = useState(7);

  // Snap the selection to a valid default once rules load.
  const effectiveDuration = options.includes(durationDays)
    ? durationDays
    : options.includes(defaultDays)
      ? defaultDays
      : options[options.length - 1] ?? 7;

  const confirm = () => {
    setError(null);
    approve.mutate(
      { auctionId: auction.id, durationDays: effectiveDuration },
      { onSuccess: onClose, onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر اعتماد المزاد.') },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-green-50 text-green">
            <Icon name="check" size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">اعتماد المزاد وإطلاقه</h3>
            <p className="text-[12px] text-muted">سيبدأ المزاد الآن وينتهي بعد المدة المحددة.</p>
          </div>
        </div>
        <label className="mb-1.5 block text-[13px] font-medium text-ink">مدة المزاد</label>
        <select
          value={effectiveDuration}
          onChange={(e) => setDurationDays(Number(e.target.value))}
          className="mb-3 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
        >
          {options.map((d) => (
            <option key={d} value={d}>{d} أيام</option>
          ))}
        </select>
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
            إلغاء
          </button>
          <button
            onClick={confirm}
            disabled={approve.isPending}
            className="rounded-[8px] bg-green px-4 py-2 text-[13px] font-medium text-white hover:bg-green/90 disabled:opacity-50"
          >
            {approve.isPending ? 'جارٍ الاعتماد...' : 'اعتماد وإطلاق'}
          </button>
        </div>
      </div>
    </div>
  );
}

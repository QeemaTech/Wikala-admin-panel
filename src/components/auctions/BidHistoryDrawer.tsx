'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { formatAmountMinor, formatRelativeTime } from '@/lib/i18n/format';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import { useAuctionBids, type AuctionDTO, type BidDTO, type BidStatus } from '@/features/auctions/use-auctions';
import type { AuctionLiveMonitorEvent } from '@/features/auctions/use-auction-socket';

const STATUS: Record<BidStatus, { tone: 'green' | 'gray' | 'amber'; label: string }> = {
  WINNING: { tone: 'green', label: 'الأعلى حالياً' },
  WON: { tone: 'green', label: 'فائز' },
  OUTBID: { tone: 'gray', label: 'تم تجاوزه' },
  LOST: { tone: 'gray', label: 'خاسر' },
};

interface BidHistoryDrawerProps {
  auction: AuctionDTO;
  onClose: () => void;
}

export function BidHistoryDrawer({ auction, onClose }: BidHistoryDrawerProps) {
  const qc = useQueryClient();
  const { data: bids, isLoading, isError } = useAuctionBids(auction.id);

  // Live-refresh while open: a bid on THIS auction invalidates the bid list.
  const onMonitor = useCallback(
    (evt: AuctionLiveMonitorEvent) => {
      if (evt.auctionId === auction.id) {
        qc.invalidateQueries({ queryKey: ['auctions', 'bids', auction.id] });
      }
    },
    [auction.id, qc],
  );
  useSocketEvent<AuctionLiveMonitorEvent>('auction:live-monitor', onMonitor);

  const isLeading = (b: BidDTO) =>
    b.status === 'WINNING' || b.status === 'WON' || (auction.leadingBidId != null && b.id === auction.leadingBidId);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/30" role="dialog" aria-modal="true">
      <button type="button" aria-label="إغلاق" className="flex-1" onClick={onClose} />

      <div className="flex h-full w-full max-w-md flex-col overflow-hidden bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-wk-blue-50 text-wk-blue">
              <Icon name="gavel" size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-ink">{auction.ad?.title ?? 'سجل المزايدات'}</h2>
              <p className="font-mono text-[11px] text-muted" dir="ltr">#{auction.id.slice(-6)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2" aria-label="إغلاق">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Current price summary */}
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
          <span className="text-[12.5px] text-muted">السعر الحالي</span>
          <span className="font-mono text-[16px] font-bold text-wk-blue">
            {formatAmountMinor(auction.currentPriceMinor)} <span className="text-[12px] text-muted">{auction.currency}</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isError ? (
            <div className="grid place-items-center p-8 text-center text-[13px] text-muted">
              <div><Icon name="alert-triangle" size={22} className="mx-auto text-red" /><p className="mt-2">تعذّر تحميل المزايدات</p></div>
            </div>
          ) : isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-[10px] bg-white" />)}
            </div>
          ) : (bids?.length ?? 0) === 0 ? (
            <div className="p-10 text-center">
              <Icon name="gavel" size={26} className="mx-auto text-muted" />
              <p className="mt-2 text-[13px] text-muted">لا توجد مزايدات على هذا المزاد بعد</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {bids!.map((b) => {
                const leading = isLeading(b);
                const st = STATUS[b.status] ?? STATUS.OUTBID;
                return (
                  <li
                    key={b.id}
                    className={
                      'flex items-center gap-3 rounded-[10px] border bg-white px-3 py-2.5 ' +
                      (leading ? 'border-green/40 bg-green-50/40' : 'border-border')
                    }
                  >
                    <Avatar name={b.userMini?.name ?? 'مزايد'} src={b.userMini?.avatarUrl ?? undefined} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{b.userMini?.name ?? 'مزايد'}</div>
                      <div className="text-[11px] text-muted">{b.placedAt ? formatRelativeTime(b.placedAt) : '—'}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-mono text-[14px] font-bold text-ink">
                        {formatAmountMinor(b.amountMinor)} <span className="text-[11px] text-muted">{b.currency}</span>
                      </div>
                      <Chip tone={st.tone} dot={leading}>{st.label}</Chip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

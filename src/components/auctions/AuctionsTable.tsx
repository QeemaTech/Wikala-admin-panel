'use client';

import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { cn } from '@/lib/utils';
import { buildPages } from '@/lib/ui/build-pages';
import { formatAmountMinor } from '@/lib/i18n/format';
import { AuctionCountdown } from './AuctionCountdown';
import { useAdminAuctions, type AuctionDTO, type AuctionsListParams } from '@/features/auctions/use-auctions';

const CLOSED = new Set(['ENDED_WON', 'ENDED_NO_BIDS']);

interface StatusChip {
  tone: 'green' | 'red' | 'gray' | 'blue';
  label: string;
}

/** Maps an auction to its status chip; LIVE auctions ending within an hour turn red. */
export function auctionStatusChip(a: AuctionDTO): StatusChip {
  if (a.status === 'LIVE') {
    const secsLeft = a.endTime ? (new Date(a.endTime).getTime() - Date.now()) / 1000 : Infinity;
    if (secsLeft > 0 && secsLeft < 3600) return { tone: 'red', label: 'تنتهي قريباً' };
    return { tone: 'green', label: 'نشط' };
  }
  if (a.status === 'SCHEDULED') return { tone: 'gray', label: 'بانتظار الاعتماد' };
  if (a.status === 'ENDED_WON') return { tone: 'blue', label: 'انتهى — تم البيع' };
  return { tone: 'gray', label: 'انتهى — بدون مزايدات' };
}

interface AuctionsTableProps {
  params: AuctionsListParams;
  onPageChange: (page: number) => void;
  onOpenBids: (a: AuctionDTO) => void;
  onForceClose: (a: AuctionDTO) => void;
  onApprove: (a: AuctionDTO) => void;
}

export function AuctionsTable({ params, onPageChange, onOpenBids, onForceClose, onApprove }: AuctionsTableProps) {
  const { data, isLoading, isError } = useAdminAuctions(params);

  if (isError) {
    return (
      <section className="rounded-[var(--radius)] border border-border bg-white p-10 text-center text-[13px] text-muted">
        <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
        <p className="mt-2">تعذّر تحميل المزادات</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-[var(--radius)] border border-border bg-white animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[60px] border-b border-border last:border-0" />
        ))}
      </section>
    );
  }

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? items.length;
  const pageSize = meta?.pageSize || 20;
  const page = meta?.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (items.length === 0) {
    return (
      <section className="rounded-[var(--radius)] border border-border bg-white p-12 text-center">
        <Icon name="gavel" size={28} className="mx-auto text-muted" />
        <p className="mt-2 text-[13px] text-muted">لا توجد مزادات في هذه القائمة</p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-start font-medium text-muted">المزاد</th>
              <th className="px-4 py-3 text-start font-medium text-muted">السعر الابتدائي</th>
              <th className="px-4 py-3 text-start font-medium text-muted">السعر الحالي</th>
              <th className="px-4 py-3 text-start font-medium text-muted">عدد المزايدات</th>
              <th className="px-4 py-3 text-start font-medium text-muted">متبقي</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const chip = auctionStatusChip(a);
              const inactive = CLOSED.has(a.status);
              return (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Thumbnail
                        src={a.ad?.coverUrl}
                        alt={a.ad?.title ?? ''}
                        icon="gavel"
                        className="h-[42px] w-[56px] rounded-[8px] bg-gradient-to-br from-[#cfdce8] to-[#a6b8cc]"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{a.ad?.title ?? 'مزاد'}</div>
                        <div className="font-mono text-[11px] text-muted" dir="ltr">#{a.id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    {formatAmountMinor(a.startingPriceMinor)} <span className="text-[11px]">{a.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <b className="font-mono text-wk-blue">{formatAmountMinor(a.currentPriceMinor)}</b>{' '}
                    <span className="font-mono text-[11px] text-muted">{a.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone="blue">{a.bidCount} مزايدة</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <AuctionCountdown endTime={a.endTime} inactive={inactive} />
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={chip.tone} dot>{chip.label}</Chip>
                  </td>
                  <td className="px-4 py-3">
                    <AuctionRowActions
                      auction={a}
                      onOpenBids={() => onOpenBids(a)}
                      onForceClose={() => onForceClose(a)}
                      onApprove={() => onApprove(a)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-[18px] py-3 text-[12px] text-muted">
        <span>تعرض {from}–{to} من {total} مزاد</span>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
              aria-label="السابق"
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
                  className={cn(
                    'grid h-7 min-w-[28px] place-items-center rounded-[7px] border px-1 font-mono text-[12px] transition-colors',
                    p === page ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-ink-2 hover:bg-surface-2',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
              aria-label="التالي"
            >
              <Icon name="chevron-start" size={12} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function AuctionRowActions({
  auction,
  onOpenBids,
  onForceClose,
  onApprove,
}: {
  auction: AuctionDTO;
  onOpenBids: () => void;
  onForceClose: () => void;
  onApprove: () => void;
}) {
  const isScheduled = auction.status === 'SCHEDULED';
  const canForceClose = auction.status === 'LIVE' || auction.status === 'SCHEDULED';

  // Actions are inline (no dropdown): the table wrapper is overflow-x-auto,
  // which would clip an absolutely-positioned menu on the last rows.
  return (
    <div className="flex items-center justify-end gap-2">
      {isScheduled && (
        <button
          onClick={onApprove}
          className="flex items-center gap-1 rounded-[6px] bg-brand px-2.5 py-[5px] text-[12px] font-medium text-white hover:bg-brand/90"
        >
          <Icon name="check" size={12} /> اعتماد
        </button>
      )}
      <button
        onClick={onOpenBids}
        className="flex items-center gap-1 rounded-[6px] border border-border px-2.5 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
      >
        <Icon name="eye" size={12} /> سجل المزايدات
      </button>
      {canForceClose && (
        <button
          onClick={onForceClose}
          className="flex items-center gap-1 rounded-[6px] border border-red/30 px-2.5 py-[5px] text-[12px] font-medium text-red hover:bg-red-50"
        >
          <Icon name="x" size={12} /> إنهاء
        </button>
      )}
    </div>
  );
}

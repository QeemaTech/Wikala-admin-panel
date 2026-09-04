import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';

vi.mock('@/features/auctions/use-auctions', () => ({ useAdminAuctions: vi.fn() }));

import { useAdminAuctions } from '@/features/auctions/use-auctions';
import { AuctionsTable, auctionStatusChip } from './AuctionsTable';

const ROW = {
  id: 'auction-abcdef',
  adId: 'ad-1',
  sellerId: 's-1',
  status: 'LIVE' as const,
  startTime: '2030-01-01T00:00:00.000Z',
  endTime: '2031-01-01T00:00:00.000Z',
  startingPriceMinor: 50000,
  currentPriceMinor: 120000,
  minIncrementMinor: 50000,
  currency: 'EGP',
  bidCount: 3,
  leadingBidId: null,
  leadingUserId: null,
  autoExtend: true,
  winnerId: null,
  endedAt: null,
  ad: { id: 'ad-1', title: 'سيارة مرسيدس', coverUrl: null },
};

describe('auctionStatusChip', () => {
  it('shows green نشط for a live auction far from ending', () => {
    expect(auctionStatusChip(ROW)).toEqual({ tone: 'green', label: 'نشط' });
  });
  it('shows red تنتهي قريباً for a live auction ending within an hour', () => {
    const soon = { ...ROW, endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
    expect(auctionStatusChip(soon)).toEqual({ tone: 'red', label: 'تنتهي قريباً' });
  });
  it('marks SCHEDULED auctions as awaiting approval', () => {
    expect(auctionStatusChip({ ...ROW, status: 'SCHEDULED' })).toEqual({ tone: 'gray', label: 'بانتظار الاعتماد' });
  });

  it('does NOT claim a past-deadline auction is still active', () => {
    // Observed live: 20 auctions sat LIVE with an end_time weeks in the past,
    // and each row showed a green "نشط" beside a countdown reading "انتهى".
    // The row contradicted itself and staff could not tell whether bidding was
    // still open.
    const overdue = { ...ROW, endTime: new Date(Date.now() - 26 * 24 * 3600 * 1000).toISOString() };
    const chip = auctionStatusChip(overdue);

    expect(chip.tone).not.toBe('green');
    expect(chip.label).not.toBe('نشط');
    expect(chip).toEqual({ tone: 'gray', label: 'انتهى — بانتظار الإغلاق' });
  });

  it('treats an auction ending this very second as ended, not as ending soon', () => {
    // The boundary matters: at exactly zero the deadline has been reached, so
    // "تنتهي قريباً" would still imply bidding is open.
    const atZero = { ...ROW, endTime: new Date(Date.now()).toISOString() };
    expect(auctionStatusChip(atZero).label).toBe('انتهى — بانتظار الإغلاق');
  });
});


describe('AuctionsTable', () => {
  const noop = () => {};

  it('renders the row with title, current price, bid count and status', () => {
    vi.mocked(useAdminAuctions).mockReturnValue({
      data: { items: [ROW], meta: { page: 1, pageSize: 20, total: 1 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAdminAuctions>);

    renderWithProviders(
      <AuctionsTable params={{ tab: 'ACTIVE' }} onPageChange={noop} onOpenBids={noop} onForceClose={noop} onApprove={noop} />,
    );

    expect(screen.getByText('سيارة مرسيدس')).toBeTruthy();
    expect(screen.getByText('1,200')).toBeTruthy(); // currentPriceMinor / 100, grouped
    expect(screen.getByText('3 مزايدة')).toBeTruthy();
    expect(screen.getByText('نشط')).toBeTruthy();
    expect(screen.getByText('سجل المزايدات')).toBeTruthy();
  });

  it('renders an empty state when there are no auctions', () => {
    vi.mocked(useAdminAuctions).mockReturnValue({
      data: { items: [], meta: { page: 1, pageSize: 20, total: 0 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAdminAuctions>);

    renderWithProviders(
      <AuctionsTable params={{ tab: 'CLOSED' }} onPageChange={noop} onOpenBids={noop} onForceClose={noop} onApprove={noop} />,
    );
    expect(screen.getByText('لا توجد مزادات في هذه القائمة')).toBeTruthy();
  });
});

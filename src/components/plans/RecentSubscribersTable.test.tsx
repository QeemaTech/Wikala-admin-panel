import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';
import type { SubscriberDTO } from '@/features/plans/use-plans';

const mockUseRecent = vi.fn();

vi.mock('@/features/plans/use-plans', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/plans/use-plans')>()),
  useRecentSubscribers: (params: { plan?: string; page?: number }) => mockUseRecent(params),
}));

import { RecentSubscribersTable } from './RecentSubscribersTable';

const items: SubscriberDTO[] = [
  {
    subscriptionId: 's1',
    plan: 'PRO',
    status: 'ACTIVE',
    user: { id: 'u1', name: 'كريم نصار', phone: '+201000000001', avatarUrl: null, joinedAt: null },
    periodStart: '2026-05-15T00:00:00.000Z',
    periodEnd: '2026-06-15T00:00:00.000Z',
    nextRenewal: '2026-06-15T00:00:00.000Z',
    amountMinor: 9900,
    currency: 'EGP',
    adQuotaUsed: 3,
    adQuotaTotal: 20,
  },
  {
    subscriptionId: 's2',
    plan: 'BASIC',
    status: 'CANCELLED',
    user: { id: 'u2', name: 'هاني سامي', phone: '+201000000002', avatarUrl: null, joinedAt: null },
    periodStart: '2026-05-12T00:00:00.000Z',
    periodEnd: '2026-06-12T00:00:00.000Z',
    nextRenewal: null,
    amountMinor: 4900,
    currency: 'EGP',
    adQuotaUsed: 5,
    adQuotaTotal: 5,
  },
];

describe('RecentSubscribersTable', () => {
  beforeEach(() => {
    mockUseRecent.mockReset();
    mockUseRecent.mockImplementation(({ page = 1 }: { page?: number }) => ({
      data: { items, total: 25, page, pages: 2 },
      isLoading: false,
      isError: false,
    }));
  });

  it('renders subscriber rows with plan + status chips', () => {
    renderWithProviders(<RecentSubscribersTable />);
    expect(screen.getByText('كريم نصار')).toBeTruthy();
    expect(screen.getByText('هاني سامي')).toBeTruthy();
    expect(screen.getByText('مفعّل')).toBeTruthy();
    expect(screen.getByText('ملغى')).toBeTruthy();
  });

  it('requests the next page when paging forward', async () => {
    renderWithProviders(<RecentSubscribersTable />);
    // buildPages(1, 2) → page buttons "1" and "2"
    fireEvent.click(screen.getByText('2'));
    await waitFor(() =>
      expect(mockUseRecent.mock.calls.some(([p]) => p?.page === 2)).toBe(true),
    );
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test/render';
import type { CampaignDTO, CampaignStatus } from '@/features/notifications/use-campaigns';

const mockUse = vi.fn();
const mockCancel = vi.fn();

vi.mock('@/features/notifications/use-campaigns', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/notifications/use-campaigns')>()),
  useCampaigns: (status: CampaignStatus, page: number) => mockUse(status, page),
}));
vi.mock('@/features/notifications/use-campaign-send', () => ({
  useCancelCampaign: () => ({ mutate: mockCancel, isPending: false }),
  useRescheduleCampaign: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { CampaignTable } from './CampaignTable';

const base: Omit<CampaignDTO, 'id' | 'title' | 'status'> = {
  body: 'x',
  type: 'PROMO',
  priority: 'NORMAL',
  audienceQuery: {},
  targetCountEstimate: 24180,
  scheduledAt: null,
  sentAt: '2026-06-01T10:00:00.000Z',
  stats: { delivered: 24180, opened: 8742, ctr: 0.3615 },
  createdBy: null,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: null,
};

function page(items: CampaignDTO[]) {
  return { data: { items, total: items.length, page: 1, pages: 1 }, isLoading: false, isError: false };
}

describe('CampaignTable', () => {
  beforeEach(() => {
    mockUse.mockReset();
    mockCancel.mockReset();
  });

  it('renders sent campaigns with open-rate', () => {
    mockUse.mockReturnValue(page([{ ...base, id: 's1', title: 'عروض الصيف بدأت', status: 'SENT', type: 'PROMO' }]));
    renderWithProviders(<CampaignTable mode="sent" />);
    expect(screen.getByText('عروض الصيف بدأت')).toBeTruthy();
    expect(screen.getByText(/36\.\d/)).toBeTruthy(); // ctr 0.3615 → ~36.x%
  });

  it('cancels a scheduled campaign', () => {
    mockUse.mockReturnValue(
      page([{ ...base, id: 'c1', title: 'تذكير مزاد الجمعة', status: 'SCHEDULED', scheduledAt: '2099-01-01T10:00:00.000Z' }]),
    );
    renderWithProviders(<CampaignTable mode="scheduled" />);
    expect(screen.getByText('تذكير مزاد الجمعة')).toBeTruthy();
    fireEvent.click(screen.getByText('إلغاء'));
    expect(mockCancel).toHaveBeenCalledWith('c1');
  });
});

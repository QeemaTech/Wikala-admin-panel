import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ModerationQueue } from './ModerationQueue';

const mockItem = {
  id: 'item-1',
  ad: {
    id: 'ad-1',
    title: 'إعلان تجريبي',
    price: 100,
    currency: 'SAR',
    status: 'PENDING_REVIEW',
    images: [],
    categoryId: 'cat-1',
    createdAt: '2024-01-01T00:00:00Z',
  },
  risk: 'LOW',
  aiVerdict: 'FLAG',
  flags: [],
  submittedAt: '2024-01-01T00:00:00Z',
};

vi.mock('@/features/moderation/use-moderation-queue', () => ({
  useModerationQueue: vi.fn(() => ({
    data: {
      items: [mockItem],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@/features/categories/use-categories', () => ({
  useCategories: vi.fn(() => ({ data: { items: [] } })),
}));

vi.mock('@/components/ads/AdCard', () => ({
  AdCard: ({ item }: { item: typeof mockItem }) => (
    <div data-testid="ad-card">{item.ad.title}</div>
  ),
}));

const defaultProps = {
  params: { tab: 'QUEUE' as const },
  selected: new Set<string>(),
  onToggleSelect: vi.fn(),
  onView: vi.fn(),
  onApprove: vi.fn(),
  onReject: vi.fn(),
  onEscalate: vi.fn(),
  onPageChange: vi.fn(),
};

describe('ModerationQueue', () => {
  it('renders ad cards from API data', () => {
    renderWithProviders(<ModerationQueue {...defaultProps} />);
    expect(screen.getByTestId('ad-card')).toBeTruthy();
    expect(screen.getByText('إعلان تجريبي')).toBeTruthy();
  });

  it('shows empty state when no items', async () => {
    const { useModerationQueue } = await import('@/features/moderation/use-moderation-queue');
    vi.mocked(useModerationQueue).mockReturnValueOnce({
      data: { items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useModerationQueue>);
    renderWithProviders(<ModerationQueue {...defaultProps} />);
    expect(screen.getByText('لا توجد إعلانات في هذه القائمة')).toBeTruthy();
  });

  it('shows loading skeleton while fetching', async () => {
    const { useModerationQueue } = await import('@/features/moderation/use-moderation-queue');
    vi.mocked(useModerationQueue).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useModerationQueue>);
    const { container } = renderWithProviders(<ModerationQueue {...defaultProps} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows error state on fetch failure', async () => {
    const { useModerationQueue } = await import('@/features/moderation/use-moderation-queue');
    vi.mocked(useModerationQueue).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useModerationQueue>);
    renderWithProviders(<ModerationQueue {...defaultProps} />);
    expect(screen.getByText('تعذّر تحميل قائمة الإعلانات')).toBeTruthy();
  });

  it('shows pagination count text from meta', () => {
    renderWithProviders(<ModerationQueue {...defaultProps} />);
    expect(screen.getByText(/تعرض 1–1 من 1 إعلان/)).toBeTruthy();
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const { useModerationQueue } = await import('@/features/moderation/use-moderation-queue');
    vi.mocked(useModerationQueue).mockReturnValueOnce({
      data: {
        items: [mockItem, { ...mockItem, id: 'item-2', ad: { ...mockItem.ad, id: 'ad-2', title: 'إعلان 2' } }],
        meta: { page: 1, pageSize: 1, total: 6, totalPages: 6 },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useModerationQueue>);
    const onPageChange = vi.fn();
    renderWithProviders(<ModerationQueue {...defaultProps} onPageChange={onPageChange} />);
    const btn2 = screen.getByText('2');
    fireEvent.click(btn2);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders checkbox overlay only on QUEUE tab', () => {
    const { container } = renderWithProviders(
      <ModerationQueue {...defaultProps} params={{ tab: 'QUEUE' }} />,
    );
    expect(container.querySelector('input[type="checkbox"]')).toBeTruthy();
  });

  it('does not render checkboxes on non-QUEUE tab', () => {
    const { container } = renderWithProviders(
      <ModerationQueue {...defaultProps} params={{ tab: 'APPROVED' as const }} />,
    );
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  });
});

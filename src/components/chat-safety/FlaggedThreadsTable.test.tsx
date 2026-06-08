import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FlaggedThreadsTable } from './FlaggedThreadsTable';
import type { FlaggedThreadDTO } from '@/features/chat-safety/use-flagged-threads';

const mockThread: FlaggedThreadDTO = {
  id: 'flag-1',
  messageId: 'msg-1',
  chatId: 'chat-abcdef',
  reason: 'external_url',
  severity: 'high',
  autoAction: 'block_link',
  reviewerId: null,
  reviewerDecision: null,
  reviewerNote: null,
  reviewedAt: null,
  createdAt: '2026-06-03T10:00:00Z',
  parties: { sender: { id: 'u1', name: 'يوسف' }, recipient: { id: 'u2', name: 'نور' } },
  ad: { id: 'ad-123456', title: 'سيارة', slug: 'car' },
  messagePreview: 'تواصل معايا [رابط محظور]',
};

vi.mock('@/features/chat-safety/use-flagged-threads', async (orig) => ({
  ...(await orig<typeof import('@/features/chat-safety/use-flagged-threads')>()),
  useFlaggedThreads: vi.fn(() => ({
    data: { items: [mockThread], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
    isLoading: false,
    isError: false,
  })),
}));

const defaultProps = {
  params: { status: 'all' as const, page: 1 },
  onPageChange: vi.fn(),
  onOpen: vi.fn(),
};

describe('FlaggedThreadsTable', () => {
  it('renders a flagged-thread row from API data', () => {
    renderWithProviders(<FlaggedThreadsTable {...defaultProps} />);
    expect(screen.getByText('محادثات مرفوعة للمراجعة')).toBeTruthy();
    expect(screen.getByText('يوسف ◀ نور')).toBeTruthy();
    expect(screen.getByText('رابط خارجي')).toBeTruthy();
    expect(screen.getByText('حظر الرابط')).toBeTruthy();
  });

  it('calls onOpen when "فتح" is clicked', () => {
    const onOpen = vi.fn();
    renderWithProviders(<FlaggedThreadsTable {...defaultProps} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('فتح'));
    expect(onOpen).toHaveBeenCalledWith(mockThread);
  });

  it('shows empty state when no items', async () => {
    const { useFlaggedThreads } = await import('@/features/chat-safety/use-flagged-threads');
    vi.mocked(useFlaggedThreads).mockReturnValueOnce({
      data: { items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFlaggedThreads>);
    renderWithProviders(<FlaggedThreadsTable {...defaultProps} />);
    expect(screen.getByText('لا توجد محادثات مرفوعة للمراجعة')).toBeTruthy();
  });

  it('shows error state on fetch failure', async () => {
    const { useFlaggedThreads } = await import('@/features/chat-safety/use-flagged-threads');
    vi.mocked(useFlaggedThreads).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useFlaggedThreads>);
    renderWithProviders(<FlaggedThreadsTable {...defaultProps} />);
    expect(screen.getByText('تعذّر تحميل المحادثات المرفوعة')).toBeTruthy();
  });

  it('calls onPageChange when a page button is clicked', async () => {
    const { useFlaggedThreads } = await import('@/features/chat-safety/use-flagged-threads');
    vi.mocked(useFlaggedThreads).mockReturnValueOnce({
      data: { items: [mockThread], meta: { page: 1, pageSize: 1, total: 6, totalPages: 6 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFlaggedThreads>);
    const onPageChange = vi.fn();
    renderWithProviders(<FlaggedThreadsTable {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

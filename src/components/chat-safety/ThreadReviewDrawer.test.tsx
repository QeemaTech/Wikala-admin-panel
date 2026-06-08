import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ThreadReviewDrawer } from './ThreadReviewDrawer';
import type { FlaggedThreadDTO } from '@/features/chat-safety/use-flagged-threads';

const thread: FlaggedThreadDTO = {
  id: 'flag-1',
  messageId: 'msg-1',
  chatId: 'chat-abcdef',
  reason: 'phone_in_text',
  severity: 'med',
  autoAction: 'hide_phone',
  reviewerId: null,
  reviewerDecision: null,
  reviewerNote: null,
  reviewedAt: null,
  createdAt: '2026-06-03T10:00:00Z',
  parties: { sender: { id: 'u1', name: 'هاني' }, recipient: { id: 'u2', name: 'منى' } },
  ad: { id: 'ad-123456', title: 'شقة', slug: 'flat' },
  messagePreview: 'كلمني على [hidden]',
};

const reviewMutate = vi.fn((_vars, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@/features/chat-safety/use-flagged-threads', async (orig) => ({
  ...(await orig<typeof import('@/features/chat-safety/use-flagged-threads')>()),
  useFlagDetail: vi.fn(() => ({
    data: {
      ...thread,
      message: { id: 'msg-1', body: 'كلمني على 01012345678', type: 'text', senderId: 'u1', createdAt: thread.createdAt },
      context: [
        { id: 'm0', senderId: 'u2', senderName: 'منى', body: 'الشقة متاحة؟', type: 'text', scamFlags: [], createdAt: thread.createdAt, isFlagged: false },
        { id: 'msg-1', senderId: 'u1', senderName: 'هاني', body: 'كلمني على 01012345678', type: 'text', scamFlags: ['phone_in_text'], createdAt: thread.createdAt, isFlagged: true },
      ],
    },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@/features/chat-safety/use-thread-review', () => ({
  useThreadReview: vi.fn(() => ({ mutate: reviewMutate, isPending: false })),
  useRevealAudit: vi.fn(() => ({ mutate: vi.fn() })),
}));

describe('ThreadReviewDrawer', () => {
  it('renders flag summary + thread context', () => {
    renderWithProviders(<ThreadReviewDrawer thread={thread} onClose={vi.fn()} />);
    expect(screen.getByText('رقم تليفون داخل النص')).toBeTruthy();
    expect(screen.getByText('الشقة متاحة؟')).toBeTruthy();
    expect(screen.getByText('الرسالة المرفوعة')).toBeTruthy();
  });

  it('submits a reviewer decision and closes (triggering list refresh)', () => {
    const onClose = vi.fn();
    renderWithProviders(<ThreadReviewDrawer thread={thread} onClose={onClose} />);
    fireEvent.click(screen.getByText('تأكيد الحظر'));
    expect(reviewMutate).toHaveBeenCalledWith(
      expect.objectContaining({ flagId: 'flag-1', decision: 'CONFIRM_BLOCK' }),
      expect.any(Object),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('masks a raw phone number in message body', () => {
    renderWithProviders(<ThreadReviewDrawer thread={thread} onClose={vi.fn()} />);
    // raw number must NOT appear; a reveal button must be present
    expect(screen.queryByText(/01012345678/)).toBeNull();
    expect(screen.getAllByLabelText('إظهار').length).toBeGreaterThan(0);
  });
});

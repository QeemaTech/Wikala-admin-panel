import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { BulkApproveBar } from './BulkApproveBar';

const mockMutateAsync = vi.fn();

vi.mock('@/features/moderation/use-moderation-actions', () => ({
  useBulkApproveAds: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('BulkApproveBar', () => {
  it('renders nothing when selected set is empty', () => {
    renderWithProviders(<BulkApproveBar selected={new Set()} onClear={vi.fn()} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders floating bar with count when items are selected', () => {
    renderWithProviders(
      <BulkApproveBar selected={new Set(['a1', 'a2', 'a3'])} onClear={vi.fn()} />,
    );
    expect(screen.getByText(/تم اختيار 3 إعلان/)).toBeTruthy();
  });

  it('opens confirmation dialog when bulk approve button clicked', () => {
    renderWithProviders(
      <BulkApproveBar selected={new Set(['a1'])} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('موافقة مجمّعة'));
    expect(screen.getByText('تأكيد الموافقة المجمّعة')).toBeTruthy();
  });

  it('calls onClear on success (no failed IDs)', async () => {
    mockMutateAsync.mockResolvedValueOnce({ approved: 2, failed: [] });
    const onClear = vi.fn();
    renderWithProviders(
      <BulkApproveBar selected={new Set(['a1', 'a2'])} onClear={onClear} />,
    );
    fireEvent.click(screen.getByText('موافقة مجمّعة'));
    fireEvent.click(screen.getByText('تأكيد'));
    await waitFor(() => expect(onClear).toHaveBeenCalled());
  });

  it('shows partial failure message with failed IDs without calling onClear', async () => {
    // Backend returns failed entries as objects: { adId, reason }
    mockMutateAsync.mockResolvedValueOnce({
      approved: 1,
      failed: [
        { adId: 'ad-bad-100001', reason: 'NOT_IN_QUEUE' },
        { adId: 'ad-bad-200002', reason: 'ERROR' },
      ],
    });
    const onClear = vi.fn();
    renderWithProviders(
      <BulkApproveBar selected={new Set(['a1', 'a2', 'a3'])} onClear={onClear} />,
    );
    fireEvent.click(screen.getByText('موافقة مجمّعة'));
    fireEvent.click(screen.getByText('تأكيد'));
    await waitFor(() =>
      expect(screen.getByText(/تمّت الموافقة على البقية/)).toBeTruthy(),
    );
    // Last 6 chars of each adId are shown, plus the Arabic reason mapping
    expect(screen.getByText('100001')).toBeTruthy();
    expect(screen.getByText('200002')).toBeTruthy();
    // NOT_IN_QUEUE is someone else having decided first, not a fault of ours.
    expect(screen.getByText(/راجعه مشرف آخر بالفعل/)).toBeTruthy();
    expect(screen.getByText(/خطأ غير متوقع/)).toBeTruthy();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('shows error message on mutate rejection', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('خطأ في الشبكة'));
    renderWithProviders(
      <BulkApproveBar selected={new Set(['a1'])} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('موافقة مجمّعة'));
    fireEvent.click(screen.getByText('تأكيد'));
    await waitFor(() => expect(screen.getByText('خطأ في الشبكة')).toBeTruthy());
  });

  it('closes dialog on cancel', () => {
    renderWithProviders(
      <BulkApproveBar selected={new Set(['a1'])} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('موافقة مجمّعة'));
    expect(screen.getByText('تأكيد الموافقة المجمّعة')).toBeTruthy();
    // [0] = bar cancel (onClear), [1] = dialog cancel (setConfirming(false))
    fireEvent.click(screen.getAllByText('إلغاء')[1]);
    expect(screen.queryByText('تأكيد الموافقة المجمّعة')).toBeNull();
  });
});

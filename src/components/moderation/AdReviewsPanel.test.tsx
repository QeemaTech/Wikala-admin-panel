import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AdReviewsPanel } from './AdReviewsPanel';
import type { AdReviewDTO } from '@/features/ads/use-ad-reviews';

/**
 * The panel that was missing entirely: the backend has shipped
 * `GET/PATCH /admin/ad-reviews` for a while, but nothing in the panel called
 * it, so a buyer's review of an ad sat at PENDING forever and never became
 * visible in the app.
 */

const mockMutate = vi.fn();
let queueState: {
  data?: { items: AdReviewDTO[]; meta: { page: number; pageSize: number; total: number; pages: number } };
  isLoading: boolean;
  isError: boolean;
};
const capturedParams: Array<{ status?: string; page?: number }> = [];

vi.mock('@/features/ads/use-ad-reviews', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/ads/use-ad-reviews')>();
  return {
    ...actual,
    useAdReviewQueue: (params: { status?: string; page?: number }) => {
      capturedParams.push(params);
      return queueState;
    },
    useModerateAdReview: () => ({ mutate: mockMutate, isPending: false }),
  };
});

const review = (over: Partial<AdReviewDTO> = {}): AdReviewDTO => ({
  id: 'r1',
  adId: 'ad1',
  adTitle: 'سيارة هيونداي إلنترا 2019',
  rating: 4,
  body: 'البائع محترم والسيارة مطابقة للوصف',
  status: 'PENDING',
  author: { id: 'u1', name: 'نورهان', avatarUrl: null },
  createdAt: new Date().toISOString(),
  ...over,
});

const meta = { page: 1, pageSize: 20, total: 1, pages: 1 };

beforeEach(() => {
  mockMutate.mockReset();
  capturedParams.length = 0;
  queueState = { data: { items: [review()], meta }, isLoading: false, isError: false };
});

describe('AdReviewsPanel', () => {
  it('opens on the pending queue — the only tab with work waiting', () => {
    renderWithProviders(<AdReviewsPanel />);
    expect(capturedParams[0].status).toBe('PENDING');
  });

  it('shows the review with its ad title, author and body', () => {
    renderWithProviders(<AdReviewsPanel />);
    expect(screen.getByText('سيارة هيونداي إلنترا 2019')).toBeTruthy();
    expect(screen.getByText('نورهان')).toBeTruthy();
    expect(screen.getByText(/مطابقة للوصف/)).toBeTruthy();
  });

  it('publishing a review sends PUBLISHED for that id', async () => {
    renderWithProviders(<AdReviewsPanel />);
    fireEvent.click(screen.getByText('نشر'));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate.mock.calls[0][0]).toEqual({ id: 'r1', status: 'PUBLISHED' });
  });

  it('rejecting a review sends REJECTED', async () => {
    renderWithProviders(<AdReviewsPanel />);
    fireEvent.click(screen.getByText('رفض'));
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate.mock.calls[0][0]).toEqual({ id: 'r1', status: 'REJECTED' });
  });

  it('offers no "publish" button on an already published review', () => {
    queueState = {
      data: { items: [review({ status: 'PUBLISHED' })], meta },
      isLoading: false,
      isError: false,
    };
    renderWithProviders(<AdReviewsPanel />);
    expect(screen.queryByText('نشر')).toBeNull();
    // Un-publishing stays available: it pulls the ad's rating back down.
    expect(screen.getByText('رفض')).toBeTruthy();
  });

  it('switching the filter refetches with that status and resets to page 1', () => {
    renderWithProviders(<AdReviewsPanel />);
    fireEvent.click(screen.getByText('منشورة'));
    const last = capturedParams[capturedParams.length - 1];
    expect(last.status).toBe('PUBLISHED');
    expect(last.page).toBe(1);
  });

  it('shows an empty state rather than a blank panel', () => {
    queueState = { data: { items: [], meta: { ...meta, total: 0 } }, isLoading: false, isError: false };
    renderWithProviders(<AdReviewsPanel />);
    expect(screen.getByText('لا توجد تقييمات في هذه القائمة')).toBeTruthy();
  });

  it('surfaces a load failure instead of pretending the queue is empty', () => {
    queueState = { data: undefined, isLoading: false, isError: true };
    renderWithProviders(<AdReviewsPanel />);
    expect(screen.getByText('تعذّر تحميل التقييمات')).toBeTruthy();
  });
});

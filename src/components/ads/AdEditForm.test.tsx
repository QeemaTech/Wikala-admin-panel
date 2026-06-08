import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';
import { AdEditForm } from './AdEditForm';
import type { AdAdminDTO } from '@/features/ads/use-ads';

const mutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/features/ads/use-ad-actions', () => ({
  useAdminEditAd: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('@/features/categories/use-categories', () => ({
  useCategoryFields: () => ({
    data: {
      items: [
        { _id: 'f1', category_id: 'c1', key: 'year', label_ar: 'سنة الصنع', label_en: 'Year', type: 'number', required: true, searchable: false, filterable: true, options: [], order: 0, is_active: true },
        { _id: 'f2', category_id: 'c1', key: 'brand', label_ar: 'الماركة', label_en: 'Brand', type: 'select', required: false, searchable: false, filterable: true, options: [{ value: 'toyota', label_ar: 'تويوتا', label_en: 'Toyota' }], order: 1, is_active: true },
      ],
    },
  }),
}));

const ad: AdAdminDTO = {
  id: 'ad123456',
  slug: 'ad-1',
  seller: null,
  categoryId: 'c1',
  subCategoryId: null,
  type: 'SELL',
  title: 'سيارة للبيع',
  description: 'وصف',
  priceMinor: 5000000,
  currency: 'EGP',
  condition: 'PRELOVED',
  dynamicFields: { year: 2020 },
  location: null,
  governorate: 'القاهرة',
  district: 'المعادي',
  status: 'PENDING_HUMAN',
  media: [],
  expiresAt: null,
  publishedAt: null,
  viewCount: 0,
  favCount: 0,
  contactCount: 0,
  dedupHash: null,
  rejectionReason: null,
  moderation: { aiRiskScore: 0.5, aiReasons: [], aiVerdict: 'FLAG', humanDecision: null, reviewerId: null, decidedAt: null },
};

describe('AdEditForm', () => {
  beforeEach(() => mutateAsync.mockClear());

  it('renders category-driven dynamic fields', () => {
    renderWithProviders(<AdEditForm ad={ad} categoryName="سيارات" onClose={() => {}} />);
    expect(screen.getByText('سنة الصنع')).toBeInTheDocument();
    expect(screen.getByText('الماركة')).toBeInTheDocument();
  });

  it('submits core + dynamic fields to the admin edit endpoint', async () => {
    const onSuccess = vi.fn();
    renderWithProviders(<AdEditForm ad={ad} categoryName="سيارات" onClose={() => {}} onSuccess={onSuccess} />);

    fireEvent.submit(screen.getByText('حفظ التعديلات').closest('form')!);

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const arg = mutateAsync.mock.calls[0][0];
    expect(arg.adId).toBe('ad123456');
    expect(arg.payload.title).toBe('سيارة للبيع');
    expect(arg.payload.priceMinor).toBe(5000000);
    expect(arg.payload.dynamicFields).toEqual({ year: 2020 });
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';

const mockCreate = vi.fn().mockResolvedValue({});
const mockUpdate = vi.fn().mockResolvedValue({});

vi.mock('@/features/banners/use-banner-mutations', () => ({
  useCreateBanner: () => ({ mutateAsync: mockCreate, isPending: false }),
  useUpdateBanner: () => ({ mutateAsync: mockUpdate, isPending: false }),
}));

vi.mock('@/features/media/use-signed-upload', () => ({
  useSignedUpload: () => ({ upload: vi.fn(), isUploading: false, progress: 0, error: null, reset: vi.fn() }),
}));

import { BannerForm } from './BannerForm';

function setInput(name: string, value: string) {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
  fireEvent.change(el, { target: { value } });
}

describe('BannerForm', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
  });

  it('reflects the typed title live in the home preview', () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);
    setInput('title', 'عروض رمضان');
    // The preview pane renders the title text (separate from the input value).
    expect(screen.getByText('عروض رمضان')).toBeTruthy();
  });

  it('rejects an invalid link URL', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);
    setInput('title', 'عروض رمضان');
    setInput('linkUrl', 'not-a-url');
    fireEvent.click(screen.getByText('إنشاء البانر'));

    expect(await screen.findByText('رابط غير صالح (يبدأ بـ http)')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a banner with the chosen slot on valid input', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);
    setInput('title', 'عروض رمضان');
    setInput('linkUrl', 'https://wikala.app/promo');
    fireEvent.click(screen.getByText('إنشاء البانر'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      title: 'عروض رمضان',
      linkUrl: 'https://wikala.app/promo',
      slot: 'HOME_TOP',
      ctaText: 'اطلب الآن',
    });
  });
});

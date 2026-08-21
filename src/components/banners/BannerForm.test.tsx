import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';

const mockCreate = vi.fn().mockResolvedValue({});
const mockUpdate = vi.fn().mockResolvedValue({});

vi.mock('@/features/banners/use-banner-mutations', () => ({
  useCreateBanner: () => ({ mutateAsync: mockCreate, isPending: false }),
  useUpdateBanner: () => ({ mutateAsync: mockUpdate, isPending: false }),
}));

// Mock the signed upload
vi.mock('@/features/media/use-signed-upload', () => ({
  useSignedUpload: () => ({
    upload: vi.fn(),
    isUploading: false,
    progress: 0,
    error: null,
  }),
}));

// Mock target search to return results when searching for ads
vi.mock('@/features/banners/use-target-search', async () => {
  const actual = await vi.importActual<typeof import('@/features/banners/use-target-search')>('@/features/banners/use-target-search');
  return {
    ...actual,
    useTargetSearch: () => ({
      data: [
        { id: '64b000000000000000000001', label: 'آيفون 14 برو', sublabel: null, slug: 'iphone-14-pro', thumbUrl: null },
        { id: '64b000000000000000000002', label: 'سامسونج S24', sublabel: null, slug: 'samsung-s24', thumbUrl: null },
      ],
      isFetching: false,
    }),
  };
});

import { BannerForm } from './BannerForm';

describe('BannerForm — destination picker', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
  });

  it('shows URL input by default and hides search bar', () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);
    const typeSelect = screen.getByTestId('destination-type-select');
    expect((typeSelect as HTMLSelectElement).value).toBe('URL');
    expect(screen.getByTestId('destination-url-input')).toBeTruthy();
    expect(screen.queryByTestId('destination-search-input')).toBeNull();
  });

  it('switching to AD type shows the search bar and hides URL input', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);
    const typeSelect = screen.getByTestId('destination-type-select');
    fireEvent.change(typeSelect, { target: { value: 'AD' } });
    await waitFor(() => {
      expect(screen.getByTestId('destination-search-input')).toBeTruthy();
      expect(screen.queryByTestId('destination-url-input')).toBeNull();
    });
  });

  it('switching to NONE hides both search bar and URL input', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);
    const typeSelect = screen.getByTestId('destination-type-select');
    fireEvent.change(typeSelect, { target: { value: 'NONE' } });
    await waitFor(() => {
      expect(screen.queryByTestId('destination-search-input')).toBeNull();
      expect(screen.queryByTestId('destination-url-input')).toBeNull();
    });
  });

  it('picking a search result stores the target id in the payload', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);

    // Switch to AD
    fireEvent.change(screen.getByTestId('destination-type-select'), { target: { value: 'AD' } });
    await waitFor(() => expect(screen.getByTestId('destination-search-input')).toBeTruthy());

    // Type in search
    fireEvent.change(screen.getByTestId('destination-search-input'), { target: { value: 'آي' } });
    // Click first result
    await waitFor(() => expect(screen.getByText('آيفون 14 برو')).toBeTruthy());
    fireEvent.click(screen.getByText('آيفون 14 برو'));

    // Should show the selected item and resolved link
    await waitFor(() => {
      expect(screen.getByText(/iphone-14-pro/)).toBeTruthy();
    });

    // Fill required form fields and submit
    fireEvent.change(document.querySelector('[name="title"]')!, { target: { value: 'بانر إعلان' } });
    fireEvent.change(document.querySelector('[name="ctaText"]')!, { target: { value: 'اضغط' } });
    fireEvent.click(screen.getByText('إنشاء البانر'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.destination.type).toBe('AD');
    expect(payload.destination.targetId).toBe('64b000000000000000000001');
  });

  it('URL type still validates and submits correctly', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);

    // Fill fields
    fireEvent.change(document.querySelector('[name="title"]')!, { target: { value: 'بانر خارجي' } });
    fireEvent.change(document.querySelector('[name="ctaText"]')!, { target: { value: 'زور' } });
    fireEvent.change(screen.getByTestId('destination-url-input'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByText('إنشاء البانر'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.destination.type).toBe('URL');
    expect(payload.destination.url).toBe('https://example.com');
  });

  it('shows the resolved deep link preview when a target is selected', async () => {
    renderWithProviders(<BannerForm onClose={() => {}} />);

    // Switch to PRODUCT
    fireEvent.change(screen.getByTestId('destination-type-select'), { target: { value: 'PRODUCT' } });
    await waitFor(() => expect(screen.getByTestId('destination-search-input')).toBeTruthy());

    // Search and pick
    fireEvent.change(screen.getByTestId('destination-search-input'), { target: { value: 'سام' } });
    await waitFor(() => expect(screen.getByText('سامسونج S24')).toBeTruthy());
    fireEvent.click(screen.getByText('سامسونج S24'));

    await waitFor(() => {
      const preview = screen.getByTestId('resolved-link-preview');
      expect(preview.textContent).toContain('wikala://products/samsung-s24');
    });
  });
});

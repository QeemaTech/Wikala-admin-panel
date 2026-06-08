import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';

const mockCreate = vi.fn().mockResolvedValue({});
const mockUpdate = vi.fn().mockResolvedValue({});

vi.mock('@/features/flash/use-flash-mutations', () => ({
  useCreateFlashSale: () => ({ mutateAsync: mockCreate, isPending: false }),
  useUpdateFlashSale: () => ({ mutateAsync: mockUpdate, isPending: false }),
}));

// The product picker searches ads — stub it with one selectable result.
vi.mock('@/features/flash/use-ad-search', () => ({
  useAdSearch: () => ({
    data: [{ id: '64b000000000000000000001', title: 'آيفون 15 برو', coverUrl: null, priceMinor: 5500000, currency: 'EGP' }],
    isFetching: false,
  }),
}));

import { FlashSaleForm } from './FlashSaleForm';

function setInput(name: string, value: string) {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
  fireEvent.change(el, { target: { value } });
}

describe('FlashSaleForm', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
  });

  // Selects the stubbed ad through the product picker (type → click result).
  function pickProduct() {
    fireEvent.change(screen.getByPlaceholderText('ابحث عن المنتج بالاسم...'), { target: { value: 'اي' } });
    fireEvent.click(screen.getByText('آيفون 15 برو'));
  }

  it('rejects a sale price that is not below the original', async () => {
    renderWithProviders(<FlashSaleForm onClose={() => {}} />);
    pickProduct();
    setInput('title', 'تخفيض الصيف');
    setInput('originalPrice', '100');
    setInput('salePrice', '150'); // invalid: >= original
    setInput('stock', '20');
    setInput('endsAt', '2030-01-01T10:00');
    fireEvent.click(screen.getByText('إطلاق العرض'));

    expect(await screen.findByText('سعر العرض يجب أن يكون أقل من السعر الأصلي')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a flash sale with minor-unit prices on valid input', async () => {
    renderWithProviders(<FlashSaleForm onClose={() => {}} />);
    pickProduct();
    setInput('title', 'تخفيض الصيف');
    setInput('originalPrice', '100');
    setInput('salePrice', '60');
    setInput('stock', '20');
    setInput('endsAt', '2030-01-01T10:00');
    fireEvent.click(screen.getByText('إطلاق العرض'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    const payload = mockCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      adId: '64b000000000000000000001',
      title: 'تخفيض الصيف',
      originalPriceMinor: 10000,
      salePriceMinor: 6000,
      stock: 20,
      source: 'ADMIN',
      currency: 'EGP',
    });
    expect(payload.endsAt).toMatch(/^20\d{2}-/); // ISO string
  });
});

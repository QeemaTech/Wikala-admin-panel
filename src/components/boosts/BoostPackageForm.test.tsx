import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';
import type { BoostPackageDTO } from '@/features/boosts/use-boosts';

const mockUpdate = vi.fn().mockResolvedValue({});

vi.mock('@/features/boosts/use-boost-mutations', () => ({
  useUpdateBoostPackage: () => ({ mutateAsync: mockUpdate, isPending: false }),
}));

import { BoostPackageForm } from './BoostPackageForm';

const pkg: BoostPackageDTO = {
  package: 'HOT',
  priceMinor: 9900,
  currency: 'EGP',
  durationDays: 7,
  placement: 'CATEGORY_TOP',
  badge: 'FLAME',
  pushToFollowers: true,
  marketingBullets: ['يجذب مشاهدات +180%'],
  benefits: ['ظهور أسرع لمشتري الفئة', 'تمييز شعلة حمراء', 'إشعار فوري للمتابعين'],
  active: true,
  activeCount: 12,
  weeklyRevenueMinor: 50000,
};

function setInput(name: string, value: string) {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
  fireEvent.change(el, { target: { value } });
}

function submitForm() {
  fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

describe('BoostPackageForm', () => {
  beforeEach(() => mockUpdate.mockClear());

  it('rejects a non-positive price and does not save', async () => {
    renderWithProviders(<BoostPackageForm pkg={pkg} onClose={() => {}} />);
    setInput('price', '0');
    submitForm();

    expect(await screen.findByText('السعر يجب أن يكون موجبًا')).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('saves the structured package with minor-unit price on valid input', async () => {
    renderWithProviders(<BoostPackageForm pkg={pkg} onClose={() => {}} />);
    setInput('price', '120');
    setInput('placement', 'TOP_FEED');
    submitForm();

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({
      pkg: 'HOT',
      payload: {
        priceMinor: 12000,
        currency: 'EGP',
        durationDays: 7,
        placement: 'TOP_FEED',
        badge: 'FLAME',
        pushToFollowers: true,
        marketingBullets: ['يجذب مشاهدات +180%'],
      },
    });
    // Structured form no longer sends a free-text benefits list.
    expect(mockUpdate.mock.calls[0][0].payload).not.toHaveProperty('benefits');
  });
});

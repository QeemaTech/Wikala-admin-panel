import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';
import type { AdminPlanDTO } from '@/features/plans/use-plans';

const mockUpdate = vi.fn().mockResolvedValue({});
const mockCreate = vi.fn().mockResolvedValue({});

vi.mock('@/features/plans/use-plan-mutations', () => ({
  useUpdatePlan: () => ({ mutateAsync: mockUpdate, isPending: false }),
  useCreatePlan: () => ({ mutateAsync: mockCreate, isPending: false }),
}));

import { PlanForm } from './PlanForm';

const plan: AdminPlanDTO = {
  plan: 'PRO',
  name: 'الاحترافية',
  priceMinor: 9900,
  currency: 'EGP',
  cycle: 'MONTHLY',
  adQuotaTotal: 20,
  dealRadarLimit: 0,
  searchPlacement: 'BOOSTED',
  analyticsLevel: 'ADVANCED',
  supportLevel: 'PRIORITY',
  verifiedBadge: true,
  marketingBullets: [],
  advantages: ['ظهور معزز في نتائج البحث'],
  active: true,
  popular: true,
  activeSubscribers: 40,
  newLast7d: 5,
  mrrMinor: 396000,
};

function setInput(name: string, value: string) {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement;
  fireEvent.change(el, { target: { value } });
}

function submitForm() {
  fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

describe('PlanForm', () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockCreate.mockClear();
  });

  it('rejects an ad quota below 1 and does not save', async () => {
    renderWithProviders(<PlanForm plan={plan} onClose={() => {}} />);
    setInput('adQuotaTotal', '0');
    submitForm();

    expect(await screen.findByText('الحصة لا تقل عن إعلان واحد')).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('saves the structured plan with minor-unit price on valid input', async () => {
    renderWithProviders(<PlanForm plan={plan} onClose={() => {}} />);
    setInput('price', '149');
    setInput('adQuotaTotal', '25');
    submitForm();

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({
      plan: 'PRO',
      payload: {
        name: 'الاحترافية',
        priceMinor: 14900,
        currency: 'EGP',
        adQuotaTotal: 25,
        searchPlacement: 'BOOSTED',
        analyticsLevel: 'ADVANCED',
        supportLevel: 'PRIORITY',
        verifiedBadge: true,
        dealRadarLimit: 0,
      },
    });
    // The structured form no longer sends free-text advantages.
    expect(mockUpdate.mock.calls[0][0].payload).not.toHaveProperty('features');
  });

  it('creates a new plan from a code + name in create mode', async () => {
    renderWithProviders(<PlanForm onClose={() => {}} />);
    setInput('plan', 'GOLD');
    setInput('name', 'الذهبية');
    setInput('price', '79');
    setInput('adQuotaTotal', '10');
    submitForm();

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      plan: 'GOLD',
      name: 'الذهبية',
      priceMinor: 7900,
      adQuotaTotal: 10,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects an invalid plan code in create mode', async () => {
    renderWithProviders(<PlanForm onClose={() => {}} />);
    setInput('plan', 'bad code!');
    setInput('name', 'خطة');
    setInput('price', '50');
    setInput('adQuotaTotal', '5');
    submitForm();

    expect(await screen.findByText(/الرمز/)).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

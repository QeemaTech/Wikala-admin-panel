import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrencyTable } from './CurrencyTable';
import type { CurrencyDTO } from '@/features/settings/use-currencies';

/**
 * The currency table drives every converted price in the app, and the rates in
 * it are typed in by hand rather than pulled from a feed. The only signal that
 * a rate has gone stale is how long ago someone last touched it, so that is
 * what these tests are about.
 */

let currencies: CurrencyDTO[] = [];
let isLoading = false;
let isError = false;

vi.mock('@/features/settings/use-currencies', () => ({
  useCurrencies: () => ({ data: currencies, isLoading, isError }),
  useCreateCurrency: () => ({ mutateAsync: vi.fn() }),
  useUpdateCurrency: () => ({ mutateAsync: vi.fn() }),
}));

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const currency = (over: Partial<CurrencyDTO> = {}): CurrencyDTO => ({
  code: 'USD',
  nameAr: 'دولار أمريكي',
  nameEn: 'US Dollar',
  exchangeRateToBase: 48,
  status: 'ACTIVE',
  updatedAt: daysAgo(1),
  ...over,
});

const base = currency({
  code: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', exchangeRateToBase: 1,
});

const setup = (rows: CurrencyDTO[]) => {
  currencies = rows;
  isLoading = false;
  isError = false;
  return render(<CurrencyTable baseCurrency="EGP" />);
};

describe('CurrencyTable', () => {
  it('shows the rate each non-base currency converts at', () => {
    setup([base, currency()]);
    expect(screen.getByText('48.00')).toBeInTheDocument();
  });

  it('locks the base currency at 1.00 instead of showing an editable rate', () => {
    setup([base]);
    expect(screen.getByText(/1.00/)).toBeInTheDocument();
    expect(screen.getByText('أساسية')).toBeInTheDocument();
  });

  it('says how recently a rate was updated, so staff can judge it', () => {
    setup([base, currency({ updatedAt: daysAgo(3) })]);
    expect(screen.getByText('حُدّث منذ 3 يوم')).toBeInTheDocument();
  });

  it('flags a rate older than a month as stale', () => {
    setup([base, currency({ updatedAt: daysAgo(75) })]);
    // Every converted price in the app is being multiplied by this number.
    const note = screen.getByText('لم يُحدَّث منذ 2 شهر');
    expect(note).toBeInTheDocument();
    expect(note.className).toContain('text-amber');
  });

  it('does not flag a freshly edited rate', () => {
    setup([base, currency({ updatedAt: daysAgo(2) })]);
    expect(screen.getByText('حُدّث منذ 2 يوم').className).not.toContain('text-amber');
  });

  it('never ages the base currency, whose rate is 1 by definition', () => {
    setup([currency({ ...base, updatedAt: daysAgo(400) })]);
    expect(screen.queryByText(/لم يُحدَّث/)).not.toBeInTheDocument();
  });

  it('omits the age line when the API sends no timestamp', () => {
    setup([base, currency({ updatedAt: null })]);
    expect(screen.queryByText(/حُدّث/)).not.toBeInTheDocument();
  });

  it('tells staff the table is empty rather than rendering a blank card', () => {
    // Exactly what live showed before the currency seed existed.
    setup([]);
    expect(screen.getByText('لا توجد عملات')).toBeInTheDocument();
  });

  it('marks a withdrawn currency so staff know the app will not offer it', () => {
    setup([base, currency({ status: 'INACTIVE' })]);
    expect(screen.getByText('مسودة')).toBeInTheDocument();
  });
});

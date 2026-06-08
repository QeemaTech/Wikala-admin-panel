import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test/render';
import { AudienceTargeting } from './AudienceTargeting';

vi.mock('@/features/categories/use-categories', () => ({
  useCategories: () => ({ data: { items: [{ id: 'c1', nameAr: 'الهواتف' }] } }),
}));

describe('AudienceTargeting', () => {
  it('shows the live estimate count', () => {
    renderWithProviders(<AudienceTargeting value={{}} onChange={() => {}} count={1234} loading={false} />);
    expect(screen.getByText(/1,234/)).toBeTruthy();
    expect(screen.getByText(/مستخدم/)).toBeTruthy();
  });

  it('shows a loading state while estimating', () => {
    renderWithProviders(<AudienceTargeting value={{}} onChange={() => {}} count={undefined} loading />);
    expect(screen.getByText('جارٍ التقدير…')).toBeTruthy();
  });

  it('updates the audience query (which drives the estimate) on a filter change', () => {
    const onChange = vi.fn();
    renderWithProviders(<AudienceTargeting value={{}} onChange={onChange} count={1000} loading={false} />);

    const selects = document.querySelectorAll('select');
    // [0] tier, [1] governorate, [2] category, [3] lastActive
    fireEvent.change(selects[0], { target: { value: 'VERIFIED' } });
    expect(onChange).toHaveBeenCalledWith({ tier: ['VERIFIED'] });

    fireEvent.change(selects[1], { target: { value: 'CAIRO' } });
    expect(onChange).toHaveBeenCalledWith({ governorate: ['CAIRO'] });

    fireEvent.change(selects[3], { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith({ lastActiveWithinDays: 7 });
  });
});

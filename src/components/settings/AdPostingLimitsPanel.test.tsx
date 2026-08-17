import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdPostingLimitsPanel } from './AdPostingLimitsPanel';
import type { SystemSettingsDTO } from '@/features/settings/use-system-settings';

const settings = (over: Partial<SystemSettingsDTO> = {}) =>
  ({
    freeTierAdLimit: 3,
    adExpiryDays: 30,
    ...over,
  } as SystemSettingsDTO);

describe('AdPostingLimitsPanel', () => {
  it('shows the stored free-tier allowance and ad lifetime', () => {
    render(<AdPostingLimitsPanel settings={settings()} onChange={() => {}} />);
    expect(screen.getByLabelText('عدد الإعلانات للخطة المجانية')).toHaveValue(3);
    expect(screen.getByLabelText('مدة صلاحية الإعلان')).toHaveValue(30);
  });

  it('emits the camelCase keys PUT /admin/settings expects', () => {
    const onChange = vi.fn();
    render(<AdPostingLimitsPanel settings={settings()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('عدد الإعلانات للخطة المجانية'), { target: { value: '5' } });
    // A snake_case key here would be silently dropped by the backend's
    // whitelist and the save would appear to succeed while changing nothing.
    expect(onChange).toHaveBeenCalledWith({ freeTierAdLimit: 5 });

    fireEvent.change(screen.getByLabelText('مدة صلاحية الإعلان'), { target: { value: '45' } });
    expect(onChange).toHaveBeenCalledWith({ adExpiryDays: 45 });
  });

  it('sends numbers, not the strings the input yields', () => {
    const onChange = vi.fn();
    render(<AdPostingLimitsPanel settings={settings()} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('عدد الإعلانات للخطة المجانية'), { target: { value: '7' } });
    // isInt() rejects "7", so a string would come back 422 on save.
    expect(typeof onChange.mock.calls[0][0].freeTierAdLimit).toBe('number');
  });

  it('warns that a limit of 1 breaks the swap flow', () => {
    // Swapping needs two published ads: the one offered and the one wanted.
    // At a limit of 1 the second publish fails and the Swap button dead-ends.
    render(<AdPostingLimitsPanel settings={settings({ freeTierAdLimit: 1 })} onChange={() => {}} />);
    expect(screen.getByText(/لن يتمكن المستخدم المجاني من عرض المقايضة/)).toBeInTheDocument();
  });

  it('warns that zero blocks free posting entirely', () => {
    render(<AdPostingLimitsPanel settings={settings({ freeTierAdLimit: 0 })} onChange={() => {}} />);
    expect(screen.getByText(/يمنع أي مستخدم مجاني من النشر/)).toBeInTheDocument();
  });

  it('shows no warning at a workable limit', () => {
    render(<AdPostingLimitsPanel settings={settings({ freeTierAdLimit: 5 })} onChange={() => {}} />);
    expect(screen.queryByText(/لن يتمكن المستخدم المجاني/)).not.toBeInTheDocument();
    expect(screen.queryByText(/يمنع أي مستخدم مجاني/)).not.toBeInTheDocument();
  });

  it('points paid quotas at the Plans page rather than implying they are set here', () => {
    render(<AdPostingLimitsPanel settings={settings()} onChange={() => {}} />);
    // Named in both the card subtitle and the footnote.
    expect(screen.getAllByText(/صفحة الباقات/).length).toBeGreaterThan(0);
  });
});

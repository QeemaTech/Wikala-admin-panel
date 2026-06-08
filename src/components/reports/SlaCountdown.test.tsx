import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SlaCountdown, slaState } from './SlaCountdown';

describe('slaState', () => {
  it('classifies breached / near / ok', () => {
    expect(slaState(-10, 'HIGH')).toBe('breached');
    expect(slaState(0, 'LOW')).toBe('breached');
    expect(slaState(3600, 'HIGH')).toBe('near'); // <4h, high
    expect(slaState(3600, 'MED')).toBe('ok'); // near-breach reserved for HIGH
    expect(slaState(50 * 3600, 'HIGH')).toBe('ok');
    expect(slaState(null, 'HIGH')).toBe('ok');
  });
});

describe('SlaCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ticks down once per second', () => {
    render(<SlaCountdown remainingSeconds={125} severity="MED" />);
    expect(screen.getByText('2د 5ث')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText('2د 2ث')).toBeTruthy();
  });

  it('shows breach text at zero', () => {
    render(<SlaCountdown remainingSeconds={2} severity="HIGH" />);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText('تخطّت SLA')).toBeTruthy();
  });

  it('renders a dash when inactive', () => {
    render(<SlaCountdown remainingSeconds={5000} severity="HIGH" inactive />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});

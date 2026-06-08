import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuctionCountdown, countdownTone, formatCountdown } from './AuctionCountdown';

describe('countdownTone', () => {
  it('classifies by urgency', () => {
    expect(countdownTone(0)).toBe('ended');
    expect(countdownTone(5 * 60)).toBe('red'); // < 10 min
    expect(countdownTone(30 * 60)).toBe('amber'); // < 1 h
    expect(countdownTone(5 * 3600)).toBe('normal');
  });
});

describe('formatCountdown', () => {
  it('formats remaining time and shows ended at zero', () => {
    expect(formatCountdown(0)).toBe('انتهى');
    expect(formatCountdown(90)).toBe('1د 30ث');
    expect(formatCountdown(3 * 3600 + 5 * 60)).toBe('3س 5د');
  });
});

describe('AuctionCountdown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks down once per second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
    const endTime = new Date('2030-01-01T00:01:30.000Z').toISOString(); // +90s

    render(<AuctionCountdown endTime={endTime} />);
    expect(screen.getByText('1د 30ث')).toBeTruthy();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('1د 29ث')).toBeTruthy();
  });

  it('renders a dash for closed (inactive) auctions', () => {
    render(<AuctionCountdown endTime={null} inactive />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdBrowseCard } from './AdBrowseCard';
import type { AdminAdCard } from '@/features/ads/use-admin-ads';

const HOUR = 3600 * 1000;

const base: AdminAdCard = {
  id: 'ad1',
  slug: 'ayfwn-13',
  title: 'آيفون 13 برو',
  priceMinor: 2000000,
  currency: 'EGP',
  coverUrl: null,
  governorate: 'CAIRO',
  district: 'مدينة نصر',
  condition: 'PRELOVED',
  publishedAt: '2026-08-20T09:00:00.000Z',
  status: 'ACTIVE',
};

const noop = () => {};
const handlers = {
  onView: noop,
  onEdit: noop,
  onTakedown: noop,
  onRestore: noop,
  onDelete: noop,
};

describe('AdBrowseCard — ad type', () => {
  it('badges an auction so staff can tell it apart from a plain listing', () => {
    render(<AdBrowseCard ad={{ ...base, type: 'AUCTION' }} {...handlers} />);
    expect(screen.getByText('مزاد')).toBeTruthy();
  });

  it('badges a swap', () => {
    render(<AdBrowseCard ad={{ ...base, type: 'TRADE' }} {...handlers} />);
    expect(screen.getByText('مبادلة')).toBeTruthy();
  });

  it('does not badge a plain SELL — that is the default, and a chip on every card is noise', () => {
    render(<AdBrowseCard ad={{ ...base, type: 'SELL' }} {...handlers} />);
    expect(screen.queryByText('بيع')).toBeNull();
  });

  it('renders without a type at all (older API response)', () => {
    render(<AdBrowseCard ad={base} {...handlers} />);
    expect(screen.getByText('آيفون 13 برو')).toBeTruthy();
  });
});

describe("AdBrowseCard — Today's Deal state", () => {
  it('marks a featured ad', () => {
    render(
      <AdBrowseCard
        ad={{
          ...base,
          todaysDeal: {
            isTodaysDeal: true,
            dealStartsAt: null,
            dealEndsAt: new Date(Date.now() + 4 * HOUR).toISOString(),
            originalPriceMinor: 2500000,
          },
        }}
        {...handlers}
      />
    );
    expect(screen.getByText('صفقة اليوم')).toBeTruthy();
  });

  it('distinguishes featured-but-expired from not featured', () => {
    // The app rail drops this ad (it filters on the clock), but staff must
    // still see that the flag is set — otherwise they re-feature something
    // already flagged and nothing appears to change.
    render(
      <AdBrowseCard
        ad={{
          ...base,
          todaysDeal: {
            isTodaysDeal: true,
            dealStartsAt: null,
            dealEndsAt: new Date(Date.now() - HOUR).toISOString(),
            originalPriceMinor: null,
          },
        }}
        {...handlers}
      />
    );
    expect(screen.getByText('صفقة اليوم · انتهت')).toBeTruthy();
  });

  it('shows no deal chip when the ad is not featured', () => {
    render(
      <AdBrowseCard
        ad={{
          ...base,
          todaysDeal: {
            isTodaysDeal: false,
            dealStartsAt: null,
            dealEndsAt: null,
            originalPriceMinor: null,
          },
        }}
        {...handlers}
      />
    );
    expect(screen.queryByText('صفقة اليوم')).toBeNull();
  });

  it('offers the feature button on an ACTIVE ad', () => {
    const onToggleDeal = vi.fn();
    render(<AdBrowseCard ad={base} {...handlers} onToggleDeal={onToggleDeal} />);
    expect(screen.getByLabelText('إضافة إلى صفقات اليوم')).toBeTruthy();
  });

  it('hides the feature button on a non-ACTIVE ad', () => {
    // The backend answers 409 for anything but ACTIVE, and the rail would
    // filter it out regardless — so the button would be a dead click.
    const onToggleDeal = vi.fn();
    render(
      <AdBrowseCard ad={{ ...base, status: 'ARCHIVED' }} {...handlers} onToggleDeal={onToggleDeal} />
    );
    expect(screen.queryByLabelText('إضافة إلى صفقات اليوم')).toBeNull();
  });

  it('flips the button to unfeature once the ad is on the rail', () => {
    const onToggleDeal = vi.fn();
    render(
      <AdBrowseCard
        ad={{
          ...base,
          todaysDeal: {
            isTodaysDeal: true,
            dealStartsAt: null,
            dealEndsAt: null,
            originalPriceMinor: null,
          },
        }}
        {...handlers}
        onToggleDeal={onToggleDeal}
      />
    );
    expect(screen.getByLabelText('إلغاء صفقة اليوم')).toBeTruthy();
  });
});

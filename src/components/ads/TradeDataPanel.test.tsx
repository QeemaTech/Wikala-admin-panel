import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TradeDataPanel } from './TradeDataPanel';
import type { AdTradeBlock } from '@/features/ads/use-ads';

const full: AdTradeBlock = {
  wantedCategoryIds: ['64a1b2c3d4e5f60012345678', '64a1b2c3d4e5f60012345679'],
  wantedDescription: 'أريد لابتوب أو تابلت بحالة جيدة',
  acceptsCashDifference: true,
  cashDifferenceDirection: 'BUYER_PAYS',
  maxCashDifferenceMinor: 500000,
  estimatedValueMinor: 3000000,
  wantedCondition: 'PRELOVED',
};

describe('TradeDataPanel', () => {
  it('renders wanted description', () => {
    render(<TradeDataPanel trade={full} />);
    expect(screen.getByText('المطلوب للمقايضة')).toBeTruthy();
    expect(screen.getByText('أريد لابتوب أو تابلت بحالة جيدة')).toBeTruthy();
  });

  it('renders category chips', () => {
    render(<TradeDataPanel trade={full} />);
    expect(screen.getByText('الفئات المقبولة')).toBeTruthy();
    // Shows last 6 chars of each category ID
    expect(screen.getByText('345678')).toBeTruthy();
    expect(screen.getByText('345679')).toBeTruthy();
  });

  it('renders wanted condition', () => {
    render(<TradeDataPanel trade={full} />);
    expect(screen.getByText('حالة المطلوب')).toBeTruthy();
    expect(screen.getByText('مستعمل')).toBeTruthy();
  });

  it('renders estimated value', () => {
    render(<TradeDataPanel trade={full} />);
    expect(screen.getByText('القيمة التقديرية')).toBeTruthy();
  });

  it('renders cash difference info', () => {
    render(<TradeDataPanel trade={full} />);
    expect(screen.getByText('نعم')).toBeTruthy();
    expect(screen.getByText('المشتري يدفع')).toBeTruthy();
    expect(screen.getByText('حد الفرق الأقصى')).toBeTruthy();
  });

  it('shows "لا" when cash difference not accepted', () => {
    const noTradeBlock: AdTradeBlock = {
      ...full,
      acceptsCashDifference: false,
      cashDifferenceDirection: null,
      maxCashDifferenceMinor: null,
    };
    render(<TradeDataPanel trade={noTradeBlock} />);
    expect(screen.getByText('لا')).toBeTruthy();
    expect(screen.queryByText('اتجاه الفرق')).toBeNull();
    expect(screen.queryByText('حد الفرق الأقصى')).toBeNull();
  });

  it('hides sections with no data', () => {
    const minimal: AdTradeBlock = {
      wantedCategoryIds: [],
      wantedDescription: null,
      acceptsCashDifference: false,
      cashDifferenceDirection: null,
      maxCashDifferenceMinor: null,
      estimatedValueMinor: null,
      wantedCondition: null,
    };
    render(<TradeDataPanel trade={minimal} />);
    expect(screen.getByText('بيانات المقايضة')).toBeTruthy();
    expect(screen.queryByText('المطلوب للمقايضة')).toBeNull();
    expect(screen.queryByText('الفئات المقبولة')).toBeNull();
    expect(screen.queryByText('حالة المطلوب')).toBeNull();
    expect(screen.queryByText('القيمة التقديرية')).toBeNull();
  });
});

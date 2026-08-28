import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CampaignStatsDrawer } from './CampaignStatsDrawer';
import type { CampaignDTO } from '@/features/notifications/use-campaigns';

const mockStats = vi.hoisted(() => ({ value: null as unknown }));

vi.mock('@/features/notifications/use-campaign-stats', () => ({
  useCampaignStats: () => ({ data: mockStats.value, isLoading: false, isError: false }),
}));

const campaign = {
  id: 'c1',
  title: 'عروض الصيف',
  type: 'PROMO',
  status: 'SENT',
  targetCountEstimate: 466,
} as CampaignDTO;

describe('CampaignStatsDrawer — why a campaign reached nobody', () => {
  beforeEach(() => {
    mockStats.value = null;
  });

  /**
   * The case that prompted this: 466 targeted, 0 delivered, and the drawer said
   * only "nobody has a registered device" — while 14 devices existed and FCM had
   * rejected their tokens. Those two causes need opposite responses, so
   * conflating them sends someone chasing the wrong problem.
   */
  it('names rejected devices as a separate cause from missing ones', () => {
    mockStats.value = { delivered: 0, opened: 0, ctr: 0, failed: 14, unreachable: 452 };
    render(<CampaignStatsDrawer campaign={campaign} onClose={() => {}} />);

    expect(screen.getByText(/رفضت خدمة الإشعارات/)).toBeInTheDocument();
    expect(screen.getByText(/١٤|14/)).toBeInTheDocument();
    expect(screen.getByText(/ليس لديه جهاز/)).toBeInTheDocument();
  });

  it('does not blame rejected tokens when there were none', () => {
    mockStats.value = { delivered: 0, opened: 0, ctr: 0, failed: 0, unreachable: 300 };
    render(<CampaignStatsDrawer campaign={campaign} onClose={() => {}} />);

    expect(screen.queryByText(/رفضت خدمة الإشعارات/)).not.toBeInTheDocument();
    expect(screen.getByText(/ليس لديه جهاز/)).toBeInTheDocument();
  });

  it('does not claim nobody has a device when every target had one', () => {
    mockStats.value = { delivered: 0, opened: 0, ctr: 0, failed: 20, unreachable: 0 };
    render(<CampaignStatsDrawer campaign={campaign} onClose={() => {}} />);

    expect(screen.getByText(/رفضت خدمة الإشعارات/)).toBeInTheDocument();
    expect(screen.queryByText(/ليس لديه جهاز/)).not.toBeInTheDocument();
  });

  // An older campaign predates the measurement. Inventing a cause would be
  // worse than saying we did not record one.
  it('admits when the reason was never recorded', () => {
    mockStats.value = { delivered: 0, opened: 0, ctr: 0, failed: 0, unreachable: 0 };
    render(<CampaignStatsDrawer campaign={campaign} onClose={() => {}} />);

    expect(screen.getByText(/لم تُسجَّل تفاصيل السبب/)).toBeInTheDocument();
  });

  it('stays quiet when the campaign actually delivered', () => {
    mockStats.value = { delivered: 1840, opened: 1108, ctr: 0.602, failed: 3, unreachable: 10 };
    render(<CampaignStatsDrawer campaign={campaign} onClose={() => {}} />);

    expect(screen.queryByText(/لم يصل هذا الإشعار/)).not.toBeInTheDocument();
  });

  // A scheduled campaign has not been attempted yet; zeros are expected, not
  // a failure, and shouting about them would be wrong.
  it('stays quiet for a campaign that has not been sent', () => {
    mockStats.value = { delivered: 0, opened: 0, ctr: 0, failed: 0, unreachable: 0 };
    render(
      <CampaignStatsDrawer campaign={{ ...campaign, status: 'SCHEDULED' } as CampaignDTO} onClose={() => {}} />
    );

    expect(screen.queryByText(/لم يصل هذا الإشعار/)).not.toBeInTheDocument();
  });
});

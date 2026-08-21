import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { OtpChannelsPanel } from './OtpChannelsPanel';
import type { SystemSettingsDTO, OtpChannelStatus } from '@/features/settings/use-system-settings';

const mockStatus = vi.fn();
vi.mock('@/features/settings/use-system-settings', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useOtpStatus: () => mockStatus(),
}));

const settings = (over: Partial<SystemSettingsDTO> = {}) =>
  ({ otpChannels: ['WHATSAPP'], ...over } as SystemSettingsDTO);

const status = (rows: Partial<OtpChannelStatus>[]) => ({
  data: rows.map((r) => ({
    channel: 'SMS',
    configured: false,
    provider: 'STUB',
    mode: 'STUB',
    ...r,
  })) as OtpChannelStatus[],
  isLoading: false,
  isError: false,
});

describe('OtpChannelsPanel — provider status', () => {
  beforeEach(() => mockStatus.mockReset());

  it('renders the channel toggles from settings', () => {
    mockStatus.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(<OtpChannelsPanel settings={settings()} onChange={() => {}} />);
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });

  it('marks a configured channel as live with its provider name', () => {
    mockStatus.mockReturnValue(
      status([{ channel: 'SMS', configured: true, provider: 'TWILIO', mode: 'LIVE' }]),
    );
    renderWithProviders(
      <OtpChannelsPanel settings={settings({ otpChannels: ['SMS'] })} onChange={() => {}} />,
    );
    expect(screen.getByText('TWILIO')).toBeInTheDocument();
  });

  /**
   * The failure this panel exists to expose: the channel is switched on, so the
   * app offers it to users, but nothing is wired behind it. Previously the
   * adapter logged "sent" and the user waited forever for a code.
   */
  it('warns loudly when an ENABLED channel has no real provider', () => {
    mockStatus.mockReturnValue(status([{ channel: 'SMS', mode: 'STUB' }]));
    renderWithProviders(
      <OtpChannelsPanel settings={settings({ otpChannels: ['SMS'] })} onChange={() => {}} />,
    );
    expect(screen.getByText(/سينتظر رمزاً لن يصل/)).toBeInTheDocument();
    // And it must name what is actually missing, not just say "not configured".
    expect(screen.getByText(/TWILIO_ACCOUNT_SID/)).toBeInTheDocument();
  });

  it('does not warn about a stubbed channel that is switched OFF', () => {
    mockStatus.mockReturnValue(status([{ channel: 'SMS', mode: 'STUB' }]));
    renderWithProviders(
      <OtpChannelsPanel settings={settings({ otpChannels: ['WHATSAPP'] })} onChange={() => {}} />,
    );
    expect(screen.queryByText(/سينتظر رمزاً لن يصل/)).not.toBeInTheDocument();
  });

  it('stays out of the way when the status endpoint is unavailable', () => {
    mockStatus.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithProviders(<OtpChannelsPanel settings={settings()} onChange={() => {}} />);
    expect(screen.queryByText(/حالة مزوّدي الخدمة/)).not.toBeInTheDocument();
  });
});

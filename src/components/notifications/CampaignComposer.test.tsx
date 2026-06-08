import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/render';

const mockCreate = vi.fn().mockResolvedValue({});

vi.mock('@/features/notifications/use-campaign-send', () => ({
  useCreateCampaign: () => ({ mutateAsync: mockCreate, isPending: false }),
}));
vi.mock('@/features/notifications/use-audience-preview', () => ({
  useAudiencePreview: () => ({ data: 1000, isFetching: false }),
}));
vi.mock('@/features/categories/use-categories', () => ({
  useCategories: () => ({ data: { items: [] } }),
}));

import { CampaignComposer } from './CampaignComposer';

function setInput(name: string, value: string) {
  const el = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement;
  fireEvent.change(el, { target: { value } });
}

describe('CampaignComposer', () => {
  beforeEach(() => mockCreate.mockClear());

  it('rejects an empty title and does not persist', async () => {
    renderWithProviders(<CampaignComposer />);
    fireEvent.click(screen.getByText('حفظ كمسودة'));

    expect(await screen.findByText('العنوان من 3 إلى 120 حرفًا')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('persists a draft with action SAVE_DRAFT on valid input', async () => {
    renderWithProviders(<CampaignComposer />);
    setInput('title', 'حملة الصيف الكبرى');
    setInput('body', 'نص الإشعار للحملة التجريبية');
    fireEvent.click(screen.getByText('حفظ كمسودة'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      title: 'حملة الصيف الكبرى',
      body: 'نص الإشعار للحملة التجريبية',
      type: 'PROMO',
      priority: 'NORMAL',
      action: 'SAVE_DRAFT',
      audienceQuery: {},
    });
  });

  it('sends now after confirming the audience estimate', async () => {
    renderWithProviders(<CampaignComposer />);
    setInput('title', 'إشعار فوري للجميع');
    setInput('body', 'محتوى الإشعار الفوري');
    fireEvent.click(screen.getByText('إرسال الآن'));

    // Confirm dialog opens showing the estimate
    expect(await screen.findByText('تأكيد الإرسال')).toBeTruthy();
    // Two "إرسال الآن" now exist (composer button + dialog confirm) — click the dialog's
    const confirmButtons = screen.getAllByText('إرسال الآن');
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0]).toMatchObject({ action: 'SEND_NOW', title: 'إشعار فوري للجميع' });
  });

  it('schedules a campaign for a future time', async () => {
    renderWithProviders(<CampaignComposer />);
    setInput('title', 'حملة مجدولة');
    setInput('body', 'محتوى الحملة المجدولة');
    fireEvent.click(screen.getByText('جدولة لاحقاً'));

    expect(await screen.findByText('جدولة الإرسال')).toBeTruthy();
    const dt = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    fireEvent.change(dt, { target: { value: '2099-01-01T10:00' } });
    fireEvent.click(screen.getByText('جدولة'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0]).toMatchObject({ action: 'SCHEDULE' });
    expect(mockCreate.mock.calls[0][0].scheduledAt).toBeTruthy();
  });
});

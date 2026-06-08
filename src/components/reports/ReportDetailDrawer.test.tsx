import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ReportDetailDrawer } from './ReportDetailDrawer';
import type { ReportDTO } from '@/features/reports/use-reports';

const report: ReportDTO = {
  id: 'report-abc123',
  subjectType: 'USER',
  subjectId: 'user-557788',
  subjectSnapshot: null,
  subjectLabel: 'بائع سيء',
  reporterId: 'u1',
  reporterName: 'هدى',
  type: 'HARASSMENT',
  details: 'سلوك مسيء',
  attachments: [],
  severity: 'HIGH',
  status: 'NEW',
  slaDueAt: '2026-06-03T12:00:00Z',
  slaRemainingSeconds: 7200,
  createdAt: '2026-06-02T00:00:00Z',
  resolvedAt: null,
  resolverId: null,
  resolutionReason: null,
};

const actionMutate = vi.fn((_v, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());

vi.mock('@/features/reports/use-reports', async (orig) => ({
  ...(await orig<typeof import('@/features/reports/use-reports')>()),
  useReportDetail: vi.fn(() => ({ data: report, isLoading: false, isError: false })),
}));

vi.mock('@/features/reports/use-report-actions', () => ({
  useReportActions: vi.fn(() => ({ mutate: actionMutate, isPending: false })),
}));

beforeEach(() => actionMutate.mockClear());

describe('ReportDetailDrawer', () => {
  it('renders report context', () => {
    renderWithProviders(<ReportDetailDrawer report={report} onClose={vi.fn()} />);
    expect(screen.getByText('تحرش')).toBeTruthy(); // type label
    expect(screen.getByText('بائع سيء')).toBeTruthy();
    expect(screen.getByText('هدى')).toBeTruthy();
  });

  it('resolves with a validated reason', () => {
    const onClose = vi.fn();
    renderWithProviders(<ReportDetailDrawer report={report} onClose={onClose} />);
    fireEvent.click(screen.getByText('حل البلاغ'));
    // empty/too-short reason is rejected
    fireEvent.click(screen.getByText('تأكيد الحل'));
    expect(actionMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/يجب ذكر سبب/)).toBeTruthy();
    // valid reason submits
    fireEvent.change(screen.getByPlaceholderText('سبب الحل...'), { target: { value: 'تم حظر المستخدم' } });
    fireEvent.click(screen.getByText('تأكيد الحل'));
    expect(actionMutate).toHaveBeenCalledWith(
      expect.objectContaining({ reportId: 'report-abc123', action: 'resolve', resolutionReason: 'تم حظر المستخدم' }),
      expect.any(Object),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('dismisses with a reason', () => {
    renderWithProviders(<ReportDetailDrawer report={report} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('رفض'));
    fireEvent.change(screen.getByPlaceholderText('سبب الرفض...'), { target: { value: 'بلاغ غير صحيح' } });
    fireEvent.click(screen.getByText('تأكيد الرفض'));
    expect(actionMutate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dismiss', resolutionReason: 'بلاغ غير صحيح' }),
      expect.any(Object),
    );
  });

  it('escalates immediately without a reason', () => {
    renderWithProviders(<ReportDetailDrawer report={report} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('تصعيد'));
    expect(actionMutate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'escalate' }),
      expect.any(Object),
    );
  });
});

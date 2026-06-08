import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { ReportsTable } from './ReportsTable';
import type { ReportDTO } from '@/features/reports/use-reports';

const mockReport: ReportDTO = {
  id: 'report-abc123',
  subjectType: 'AD',
  subjectId: 'ad-998877',
  subjectSnapshot: null,
  subjectLabel: 'آيفون مشبوه',
  reporterId: 'u1',
  reporterName: 'أحمد',
  type: 'SCAM',
  details: 'احتيال',
  attachments: [],
  severity: 'HIGH',
  status: 'NEW',
  slaDueAt: '2026-06-03T12:00:00Z',
  slaRemainingSeconds: -60, // breached
  createdAt: '2026-06-01T00:00:00Z',
  resolvedAt: null,
  resolverId: null,
  resolutionReason: null,
};

vi.mock('@/features/reports/use-reports', async (orig) => ({
  ...(await orig<typeof import('@/features/reports/use-reports')>()),
  useReports: vi.fn(() => ({
    data: { items: [mockReport], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
    isLoading: false,
    isError: false,
  })),
}));

const props = {
  params: { tab: 'OPEN' as const, page: 1 },
  search: '',
  onSearchChange: vi.fn(),
  severity: 'ALL' as const,
  onSeverityChange: vi.fn(),
  onPageChange: vi.fn(),
  onOpen: vi.fn(),
};

describe('ReportsTable', () => {
  it('renders a report row from API data', () => {
    renderWithProviders(<ReportsTable {...props} />);
    expect(screen.getByText('احتيال')).toBeTruthy(); // type label
    expect(screen.getByText('آيفون مشبوه')).toBeTruthy(); // subject label
    expect(screen.getByText('أحمد')).toBeTruthy(); // reporter
    expect(screen.getByText('جديد')).toBeTruthy(); // status chip
  });

  it('highlights breached rows', () => {
    const { container } = renderWithProviders(<ReportsTable {...props} />);
    expect(container.querySelector('tr.bg-red-50\\/60')).toBeTruthy();
  });

  it('calls onSeverityChange when a severity option is clicked', () => {
    const onSeverityChange = vi.fn();
    renderWithProviders(<ReportsTable {...props} onSeverityChange={onSeverityChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'عالية' }));
    expect(onSeverityChange).toHaveBeenCalledWith('HIGH');
  });

  it('calls onOpen when "فتح" is clicked', () => {
    const onOpen = vi.fn();
    renderWithProviders(<ReportsTable {...props} onOpen={onOpen} />);
    fireEvent.click(screen.getByText('فتح'));
    expect(onOpen).toHaveBeenCalledWith(mockReport);
  });

  it('shows empty state when no items', async () => {
    const { useReports } = await import('@/features/reports/use-reports');
    vi.mocked(useReports).mockReturnValueOnce({
      data: { items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useReports>);
    renderWithProviders(<ReportsTable {...props} />);
    expect(screen.getByText('لا توجد بلاغات في هذه القائمة')).toBeTruthy();
  });
});

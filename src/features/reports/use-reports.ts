import { useQuery, useQueries } from '@tanstack/react-query';
import { get, getPaged, type PageMeta } from '@/lib/api/client';

export type ReportTab = 'OPEN' | 'REVIEW' | 'RESOLVED' | 'DISMISSED';
export type ReportSeverity = 'HIGH' | 'MED' | 'LOW';
export type ReportStatus = 'NEW' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
export type ReportSubjectType = 'AD' | 'USER' | 'MESSAGE';

/** Admin report row (API §7.27 ReportDTO, enriched with reporterName + subjectLabel). */
export interface ReportDTO {
  id: string;
  subjectType: ReportSubjectType;
  subjectId: string | null;
  subjectSnapshot: Record<string, unknown> | null;
  subjectLabel: string | null;
  reporterId: string | null;
  reporterName: string | null;
  type: string;
  details: string | null;
  attachments: string[];
  severity: ReportSeverity;
  status: ReportStatus;
  slaDueAt: string | null;
  slaRemainingSeconds: number | null;
  createdAt: string | null;
  resolvedAt: string | null;
  resolverId: string | null;
  resolutionReason: string | null;
}

export interface ReportsKpi {
  today: number;
  olderThan24h: number;
  slaBreach: number;
  avgResolutionHours: number;
  avgResolutionMinutes: number;
}

export interface ReportsListParams {
  tab?: ReportTab;
  severity?: ReportSeverity | 'ALL';
  search?: string;
  page?: number;
}

export function buildReportsQuery(params: ReportsListParams): string {
  const q = new URLSearchParams();
  if (params.tab) q.set('tab', params.tab);
  if (params.severity && params.severity !== 'ALL') q.set('severity', params.severity);
  if (params.search) q.set('search', params.search);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useReports(params: ReportsListParams = {}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => getPaged<ReportDTO>(`/admin/reports${buildReportsQuery(params)}`),
    staleTime: 15_000,
  });
}

export function useReportsKpi() {
  return useQuery({
    queryKey: ['reports', 'kpi'],
    queryFn: () => get<ReportsKpi>('/admin/reports/kpi'),
    staleTime: 30_000,
  });
}

export function useReportDetail(reportId: string | null) {
  return useQuery({
    queryKey: ['reports', 'detail', reportId],
    queryFn: () => get<ReportDTO>(`/admin/reports/${reportId}`),
    enabled: !!reportId,
    staleTime: 10_000,
  });
}

const ALL_TABS: ReportTab[] = ['OPEN', 'REVIEW', 'RESOLVED', 'DISMISSED'];

/** Live per-tab counts from each tab's meta.total. */
export function useReportTabCounts(): Partial<Record<ReportTab, number>> {
  const results = useQueries({
    queries: ALL_TABS.map((tab) => ({
      queryKey: ['reports-count', tab],
      queryFn: () => getPaged<ReportDTO>(`/admin/reports?tab=${tab}`),
      staleTime: 30_000,
    })),
  });
  return Object.fromEntries(
    ALL_TABS.map((tab, i) => [tab, (results[i] as { data?: { meta?: { total?: number } } }).data?.meta?.total]),
  ) as Partial<Record<ReportTab, number>>;
}

export type { PageMeta };

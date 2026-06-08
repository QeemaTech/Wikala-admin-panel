import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { ReportDTO } from './use-reports';

export type ReportAction = 'resolve' | 'dismiss' | 'escalate';

export interface ReportActionPayload {
  reportId: string;
  action: ReportAction;
  resolutionReason?: string;
}

/**
 * Resolve / dismiss / escalate a report
 * (POST /admin/reports/:id/{resolve,dismiss,escalate}).
 * Invalidates the reports list, tab counts, and KPI on success.
 *
 * Resolving a report can act on the reported entity — take down the ad, ban the
 * user — so the ads catalog, moderation views and users list may also change.
 */
export function useReportActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, action, resolutionReason }: ReportActionPayload) =>
      post<ReportDTO>(`/admin/reports/${reportId}/${action}`, resolutionReason ? { resolutionReason } : {}),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['reports-count'] });
      if (data?.id) qc.setQueryData(['reports', 'detail', data.id], data);
      // Cross-feature side effects of a resolution.
      qc.invalidateQueries({ queryKey: ['admin-ads'] });
      qc.invalidateQueries({ queryKey: ['moderation'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

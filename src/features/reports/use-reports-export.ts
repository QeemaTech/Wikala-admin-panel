import { useState, useCallback } from 'react';
import { getPaged } from '@/lib/api/client';
import { exportCsv } from '@/lib/export/csv';
import { buildReportsQuery, type ReportDTO, type ReportsListParams } from './use-reports';
import { reportTypeLabel, SEVERITY_LABEL, STATUS_LABEL, SUBJECT_TYPE_LABEL } from './labels';

const EXPORT_PAGE_SIZE = 50;
const MAX_PAGES = 200; // hard cap (10k rows) so a runaway export can't hang the tab

/** Maps a report to a CSV row keyed by Arabic headers (mirrors the table columns). */
export function reportToCsvRow(r: ReportDTO): Record<string, string> {
  const slaMin = r.slaRemainingSeconds != null ? Math.round(r.slaRemainingSeconds / 60) : null;
  return {
    'رقم البلاغ': r.id,
    'النوع': reportTypeLabel(r.type),
    'المُبلَّغ عنه': r.subjectLabel || (r.subjectId ? `${SUBJECT_TYPE_LABEL[r.subjectType]} #${r.subjectId.slice(-6)}` : '—'),
    'المُبلِّغ': r.reporterName || '—',
    'الخطورة': SEVERITY_LABEL[r.severity],
    'الوقت المتبقي (دقائق)': slaMin == null ? '—' : String(slaMin),
    'الحالة': STATUS_LABEL[r.status],
    'تاريخ الإنشاء': r.createdAt || '',
    'سبب الحل': r.resolutionReason || '',
  };
}

/**
 * Exports the current (filtered) reports list to CSV. Fetches all pages of the
 * active tab + filters, then hands the rows to the shared CSV util (UTF-8 BOM,
 * Arabic headers). Paginated fetch keeps the UI responsive on large exports.
 */
export function useReportsExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportReports = useCallback(async (params: ReportsListParams) => {
    setIsExporting(true);
    try {
      const rows: Record<string, string>[] = [];
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const qs = buildReportsQuery({ ...params, page });
        const sep = qs ? '&' : '?';
        const { items, meta } = await getPaged<ReportDTO>(`/admin/reports${qs}${sep}pageSize=${EXPORT_PAGE_SIZE}`);
        rows.push(...items.map(reportToCsvRow));
        if (page >= (meta.totalPages || 1) || items.length === 0) break;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      exportCsv(rows, `reports-${params.tab?.toLowerCase() ?? 'all'}-${stamp}`);
      return rows.length;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportReports, isExporting };
}

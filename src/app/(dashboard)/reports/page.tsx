'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Tabs } from '@/components/ui/Tabs';
import { Icon } from '@/components/ui/Icon';
import { ReportsKpiStrip } from '@/components/reports/ReportsKpiStrip';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { ReportDetailDrawer } from '@/components/reports/ReportDetailDrawer';
import { useReportTabCounts, type ReportDTO, type ReportTab, type ReportSeverity } from '@/features/reports/use-reports';
import { useReportsExport } from '@/features/reports/use-reports-export';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'OPEN', label: 'بلاغات نشطة' },
  { id: 'REVIEW', label: 'قيد المراجعة' },
  { id: 'RESOLVED', label: 'تم الحل' },
  { id: 'DISMISSED', label: 'مرفوضة' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('OPEN');
  const [severity, setSeverity] = useState<ReportSeverity | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<ReportDTO | null>(null);

  const tabCounts = useReportTabCounts();
  const { exportReports, isExporting } = useReportsExport();

  const params = { tab, severity, search: search || undefined, page };

  const handleTab = (id: string) => { setTab(id as ReportTab); setPage(1); };
  const handleSeverity = (v: ReportSeverity | 'ALL') => { setSeverity(v); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const tabItems = TABS.map((t) => ({ id: t.id, label: t.label, count: tabCounts[t.id] ?? null }));

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="البلاغات"
        sub="التزام SLA: 24–48 ساعة · يتم إبلاغ المُبلّغ عند إتمام المعالجة"
        actions={
          <button
            type="button"
            onClick={() => exportReports(params)}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2 disabled:opacity-50"
          >
            <Icon name="download" size={14} /> {isExporting ? 'جارٍ التصدير...' : 'تصدير CSV'}
          </button>
        }
      />

      <div className="mb-4">
        <ReportsKpiStrip />
      </div>

      <Tabs items={tabItems} value={tab} onChange={handleTab} />

      <ReportsTable
        params={params}
        search={search}
        onSearchChange={handleSearch}
        severity={severity}
        onSeverityChange={handleSeverity}
        onPageChange={setPage}
        onOpen={setActive}
      />

      {active && <ReportDetailDrawer report={active} onClose={() => setActive(null)} />}
    </div>
  );
}

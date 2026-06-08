'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { useReportsKpi } from '@/features/reports/use-reports';

function formatAvg(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د`;
}

/** Reports KPI strip (design: pages-moderation Reports). */
export function ReportsKpiStrip() {
  const { data, isLoading, isError } = useReportsKpi();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[104px] rounded-[var(--radius)] bg-surface" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-8 text-center">
        <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
        <p className="mt-2 text-[12.5px] text-muted">تعذّر تحميل مؤشرات البلاغات</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
      <KpiCard label="بلاغات اليوم" value={data.today} icon={<Icon name="flag" size={18} />} tintColor="#226199" />
      <KpiCard label="بلاغات متبقية > 24س" value={data.olderThan24h} icon={<Icon name="clock" size={18} />} tintColor="#d98a17" />
      <KpiCard label="تخطّت SLA" value={data.slaBreach} icon={<Icon name="alert-triangle" size={18} />} tintColor="#d44030" />
      <KpiCard label="متوسط زمن الحل" value={formatAvg(data.avgResolutionMinutes)} icon={<Icon name="check" size={18} />} tintColor="#1f9c63" />
    </div>
  );
}

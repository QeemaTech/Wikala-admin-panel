'use client';

import { Card } from '@/components/ui/Card';
import { AreaChart } from '@/components/charts/AreaChart';
import { formatNumber } from '@/lib/i18n/format';
import { RANGE_LABEL } from '@/components/analytics/RangeToggle';
import type { AnalyticsUsers, AnalyticsRange } from '@/features/analytics/use-analytics';

/** "YYYY-MM-DD" → "DD/MM" for compact axis labels. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

interface NewVsReturningChartProps {
  data: AnalyticsUsers;
  range: AnalyticsRange;
}

export function NewVsReturningChart({ data, range }: NewVsReturningChartProps) {
  const labels = data.series.map((d) => shortDate(d.date));
  const values = data.series.map((d) => d.newUsers);
  const hasData = data.series.length > 0;

  return (
    <Card title="المستخدمون الجدد مقابل العائدون" sub={RANGE_LABEL[range]}>
      {hasData ? (
        <>
          <AreaChart
            labels={labels}
            values={values}
            height={200}
            color="#226199"
            fill="#226199"
            tooltipLabel="مستخدمون جدد"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-[2px] bg-wk-blue" aria-hidden="true" />
              <b className="text-ink">مستخدمون جدد</b>
              <span className="font-mono text-muted">{formatNumber(data.totals.newUsers)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-[2px] bg-green" aria-hidden="true" />
              <b className="text-ink">عائدون</b>
              <span className="font-mono text-muted">{formatNumber(data.totals.returningUsers)}</span>
            </span>
          </div>
        </>
      ) : (
        <div className="grid h-[200px] place-items-center text-[13px] text-muted">
          لا توجد بيانات لهذه الفترة
        </div>
      )}
    </Card>
  );
}

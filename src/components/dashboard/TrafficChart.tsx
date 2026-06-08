import { AreaChart } from '@/components/charts/AreaChart';
import { Card } from '@/components/ui/Card';
import type { DashboardRange } from '@/features/dashboard/use-dashboard';

const RANGE_LABEL: Record<DashboardRange, string> = {
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يوم',
  '90d': 'آخر 90 يوم',
};

interface TrafficChartProps {
  labels: string[];
  values: number[];
  range: DashboardRange;
}

export function TrafficChart({ labels, values, range }: TrafficChartProps) {
  return (
    <Card
      title="حركة المستخدمين والإعلانات"
      sub={RANGE_LABEL[range]}
      actions={
        <div className="flex items-center gap-1.5 text-[12px] text-muted">
          <i className="inline-block h-2 w-2 rounded-[2px]" style={{ background: '#226199' }} />
          إعلانات جديدة
        </div>
      }
    >
      <AreaChart labels={labels} values={values} height={240} />
    </Card>
  );
}

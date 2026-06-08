import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/lib/i18n/format';
import type { TrustIndicators } from '@/features/dashboard/use-dashboard';

interface SlaCompliance {
  reports7d: number;
  verifications7d: number;
}

interface TrustIndicatorsCardProps {
  indicators: TrustIndicators;
  slaCompliance?: SlaCompliance;
}

const SLA_THRESHOLD = 80;

interface TrustRow {
  label: string;
  value: number;
  color: string;
  delta: number;
  deltaLabel: string;
  deltaPositiveIsGood: boolean;
}

export function TrustIndicatorsCard({ indicators, slaCompliance }: TrustIndicatorsCardProps) {
  const slaAlert =
    slaCompliance &&
    (slaCompliance.reports7d < SLA_THRESHOLD || slaCompliance.verifications7d < SLA_THRESHOLD);

  const d = indicators.deltas ?? { verifiedWeek: 0, premiumWeek: 0, monitoredToday: 0, bannedToday: 0 };

  const rows: TrustRow[] = [
    { label: 'موثَّقون', value: indicators.verified, color: '#1f9c63', delta: d.verifiedWeek, deltaLabel: 'هذا الأسبوع', deltaPositiveIsGood: true },
    { label: 'مميَّزون', value: indicators.premium, color: '#7a4cc4', delta: d.premiumWeek, deltaLabel: 'هذا الأسبوع', deltaPositiveIsGood: true },
    { label: 'تحت المراقبة', value: indicators.monitored, color: '#d98a17', delta: d.monitoredToday, deltaLabel: 'اليوم', deltaPositiveIsGood: false },
    { label: 'محظورون', value: indicators.banned, color: '#d44030', delta: d.bannedToday, deltaLabel: 'اليوم', deltaPositiveIsGood: false },
  ];

  return (
    <Card title="مؤشرات الثقة" sub="توزيع حالات المستخدمين">
      {slaAlert && (
        <div className="mb-3 flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Icon name="alert-triangle" size={14} className="mt-px shrink-0 text-amber-600" />
          <p className="text-[12px] text-amber-700">
            معدل استجابة SLA منخفض — البلاغات {slaCompliance!.reports7d}% · التوثيق{' '}
            {slaCompliance!.verifications7d}% (الحد الأدنى {SLA_THRESHOLD}%)
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => {
          const isGood = row.deltaPositiveIsGood ? row.delta > 0 : row.delta === 0;
          const chipColor = row.deltaPositiveIsGood
            ? (row.delta > 0 ? '#1f9c63' : '#8a98ac')
            : (row.delta > 0 ? '#d98a17' : '#8a98ac');
          return (
            <div
              key={row.label}
              className="rounded-[10px] border px-4 py-3"
              style={{ borderColor: `${row.color}30`, backgroundColor: `${row.color}08` }}
            >
              <p className="font-mono text-[20px] font-bold" style={{ color: row.color }}>
                {formatNumber(row.value)}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">{row.label}</p>
              {row.delta > 0 && (
                <span
                  className="mt-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ backgroundColor: `${chipColor}18`, color: chipColor }}
                >
                  +{formatNumber(row.delta)} {row.deltaLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

import { Card } from '@/components/ui/Card';
import { BarRow } from '@/components/ui/BarRow';
import { formatCurrencyMinor, formatPercent } from '@/lib/i18n/format';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

const PACKAGE_COLORS: Record<string, string> = {
  boost: '#d98a17',
  hot: '#d44030',
  urgent: '#7a4cc4',
  pro: '#226199',
};

function packageColor(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(PACKAGE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return '#226199';
}

interface RevenueCardProps {
  totalMinor: number;
  byPackage: Record<string, number>;
  subscriptions: number;
  deltaVsYesterday?: number | null;
}

export function RevenueCard({ totalMinor, byPackage, subscriptions, deltaVsYesterday }: RevenueCardProps) {
  const packageEntries = Object.entries(byPackage);
  const maxMinor = Math.max(totalMinor, 1);
  const hasDelta = deltaVsYesterday != null && isFinite(deltaVsYesterday);
  const isPositive = hasDelta && deltaVsYesterday >= 0;

  return (
    <Card title="إيرادات اليوم" sub="مقسمة حسب المصدر">
      <div className="space-y-3">
        <div>
          <p className="font-mono text-[32px] font-bold leading-none tracking-[-0.5px] text-ink">
            {formatCurrencyMinor(totalMinor)}
          </p>
          {hasDelta && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  isPositive ? 'bg-green/10 text-green' : 'bg-red/10 text-red',
                )}
              >
                <Icon name={isPositive ? 'arrow-up' : 'arrow-down'} size={10} strokeWidth={2.5} />
                {formatPercent(Math.abs(deltaVsYesterday))}
              </span>
              <span className="text-[11px] text-muted">عن أمس</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {packageEntries.length > 0 ? (
            packageEntries.map(([pkg, amount]) => (
              <BarRow
                key={pkg}
                label={pkg}
                value={amount}
                max={maxMinor}
                color={packageColor(pkg)}
                right={formatCurrencyMinor(amount)}
              />
            ))
          ) : (
            <p className="text-center text-[12.5px] text-muted">لا توجد مبيعات اليوم</p>
          )}
          {subscriptions > 0 && (
            <BarRow
              label="اشتراكات Pro"
              value={subscriptions}
              max={maxMinor}
              color="#226199"
              right={formatCurrencyMinor(subscriptions)}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

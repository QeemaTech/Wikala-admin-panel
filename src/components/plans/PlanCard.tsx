'use client';

import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import { planLabelAr, type AdminPlanDTO } from '@/features/plans/use-plans';

interface PlanCardProps {
  plan: AdminPlanDTO;
  onEdit: (plan: AdminPlanDTO) => void;
  onViewSubscribers: (plan: AdminPlanDTO) => void;
}

const CYCLE_LABEL: Record<string, string> = {
  MONTHLY: 'شهرياً',
  YEARLY: 'سنوياً',
};

function cycleLabel(cycle: string): string {
  return CYCLE_LABEL[cycle] ?? cycle;
}

export function PlanCard({ plan, onEdit, onViewSubscribers }: PlanCardProps) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <h3 className="text-[22px] font-bold text-ink">{plan.name || planLabelAr(plan.plan)}</h3>
            {plan.popular && (
              <Chip tone="amber">
                <Icon name="sparkles" size={11} /> الأكثر طلباً
              </Chip>
            )}
          </div>
          <div className="text-[12px] text-muted">
            {formatNumber(plan.adQuotaTotal)} إعلانات / شهر · {cycleLabel(plan.cycle)}
          </div>
        </div>
        <div className="shrink-0 font-mono text-[32px] font-bold tracking-[-0.5px] text-ink">
          {formatAmountMinor(plan.priceMinor)}
          <span className="text-[13px] font-medium text-muted"> {plan.currency}</span>
        </div>
      </div>

      <div className="my-[18px] grid grid-cols-3 gap-3.5 border-y border-border py-3.5">
        <div>
          <div className="text-[12px] text-muted">المشتركون النشطون</div>
          <div className="font-mono text-[22px] font-bold text-ink">{formatNumber(plan.activeSubscribers)}</div>
        </div>
        <div>
          <div className="text-[12px] text-muted">الإيراد الشهري</div>
          <div className="font-mono text-[22px] font-bold text-ink">
            {formatAmountMinor(plan.mrrMinor)}
            <span className="ms-1 text-[12px] font-medium text-muted">{plan.currency}</span>
          </div>
        </div>
        <div>
          <div className="text-[12px] text-muted">جدد في 7 أيام</div>
          <div className="font-mono text-[22px] font-bold text-green">+{formatNumber(plan.newLast7d)}</div>
        </div>
      </div>

      <div className="mb-2 text-[12px] font-semibold text-muted">المزايا</div>
      <div className="space-y-0.5">
        {plan.advantages.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 py-1 text-[13px] text-ink-2">
            <Icon name="check" size={14} className="shrink-0 text-green" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2"
        >
          <Icon name="pencil" size={13} /> تعديل الخطة
        </button>
        <button
          type="button"
          onClick={() => onViewSubscribers(plan)}
          className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2"
        >
          <Icon name="users" size={13} /> قائمة المشتركين
        </button>
      </div>
    </div>
  );
}

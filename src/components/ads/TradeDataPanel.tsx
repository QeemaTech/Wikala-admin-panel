'use client';

import { Chip } from '@/components/ui/Chip';
import { formatNumber } from '@/lib/i18n/format';
import type { AdTradeBlock } from '@/features/ads/use-ads';

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'جديد',
  PRELOVED: 'مستعمل',
  REFURBISHED: 'مجدد',
  ANY: 'أي حالة',
};

const DIRECTION_LABELS: Record<string, string> = {
  SELLER_PAYS: 'البائع يدفع',
  BUYER_PAYS: 'المشتري يدفع',
  EITHER: 'أي طرف',
};

interface TradeDataPanelProps {
  trade: AdTradeBlock;
}

export function TradeDataPanel({ trade }: TradeDataPanelProps) {
  return (
    <div className="space-y-3 rounded-[10px] border border-border bg-surface p-4" dir="rtl">
      <h4 className="text-[13px] font-semibold text-ink">بيانات المقايضة</h4>

      {trade.wantedDescription && (
        <div>
          <span className="text-[12px] text-muted">المطلوب للمقايضة</span>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/85">{trade.wantedDescription}</p>
        </div>
      )}

      {trade.wantedCategoryIds.length > 0 && (
        <div>
          <span className="text-[12px] text-muted">الفئات المقبولة</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {trade.wantedCategoryIds.map((id) => (
              <Chip key={id} tone="blue">{id.slice(-6)}</Chip>
            ))}
          </div>
        </div>
      )}

      {trade.wantedCondition && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">حالة المطلوب</span>
          <Chip tone="gray">{CONDITION_LABELS[trade.wantedCondition] ?? trade.wantedCondition}</Chip>
        </div>
      )}

      {trade.estimatedValueMinor != null && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">القيمة التقديرية</span>
          <span className="font-mono text-[12.5px] font-semibold text-ink">{formatNumber(Math.round(trade.estimatedValueMinor / 100))} ج.م</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted">يقبل فرق نقدي</span>
        <Chip tone={trade.acceptsCashDifference ? 'green' : 'gray'}>
          {trade.acceptsCashDifference ? 'نعم' : 'لا'}
        </Chip>
      </div>

      {trade.acceptsCashDifference && trade.cashDifferenceDirection && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">اتجاه الفرق</span>
          <span className="text-[12.5px] text-ink">{DIRECTION_LABELS[trade.cashDifferenceDirection] ?? trade.cashDifferenceDirection}</span>
        </div>
      )}

      {trade.acceptsCashDifference && trade.maxCashDifferenceMinor != null && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">حد الفرق الأقصى</span>
          <span className="font-mono text-[12.5px] font-semibold text-ink">{formatNumber(Math.round(trade.maxCashDifferenceMinor / 100))} ج.م</span>
        </div>
      )}
    </div>
  );
}

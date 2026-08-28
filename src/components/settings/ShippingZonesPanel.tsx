'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { GOVERNORATES, GOVERNORATE_LABELS, type Governorate } from '@/lib/constants/enums';
import type { SystemSettingsDTO, DeliveryZone } from '@/features/settings/use-system-settings';

interface ShippingZonesPanelProps {
  settings: SystemSettingsDTO;
  onChange: (patch: Partial<SystemSettingsDTO>) => void;
}

/** Minor units are what the API speaks; humans think in pounds. */
const toMajor = (minor: number | null | undefined) =>
  minor == null ? '' : String(minor / 100);

const toMinor = (major: string): number | null => {
  if (major.trim() === '') return null;
  const n = Number(major);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
};

const feeInput =
  'w-[86px] rounded-[8px] border border-border bg-surface px-2 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-40';

/**
 * Per-governorate delivery pricing.
 *
 * Before this panel the delivery fee was a single number that no screen
 * rendered and no endpoint accepted a change for: altering what a customer paid
 * for shipping meant editing the database by hand. Worse, it was one flat rate
 * for every destination, so Aswan and the next street over cost the same.
 *
 * The table is deliberately opt-in per governorate. Forty-seven rows of
 * mandatory input would be a chore and would go stale; instead every
 * governorate falls back to the default rate until someone gives it its own,
 * and the fallback is shown inline so the effective price is never a mystery.
 */
export function ShippingZonesPanel({ settings, onChange }: ShippingZonesPanelProps) {
  const commerce = settings.commerce;
  const [adding, setAdding] = useState('');

  const zonesByKey = useMemo(
    () => new Map(commerce.deliveryZones.map((z) => [z.governorate, z])),
    [commerce.deliveryZones]
  );

  const patchCommerce = (p: Partial<SystemSettingsDTO['commerce']>) =>
    onChange({ commerce: { ...commerce, ...p } });

  const setZones = (zones: DeliveryZone[]) => patchCommerce({ deliveryZones: zones });

  const updateZone = (governorate: string, p: Partial<DeliveryZone>) =>
    setZones(commerce.deliveryZones.map((z) => (z.governorate === governorate ? { ...z, ...p } : z)));

  const removeZone = (governorate: string) =>
    setZones(commerce.deliveryZones.filter((z) => z.governorate !== governorate));

  const addZone = (governorate: string) => {
    if (!governorate || zonesByKey.has(governorate)) return;
    setZones([
      ...commerce.deliveryZones,
      {
        governorate,
        label: GOVERNORATE_LABELS[governorate as Governorate] ?? governorate,
        // Seeded from the default so the row starts at today's real price
        // rather than a free-delivery zero nobody meant to publish.
        feeMinor: commerce.deliveryFeeMinor,
        freeOverMinor: null,
        enabled: true,
      },
    ]);
    setAdding('');
  };

  const available = GOVERNORATES.filter((g) => !zonesByKey.has(g));
  const disabledCount = commerce.deliveryZones.filter((z) => !z.enabled).length;

  return (
    <Card
      title="أسعار الشحن حسب المحافظة"
      sub="سعر التوصيل الافتراضي، وأسعار خاصة لكل محافظة عند الحاجة"
      pad={false}
    >
      <div className="px-5">
        {/* ── Defaults ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 border-b border-border py-3.5">
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink">سعر التوصيل الافتراضي</div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-muted">
              يُطبَّق على أي محافظة ليس لها سعر خاص في الجدول أدناه
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={toMajor(commerce.deliveryFeeMinor)}
              onChange={(e) => patchCommerce({ deliveryFeeMinor: toMinor(e.target.value) ?? 0 })}
              dir="ltr"
              className={feeInput}
              aria-label="سعر التوصيل الافتراضي"
            />
            <span className="text-[12px] text-muted">ج.م</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-border py-3.5">
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink">شحن مجاني فوق</div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-muted">
              اتركه فارغًا لإلغاء الشحن المجاني — يُحتسب بعد خصم الكوبون
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              placeholder="—"
              value={toMajor(commerce.freeShippingOverMinor)}
              onChange={(e) => patchCommerce({ freeShippingOverMinor: toMinor(e.target.value) })}
              dir="ltr"
              className={feeInput}
              aria-label="شحن مجاني فوق"
            />
            <span className="text-[12px] text-muted">ج.م</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-border py-3.5">
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink">الدفع عند الاستلام</div>
            <div className="mt-0.5 text-[12px] leading-relaxed text-muted">
              عند الإيقاف، لن يتمكن العميل من إتمام الطلب بالدفع عند الاستلام
            </div>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={commerce.codEnabled}
              onChange={(e) => patchCommerce({ codEnabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--brand)]"
              aria-label="الدفع عند الاستلام"
            />
          </label>
        </div>

        {/* ── Per-governorate table ────────────────────────────────── */}
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-[13px] font-medium text-ink">
              أسعار خاصة بالمحافظات
              <span className="ms-2 font-normal text-muted">
                ({commerce.deliveryZones.length} من {GOVERNORATES.length})
              </span>
            </div>
            <select
              value={adding}
              onChange={(e) => addZone(e.target.value)}
              className="rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              aria-label="أضف محافظة"
            >
              <option value="">+ أضف محافظة</option>
              {available.map((g) => (
                <option key={g} value={g}>
                  {GOVERNORATE_LABELS[g]}
                </option>
              ))}
            </select>
          </div>

          {commerce.deliveryZones.length === 0 ? (
            <p className="rounded-[8px] bg-[var(--surface-2,#f7f7f8)] px-3 py-3 text-[12px] leading-relaxed text-muted">
              لا توجد أسعار خاصة — كل المحافظات تُشحن حاليًا بالسعر الافتراضي (
              {toMajor(commerce.deliveryFeeMinor)} ج.م).
            </p>
          ) : (
            <div className="overflow-hidden rounded-[8px] border border-border">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-[var(--surface-2,#f7f7f8)] text-[12px] text-muted">
                    <th className="px-3 py-2 text-start font-medium">المحافظة</th>
                    <th className="px-3 py-2 text-center font-medium">سعر التوصيل</th>
                    <th className="px-3 py-2 text-center font-medium">مجاني فوق</th>
                    <th className="px-3 py-2 text-center font-medium">نخدمها</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {commerce.deliveryZones.map((z) => (
                    <tr key={z.governorate} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-ink">
                        {GOVERNORATE_LABELS[z.governorate as Governorate] ?? z.label ?? z.governorate}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={toMajor(z.feeMinor)}
                          disabled={!z.enabled}
                          onChange={(e) => updateZone(z.governorate, { feeMinor: toMinor(e.target.value) ?? 0 })}
                          dir="ltr"
                          className={feeInput}
                          aria-label={`سعر التوصيل إلى ${z.label}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="—"
                          value={toMajor(z.freeOverMinor)}
                          disabled={!z.enabled}
                          onChange={(e) => updateZone(z.governorate, { freeOverMinor: toMinor(e.target.value) })}
                          dir="ltr"
                          className={feeInput}
                          aria-label={`شحن مجاني إلى ${z.label} فوق`}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={z.enabled}
                          onChange={(e) => updateZone(z.governorate, { enabled: e.target.checked })}
                          className="h-4 w-4 accent-[var(--brand)]"
                          aria-label={`نخدم ${z.label}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeZone(z.governorate)}
                          className="rounded-[6px] p-1 text-muted hover:bg-red/10 hover:text-red"
                          aria-label={`احذف ${z.label}`}
                          title="حذف — ستعود المحافظة للسعر الافتراضي"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Switching a governorate off is a refusal at checkout, not a
              discount, and that is worth stating plainly before someone
              discovers it from a customer complaint. */}
          {disabledCount > 0 && (
            <p className="mt-2 text-[12px] leading-relaxed text-amber-700">
              {disabledCount} محافظة موقوفة — لن يستطيع العملاء هناك إتمام الطلب نهائيًا.
            </p>
          )}

          <p className="py-3.5 text-[12px] leading-relaxed text-muted">
            المحافظات غير المدرجة تُشحن بالسعر الافتراضي. الأسعار بالجنيه ويُطبَّق السعر على
            الطلب كاملًا، لا على كل منتج.
          </p>
        </div>
      </div>
    </Card>
  );
}

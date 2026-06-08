'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { FlashSalesList } from '@/components/flash/FlashSalesList';
import { FlashSaleForm } from '@/components/flash/FlashSaleForm';
import { FlashRulesPanel } from '@/components/flash/FlashRulesPanel';
import { useEndFlashSale, useDeleteFlashSale } from '@/features/flash/use-flash-mutations';
import type { FlashSaleDTO } from '@/features/flash/use-flash-sales';

type FormState = { mode: 'create' } | { mode: 'edit'; flash: FlashSaleDTO } | null;
type ConfirmState = { action: 'end' | 'delete'; flash: FlashSaleDTO } | null;

export default function FlashPage() {
  const [form, setForm] = useState<FormState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const rulesRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="العروض الفلاش"
        sub="عروض محدودة الوقت يعرضها التطبيق على الصفحة الرئيسية مع عدّاد تنازلي"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => rulesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
            >
              <Icon name="cog" size={14} /> قواعد العرض
            </button>
            <button
              type="button"
              onClick={() => setForm({ mode: 'create' })}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
            >
              <Icon name="bolt" size={14} /> إطلاق عرض فلاش
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-start gap-3 rounded-[var(--radius)] border border-wk-blue/20 bg-wk-blue-50 px-4 py-3.5">
        <Icon name="sparkles" size={18} className="mt-0.5 shrink-0 text-wk-blue" />
        <div className="text-[12.5px] leading-relaxed">
          <div className="font-semibold text-ink">كيف تُختار العروض الفلاش؟</div>
          <p className="mt-0.5 text-ink-2">
            يمكن أن يكون مصدر الإعلان: تنسيق إداري من فريق وكالة، أو طلب من بائع يدفع مقابل ظهور إعلانه ضمن العروض.
            حدّد القاعدة الافتراضية من{' '}
            <Link href="/settings" className="font-semibold text-wk-blue hover:underline">إعدادات النظام</Link>.
          </p>
        </div>
      </div>

      <FlashSalesList
        onEdit={(flash) => setForm({ mode: 'edit', flash })}
        onEnd={(flash) => setConfirm({ action: 'end', flash })}
        onDelete={(flash) => setConfirm({ action: 'delete', flash })}
      />

      <div ref={rulesRef} className="mt-4 scroll-mt-6">
        <FlashRulesPanel />
      </div>

      {form?.mode === 'create' && <FlashSaleForm onClose={() => setForm(null)} />}
      {form?.mode === 'edit' && <FlashSaleForm flash={form.flash} onClose={() => setForm(null)} />}
      {confirm && <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function ConfirmDialog({ state, onClose }: { state: NonNullable<ConfirmState>; onClose: () => void }) {
  const end = useEndFlashSale();
  const remove = useDeleteFlashSale();
  const [error, setError] = useState<string | null>(null);
  const isDelete = state.action === 'delete';
  const pending = end.isPending || remove.isPending;

  const confirm = () => {
    setError(null);
    const opts = { onSuccess: onClose, onError: (e: unknown) => setError(e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء.') };
    if (isDelete) remove.mutate(state.flash.id, opts);
    else end.mutate(state.flash.id, opts);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${isDelete ? 'bg-red-50 text-red' : 'bg-amber-50 text-amber'}`}>
            <Icon name={isDelete ? 'trash' : 'x'} size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">{isDelete ? 'حذف العرض' : 'إنهاء العرض'}</h3>
            <p className="text-[12px] text-muted">{state.flash.title}</p>
          </div>
        </div>
        <p className="mb-4 text-[13px] text-ink-2">
          {isDelete ? 'سيُحذف هذا العرض نهائيًا.' : 'سيتوقف عرض هذا العرض في التطبيق فورًا.'} هل أنت متأكد؟
        </p>
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">إلغاء</button>
          <button
            onClick={confirm}
            disabled={pending}
            className={`rounded-[8px] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 ${isDelete ? 'bg-red hover:bg-red/90' : 'bg-amber hover:bg-amber/90'}`}
          >
            {pending ? 'جارٍ...' : isDelete ? 'حذف' : 'إنهاء'}
          </button>
        </div>
      </div>
    </div>
  );
}

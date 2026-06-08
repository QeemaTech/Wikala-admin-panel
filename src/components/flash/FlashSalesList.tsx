'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { formatAmountMinor } from '@/lib/i18n/format';
import { AuctionCountdown } from '@/components/auctions/AuctionCountdown';
import { useFlashSales, stockPercent, type FlashSaleDTO } from '@/features/flash/use-flash-sales';

interface FlashSalesListProps {
  onEdit: (f: FlashSaleDTO) => void;
  onEnd: (f: FlashSaleDTO) => void;
  onDelete: (f: FlashSaleDTO) => void;
}

export function FlashSalesList({ onEdit, onEnd, onDelete }: FlashSalesListProps) {
  const { data, isLoading, isError } = useFlashSales({ status: 'ACTIVE' });
  const items = data?.items ?? [];

  return (
    <Card title="عروض جارية الآن" sub={isLoading ? undefined : `${items.length} عرض نشط`}>
      {isError ? (
        <div className="py-10 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل العروض الفلاش</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-[72px] rounded-[10px] bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="bolt" size={28} className="mx-auto text-muted" />
          <p className="mt-2 text-[13px] text-muted">لا توجد عروض فلاش جارية حاليًا</p>
        </div>
      ) : (
        <div>
          {items.map((f) => (
            <FlashRow key={f.id} flash={f} onEdit={() => onEdit(f)} onEnd={() => onEnd(f)} onDelete={() => onDelete(f)} />
          ))}
        </div>
      )}
    </Card>
  );
}

function FlashRow({
  flash: f,
  onEdit,
  onEnd,
  onDelete,
}: {
  flash: FlashSaleDTO;
  onEdit: () => void;
  onEnd: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pct = stockPercent(f.sold, f.stock);

  return (
    <div className="grid grid-cols-[48px_1fr_200px_auto] items-center gap-4 border-b border-border py-3.5 last:border-0">
      <Thumbnail
        src={f.ad?.coverUrl}
        alt={f.title}
        icon="bolt"
        iconSize={22}
        className="h-12 w-12 rounded-[10px] bg-gradient-to-br from-wk-blue to-[#4d85bc]"
      />

      <div className="min-w-0">
        <div className="truncate text-[14px] font-bold text-ink">{f.title}</div>
        <div className="mt-0.5 text-[12px] text-muted">
          المسؤول: <span className="font-mono" dir="ltr">#{(f.curatorId ?? '').slice(-6) || '—'}</span> · <span className="font-mono" dir="ltr">#{f.id.slice(-6)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px]">
          <span className="text-muted">السعر الأصلي</span>
          <b className="font-mono text-muted line-through">{formatAmountMinor(f.originalPriceMinor)} {f.currency}</b>
          <span className="text-muted">سعر العرض</span>
          <b className="font-mono text-red">{formatAmountMinor(f.salePriceMinor)} {f.currency}</b>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
          <span className="text-muted">تم بيع <b className="text-ink">{f.sold}</b> من {f.stock}</span>
          <b className="font-mono">{pct}%</b>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-red transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AuctionCountdown endTime={f.endsAt} inactive={f.status === 'ENDED'} />
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="إجراءات"
            aria-haspopup="menu"
            aria-expanded={open}
            className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface-2"
          >
            <Icon name="more-v" size={14} />
          </button>
          {open && (
            <>
              <button type="button" aria-label="إغلاق القائمة" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
              <div role="menu" className="absolute end-0 z-20 mt-1 w-36 overflow-hidden rounded-[8px] border border-border bg-white py-1 shadow-lg">
                <button role="menuitem" onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] text-ink hover:bg-surface-2">
                  <Icon name="pencil" size={13} /> تعديل
                </button>
                <button role="menuitem" onClick={() => { setOpen(false); onEnd(); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] text-amber hover:bg-surface-2">
                  <Icon name="x" size={13} /> إنهاء العرض
                </button>
                <button role="menuitem" onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] text-red hover:bg-surface-2">
                  <Icon name="trash" size={13} /> حذف
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

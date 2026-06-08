'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { BannerStats } from './BannerStats';
import { useBanners, SLOT_LABELS, type BannerDTO } from '@/features/banners/use-banners';

const GRADIENTS = [
  'from-[#d98a17] to-[#e8a851]',
  'from-[#7a4cc4] to-[#a37bd9]',
  'from-[#1f9c63] to-[#4dba85]',
  'from-[#226199] to-[#4d85bc]',
  'from-[#5a6679] to-[#8a98ac]',
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[h];
}

interface BannersListProps {
  onEdit: (b: BannerDTO) => void;
  onPublish: (b: BannerDTO) => void;
  onEnd: (b: BannerDTO) => void;
}

export function BannersList({ onEdit, onPublish, onEnd }: BannersListProps) {
  const { data, isLoading, isError } = useBanners();
  const items = data?.items ?? [];
  // Single pass for both counts (lists are small; no memo needed).
  let liveCount = 0;
  let draftCount = 0;
  for (const b of items) {
    if (b.status === 'LIVE') liveCount += 1;
    else if (b.status === 'DRAFT') draftCount += 1;
  }

  return (
    <Card title="بانرات نشطة" sub={isLoading ? undefined : `${liveCount} نشط · ${draftCount} مسودة`}>
      {isError ? (
        <div className="py-10 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل البانرات</p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-[92px] rounded-[10px] bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="image-frame" size={28} className="mx-auto text-muted" />
          <p className="mt-2 text-[13px] text-muted">لا توجد بانرات بعد</p>
        </div>
      ) : (
        <div>
          {items.map((b) => (
            <BannerRow key={b.id} banner={b} onEdit={() => onEdit(b)} onPublish={() => onPublish(b)} onEnd={() => onEnd(b)} />
          ))}
        </div>
      )}
    </Card>
  );
}

function BannerRow({
  banner: b,
  onEdit,
  onPublish,
  onEnd,
}: {
  banner: BannerDTO;
  onEdit: () => void;
  onPublish: () => void;
  onEnd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-0">
      <div className={`flex h-[92px] w-[220px] shrink-0 flex-col justify-between overflow-hidden rounded-[10px] bg-gradient-to-br p-3 ${gradientFor(b.id)}`}>
        {b.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.imageUrl} alt="" className="h-full w-full rounded-[6px] object-cover" onError={() => setImgError(true)} />
        ) : (
          <>
            <h4 className="text-[14px] font-bold text-white">{b.title.split('—')[0].trim()}</h4>
            <span className="w-fit rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">{b.ctaText}</span>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold text-ink">{b.title}</div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-muted">
          <Icon name="location" size={11} /> {SLOT_LABELS[b.slot] ?? b.slot} · <span className="font-mono" dir="ltr">#{b.id.slice(-6)}</span>
        </div>
        <BannerStats banner={b} className="mt-2" />
      </div>

      <div className="flex items-center gap-2">
        {b.status === 'LIVE' ? (
          <Chip tone="green" dot>نشط</Chip>
        ) : b.status === 'DRAFT' ? (
          <Chip tone="gray">مسودة</Chip>
        ) : (
          <Chip tone="gray" dot>منتهٍ</Chip>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-[6px] border border-border px-2.5 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
        >
          <Icon name="pencil" size={12} /> تعديل
        </button>
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
                {b.status === 'DRAFT' && (
                  <button role="menuitem" onClick={() => { setOpen(false); onPublish(); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] text-green hover:bg-surface-2">
                    <Icon name="check" size={13} /> نشر
                  </button>
                )}
                {b.status !== 'ENDED' && (
                  <button role="menuitem" onClick={() => { setOpen(false); onEnd(); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] text-amber hover:bg-surface-2">
                    <Icon name="x" size={13} /> إنهاء
                  </button>
                )}
                <button role="menuitem" onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-[12.5px] text-ink hover:bg-surface-2">
                  <Icon name="pencil" size={13} /> تعديل
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

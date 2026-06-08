'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useSignedUpload } from '@/features/media/use-signed-upload';
import type { MediaContext } from '@/lib/api/media';
import type { AdMediaDTO } from '@/features/ads/use-ads';

/** Pure helper — move an item and renumber `order` (primary image = 0). Exported for tests. */
export function reorderMedia(list: AdMediaDTO[], from: number, to: number): AdMediaDTO[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((m, i) => ({ ...m, order: i }));
}

function thumbOf(m: AdMediaDTO): string | null {
  return m.variants?.thumb || m.variants?.w720 || m.originalUrl || null;
}
function isVideo(m: AdMediaDTO): boolean {
  return (m.mimeType ?? '').startsWith('video');
}

interface MediaGalleryProps {
  value: AdMediaDTO[];
  onChange?: (next: AdMediaDTO[]) => void;
  context?: MediaContext;
  contextId?: string;
  editable?: boolean;
}

export function MediaGallery({ value, onChange, context = 'ADS_MEDIA', contextId, editable = false }: MediaGalleryProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const { upload, isUploading, progress, error } = useSignedUpload();

  const ordered = [...value].sort((a, b) => a.order - b.order);

  const apply = (next: AdMediaDTO[]) => onChange?.(next);

  const handleDrop = (to: number) => {
    if (dragIdx === null) return;
    apply(reorderMedia(ordered, dragIdx, to));
    setDragIdx(null);
  };

  const handleRemove = (idx: number) => {
    apply(ordered.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i })));
    setConfirmIdx(null);
  };

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !contextId) return;
    try {
      const d = await upload(file, { context, contextId });
      apply([
        ...ordered,
        {
          cloudinaryPublicId: d.cloudinaryId,
          originalUrl: d.watermarkedUrl,
          variants: d.variants,
          mimeType: d.mimeType,
          width: d.width,
          height: d.height,
          order: ordered.length,
        },
      ]);
    } catch {
      /* error surfaced via hook state */
    }
  };

  if (!ordered.length && !editable) {
    return <div className="rounded-[10px] border border-dashed border-border bg-surface-2 py-8 text-center text-[12.5px] text-muted">لا توجد وسائط</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {ordered.map((m, idx) => (
          <div
            key={m.id ?? m.cloudinaryPublicId}
            draggable={editable}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => editable && e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-[10px] border border-border bg-surface-2',
              editable && 'cursor-move',
              dragIdx === idx && 'opacity-50',
            )}
          >
            {isVideo(m) ? (
              <video src={m.originalUrl ?? undefined} className="h-full w-full object-cover" muted playsInline />
            ) : thumbOf(m) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbOf(m) as string} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted"><Icon name="image-frame" size={28} /></div>
            )}

            {idx === 0 && (
              <span className="absolute top-1.5 start-1.5 rounded-[6px] bg-wk-blue/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">رئيسية</span>
            )}
            {isVideo(m) && (
              <span className="absolute bottom-1.5 start-1.5 rounded-[6px] bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">فيديو</span>
            )}

            {editable && (
              <button
                type="button"
                aria-label="حذف"
                onClick={() => setConfirmIdx(idx)}
                className="absolute top-1.5 end-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Icon name="trash" size={13} />
              </button>
            )}

            {confirmIdx === idx && (
              <div className="absolute inset-0 grid place-items-center gap-1.5 bg-black/70 p-2 text-center">
                <p className="text-[11px] text-white">حذف هذه الصورة؟</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => handleRemove(idx)} className="rounded-[6px] bg-red px-2 py-1 text-[11px] font-medium text-white">حذف</button>
                  <button type="button" onClick={() => setConfirmIdx(null)} className="rounded-[6px] bg-white/90 px-2 py-1 text-[11px] font-medium text-ink">إلغاء</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {editable && (
          <label className={cn(
            'grid aspect-square cursor-pointer place-items-center gap-1 rounded-[10px] border border-dashed border-border bg-surface-2 text-muted transition-colors hover:border-brand hover:text-brand',
            isUploading && 'pointer-events-none opacity-60',
          )}>
            <Icon name={isUploading ? 'refresh' : 'upload'} size={20} className={isUploading ? 'animate-spin' : undefined} />
            <span className="text-[11px]">{isUploading ? `${progress}%` : 'إضافة'}</span>
            <input type="file" accept="image/*,video/mp4,video/quicktime" className="hidden" onChange={handleAdd} disabled={isUploading} />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-[12px] text-red">{error}</p>}
    </div>
  );
}

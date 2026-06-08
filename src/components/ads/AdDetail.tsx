'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { StatusPill } from '@/components/ui/StatusPill';
import { MediaGallery } from '@/components/media/MediaGallery';
import { MobilePreviewPane } from '@/components/preview/MobilePreviewPane';
import { AdStatusTimeline } from './AdStatusTimeline';
import { AdEditForm } from './AdEditForm';
import { FavoriteBadge } from './FavoriteBadge';
import { useCategoryFields } from '@/features/categories/use-categories';
import { formatNumber } from '@/lib/i18n/format';
import type { AdAdminDTO } from '@/features/ads/use-ads';

interface AdDetailProps {
  ad: AdAdminDTO | null;
  categoryName?: string | null;
  onClose: () => void;
}

export function AdDetail({ ad, categoryName, onClose }: AdDetailProps) {
  const [editing, setEditing] = useState(false);
  const fieldsQuery = useCategoryFields(ad?.categoryId ?? null);

  if (!ad) {
    return (
      <Drawer onClose={onClose}>
        <div className="grid h-full place-items-center text-[13px] text-muted">الإعلان غير موجود</div>
      </Drawer>
    );
  }

  const labelFor = (key: string) =>
    fieldsQuery.data?.items.find((f) => f.key === key)?.label_ar ?? key;
  const cover = ad.media?.find((m) => m.order === 0) ?? ad.media?.[0];
  const coverUrl = cover?.variants?.w720 || cover?.originalUrl || null;
  const price = ad.priceMinor != null ? `${formatNumber(Math.round(ad.priceMinor / 100))} ${ad.currency}` : '—';
  const loc = [ad.governorate, ad.district].filter(Boolean).join(' · ') || '—';
  const dynEntries = Object.entries(ad.dynamicFields ?? {});

  return (
    <Drawer onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <StatusPill status={ad.status} />
          <span className="font-mono text-[12px] text-muted">#{ad.id.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-2">
            <Icon name="pencil" size={14} /> تعديل
          </button>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 overflow-y-auto p-5">
        <div className="space-y-5">
          <div>
            <h2 className="text-[18px] font-bold text-ink">{ad.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {categoryName && <Chip tone="gray">{categoryName}</Chip>}
              <Chip tone="blue">{ad.type}</Chip>
              <span className="font-mono text-[15px] font-bold text-wk-blue">{price}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-muted">
              <span className="inline-flex items-center gap-1" title="المشاهدات">
                <Icon name="eye" size={13} />
                <span className="font-mono text-[12px]">{formatNumber(ad.viewCount)}</span>
              </span>
              <FavoriteBadge count={ad.favCount} />
              <span className="inline-flex items-center gap-1" title="مرات التواصل">
                <Icon name="phone" size={13} />
                <span className="font-mono text-[12px]">{formatNumber(ad.contactCount)}</span>
              </span>
            </div>
          </div>

          <Section title="الوسائط">
            <MediaGallery value={ad.media} />
          </Section>

          <Section title="الوصف">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink/85">{ad.description || '—'}</p>
          </Section>

          {dynEntries.length > 0 && (
            <Section title="الحقول التفصيلية">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {dynEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-2">
                    <dt className="text-[12.5px] text-muted">{labelFor(k)}</dt>
                    <dd className="text-[12.5px] font-medium text-ink">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          <Section title="البائع والموقع">
            <div className="flex items-center gap-2.5">
              <Avatar name={ad.seller?.name ?? 'بائع'} src={ad.seller?.avatarUrl} size={36} />
              <div>
                <div className="text-[13px] font-semibold text-ink">{ad.seller?.name ?? '—'}</div>
                <div className="text-[12px] text-muted">{loc}</div>
              </div>
            </div>
          </Section>

          {(ad.moderation.aiReasons.length > 0 || ad.rejectionReason) && (
            <Section title="تقييم المراجعة الآلية">
              {ad.moderation.aiRiskScore != null && (
                <div className="mb-2 text-[12.5px] text-muted">درجة المخاطرة: <span className="font-mono font-semibold text-ink">{Math.round(ad.moderation.aiRiskScore * 100)}%</span></div>
              )}
              {ad.moderation.aiReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-1 text-[12.5px] text-ink/80">
                  <Icon name="alert-triangle" size={13} color="#d98a17" className="mt-0.5 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
              {ad.rejectionReason && <p className="mt-2 text-[12.5px] text-red">سبب الرفض: {ad.rejectionReason}</p>}
            </Section>
          )}
        </div>

        <div className="space-y-5">
          <Section title="مسار الحالة">
            <AdStatusTimeline status={ad.status} rejectionReason={ad.rejectionReason} publishedAt={ad.publishedAt} expiresAt={ad.expiresAt} />
          </Section>

          <Section title="معاينة الجوال">
            <div className="flex justify-center">
              <MobilePreviewPane scale={0.85}>
                <div className="flex h-full flex-col">
                  <div className="mb-2 aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-surface-2">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt={ad.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-muted"><Icon name="image-frame" size={32} /></div>
                    )}
                  </div>
                  <div className="text-[13px] font-bold text-ink">{ad.title}</div>
                  <div className="mt-1 font-mono text-[14px] font-bold text-wk-blue">{price}</div>
                  <div className="mt-1 text-[11px] text-muted">{loc}</div>
                </div>
              </MobilePreviewPane>
            </div>
          </Section>
        </div>
      </div>

      {editing && (
        <AdEditForm ad={ad} categoryName={categoryName} onClose={() => setEditing(false)} onSuccess={() => setEditing(false)} />
      )}
    </Drawer>
  );
}

function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="flex h-full w-full max-w-[920px] flex-col bg-surface shadow-2xl">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[13px] font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

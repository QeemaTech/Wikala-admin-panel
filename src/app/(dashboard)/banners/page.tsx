'use client';

import { useRef, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { BannersList } from '@/components/banners/BannersList';
import { BannerForm } from '@/components/banners/BannerForm';
import { BannerHomePreview } from '@/components/banners/BannerHomePreview';
import { usePublishBanner, useEndBanner } from '@/features/banners/use-banner-mutations';
import { useBanners, type BannerDTO } from '@/features/banners/use-banners';

type FormState = { mode: 'create' } | { mode: 'edit'; banner: BannerDTO } | null;

export default function BannersPage() {
  const [form, setForm] = useState<FormState>(null);
  const [endFor, setEndFor] = useState<BannerDTO | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const publish = usePublishBanner();
  const previewRef = useRef<HTMLDivElement>(null);

  const onPublish = (banner: BannerDTO) => {
    setActionError(null);
    publish.mutate(banner.id, {
      onError: (e) => setActionError(e instanceof Error ? e.message : 'تعذّر نشر البانر.'),
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="البانرات الترويجية"
        sub="إدارة كاروسيلات الصفحة الرئيسية وصفحات الفئات"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
            >
              <Icon name="eye" size={14} /> معاينة على الجوال
            </button>
            <button
              type="button"
              onClick={() => setForm({ mode: 'create' })}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
            >
              <Icon name="plus" size={14} /> إنشاء بانر
            </button>
          </div>
        }
      />

      {actionError && (
        <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-red/20 bg-red-50 px-4 py-2.5 text-[12.5px] text-red">
          <Icon name="alert-triangle" size={15} /> {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BannersList
            onEdit={(banner) => setForm({ mode: 'edit', banner })}
            onPublish={onPublish}
            onEnd={(banner) => setEndFor(banner)}
          />
        </div>
        <div ref={previewRef} className="scroll-mt-6">
          <HomePreviewCard />
        </div>
      </div>

      {form?.mode === 'create' && <BannerForm onClose={() => setForm(null)} />}
      {form?.mode === 'edit' && <BannerForm banner={form.banner} onClose={() => setForm(null)} />}
      {endFor && <EndBannerDialog banner={endFor} onClose={() => setEndFor(null)} />}
    </div>
  );
}

/** Right column: phone preview of the current top home banner (real data). */
function HomePreviewCard() {
  const { data, isLoading } = useBanners({ live: true });
  const banners = data?.items ?? [];
  const top = banners.find((b) => b.slot === 'HOME_TOP') ?? banners[0] ?? null;

  return (
    <Card title="معاينة الصفحة الرئيسية" sub="ترتيب البانرات الحالي">
      {isLoading ? (
        <div className="mx-auto h-[420px] w-[260px] animate-pulse rounded-[28px] bg-surface" />
      ) : top ? (
        <BannerHomePreview
          title={top.title}
          subtitle={top.subtitle ?? undefined}
          ctaText={top.ctaText}
          imageUrl={top.imageUrl}
          slot={top.slot}
        />
      ) : (
        <div className="py-10 text-center text-[12.5px] text-muted">
          <Icon name="image-frame" size={24} className="mx-auto" />
          <p className="mt-2">لا توجد بانرات نشطة لعرضها</p>
        </div>
      )}
    </Card>
  );
}

function EndBannerDialog({ banner, onClose }: { banner: BannerDTO; onClose: () => void }) {
  const end = useEndBanner();
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    setError(null);
    end.mutate(banner.id, {
      onSuccess: onClose,
      onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر إنهاء البانر.'),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-amber-50 text-amber">
            <Icon name="x" size={20} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">إنهاء البانر</h3>
            <p className="text-[12px] text-muted">{banner.title}</p>
          </div>
        </div>
        <p className="mb-4 text-[13px] text-ink-2">سيتوقف عرض هذا البانر في التطبيق. لا يمكن تعديله بعد الإنهاء.</p>
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">إلغاء</button>
          <button onClick={confirm} disabled={end.isPending} className="rounded-[8px] bg-amber px-4 py-2 text-[13px] font-medium text-white hover:bg-amber/90 disabled:opacity-50">
            {end.isPending ? 'جارٍ...' : 'إنهاء'}
          </button>
        </div>
      </div>
    </div>
  );
}

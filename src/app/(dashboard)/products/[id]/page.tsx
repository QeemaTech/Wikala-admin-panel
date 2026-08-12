'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PageHead } from '@/components/ui/PageHead';
import { StatusPill } from '@/components/ui/StatusPill';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/forms/Field';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductReviewList } from '@/components/products/ProductReviewList';
import { DealCountdown } from '@/components/products/DealCountdown';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  useProduct,
  PLACEMENT_LABELS,
  PRODUCT_STATUSES,
  STATUS_LABELS,
  type ProductStatus,
} from '@/features/products/use-products';
import { useDeleteProduct, useUpdateProduct } from '@/features/products/use-product-mutations';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(BIDI, '');
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border py-2 last:border-0">
      <span className="shrink-0 text-[12px] text-muted">{label}</span>
      <span className="text-start text-[13px] text-ink">{value ?? '—'}</span>
    </div>
  );
}

/**
 * Gallery image with a fallback: the 1080 variant is an eager Cloudinary
 * transform that may not exist for every asset, in which case the thumb — which
 * the list already renders successfully — still does.
 */
function GalleryImage({ url, thumbUrl, alt }: { url: string | null; thumbUrl: string | null; alt: string }) {
  const [src, setSrc] = useState(url ?? thumbUrl);

  useEffect(() => setSrc(url ?? thumbUrl), [url, thumbUrl]);

  if (!src) {
    return (
      <div className="grid aspect-square w-full place-items-center text-muted">
        <Icon name="image-frame" size={28} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setSrc((s) => (s !== thumbUrl ? thumbUrl : null))}
      className="aspect-square w-full object-cover"
    />
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface px-3 py-2.5 text-center">
      <p className={`font-mono text-[16px] font-bold ${tone ?? 'text-ink'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading, isError } = useProduct(id);
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [gallery, setGallery] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = (status: ProductStatus) => {
    setError(null);
    update.mutate(
      { id, payload: { status } },
      { onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر تغيير الحالة.') },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] animate-pulse px-7 pb-14 pt-6">
        <div className="mb-6 h-8 w-64 rounded bg-surface" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-[420px] rounded-[var(--radius)] bg-surface" />
          <div className="h-[420px] rounded-[var(--radius)] bg-surface lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
          <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
          <p className="mt-2 text-[13px] text-muted">تعذّر تحميل المنتج — قد يكون محذوفًا.</p>
          <Link
            href="/products"
            className="mt-3 inline-block rounded-[8px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            العودة إلى المنتجات
          </Link>
        </div>
      </div>
    );
  }

  const images = product.media;
  const active = images[Math.min(gallery, Math.max(0, images.length - 1))];
  const discount =
    product.compareAtPriceMinor && product.compareAtPriceMinor > product.priceMinor
      ? Math.round(
          ((product.compareAtPriceMinor - product.priceMinor) / product.compareAtPriceMinor) * 100,
        )
      : null;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <Link
        href="/products"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink"
      >
        <Icon name="chevron-start" size={13} /> كل المنتجات
      </Link>

      <PageHead
        title={product.title}
        sub={`${product.category?.nameAr ?? '—'} · ${product.slug}`}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={product.status}
              onChange={(e) => changeStatus(e.target.value as ProductStatus)}
              disabled={update.isPending}
              className="w-40"
              aria-label="حالة المنتج"
            >
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
            >
              <Icon name="pencil" size={14} /> تعديل
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="حذف"
              className="grid h-9 w-9 place-items-center rounded-[8px] border border-border text-muted hover:bg-red/10 hover:text-red"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-red/20 bg-red-50 px-4 py-2.5 text-[12.5px] text-red">
          <Icon name="alert-triangle" size={15} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Gallery + headline figures ─────────────────────────────── */}
        <div className="space-y-4">
          <Card title="الصور" sub={`${formatNumber(images.length)} صورة`}>
            {images.length === 0 ? (
              <div className="grid aspect-square place-items-center rounded-[10px] border border-dashed border-border bg-surface-2 text-muted">
                <div className="text-center">
                  <Icon name="image-frame" size={28} className="mx-auto" />
                  <p className="mt-2 text-[12.5px]">لا توجد صور</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-[10px] border border-border bg-surface-2">
                  <GalleryImage
                    url={active?.url ?? null}
                    thumbUrl={active?.thumbUrl ?? null}
                    alt={product.title}
                  />
                </div>
                {images.length > 1 && (
                  <div className="mt-2.5 grid grid-cols-5 gap-2">
                    {images.map((m, i) => (
                      <button
                        key={m.id ?? m.cloudinaryPublicId}
                        type="button"
                        onClick={() => setGallery(i)}
                        aria-label={`صورة ${i + 1}`}
                        className={`overflow-hidden rounded-[8px] border-2 transition-colors ${
                          i === gallery ? 'border-brand' : 'border-transparent hover:border-border'
                        }`}
                      >
                        <Thumbnail
                          src={m.thumbUrl}
                          alt=""
                          icon="image-frame"
                          className="aspect-square w-full bg-surface-2"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>

          <Card title="الأرقام">
            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="المخزون"
                value={formatNumber(product.stock)}
                tone={product.stock === 0 ? 'text-red' : undefined}
              />
              <Stat label="المُباع" value={formatNumber(product.sold)} />
              <Stat
                label="التقييم"
                value={product.ratingAvg == null ? '—' : product.ratingAvg.toFixed(1)}
              />
            </div>
            {product.stock === 0 && (
              <p className="mt-2.5 rounded-[8px] bg-red-50 px-3 py-2 text-[12px] text-red">
                نفدت الكمية — لن يتمكن المشترون من إتمام الطلب حتى تُحدَّث الكمية.
              </p>
            )}
          </Card>
        </div>

        {/* ── Details ────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="التسعير والعرض">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[26px] font-bold leading-none text-ink">
                {formatAmountMinor(product.priceMinor)}
                <span className="ms-1.5 text-[13px] font-normal text-muted">{product.currency}</span>
              </span>
              {product.compareAtPriceMinor != null && (
                <span className="font-mono text-[15px] text-muted line-through">
                  {formatAmountMinor(product.compareAtPriceMinor)}
                </span>
              )}
              {discount != null && <Chip tone="green">خصم {formatNumber(discount)}٪</Chip>}
              <StatusPill status={product.status} />
              {product.badgeText && <Chip tone="amber">{product.badgeText}</Chip>}
            </div>

            <Row
              label="مكان العرض"
              value={
                product.placement === 'NONE' ? (
                  <span className="text-muted">لا يظهر في العروض</span>
                ) : (
                  <Chip tone={product.placement === 'FLASH' ? 'amber' : 'violet'}>
                    {PLACEMENT_LABELS[product.placement]}
                  </Chip>
                )
              }
            />
            {product.placement !== 'NONE' && (
              <>
                <Row label="يبدأ العرض" value={fmtDateTime(product.dealStartsAt)} />
                <Row
                  label="ينتهي العرض"
                  value={
                    product.dealEndsAt ? (
                      <span className="flex items-center gap-2">
                        {fmtDateTime(product.dealEndsAt)}
                        <DealCountdown endsAt={product.dealEndsAt} />
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
              </>
            )}
            <Row label="رمز المنتج (SKU)" value={product.sku ? <span className="font-mono">{product.sku}</span> : '—'} />
            <Row
              label="الوزن"
              value={product.weightGrams ? `${formatNumber(product.weightGrams)} جم` : '—'}
            />
            <Row label="أُضيف في" value={fmtDateTime(product.createdAt)} />
          </Card>

          {product.description && (
            <Card title="الوصف">
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-2">
                {product.description}
              </p>
            </Card>
          )}

          <Card
            title="المواصفات"
            sub="تُعرض في صفحة المنتج بالتطبيق — تُدار من حقول الفئة"
          >
            {product.specs.length === 0 ? (
              <p className="py-3 text-[13px] text-muted">
                لا توجد مواصفات — أضِف حقولًا للفئة من صفحة الفئات والأقسام، ثم عبّئها من زر التعديل.
              </p>
            ) : (
              <div className="overflow-hidden rounded-[10px] border border-border">
                <table className="w-full text-[12.5px]">
                  <tbody>
                    {product.specs.map((s) => (
                      <tr key={s.key} className="border-b border-border last:border-0">
                        <td className="w-1/3 bg-surface px-3 py-2 text-muted">{s.labelAr}</td>
                        <td className="px-3 py-2 text-ink">{String(s.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="التقييمات"
            sub={
              product.reviewCount > 0
                ? `${formatNumber(product.reviewCount)} تقييم منشور`
                : 'لا توجد تقييمات منشورة بعد'
            }
          >
            <ProductReviewList productId={product.id} />
          </Card>
        </div>
      </div>

      {editing && <ProductForm productId={product.id} onClose={() => setEditing(false)} />}

      {confirmDelete && (
        <ConfirmDialog
          title="حذف المنتج"
          message={`سيُخفى «${product.title}» من التطبيق. الطلبات السابقة تحتفظ بنسخة من بياناته.`}
          confirmLabel="حذف"
          loading={remove.isPending}
          error={error}
          onConfirm={() =>
            remove.mutate(product.id, {
              onSuccess: () => router.push('/products'),
              onError: (e) =>
                setError(e instanceof Error ? e.message : 'تعذّر حذف المنتج.'),
            })
          }
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

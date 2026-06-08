'use client';

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import { HAS_MAPS_KEY, MAPS_API_KEY, MAPS_LIBRARIES } from '@/lib/maps';
import { StoreLogo, storeBannerStyle } from './StoreLogo';
import { useStore, useStoreAds, type StoreAd, type StoreDTO } from '@/features/stores/use-stores';

function adThumb(ad: StoreAd): string | null {
  const m = ad.media?.[0];
  return m?.variants?.w720 ?? m?.variants?.thumb ?? m?.original_url ?? null;
}

function Stat({ icon, label, value }: { icon: 'eye' | 'heart' | 'phone' | 'shopping-bag'; label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-2 px-3 py-2.5 text-center">
      <Icon name={icon} size={15} className="mx-auto text-muted" />
      <div className="mt-1 font-mono text-[15px] font-bold text-ink">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}

function BranchesMap({ store }: { store: StoreDTO }) {
  const points = store.branches.filter((b) => b.location).map((b) => ({ id: b.id, ...b.location! }));
  const { isLoaded } = useJsApiLoader({
    id: 'wikala-google-maps',
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
    language: 'ar',
    region: 'EG',
  });

  if (!HAS_MAPS_KEY || points.length === 0) {
    return (
      <div className="grid h-[200px] place-items-center rounded-[10px] border border-border bg-surface-2 text-[12.5px] text-muted">
        {points.length === 0 ? 'لا توجد فروع بموقع محدد' : 'الخريطة غير متاحة'}
      </div>
    );
  }
  if (!isLoaded) {
    return <div className="h-[200px] animate-pulse rounded-[10px] bg-surface-2" />;
  }
  return (
    <div className="overflow-hidden rounded-[10px] border border-border">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 200 }}
        center={points[0]}
        zoom={points.length > 1 ? 6 : 11}
        options={{ disableDefaultUI: true, gestureHandling: 'cooperative' }}
      >
        {points.map((p) => (
          <MarkerF key={p.id} position={{ lat: p.lat, lng: p.lng }} />
        ))}
      </GoogleMap>
    </div>
  );
}

interface StoreDetailProps {
  storeId: string;
  onClose: () => void;
}

export function StoreDetail({ storeId, onClose }: StoreDetailProps) {
  const { data: store, isLoading, isError } = useStore(storeId);
  const { data: ads, isLoading: adsLoading } = useStoreAds(store?.slug ?? null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[12px] bg-white shadow-xl">
        {isError ? (
          <div className="p-10 text-center text-[13px] text-red">تعذّر تحميل المتجر</div>
        ) : isLoading || !store ? (
          <div className="h-[400px] animate-pulse rounded-[12px] bg-surface" />
        ) : (
          <>
            <div className="relative h-[120px] rounded-t-[12px]" style={storeBannerStyle(store.bannerUrl)}>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink hover:bg-white">
                <Icon name="x" size={16} />
              </button>
              {store.premiumActive && (
                <div className="absolute start-4 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-violet">
                  <Icon name="crown" size={12} /> Premium
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-start gap-3">
                <StoreLogo name={store.name} logoUrl={store.logoUrl} className="-mt-10 h-16 w-16 shrink-0 text-[20px]" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-bold text-ink">{store.name}</h2>
                  {store.bio && <p className="mt-0.5 text-[12.5px] text-muted">{store.bio}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {store.categoryNames.map((c) => (
                      <Chip key={c} tone="gray">{c}</Chip>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2.5">
                <Stat icon="eye" label="الزيارات" value={formatNumber(store.stats.views)} />
                <Stat icon="heart" label="الإعجابات" value={formatNumber(store.stats.likes)} />
                <Stat icon="phone" label="تواصل" value={formatNumber(store.stats.contacted)} />
                <Stat icon="shopping-bag" label="إعلانات" value={formatNumber(store.adsCount)} />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[12px] font-medium text-muted">الفروع ({store.branches.length})</p>
                <BranchesMap store={store} />
                {store.branches.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {store.branches.map((b) => (
                      <li key={b.id} className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                        <Icon name="location" size={12} className="text-muted" />
                        <b className="text-ink">{b.name}</b> — {b.addressText}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[12px] font-medium text-muted">أحدث الإعلانات</p>
                {adsLoading ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-[120px] animate-pulse rounded-[10px] bg-surface-2" />
                    ))}
                  </div>
                ) : !ads || ads.length === 0 ? (
                  <p className="rounded-[8px] bg-surface-2 p-3 text-[12.5px] text-muted">لا توجد إعلانات نشطة</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {ads.slice(0, 6).map((ad) => {
                      const thumb = adThumb(ad);
                      return (
                        <div key={ad._id} className="overflow-hidden rounded-[10px] border border-border">
                          <div className="aspect-[4/3] bg-surface-2">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center text-muted"><Icon name="image-frame" size={20} /></div>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="truncate text-[12px] font-medium text-ink">{ad.title}</div>
                            <div className="mt-0.5 font-mono text-[11.5px] text-muted">
                              {ad.price_minor != null ? `${formatAmountMinor(ad.price_minor)} ${ad.currency}` : '—'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

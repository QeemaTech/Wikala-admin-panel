'use client';

import { useCallback, useRef, useState } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatNumber } from '@/lib/i18n/format';
import {
  DEFAULT_ZOOM,
  EGYPT_CENTER,
  HAS_MAPS_KEY,
  MAPS_API_KEY,
  MAPS_LIBRARIES,
} from '@/lib/maps';
import { useMapAds, type MapBounds, type MapPin } from '@/features/map/use-map-ads';
import { EMPTY_FILTERS, type SearchFilters } from '@/features/search/use-search-filters';

interface AdLocationMapProps {
  /** Search filters applied to the bbox query (e.g. category-scoped). */
  filters?: SearchFilters;
  /** Called when a pin's summary popover "view" action is used. */
  onSelectAd?: (adId: string) => void;
  height?: number;
  className?: string;
}

const containerStyle = (height: number) => ({ width: '100%', height: `${height}px` });

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  // RTL-aware: keep zoom control on the inline-start side for Arabic.
  zoomControlOptions: { position: 7 /* LEFT_CENTER */ },
};

function fmtPrice(minor: number | null, currency: string): string {
  if (minor == null) return 'السعر عند التواصل';
  return `${formatNumber(Math.round(minor / 100))} ${currency}`;
}

/**
 * Google Maps widget plotting ad locations from `GET /map/bbox`. Server-side
 * clustering kicks in at low zoom; panning/zooming refetches via the map's
 * `idle` event. Pins open a small summary popover. Renders a graceful fallback
 * when the Maps API key is not provisioned.
 */
export function AdLocationMap({
  filters = EMPTY_FILTERS,
  onSelectAd,
  height = 420,
  className,
}: AdLocationMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'wikala-google-maps',
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
    language: 'ar',
    region: 'EG',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [activePin, setActivePin] = useState<MapPin | null>(null);

  const { data, isFetching } = useMapAds(bounds, zoom, filters);

  const syncViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const z = map.getZoom();
    if (!b || z == null) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    setZoom(z);
    setBounds({ neLat: ne.lat(), neLng: ne.lng(), swLat: sw.lat(), swLng: sw.lng() });
  }, []);

  // ── No-key fallback ───────────────────────────────────────────────────────
  if (!HAS_MAPS_KEY) {
    return (
      <FallbackPanel
        className={className}
        height={height}
        icon="map"
        title="الخريطة غير مُفعّلة"
        message="لم يتم ضبط مفتاح Google Maps. أضف NEXT_PUBLIC_GOOGLE_MAPS_API_KEY لعرض مواقع الإعلانات."
      />
    );
  }

  if (loadError) {
    return (
      <FallbackPanel
        className={className}
        height={height}
        icon="alert-triangle"
        title="تعذّر تحميل الخريطة"
        message="حدث خطأ أثناء تحميل Google Maps. تحقّق من المفتاح والاتصال."
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={className}
        style={containerStyle(height)}
      >
        <div className="h-full w-full animate-pulse rounded-[12px] border border-border bg-surface-2" />
      </div>
    );
  }

  const pins = data?.items ?? [];
  const clusters = data?.clusters ?? [];

  return (
    <div className={`relative overflow-hidden rounded-[12px] border border-border ${className ?? ''}`}>
      <GoogleMap
        mapContainerStyle={containerStyle(height)}
        center={EGYPT_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={(map) => { mapRef.current = map; }}
        onUnmount={() => { mapRef.current = null; }}
        onIdle={syncViewport}
      >
        {/* Server-side clusters (low zoom) */}
        {clusters.map((c) => (
          <MarkerF
            key={c.geohash}
            position={{ lat: c.lat, lng: c.lng }}
            label={{
              text: formatNumber(c.count),
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700',
            }}
            icon={{
              path: 0 /* CIRCLE */,
              scale: Math.min(26, 12 + Math.log2(c.count + 1) * 3),
              fillColor: '#226199',
              fillOpacity: 0.92,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            onClick={() => {
              const map = mapRef.current;
              if (map) {
                map.panTo({ lat: c.lat, lng: c.lng });
                map.setZoom(Math.min(14, (map.getZoom() ?? DEFAULT_ZOOM) + 2));
              }
            }}
          />
        ))}

        {/* Individual pins (high zoom) */}
        {pins.map((p) => (
          <MarkerF
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setActivePin(p)}
          />
        ))}

        {activePin && (
          <InfoWindowF
            position={{ lat: activePin.lat, lng: activePin.lng }}
            onCloseClick={() => setActivePin(null)}
          >
            <div dir="rtl" className="min-w-[150px] space-y-1 p-0.5 text-right">
              <div className="font-mono text-[13px] font-bold text-wk-blue">
                {fmtPrice(activePin.priceMinor, activePin.currency)}
              </div>
              <div className="font-mono text-[11px] text-muted">#{activePin.id.slice(-6)}</div>
              {onSelectAd && (
                <button
                  type="button"
                  onClick={() => onSelectAd(activePin.id)}
                  className="mt-1 w-full rounded-[6px] bg-brand px-2 py-1 text-[12px] font-medium text-white hover:bg-brand-700"
                >
                  عرض الإعلان
                </button>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {data?.meta?.truncated && (
        <div className="absolute bottom-2 start-2 rounded-[8px] bg-[rgba(13,42,68,.85)] px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
          عدد كبير من النتائج — قرّب للعرض الكامل
        </div>
      )}
      {isFetching && (
        <div className="absolute top-2 end-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] text-muted shadow-sm">
          جارٍ التحديث…
        </div>
      )}
    </div>
  );
}

function FallbackPanel({
  icon,
  title,
  message,
  height,
  className,
}: {
  icon: IconName;
  title: string;
  message: string;
  height: number;
  className?: string;
}) {
  return (
    <div
      className={`grid place-items-center rounded-[12px] border border-dashed border-border bg-surface-2 px-6 text-center ${className ?? ''}`}
      style={{ height: `${height}px` }}
    >
      <div className="max-w-xs space-y-2">
        <Icon name={icon} size={30} className="mx-auto text-muted" />
        <h4 className="text-[13.5px] font-semibold text-ink">{title}</h4>
        <p className="text-[12px] leading-relaxed text-muted">{message}</p>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Icon } from '@/components/ui/Icon';
import {
  DEFAULT_ZOOM,
  EGYPT_CENTER,
  HAS_MAPS_KEY,
  MAPS_API_KEY,
  MAPS_LIBRARIES,
} from '@/lib/maps';

/** GeoJSON Point + reverse-geocoded Arabic place names emitted by the picker. */
export interface PickedLocation {
  lat: number;
  lng: number;
  point: { type: 'Point'; coordinates: [number, number] };
  governorate: string | null;
  district: string | null;
}

interface LocationPickerProps {
  /** Existing location to pre-populate (GeoJSON-style lng/lat). */
  value?: { lat: number; lng: number } | null;
  onChange: (loc: PickedLocation) => void;
  height?: number;
  className?: string;
}

function toPicked(
  lat: number,
  lng: number,
  governorate: string | null = null,
  district: string | null = null,
): PickedLocation {
  return { lat, lng, point: { type: 'Point', coordinates: [lng, lat] }, governorate, district };
}

export function LocationPicker({ value, onChange, height = 360, className }: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'wikala-google-maps',
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
    language: 'ar',
    region: 'EG',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(value ?? null);
  const [place, setPlace] = useState<{ governorate: string | null; district: string | null }>({
    governorate: null,
    district: null,
  });
  const [geocoding, setGeocoding] = useState(false);

  // Reverse-geocode a dropped point to Arabic governorate/district names.
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoderRef.current && isLoaded) geocoderRef.current = new google.maps.Geocoder();
    const geocoder = geocoderRef.current;
    if (!geocoder) {
      onChange(toPicked(lat, lng));
      return;
    }
    setGeocoding(true);
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      if (status !== 'OK' || !results?.length) {
        setPlace({ governorate: null, district: null });
        onChange(toPicked(lat, lng));
        return;
      }
      const comps = results[0].address_components;
      const find = (type: string) =>
        comps.find((c) => c.types.includes(type))?.long_name ?? null;
      const governorate = find('administrative_area_level_1');
      const district =
        find('administrative_area_level_2') ?? find('locality') ?? find('sublocality') ?? null;
      setPlace({ governorate, district });
      onChange(toPicked(lat, lng, governorate, district));
    });
  }, [isLoaded, onChange]);

  const apply = useCallback((lat: number, lng: number) => {
    setPos({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Sync incoming value (e.g. when the host form loads an existing record).
  useEffect(() => {
    if (value && (value.lat !== pos?.lat || value.lng !== pos?.lng)) {
      setPos(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // ── Keyboard-accessible coordinate inputs (work with or without the map) ────
  const coordInputs = (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-[12px] text-muted">
        خط العرض (Lat)
        <input
          type="number"
          step="0.000001"
          value={pos?.lat ?? ''}
          onChange={(e) => {
            const lat = Number(e.target.value);
            if (!Number.isNaN(lat) && pos) apply(lat, pos.lng);
            else if (!Number.isNaN(lat)) apply(lat, EGYPT_CENTER.lng);
          }}
          className="mt-1 block w-36 rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-ink outline-none focus:border-brand"
        />
      </label>
      <label className="text-[12px] text-muted">
        خط الطول (Lng)
        <input
          type="number"
          step="0.000001"
          value={pos?.lng ?? ''}
          onChange={(e) => {
            const lng = Number(e.target.value);
            if (!Number.isNaN(lng) && pos) apply(pos.lat, lng);
            else if (!Number.isNaN(lng)) apply(EGYPT_CENTER.lat, lng);
          }}
          className="mt-1 block w-36 rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-ink outline-none focus:border-brand"
        />
      </label>
      <div className="flex-1 text-[12px]">
        {geocoding ? (
          <span className="text-muted">جارٍ تحديد الموقع…</span>
        ) : place.governorate || place.district ? (
          <span className="text-ink">
            <Icon name="location" size={12} className="ms-1 inline text-brand" />
            {[place.governorate, place.district].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!HAS_MAPS_KEY || loadError) {
    return (
      <div className={`space-y-3 ${className ?? ''}`}>
        <div
          className="grid place-items-center rounded-[12px] border border-dashed border-border bg-surface-2 px-6 text-center"
          style={{ height: `${Math.min(height, 160)}px` }}
        >
          <div className="max-w-xs space-y-1.5">
            <Icon name="map" size={26} className="mx-auto text-muted" />
            <p className="text-[12px] text-muted">
              {loadError ? 'تعذّر تحميل الخريطة.' : 'الخريطة غير مُفعّلة — أدخل الإحداثيات يدويًا.'}
            </p>
          </div>
        </div>
        {coordInputs}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={className} style={{ height: `${height}px` }}>
        <div className="h-full w-full animate-pulse rounded-[12px] border border-border bg-surface-2" />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <div className="overflow-hidden rounded-[12px] border border-border">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: `${height}px` }}
          center={pos ?? EGYPT_CENTER}
          zoom={pos ? 13 : DEFAULT_ZOOM}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          }}
          onLoad={(map) => { mapRef.current = map; }}
          onUnmount={() => { mapRef.current = null; }}
          onClick={(e) => {
            if (e.latLng) apply(e.latLng.lat(), e.latLng.lng());
          }}
        >
          {pos && (
            <MarkerF
              position={pos}
              draggable
              onDragEnd={(e) => {
                if (e.latLng) apply(e.latLng.lat(), e.latLng.lng());
              }}
            />
          )}
        </GoogleMap>
      </div>
      {coordInputs}
    </div>
  );
}

'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { composeSearchQuery, EMPTY_FILTERS, type SearchFilters } from '@/features/search/use-search-filters';

export interface MapBounds {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
}

export interface MapPin {
  id: string;
  slug: string;
  lng: number;
  lat: number;
  priceMinor: number | null;
  currency: string;
}

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  geohash: string;
}

/** `GET /map/bbox` returns pins by default, or clusters when `cluster=true`. */
export interface MapBboxResponse {
  items?: MapPin[];
  clusters?: MapCluster[];
  meta: { truncated: boolean };
}

/** Below this zoom we request server-side clusters; at/above it, individual pins. */
export const CLUSTER_ZOOM_THRESHOLD = 11;

function boundsQuery(b: MapBounds, zoom: number, filters: SearchFilters): string {
  const cluster = zoom < CLUSTER_ZOOM_THRESHOLD;
  const extra: Record<string, string | number> = {
    neLat: b.neLat,
    neLng: b.neLng,
    swLat: b.swLat,
    swLng: b.swLng,
  };
  if (cluster) {
    extra.cluster = 'true';
    extra.zoom = Math.round(zoom);
  }
  return composeSearchQuery(filters, extra);
}

/**
 * Fetches ad-location pins (or server-side clusters) for the current map
 * viewport. Refetches whenever bounds, zoom, or filters change — wire this to
 * the map's `idle` event so panning/zooming refreshes the data. Disabled until
 * real bounds are available (avoids a bogus initial request).
 */
export function useMapAds(
  bounds: MapBounds | null,
  zoom: number,
  filters: SearchFilters = EMPTY_FILTERS,
) {
  const qs = bounds ? boundsQuery(bounds, zoom, filters) : '';
  return useQuery({
    queryKey: ['map-bbox', qs],
    queryFn: () => get<MapBboxResponse>(`/map/bbox?${qs}`),
    enabled: !!bounds,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

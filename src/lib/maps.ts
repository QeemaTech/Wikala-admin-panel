import type { Libraries } from '@react-google-maps/api';

/** Google Maps JS API key (browser). Provisioned via env — see Week 6 live-test
 *  guide. When absent, map widgets render a graceful no-key fallback. */
export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const HAS_MAPS_KEY = MAPS_API_KEY.length > 0;

/** Stable libraries array — `useJsApiLoader` requires referential stability.
 *  `geocoding` powers the reverse-geocode in the location picker. */
export const MAPS_LIBRARIES: Libraries = ['geocoding'];

/** Map defaults centered on Egypt (Cairo) for the MENA market. */
export const EGYPT_CENTER = { lat: 30.0444, lng: 31.2357 };
export const DEFAULT_ZOOM = 6;

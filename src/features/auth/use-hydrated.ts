'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from './auth-store';

/**
 * True once zustand's `persist` has read the session back out of localStorage.
 *
 * On a hard page load the store starts empty and rehydrates asynchronously, so
 * anything that redirects on `!accessToken` has to wait for this — otherwise the
 * first render of a deep link looks logged-out and bounces the user away from
 * the page they actually asked for.
 */
export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    // Fires only for hydrations that finish after this subscribes; the initial
    // state above covers the case where it already completed.
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}

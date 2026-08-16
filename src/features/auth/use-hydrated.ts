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
  // Always starts false so the prerendered markup and the client's first render
  // agree — reading the real value up front makes them differ on a signed-in
  // reload and trips a hydration mismatch.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = useAuthStore.persist;
    // `persist` is missing during prerender: `createJSONStorage` returns
    // undefined when there is no localStorage, and zustand's persist middleware
    // then skips attaching its API altogether. Treat that as settled instead of
    // waiting for a rehydration that will never fire.
    if (!store) {
      setHydrated(true);
      return;
    }
    // Fires only for hydrations finishing after this subscribes; the direct
    // check below covers one that already completed.
    const unsub = store.onFinishHydration(() => setHydrated(true));
    if (store.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}

import { useEffect, useRef } from 'react';
import { getAdminSocket } from './admin-socket';

/**
 * Subscribes to a Socket.IO event on the /admin namespace.
 * Stable handler ref prevents duplicate listeners on re-renders.
 * Cleans up on unmount.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const sock = getAdminSocket();
    const listener = (data: T) => handlerRef.current(data);
    sock.on(event, listener);
    return () => {
      sock.off(event, listener);
    };
  }, [event]);
}

import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/auth-store';
import { resolveApiBaseUrl } from '@/lib/api/base-url';

function baseHost(): string {
  try {
    return new URL(resolveApiBaseUrl()).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

let adminSocket: Socket | null = null;

export function getAdminSocket(): Socket {
  if (adminSocket?.connected) return adminSocket;

  adminSocket?.disconnect();

  const { accessToken } = useAuthStore.getState();
  adminSocket = io(`${baseHost()}/admin`, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    reconnectionAttempts: Infinity,
  });

  return adminSocket;
}

export function disconnectAdminSocket(): void {
  adminSocket?.disconnect();
  adminSocket = null;
}

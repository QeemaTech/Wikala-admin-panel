import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/auth-store';

function baseHost(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  try {
    return new URL(url).origin;
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

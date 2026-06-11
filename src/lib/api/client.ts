import { ApiError } from './errors';
import { useAuthStore } from '@/features/auth/auth-store';
import { resolveApiBaseUrl } from './base-url';

const BASE = resolveApiBaseUrl();

function buildHeaders(token?: string | null, write = false): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': 'ar',
    'X-Request-Id': crypto.randomUUID(),
    'X-Platform': 'web-admin',
  };
  if (write) h['X-Idempotency-Key'] = crypto.randomUUID();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function parseError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({})) as { error?: { code?: string; message?: string; details?: unknown } };
  return new ApiError(
    body.error?.code ?? 'UNKNOWN',
    body.error?.message ?? 'Request failed',
    res.status,
    body.error?.details,
  );
}

async function tryRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE}/admin/auth/refresh`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { logout(); return null; }
    const { data } = await res.json() as { data: { accessToken: string; refreshToken: string } };
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    logout();
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, write = false): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  let headers = buildHeaders(accessToken, write);

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && accessToken) {
    const newToken = await tryRefresh();
    if (!newToken) throw new ApiError('UNAUTHORIZED', 'انتهت صلاحية الجلسة', 401);
    headers = buildHeaders(newToken, write);
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  }

  if (!res.ok) throw await parseError(res);

  // 204 No Content (e.g. DELETE) and any empty body have nothing to parse —
  // calling res.json() on them throws and would send the mutation to onError,
  // skipping cache invalidation in onSuccess.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? (JSON.parse(text) as { data: T }).data : (undefined as T));
}

export function get<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

/** Standard pagination meta (API Contract §5). */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * GET for list endpoints that return pagination in the sibling `meta` block
 * (envelope `{ success, data: { items }, meta }` per Contract §3/§5). The plain
 * `get()` helper only returns `data`, dropping `meta`; this keeps both.
 */
export async function getPaged<T, M = PageMeta>(path: string): Promise<{ items: T[]; meta: M }> {
  const { accessToken } = useAuthStore.getState();
  let headers = buildHeaders(accessToken);
  let res = await fetch(`${BASE}${path}`, { method: 'GET', headers });

  if (res.status === 401 && accessToken) {
    const newToken = await tryRefresh();
    if (!newToken) throw new ApiError('UNAUTHORIZED', 'انتهت صلاحية الجلسة', 401);
    headers = buildHeaders(newToken);
    res = await fetch(`${BASE}${path}`, { method: 'GET', headers });
  }

  if (!res.ok) throw await parseError(res);

  const envelope = (await res.json()) as { data: { items: T[] }; meta: M };
  return { items: envelope.data?.items ?? [], meta: envelope.meta };
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }, true);
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, true);
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }, true);
}

export function del<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}

export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  // No Content-Type — browser sets multipart boundary automatically
  const headers: Record<string, string> = {
    'Accept-Language': 'ar',
    'X-Request-Id': crypto.randomUUID(),
    'X-Platform': 'web-admin',
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });

  if (res.status === 401 && accessToken) {
    const newToken = await tryRefresh();
    if (!newToken) throw new ApiError('UNAUTHORIZED', 'انتهت صلاحية الجلسة', 401);
    headers['Authorization'] = `Bearer ${newToken}`;
    res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  }

  if (!res.ok) throw await parseError(res);
  const envelope = await res.json() as { data: T };
  return envelope.data;
}

const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

/** Ensures NEXT_PUBLIC_API_URL is an absolute URL (fetch treats host-only values as relative paths). */
export function resolveApiBaseUrl(raw = process.env.NEXT_PUBLIC_API_URL): string {
  const value = (raw ?? DEFAULT_API_URL).trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(value)) return value;
  const protocol = /^localhost(?::\d+)?/i.test(value) ? 'http' : 'https';
  return `${protocol}://${value}`;
}

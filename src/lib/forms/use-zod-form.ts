import { useForm, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { ApiError } from '@/lib/api/errors';

export function useZodForm<T extends z.ZodType>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>,
) {
  return useForm<z.infer<T>>({
    ...options,
    resolver: zodResolver(schema),
  });
}

export function applyServerErrors<T extends Record<string, unknown>>(
  setError: (field: string, error: { type: string; message: string }) => void,
  err: ApiError,
): void {
  if (err.status !== 422) return;

  const details = err.details as { field?: string; message?: string }[] | undefined;
  if (!Array.isArray(details)) return;

  for (const d of details) {
    if (d.field && d.message) {
      setError(d.field, { type: 'server', message: d.message });
    }
  }
}

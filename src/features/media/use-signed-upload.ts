import { useState, useCallback } from 'react';
import {
  requestSignedUpload,
  uploadToCloudinary,
  type MediaContext,
  type MediaDescriptor,
} from '@/lib/api/media';

const DEFAULT_ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export interface UploadOptions {
  context: MediaContext;
  contextId: string;
  /** Client-side guards before requesting a signature (server re-validates). */
  allowedMimes?: string[];
  maxSizeBytes?: number;
}

export interface UseSignedUploadResult {
  upload: (file: File, opts: UploadOptions) => Promise<MediaDescriptor>;
  progress: number;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Two-step signed upload: request Cloudinary params from the backend, then upload
 * the file directly with watermark transform. Validates MIME + size first.
 */
export function useSignedUpload(): UseSignedUploadResult {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(async (file: File, opts: UploadOptions): Promise<MediaDescriptor> => {
    setError(null);
    const allowed = opts.allowedMimes ?? DEFAULT_ALLOWED;
    const maxBytes = opts.maxSizeBytes ?? DEFAULT_MAX_BYTES;

    if (!allowed.includes(file.type)) {
      const msg = 'نوع الملف غير مدعوم.';
      setError(msg);
      throw new Error(msg);
    }
    if (file.size > maxBytes) {
      const msg = `حجم الملف يتجاوز الحد المسموح (${Math.round(maxBytes / 1024 / 1024)} ميجابايت).`;
      setError(msg);
      throw new Error(msg);
    }

    setIsUploading(true);
    setProgress(0);
    try {
      const params = await requestSignedUpload({
        context: opts.context,
        contextId: opts.contextId,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      const descriptor = await uploadToCloudinary(params, file, setProgress);
      setProgress(100);
      return descriptor;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'فشل الرفع. حاول مرة أخرى.';
      setError(msg);
      throw e;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, progress, isUploading, error, reset };
}

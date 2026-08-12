import { post } from './client';

export type MediaContext =
  | 'ADS_MEDIA' | 'USERS_AVATAR' | 'VERIFICATION_ID_PHOTO' | 'VERIFICATION_SELFIE'
  | 'STORES_LOGO' | 'STORES_BANNER' | 'BANNERS' | 'CHAT_ATTACHMENT_IMAGE' | 'REPORTS_EVIDENCE'
  | 'PRODUCTS_MEDIA';

export interface SignedUploadParams {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  transformation?: string;
  uploadUrl: string;
  maxSizeBytes: number;
  allowedMimes: string[];
}

export interface SignedUploadRequest {
  context: MediaContext;
  contextId: string;
  mimeType: string;
  sizeBytes: number;
}

export interface MediaDescriptor {
  cloudinaryId: string;
  watermarkedUrl: string;
  variants: { w1080: string | null; w720: string | null; thumb: string | null };
  mimeType: string | null;
  width: number | null;
  height: number | null;
}

/** Step 1 — ask the backend for Cloudinary signed-upload params (Contract §7.10). */
export function requestSignedUpload(req: SignedUploadRequest): Promise<SignedUploadParams> {
  return post<SignedUploadParams>('/media/signed-upload', req);
}

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  resource_type?: string;
  eager?: { secure_url: string }[];
}

/** Step 2 — upload the file directly to Cloudinary with progress reporting. */
export function uploadToCloudinary(
  params: SignedUploadParams,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<MediaDescriptor> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', params.apiKey);
    form.append('timestamp', String(params.timestamp));
    form.append('signature', params.signature);
    form.append('public_id', params.publicId);
    form.append('folder', params.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', params.uploadUrl, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText) as CloudinaryResponse;
          const eager = res.eager ?? [];
          resolve({
            cloudinaryId: res.public_id,
            watermarkedUrl: res.secure_url,
            variants: {
              w1080: eager[0]?.secure_url ?? res.secure_url ?? null,
              w720: eager[1]?.secure_url ?? null,
              thumb: eager[2]?.secure_url ?? null,
            },
            mimeType: file.type || null,
            width: res.width ?? null,
            height: res.height ?? null,
          });
        } catch {
          reject(new Error('تعذّر قراءة استجابة الرفع. حاول مرة أخرى.'));
        }
      } else {
        reject(new Error('فشل رفع الملف. حاول مرة أخرى.'));
      }
    };

    xhr.onerror = () => reject(new Error('تعذّر الاتصال بخدمة الرفع. تحقّق من الاتصال وحاول مجددًا.'));
    xhr.send(form);
  });
}

import { describe, expect, it, vi, beforeEach } from 'vitest';

const post = vi.fn();
vi.mock('./client', () => ({ post: (...args: unknown[]) => post(...args) }));

import { requestSignedUpload, uploadToCloudinary, type SignedUploadParams } from './media';

const PARAMS: SignedUploadParams = {
  cloudName: 'dev',
  apiKey: 'dev-key',
  signature: 'sig',
  timestamp: 123,
  folder: 'ads/1/media',
  publicId: 'ads_1_abc',
  transformation: 'l_wikala_watermark',
  uploadUrl: 'https://api.cloudinary.com/v1_1/dev/auto/upload',
  maxSizeBytes: 10485760,
  allowedMimes: ['image/jpeg'],
};

describe('requestSignedUpload', () => {
  beforeEach(() => post.mockReset());

  it('asks the backend for signed params with the upload context', async () => {
    post.mockResolvedValue(PARAMS);
    const res = await requestSignedUpload({ context: 'ADS_MEDIA', contextId: '1', mimeType: 'image/jpeg', sizeBytes: 999 });
    expect(post).toHaveBeenCalledWith('/media/signed-upload', { context: 'ADS_MEDIA', contextId: '1', mimeType: 'image/jpeg', sizeBytes: 999 });
    expect(res.uploadUrl).toContain('cloudinary');
  });
});

describe('uploadToCloudinary', () => {
  it('uploads the file and maps the Cloudinary response to a media descriptor', async () => {
    class FakeXHR {
      upload: Record<string, unknown> = {};
      status = 200;
      responseText = JSON.stringify({
        public_id: 'ads_1_abc',
        secure_url: 'https://res.cloudinary.com/x.jpg',
        width: 800,
        height: 600,
        eager: [
          { secure_url: 'https://res.cloudinary.com/x-1080.jpg' },
          { secure_url: 'https://res.cloudinary.com/x-720.jpg' },
          { secure_url: 'https://res.cloudinary.com/x-thumb.jpg' },
        ],
      });
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open() {}
      send() { this.onload?.(); }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);

    const file = new File(['data'], 'x.jpg', { type: 'image/jpeg' });
    const d = await uploadToCloudinary(PARAMS, file);

    expect(d.cloudinaryId).toBe('ads_1_abc');
    expect(d.watermarkedUrl).toBe('https://res.cloudinary.com/x.jpg');
    expect(d.variants.w720).toBe('https://res.cloudinary.com/x-720.jpg');
    expect(d.variants.thumb).toBe('https://res.cloudinary.com/x-thumb.jpg');
    expect(d.width).toBe(800);
  });
});

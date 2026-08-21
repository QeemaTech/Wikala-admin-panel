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
  eager: 'c_limit,w_1080|c_limit,w_720|c_fill,w_256,h_256',
  transformation: 'c_limit,w_1920',
  uploadUrl: 'https://api.cloudinary.com/v1_1/dev/auto/upload',
  maxSizeBytes: 10485760,
  allowedMimes: ['image/jpeg'],
};

/** Captures whatever body was actually POSTed so we can assert on it. */
const stubXhr = (response: object) => {
  let sent: FormData | null = null;
  class FakeXHR {
    upload: Record<string, unknown> = {};
    status = 200;
    responseText = JSON.stringify(response);
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    open() {}
    send(body: FormData) { sent = body; this.onload?.(); }
  }
  vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
  return () => sent;
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
  /**
   * Cloudinary rebuilds the signature from every field in the POST except
   * file/api_key/cloud_name/resource_type/signature. So the body we send must
   * contain EXACTLY the fields the backend signed — no more, no fewer.
   * Omitting `eager` here 401'd every panel upload in production while this
   * suite stayed green, because nothing asserted on the body.
   */
  it('echoes back every field the backend signed', async () => {
    const getSent = stubXhr({ public_id: 'ads_1_abc', secure_url: 'https://res.cloudinary.com/x.jpg' });
    const file = new File(['data'], 'x.jpg', { type: 'image/jpeg' });
    await uploadToCloudinary(PARAMS, file);

    const body = getSent()!;
    expect(body.get('eager')).toBe(PARAMS.eager);
    expect(body.get('transformation')).toBe(PARAMS.transformation);
    expect(body.get('public_id')).toBe(PARAMS.publicId);
    expect(body.get('folder')).toBe(PARAMS.folder);
    expect(body.get('timestamp')).toBe(String(PARAMS.timestamp));
    expect(body.get('signature')).toBe(PARAMS.signature);
  });

  it('sends no unsigned extras — an extra field breaks the hash just as badly', async () => {
    const getSent = stubXhr({ public_id: 'ads_1_abc', secure_url: 'https://res.cloudinary.com/x.jpg' });
    const file = new File(['data'], 'x.jpg', { type: 'image/jpeg' });
    await uploadToCloudinary(PARAMS, file);

    const signable = [...getSent()!.keys()].filter(
      (k) => !['file', 'api_key', 'cloud_name', 'resource_type', 'signature'].includes(k),
    );
    expect(signable.sort()).toEqual(['eager', 'folder', 'public_id', 'timestamp', 'transformation']);
  });

  it('omits eager entirely when the context has none (verification docs)', async () => {
    const getSent = stubXhr({ public_id: 'v_1_abc', secure_url: 'https://res.cloudinary.com/v.pdf' });
    const noEager: SignedUploadParams = { ...PARAMS, eager: undefined, transformation: undefined };
    await uploadToCloudinary(noEager, new File(['d'], 'v.pdf', { type: 'application/pdf' }));

    // A blank `eager=` would be hashed as a real field and fail the same way.
    expect(getSent()!.has('eager')).toBe(false);
    expect(getSent()!.has('transformation')).toBe(false);
  });

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

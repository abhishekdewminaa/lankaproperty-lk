/**
 * LankaProperty.lk — Supabase Storage Cloud Media Service
 *
 * Uploads client-side compressed WebP property photos directly to the public
 * Supabase Storage bucket ('property-images') under 'listings/'.
 * Returns CDN-cached public HTTPS URLs accessible on both desktop and mobile.
 */

import { supabase } from '../lib/supabase';

export interface UploadResponse {
  success: boolean;
  url: string;
  size: number;
  mimeType?: string;
  error?: string;
}

const BUCKET_NAME = 'property-images';

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string; mimeType: string } {
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'webp';

  const binaryStr = atob(base64Data || '');
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return { blob: new Blob([bytes], { type: mimeType }), ext, mimeType };
}

/**
 * Uploads a single compressed base64 image directly to Supabase Storage.
 * Falls back gracefully to dataUrl only if upload fails.
 */
export async function uploadPropertyPhotoToSupabase(
  dataUrl: string,
  filename?: string
): Promise<{ url: string; size: number }> {
  if (!dataUrl || dataUrl.startsWith('http') || dataUrl.startsWith('/uploads/')) {
    return { url: dataUrl, size: 0 };
  }

  try {
    const { blob, ext, mimeType } = dataUrlToBlob(dataUrl);
    const safeName = (filename || 'property_photo')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .slice(0, 40);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `listings/${safeName}_${uniqueId}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '31536000',
      });

    if (!error) {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      if (data?.publicUrl) {
        return { url: data.publicUrl, size: blob.size };
      }
    } else {
      console.warn('Supabase Storage upload returned error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase Storage upload deferred, falling back to local dataUrl:', err);
  }

  return { url: dataUrl, size: dataUrl.length };
}

/**
 * Uploads an array of compressed WebP photos in parallel to Supabase Storage.
 */
export async function uploadBatchPropertyPhotosToSupabase(
  dataUrls: string[]
): Promise<string[]> {
  return Promise.all(
    dataUrls.map(async (dataUrl, idx) => {
      const res = await uploadPropertyPhotoToSupabase(dataUrl, `photo_${idx + 1}`);
      return res.url;
    })
  );
}

// Backward-compatible aliases for existing form components
export const uploadPropertyPhotoToHostinger = uploadPropertyPhotoToSupabase;
export const uploadBatchPropertyPhotosToHostinger = uploadBatchPropertyPhotosToSupabase;

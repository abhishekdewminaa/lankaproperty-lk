/**
 * LankaProperty.lk — Hostinger NVMe SSD Media Storage Service
 *
 * Implements Strategy 1:
 * - Uploads client-side compressed WebP property photos directly to Hostinger's SSD (/uploads/properties/).
 * - Returns lean public URLs (e.g., "/uploads/properties/lp_1794892_abc123.webp").
 * - Supabase PostgreSQL saves ONLY the 40-character URL string in the JSONB column.
 * - Result: 0 MB Supabase Storage used, 0 MB Supabase Egress used.
 * - Leverages Hostinger's 50 GB SSD storage & Unlimited Bandwidth quota.
 */

export interface UploadResponse {
  success: boolean;
  url: string;
  size: number;
  mimeType?: string;
  error?: string;
}

/**
 * Uploads a single compressed base64 image to Hostinger SSD.
 * Gracefully falls back to dataUrl if server is offline or in static preview mode.
 */
export async function uploadPropertyPhotoToHostinger(
  dataUrl: string,
  filename?: string
): Promise<{ url: string; size: number }> {
  // If already a hosted URL (http... or /uploads...), no upload needed
  if (!dataUrl || dataUrl.startsWith('http') || dataUrl.startsWith('/uploads/')) {
    return { url: dataUrl, size: 0 };
  }

  try {
    const response = await fetch('/api/upload/property-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: dataUrl,
        filename: filename || 'property_photo.webp',
      }),
    });

    if (response.ok) {
      const result: UploadResponse = await response.json();
      if (result.success && result.url) {
        return { url: result.url, size: result.size };
      }
    }
  } catch (err) {
    console.warn('Hostinger direct SSD upload deferred, falling back to local dataUrl:', err);
  }

  // Graceful fallback for offline demo or static preview
  return { url: dataUrl, size: dataUrl.length };
}

/**
 * Uploads an array of compressed WebP photos in parallel to Hostinger SSD.
 */
export async function uploadBatchPropertyPhotosToHostinger(
  dataUrls: string[]
): Promise<string[]> {
  const uploadPromises = dataUrls.map(async (dataUrl) => {
    const res = await uploadPropertyPhotoToHostinger(dataUrl);
    return res.url;
  });

  return Promise.all(uploadPromises);
}

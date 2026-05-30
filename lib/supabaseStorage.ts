import { supabase } from './supabase';

const BUCKET = 'driver-documents';

/**
 * Uploads a driver document to Supabase Storage.
 * Returns the public URL on success, null if Supabase is unavailable or upload fails.
 *
 * Path pattern: driver-documents/{mobile}/{fieldName}-{timestamp}.{ext}
 */
export async function uploadDriverDocument(
  file: File,
  fieldName: string,
  mobile: string
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: null }; // Supabase not configured — silent skip

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const safeMobile = mobile.replace(/\D/g, '') || 'unknown';
  const path = `${safeMobile}/${fieldName}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (error) {
    console.warn('[storage] upload failed:', error.message);
    return { url: null, error: error.message };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, error: null };
}

/**
 * Lists all uploaded files for a given mobile number.
 * Useful for admin review.
 */
export async function listDriverDocuments(
  mobile: string
): Promise<{ name: string; url: string }[]> {
  if (!supabase) return [];

  const safeMobile = mobile.replace(/\D/g, '') || 'unknown';
  const { data, error } = await supabase.storage.from(BUCKET).list(safeMobile);

  if (error || !data) return [];

  return data.map((file) => {
    const { data: urlData } = supabase!.storage
      .from(BUCKET)
      .getPublicUrl(`${safeMobile}/${file.name}`);
    return { name: file.name, url: urlData.publicUrl };
  });
}

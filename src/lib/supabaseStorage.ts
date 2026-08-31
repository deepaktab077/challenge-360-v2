import { supabase } from './supabaseClient';

const BUCKET = 'health-reports';

export interface StorageUploadResult {
  storagePath: string;
  fileName: string;
}

/** Uploads a File into the private "health-reports" bucket, under a
 * per-user folder so Storage RLS can enforce ownership from the path. */
export async function uploadHealthReportToStorage(userId: string, file: File): Promise<StorageUploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return { storagePath: path, fileName: file.name };
}

/** Generates a short-lived signed URL to view/download a private file. */
export async function getHealthReportSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteHealthReportFile(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

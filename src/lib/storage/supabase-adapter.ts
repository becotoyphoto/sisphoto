import { createServiceClient } from '@/lib/supabase-service';
import type { StorageProvider, StorageFile, UploadOptions } from './types';

export function createSupabaseStorage(): StorageProvider {
  const client = createServiceClient();

  return {
    name: 'supabase',

    async upload(bucket, path, file, options) {
      const { error } = await client.storage
        .from(bucket)
        .upload(path, file as any, {
          contentType: options?.contentType,
          upsert: options?.upsert ?? false,
          cacheControl: options?.cacheControl,
        });

      if (error) {
        console.error(`[storage:supabase] Upload failed: ${bucket}/${path}`, error.message);
        return { path, error: error.message };
      }

      return { path };
    },

    async download(bucket, path) {
      const { data, error } = await client.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error(`[storage:supabase] Download failed: ${bucket}/${path}`, error.message);
        return { data: null, error: error.message };
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return { data: buffer };
    },

    getPublicUrl(bucket, path) {
      const { data } = client.storage
        .from(bucket)
        .getPublicUrl(path);
      return data.publicUrl;
    },

    async getSignedUrl(bucket, path, expiresIn = 3600) {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error(`[storage:supabase] Signed URL failed: ${bucket}/${path}`, error.message);
        return { url: '', error: error.message };
      }

      return { url: data.signedUrl };
    },

    async delete(bucket, paths) {
      const { error } = await client.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        console.error(`[storage:supabase] Delete failed: ${bucket}`, error.message);
        return { error: error.message };
      }

      return {};
    },

    async list(bucket, prefix) {
      const { data, error } = await client.storage
        .from(bucket)
        .list(prefix || '');

      if (error) {
        console.error(`[storage:supabase] List failed: ${bucket}/${prefix}`, error.message);
        return { files: [], error: error.message };
      }

      const files: StorageFile[] = (data || []).map((f) => ({
        path: prefix ? `${prefix}/${f.name}` : f.name,
        bucket,
        size: f.metadata?.size,
        lastModified: f.updated_at ? new Date(f.updated_at) : undefined,
      }));

      return { files };
    },
  };
}

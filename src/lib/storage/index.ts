/**
 * Storage Abstraction Layer
 *
 * Suporta múltiplos providers (Supabase, R2) com escrita dupla e leitura do primário.
 *
 * Variáveis de ambiente:
 *   STORAGE_PRIMARY = 'supabase' | 'r2'  (default: 'supabase')
 *   STORAGE_SECONDARY = 'supabase' | 'r2' (default: o que não for primary)
 *
 * Escrita: grava nos DOIS providers simultaneamente.
 *   Se o secundário falhar, loga erro mas não bloqueia.
 * Leitura: usa apenas o provider PRIMÁRIO.
 *   Se o primário falhar, tenta o secundário como fallback.
 */

import type { StorageProvider, StorageFile, UploadOptions } from './types';
import { createSupabaseStorage } from './supabase-adapter';
import { createR2Storage } from './r2-adapter';

let primaryProvider: StorageProvider | null = null;
let secondaryProvider: StorageProvider | null = null;

function getProviders(): { primary: StorageProvider; secondary: StorageProvider | null } {
  if (!primaryProvider) {
    const mode = process.env.STORAGE_PRIMARY || 'supabase';
    const supabase = createSupabaseStorage();
    let r2: StorageProvider | null = null;

    // Try to initialize R2 — it will throw if env vars are missing
    try {
      r2 = createR2Storage();
    } catch {
      console.warn('[storage] R2 not configured — skipping R2 adapter');
    }

    if (mode === 'r2' && r2) {
      primaryProvider = r2;
      secondaryProvider = supabase;
    } else {
      primaryProvider = supabase;
      secondaryProvider = r2;
    }

    console.log(`[storage] Primary: ${primaryProvider.name}, Secondary: ${secondaryProvider?.name || 'none'}`);
  }

  return { primary: primaryProvider, secondary: secondaryProvider };
}

/**
 * Attempts an operation on a provider, returning null on failure.
 */
async function tryOp<T>(
  provider: StorageProvider,
  fn: (p: StorageProvider) => Promise<T>,
  label: string
): Promise<{ ok: true; result: T } | { ok: false; error: string }> {
  try {
    const result = await fn(provider);
    return { ok: true, result };
  } catch (err: any) {
    console.error(`[storage] ${provider.name} ${label}:`, err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function upload(
  bucket: string,
  path: string,
  file: Buffer | Blob | File,
  options?: UploadOptions
): Promise<{ path: string; primaryError?: string; secondaryError?: string }> {
  const { primary, secondary } = getProviders();
  const result: { path: string; primaryError?: string; secondaryError?: string } = { path };

  // Primary write
  const primaryResult = await tryOp(primary, (p) => p.upload(bucket, path, file, options), `upload ${bucket}/${path}`);
  if (!primaryResult.ok) {
    result.primaryError = primaryResult.error;
  }

  // Secondary write (dual-write — non-blocking on failure)
  if (secondary) {
    // Clone buffer for secondary if needed (Buffer can only be consumed once)
    const secondaryResult = await tryOp(secondary, (p) => p.upload(bucket, path, file, options), `upload ${bucket}/${path}`);
    if (!secondaryResult.ok) {
      result.secondaryError = secondaryResult.error;
      console.error(`[storage] Dual-write failed on ${secondary.name}: ${secondaryResult.error}`);
    }
  }

  return result;
}

export async function download(
  bucket: string,
  path: string
): Promise<{ data: Buffer | null; error?: string }> {
  const { primary, secondary } = getProviders();

  const primaryResult = await tryOp(primary, (p) => p.download(bucket, path), `download ${bucket}/${path}`);
  if (primaryResult.ok) {
    return { data: primaryResult.result.data };
  }

  // Fallback to secondary
  if (secondary) {
    console.warn(`[storage] Primary ${primary.name} failed, trying secondary ${secondary.name}`);
    const secondaryResult = await tryOp(secondary, (p) => p.download(bucket, path), `download ${bucket}/${path}`);
    if (secondaryResult.ok) {
      return { data: secondaryResult.result.data };
    }
    return { data: null, error: `Primary: ${primaryResult.error}, Secondary: ${secondaryResult.error}` };
  }

  return { data: null, error: primaryResult.error };
}

export function getPublicUrl(bucket: string, path: string): string {
  const { primary } = getProviders();
  return primary.getPublicUrl(bucket, path);
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string; error?: string }> {
  const { primary, secondary } = getProviders();

  const primaryResult = await tryOp(primary, (p) => p.getSignedUrl(bucket, path, expiresIn), `signedUrl ${bucket}/${path}`);
  if (primaryResult.ok) {
    return { url: primaryResult.result.url };
  }

  // Fallback to secondary
  if (secondary) {
    console.warn(`[storage] Primary ${primary.name} failed for signed URL, trying secondary`);
    const secondaryResult = await tryOp(secondary, (p) => p.getSignedUrl(bucket, path, expiresIn), `signedUrl ${bucket}/${path}`);
    if (secondaryResult.ok) {
      return { url: secondaryResult.result.url };
    }
    return { url: '', error: `Primary: ${primaryResult.error}, Secondary: ${secondaryResult.error}` };
  }

  return { url: '', error: primaryResult.error };
}

export async function remove(
  bucket: string,
  paths: string[]
): Promise<{ primaryError?: string; secondaryError?: string }> {
  const { primary, secondary } = getProviders();
  const result: { primaryError?: string; secondaryError?: string } = {};

  const primaryResult = await tryOp(primary, (p) => p.delete(bucket, paths), `delete ${bucket}`);
  if (!primaryResult.ok) {
    result.primaryError = primaryResult.error;
  }

  if (secondary) {
    const secondaryResult = await tryOp(secondary, (p) => p.delete(bucket, paths), `delete ${bucket}`);
    if (!secondaryResult.ok) {
      result.secondaryError = secondaryResult.error;
    }
  }

  return result;
}

export async function list(
  bucket: string,
  prefix?: string
): Promise<{ files: StorageFile[]; error?: string }> {
  const { primary, secondary } = getProviders();

  const primaryResult = await tryOp(primary, (p) => p.list(bucket, prefix), `list ${bucket}/${prefix}`);
  if (primaryResult.ok) {
    return { files: primaryResult.result.files };
  }

  if (secondary) {
    console.warn(`[storage] Primary ${primary.name} failed for list, trying secondary`);
    const secondaryResult = await tryOp(secondary, (p) => p.list(bucket, prefix), `list ${bucket}/${prefix}`);
    if (secondaryResult.ok) {
      return { files: secondaryResult.result.files };
    }
    return { files: [], error: `Primary: ${primaryResult.error}, Secondary: ${secondaryResult.error}` };
  }

  return { files: [], error: primaryResult.error };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Get the name of the current primary provider */
export function getPrimaryProviderName(): string {
  const { primary } = getProviders();
  return primary.name;
}

/** Get the name of the current secondary provider */
export function getSecondaryProviderName(): string {
  const { secondary } = getProviders();
  return secondary?.name || 'none';
}

// Re-export types
export type { StorageProvider, StorageFile, UploadOptions } from './types';

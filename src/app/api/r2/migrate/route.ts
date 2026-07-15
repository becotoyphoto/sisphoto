import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';
import { createR2Storage } from '@/lib/storage/r2-adapter';

/**
 * API to copy all existing files from Supabase to R2.
 * Meant to be called once as a migration script.
 * GET /api/r2/migrate - dry run (shows what would be copied)
 * POST /api/r2/migrate - executes the migration
 */
export async function GET() {
  try {
    let r2: ReturnType<typeof createR2Storage>;
    try {
      r2 = createR2Storage();
    } catch {
      return NextResponse.json({ error: 'R2 not configured. Set R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get all photos from database
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, storage_path_original, storage_path_watermark');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check what exists in R2 already
    const needsCopy: { bucket: string; path: string }[] = [];

    for (const photo of photos || []) {
      if (photo.storage_path_original) {
        const { files } = await r2.list('originals', photo.storage_path_original);
        if (files.length === 0) {
          needsCopy.push({ bucket: 'originals', path: photo.storage_path_original });
        }
      }
      if (photo.storage_path_watermark) {
        const { files } = await r2.list('photos', photo.storage_path_watermark);
        if (files.length === 0) {
          needsCopy.push({ bucket: 'photos', path: photo.storage_path_watermark });
        }
      }
    }

    return NextResponse.json({
      totalPhotos: photos?.length || 0,
      needsCopy: needsCopy.length,
      items: needsCopy.slice(0, 20), // first 20 as sample
    });
  } catch (error) {
    console.error('Error in migration check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    let r2: ReturnType<typeof createR2Storage>;
    try {
      r2 = createR2Storage();
    } catch {
      return NextResponse.json({ error: 'R2 not configured.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, storage_path_original, storage_path_watermark');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let copied = 0;
    let failed = 0;
    const errors: { bucket: string; path: string; error: string }[] = [];

    for (const photo of photos || []) {
      for (const bucket of ['originals', 'photos'] as const) {
        const path = bucket === 'originals' ? photo.storage_path_original : photo.storage_path_watermark;
        if (!path) continue;

        // Check if already exists in R2
        const { files } = await r2.list(bucket, path);
        if (files.length > 0) continue;

        // Download from Supabase
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from(bucket)
          .download(path);

        if (downloadError || !fileData) {
          failed++;
          errors.push({ bucket, path, error: `Download: ${downloadError?.message}` });
          continue;
        }

        // Upload to R2
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const { error: uploadError } = await r2.upload(bucket, path, buffer, {
          contentType: 'image/jpeg',
        });

        if (uploadError) {
          failed++;
          errors.push({ bucket, path, error: `Upload: ${uploadError}` });
        } else {
          copied++;
        }
      }
    }

    return NextResponse.json({
      total: photos?.length || 0,
      copied,
      failed,
      errors: errors.slice(0, 20), // first 20 errors as sample
    });
  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

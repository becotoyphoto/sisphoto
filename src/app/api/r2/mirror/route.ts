import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';
import { createR2Storage } from '@/lib/storage/r2-adapter';

/**
 * API to mirror uploaded files from Supabase Storage to R2.
 * Called after client-side uploads (which upload directly to Supabase from the browser).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bucket, paths } = body as { bucket: string; paths: { path: string; contentType?: string }[] };

    if (!bucket || !paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'Missing bucket or paths' }, { status: 400 });
    }

    if (!['photos', 'originals'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    let r2: ReturnType<typeof createR2Storage>;
    try {
      r2 = createR2Storage();
    } catch {
      // R2 not configured — this is fine
      return NextResponse.json({ mirrored: 0, skipped: true, reason: 'R2 not configured' });
    }

    const supabase = createServiceClient();
    const results: { path: string; success: boolean; error?: string }[] = [];

    for (const item of paths) {
      try {
        // Download from Supabase
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from(bucket)
          .download(item.path);

        if (downloadError || !fileData) {
          results.push({ path: item.path, success: false, error: `Download failed: ${downloadError?.message}` });
          continue;
        }

        // Upload to R2
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const { error: uploadError } = await r2.upload(bucket, item.path, buffer, {
          contentType: item.contentType || 'image/jpeg',
        });

        results.push({
          path: item.path,
          success: !uploadError,
          error: uploadError || undefined,
        });
      } catch (err: any) {
        results.push({ path: item.path, success: false, error: err.message });
      }
    }

    const mirrored = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (failed > 0) {
      console.warn(`[storage:mirror] Mirrored ${mirrored}/${results.length} files to R2, ${failed} failed`);
    }

    return NextResponse.json({ mirrored, failed, results });
  } catch (error) {
    console.error('Error in mirror API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

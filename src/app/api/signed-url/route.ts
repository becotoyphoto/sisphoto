import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body.items)) {
      const service = createServiceClient();
      const urls: Record<string, string> = {};

      await Promise.all(
        body.items.map(async (item: { id: string; path: string; bucket: string }) => {
          if (!item?.path || !item?.bucket || !item?.id) return;

          const { data, error } = await service.storage
            .from(item.bucket)
            .createSignedUrl(item.path, 3600);

          if (!error && data?.signedUrl) {
            urls[item.id] = data.signedUrl;
          }
        })
      );

      return NextResponse.json({ urls });
    }

    const { path, bucket } = body;

    if (!path || !bucket) {
      return NextResponse.json({ error: 'Missing path or bucket' }, { status: 400 });
    }

    const service = createServiceClient();

    const { data, error } = await service.storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Error in signed-url API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

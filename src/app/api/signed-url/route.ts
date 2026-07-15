import { NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/storage';

const ALLOWED_BUCKETS = ['photos'];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body.items)) {
      const urls: Record<string, string> = {};

      await Promise.all(
        body.items
          .filter((item: { id: string; path: string; bucket: string }) =>
            item?.path && item?.bucket && item?.id && ALLOWED_BUCKETS.includes(item.bucket)
          )
          .map(async (item: { id: string; path: string; bucket: string }) => {
            const { url, error } = await getSignedUrl(item.bucket, item.path, 3600);
            if (!error && url) {
              urls[item.id] = url;
            }
          })
      );

      return NextResponse.json({ urls });
    }

    const { path, bucket } = body;

    if (!path || !bucket) {
      return NextResponse.json({ error: 'Missing path or bucket' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Bucket not allowed' }, { status: 403 });
    }

    const { url, error } = await getSignedUrl(bucket, path, 3600);

    if (error || !url) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error in signed-url API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

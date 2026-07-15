import { NextResponse } from 'next/server';
import { getPublicUrl } from '@/lib/storage';

/**
 * Returns a public URL for a given storage path.
 * Uses the active storage abstraction layer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bucket, path } = body as { bucket: string; path: string };

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Missing bucket or path' }, { status: 400 });
    }

    if (!['photos', 'originals'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const url = getPublicUrl(bucket, path);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error in public-url API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

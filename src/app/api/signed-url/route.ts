import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: Request) {
  try {
    const { path, bucket } = await request.json();

    if (!path || !bucket) {
      return NextResponse.json({ error: 'Missing path or bucket' }, { status: 400 });
    }

    const service = createServiceClient();

    const { data, error } = await service
      .storage
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

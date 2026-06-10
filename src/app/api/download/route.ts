import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photo_id } = await request.json();
    if (!photo_id) {
      return NextResponse.json({ error: 'Missing photo_id' }, { status: 400 });
    }

    // Check ownership: user must have a paid order with this photo
    // First try via the authenticated client (most reliable)
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select('photo_id, order:orders!inner(user_id, status)')
      .eq('order.user_id', user.id)
      .eq('order.status', 'paid')
      .eq('photo_id', photo_id)
      .limit(1);

    if (orderError) {
      console.error('Error checking order:', orderError);
    }

    const hasAccess = orderItems && orderItems.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Você não possui essa foto' }, { status: 403 });
    }

    // Get the photo to find original storage path
    const { data: photo, error: photoError } = await service
      .from('photos')
      .select('storage_path_original')
      .eq('id', photo_id)
      .single();

    if (photoError || !photo?.storage_path_original) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
    }

    // Generate signed URL for the original (1 hour expiry)
    const { data: signedData, error: signedError } = await service
      .storage
      .from('originals')
      .createSignedUrl(photo.storage_path_original, 3600);

    if (signedError || !signedData) {
      console.error('Error creating signed URL:', signedError);
      return NextResponse.json({ error: 'Erro ao gerar link de download' }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });
  } catch (error) {
    console.error('Error in download API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

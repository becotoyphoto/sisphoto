import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';
import { getSignedUrl } from '@/lib/storage';

export async function GET() {
  try {
    const supabase = await createClient();
    const service = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all order items for these orders
    const orderIds = orders.map(o => o.id);
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      // Return orders without items
      return NextResponse.json(orders);
    }

    // Fetch photo details and signed URLs for all items
    const photoIds = [...new Set((items || []).map(i => i.photo_id))];
    const { data: photos, error: photosError } = await service
      .from('photos')
      .select('id, storage_path_watermark, storage_path_original, price')
      .in('id', photoIds);

    const photoMap: Record<string, any> = {};
    for (const photo of photos || []) {
      // Get signed URL for thumbnail
      let thumbnailUrl: string | null = null;
      if (photo.storage_path_watermark) {
        const { url } = await getSignedUrl('photos', photo.storage_path_watermark, 3600);
        thumbnailUrl = url || null;
      }
      photoMap[photo.id] = { ...photo, thumbnail_url: thumbnailUrl };
    }

    // Attach items with photo info to each order
    const enrichedOrders = orders.map(order => ({
      ...order,
      items: (items || [])
        .filter(item => item.order_id === order.id)
        .map(item => ({
          ...item,
          photo: photoMap[item.photo_id] || null
        }))
    }));

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Error in my orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

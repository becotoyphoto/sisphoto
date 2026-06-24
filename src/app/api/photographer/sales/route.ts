import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getCommissionRate } from '@/lib/platform-settings';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const PLATFORM_COMMISSION = await getCommissionRate();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'photographer') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('photographer_id', user.id);

    const eventIds = events?.map(e => e.id) || [];

    if (eventIds.length === 0) {
      return NextResponse.json({
        totalSales: 0,
        totalPhotosSold: 0,
        photographerEarnings: 0,
        platformCommission: 0,
        pendingWithdrawals: 0,
        salesByEvent: [],
        recentSales: [],
      });
    }

    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        *,
        photo:photos (
          event_id,
          price,
          event:events (
            name,
            photographer_id
          )
        )
      `)
      .in('photo.event_id', eventIds);

    const salesByEvent: Record<string, { name: string; sales: number; amount: number }> = {};
    let totalSales = 0;
    let totalPhotosSold = 0;
    let photographerEarnings = 0;

    for (const item of orderItems || []) {
      if (item.photo?.event?.photographer_id === user.id) {
        totalSales += Number(item.price_at_purchase);
        totalPhotosSold += 1;
        photographerEarnings += Number(item.price_at_purchase) * (1 - PLATFORM_COMMISSION);
      }
    }

    const platformCommission = totalSales * PLATFORM_COMMISSION;

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('photographer_id', user.id)
      .eq('status', 'requested');

    const pendingWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

    const recentSales = orderItems
      ?.filter((item: any) => item.photo?.event?.photographer_id === user.id)
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        photo_id: item.photo_id,
        event_name: item.photo?.event?.name || 'Evento',
        price: item.price_at_purchase,
        earnings: Number(item.price_at_purchase) * (1 - PLATFORM_COMMISSION),
        date: item.created_at,
      })) || [];

    return NextResponse.json({
      totalSales,
      totalPhotosSold,
      photographerEarnings,
      platformCommission,
      pendingWithdrawals,
      recentSales,
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

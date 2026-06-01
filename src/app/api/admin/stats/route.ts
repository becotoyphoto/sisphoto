import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [
      { count: photographersCount },
      { count: pendingPhotographersCount },
      { count: eventsCount },
      { count: photosCount },
      { count: usersCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'photographer'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'photographer').eq('is_approved', false),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    ]);

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'paid');

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles(full_name),
        order_items(count)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentPhotographers } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'photographer')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        photographersCount: photographersCount || 0,
        pendingPhotographersCount: pendingPhotographersCount || 0,
        eventsCount: eventsCount || 0,
        photosCount: photosCount || 0,
        usersCount: usersCount || 0,
        totalRevenue,
        platformCommission: totalRevenue * 0.15,
      },
      recentOrders: recentOrders || [],
      recentPhotographers: recentPhotographers || [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

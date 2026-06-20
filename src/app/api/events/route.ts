import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

async function getProfileContext(userId: string) {
  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', userId)
    .single();

  return { serviceSupabase, profile };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceSupabase, profile } = await getProfileContext(user.id);
    const isAdmin = profile?.role === 'admin';

    if (!isAdmin && (!profile || profile.role !== 'photographer' || !profile.is_approved)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category_id, city, state, date, cover_image_url, status, photographer_id } = body;

    if (!name || !city || !state || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const effectivePhotographerId = isAdmin && photographer_id ? photographer_id : user.id;

    const { data, error } = await serviceSupabase
      .from('events')
      .insert({
        photographer_id: effectivePhotographerId,
        name,
        description,
        category_id,
        city,
        state,
        date,
        cover_image_url,
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceSupabase, profile } = await getProfileContext(user.id);
    const isAdmin = profile?.role === 'admin';

    if (!isAdmin && (!profile || profile.role !== 'photographer' || !profile.is_approved)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let query = serviceSupabase
      .from('events')
      .select(`
        id,
        name,
        city,
        state,
        date,
        status,
        cover_image_url,
        category:categories(name),
        photographer:profiles(full_name)
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('photographer_id', user.id);
    }

    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const eventIds = events?.map((event) => event.id) || [];
    const photoCountByEventId = new Map<string, number>();

    if (eventIds.length > 0) {
      const { data: photoRows, error: photosError } = await serviceSupabase
        .from('photos')
        .select('event_id')
        .in('event_id', eventIds);

      if (photosError) {
        console.error('Error fetching photo counts:', photosError);
        return NextResponse.json({ error: photosError.message }, { status: 500 });
      }

      for (const photo of photoRows || []) {
        photoCountByEventId.set(photo.event_id, (photoCountByEventId.get(photo.event_id) || 0) + 1);
      }
    }

    const data = (events || []).map((event) => ({
      ...event,
      photos: [{ count: photoCountByEventId.get(event.id) || 0 }],
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

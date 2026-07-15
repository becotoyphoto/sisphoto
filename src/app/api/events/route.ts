import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

// #region debug-point events-1
const DEBUG_SERVER_URL = process.env.DEBUG_SERVER_URL || 'http://127.0.0.1:7777/event';
const DEBUG_SESSION_ID = process.env.DEBUG_SESSION_ID || 'photos-not-appearing-dashboard';
async function debugLog(event: string, data: Record<string, unknown>) {
  try {
    await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: DEBUG_SESSION_ID, event, ...data, timestamp: new Date().toISOString() }),
    });
  } catch {}
}
// #endregion debug-point events-1

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

    // Check for duplicate event name (case-insensitive, per photographer)
    const trimmedName = name.trim();
    const { data: existingEvent } = await serviceSupabase
      .from('events')
      .select('id')
      .eq('photographer_id', effectivePhotographerId)
      .ilike('name', trimmedName)
      .limit(1)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Já existe um evento com esse nome. Escolha outro nome ou edite o evento existente.' },
        { status: 409 }
      );
    }

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
    const photographerId = searchParams.get('photographer_id') || '';

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

    if (photographerId && isAdmin) {
      query = query.eq('photographer_id', photographerId);
    }

    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: events, error } = await query;

    // #region debug-point events-2
    await debugLog('events-get-base-result', {
      userId: user.id,
      isAdmin,
      search,
      statusFilter: status,
      success: !error,
      error: error?.message,
      eventCount: events?.length ?? 0,
      eventIds: (events || []).map((event) => event.id),
    });
    // #endregion debug-point events-2

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

    // #region debug-point events-3
    await debugLog('events-get-final-result', {
      userId: user.id,
      data: data.map((event) => ({
        id: event.id,
        name: event.name,
        photoCount: event.photos?.[0]?.count || 0,
        status: event.status,
      })),
    });
    // #endregion debug-point events-3

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'photographer' || !profile.is_approved) {
      return NextResponse.json({ error: 'Not authorized as photographer' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category_id, city, state, date, cover_image_url, status } = body;

    if (!name || !city || !state || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        photographer_id: user.id,
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

export async function GET() {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // #region debug-point E:events-unauthorized
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'E',location:'api/events/route.ts:user-check',msg:'[DEBUG] events list rejected due to missing user',data:{},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // #region debug-point D:events-request
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'D',location:'api/events/route.ts:request',msg:'[DEBUG] photographer events requested',data:{userId:user.id},ts:Date.now()})}).catch(()=>{});
    // #endregion

    const { data: events, error } = await serviceSupabase
      .from('events')
      .select(`
        id,
        name,
        city,
        state,
        date,
        status,
        cover_image_url,
        category:categories(name)
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false });

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
        const currentCount = photoCountByEventId.get(photo.event_id) || 0;
        photoCountByEventId.set(photo.event_id, currentCount + 1);
      }
    }

    const data = (events || []).map((event) => ({
      ...event,
      photos: [{ count: photoCountByEventId.get(event.id) || 0 }],
    }));

    // #region debug-point D:events-success
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'D',location:'api/events/route.ts:success',msg:'[DEBUG] photographer events query succeeded',data:{userId:user.id,eventCount:data.length,counts:data.map((event)=>({eventId:event.id,photoCount:event.photos?.[0]?.count||0}))},ts:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json(data);
  } catch (error) {
    // #region debug-point D:events-exception
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'D',location:'api/events/route.ts:catch',msg:'[DEBUG] events route threw exception',data:{error:error instanceof Error ? error.message : String(error)},ts:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

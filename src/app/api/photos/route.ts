import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // #region debug-point E:photo-unauthorized
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'E',traceId,location:'api/photos/route.ts:user-check',msg:'[DEBUG] photo creation rejected due to missing user',data:{},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event_id, storage_path_original, storage_path_watermark, price, metadata } = body;
    // #region debug-point C:photo-create-request
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'C',traceId,location:'api/photos/route.ts:request',msg:'[DEBUG] photo creation requested',data:{userId:user.id,eventId:event_id,storage_path_original,storage_path_watermark,price},ts:Date.now()})}).catch(()=>{});
    // #endregion

    if (!event_id || !storage_path_original || !storage_path_watermark) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: event } = await supabase
      .from('events')
      .select('photographer_id')
      .eq('id', event_id)
      .single();

    if (!event || event.photographer_id !== user.id) {
      // #region debug-point E:photo-not-authorized
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'E',traceId,location:'api/photos/route.ts:event-auth',msg:'[DEBUG] photo creation rejected by event ownership',data:{event_id,userId:user.id,eventPhotographerId:event?.photographer_id ?? null},ts:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('photos')
      .insert({
        event_id,
        storage_path_original,
        storage_path_watermark,
        price: price || 15.00,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      // #region debug-point C:photo-insert-error
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'C',traceId,location:'api/photos/route.ts:insert-error',msg:'[DEBUG] photo insert failed',data:{event_id,error:error.message},ts:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('Error creating photo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    // #region debug-point C:photo-exception
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'C',location:'api/photos/route.ts:catch',msg:'[DEBUG] photo route threw exception',data:{error:error instanceof Error ? error.message : String(error)},ts:Date.now()})}).catch(()=>{});
    // #endregion
    console.error('Error creating photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    // #region debug-point D:photos-get-request
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'photo-upload-missing',runId:'pre-fix',hypothesisId:'D',location:'api/photos/route.ts:get-request',msg:'[DEBUG] photos list requested',data:{eventId,userId:user?.id ?? null},ts:Date.now()})}).catch(()=>{});
    // #endregion

    const { data: event, error: eventError } = await serviceSupabase
      .from('events')
      .select('id, status, photographer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const canView =
      event.status === 'published' || (user && event.photographer_id === user.id);

    if (!canView) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data, error } = await serviceSupabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching photos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

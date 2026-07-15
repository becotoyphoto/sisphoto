import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';
import { remove } from '@/lib/storage';

// #region debug-point photos-1
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
// #endregion debug-point photos-1

async function getActorContext(userId: string) {
  const serviceSupabase = createServiceClient();

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return { serviceSupabase, role: profile?.role as 'admin' | 'photographer' | 'client' | undefined };
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { event_id, storage_path_original, storage_path_watermark, price, metadata } = body;

    if (!event_id || !storage_path_original || !storage_path_watermark) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const { serviceSupabase, role } = await getActorContext(user.id);

    const { data: event } = await serviceSupabase
      .from('events')
      .select('photographer_id')
      .eq('id', event_id)
      .single();

    if (!event || (event.photographer_id !== user.id && role !== 'admin')) {
      // #region debug-point photos-post-1
      await debugLog('photos-post-forbidden', {
        userId: user.id,
        eventId: event_id,
        role,
        eventPhotographerId: event?.photographer_id ?? null,
      });
      // #endregion debug-point photos-post-1
      return NextResponse.json({ error: 'Sem permissão para adicionar fotos neste evento' }, { status: 403 });
    }

    const { data, error } = await serviceSupabase
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

    // #region debug-point photos-post-2
    await debugLog('photos-post-result', {
      userId: user.id,
      eventId: event_id,
      role,
      success: !error,
      error: error?.message,
      photoId: data?.id ?? null,
      storagePathOriginal: storage_path_original,
      storagePathWatermark: storage_path_watermark,
    });
    // #endregion debug-point photos-post-2

    if (error) {
      console.error('Error creating photo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { serviceSupabase, role } = user
      ? await getActorContext(user.id)
      : { serviceSupabase: createServiceClient(), role: undefined };

    const { data: event, error: eventError } = await serviceSupabase
      .from('events')
      .select('id, status, photographer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      // #region debug-point photos-get-1
      await debugLog('photos-get-event-missing', {
        eventId,
        userId: user?.id ?? null,
        role,
        eventError: eventError?.message,
      });
      // #endregion debug-point photos-get-1
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const canView =
      event.status === 'published' || (user && (event.photographer_id === user.id || role === 'admin'));

    if (!canView) {
      // #region debug-point photos-get-2
      await debugLog('photos-get-forbidden', {
        eventId,
        userId: user?.id ?? null,
        role,
        eventStatus: event.status,
        eventPhotographerId: event.photographer_id,
      });
      // #endregion debug-point photos-get-2
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data, error } = await serviceSupabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    // #region debug-point photos-get-3
    await debugLog('photos-get-result', {
      eventId,
      userId: user?.id ?? null,
      role,
      success: !error,
      error: error?.message,
      count: data?.length ?? 0,
      photoIds: (data || []).map((photo) => photo.id),
    });
    // #endregion debug-point photos-get-3

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

export async function DELETE(request: Request) {
  try {
    const { user } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'Foto não informada' }, { status: 400 });
    }

    const { serviceSupabase, role } = await getActorContext(user.id);

    const { data: photo, error: photoError } = await serviceSupabase
      .from('photos')
      .select('id, event_id, storage_path_original, storage_path_watermark')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
    }

    const { data: event } = await serviceSupabase
      .from('events')
      .select('id, photographer_id, cover_image_url')
      .eq('id', photo.event_id)
      .single();

    if (!event || (event.photographer_id !== user.id && role !== 'admin')) {
      return NextResponse.json({ error: 'Sem permissão para excluir esta foto' }, { status: 403 });
    }

    await serviceSupabase.from('cart_items').delete().eq('photo_id', photoId);
    await serviceSupabase.from('order_items').delete().eq('photo_id', photoId);

    const { error: deletePhotoError } = await serviceSupabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deletePhotoError) {
      return NextResponse.json({ error: deletePhotoError.message }, { status: 500 });
    }

    if (
      event.cover_image_url &&
      (event.cover_image_url.includes(photo.storage_path_watermark) ||
        event.cover_image_url.includes(encodeURIComponent(photo.storage_path_watermark)))
    ) {
      await serviceSupabase.from('events').update({ cover_image_url: null }).eq('id', event.id);
    }

    const pathsToRemove = [photo.storage_path_original, photo.storage_path_watermark].filter(Boolean);

    if (photo.storage_path_original) {
      await remove('originals', [photo.storage_path_original]);
    }

    if (photo.storage_path_watermark) {
      await remove('photos', [photo.storage_path_watermark]);
    }

    return NextResponse.json({ success: true, removed: pathsToRemove.length });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

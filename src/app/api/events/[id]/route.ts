import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';

async function getActorRole(userId: string) {
  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return { service, role: profile?.role as 'admin' | 'photographer' | 'client' | undefined };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service, role } = await getActorRole(user.id);

    const { data: event } = await service
      .from('events')
      .select('photographer_id')
      .eq('id', id)
      .single();

    if (!event || (event.photographer_id !== user.id && role !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category_id, city, state, date, cover_image_url, status } = body;

    const { data, error } = await service
      .from('events')
      .update({
        name,
        description,
        category_id,
        city,
        state,
        date,
        cover_image_url,
        status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        photographer:profiles(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { service, role } = await getActorRole(user.id);

    const { data: event, error: eventError } = await service
      .from('events')
      .select('id, photographer_id')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.photographer_id !== user.id && role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão para excluir este evento' }, { status: 403 });
    }

    const { data: photos } = await service
      .from('photos')
      .select('id, storage_path_original, storage_path_watermark')
      .eq('event_id', id);

    const photoIds = (photos || []).map((photo) => photo.id);

    if (photoIds.length > 0) {
      await service.from('cart_items').delete().in('photo_id', photoIds);
      await service.from('order_items').delete().in('photo_id', photoIds);
      await service.from('photos').delete().eq('event_id', id);

      const originalPaths = (photos || [])
        .map((photo) => photo.storage_path_original)
        .filter(Boolean);
      const watermarkPaths = (photos || [])
        .map((photo) => photo.storage_path_watermark)
        .filter(Boolean);

      if (originalPaths.length > 0) {
        await service.storage.from('originals').remove(originalPaths);
      }

      if (watermarkPaths.length > 0) {
        await service.storage.from('photos').remove(watermarkPaths);
      }
    }

    const { error: deleteEventError } = await service.from('events').delete().eq('id', id);

    if (deleteEventError) {
      return NextResponse.json({ error: deleteEventError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedPhotos: photoIds.length });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

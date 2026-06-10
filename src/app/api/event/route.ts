import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    }

    const service = createServiceClient();

    const { data, error } = await service
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
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

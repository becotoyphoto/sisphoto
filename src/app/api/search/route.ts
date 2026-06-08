import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const q = searchParams.get('q');

    const service = createServiceClient();

    let query = service
      .from('events')
      .select(`
        id,
        name,
        description,
        city,
        state,
        date,
        status,
        cover_image_url,
        category:categories(id, name, slug),
        photographer:profiles(full_name)
      `)
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(50);

    if (category) {
      query = query.eq('category.slug', category);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

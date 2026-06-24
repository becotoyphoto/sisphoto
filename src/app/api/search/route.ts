import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.trim();
    const city = searchParams.get('city')?.trim();
    const q = searchParams.get('q')?.trim();

    const service = createServiceClient();
    let categoryId: string | null = null;

    if (category) {
      const { data: categoryRow, error: categoryError } = await service
        .from('categories')
        .select('id')
        .eq('slug', category)
        .maybeSingle();

      if (categoryError) {
        console.error('Error resolving category for search:', categoryError);
        return NextResponse.json({ error: categoryError.message }, { status: 500 });
      }

      if (!categoryRow?.id) {
        return NextResponse.json([]);
      }

      categoryId = categoryRow.id;
    }

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

    if (categoryId) {
      query = query.eq('category_id', categoryId);
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

import { createClient } from './supabase-client';
import { getSignedUrl } from '@/lib/storage';

const supabase = createClient();

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface Event {
  id: string;
  photographer_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  city: string;
  state: string;
  date: string;
  cover_image_url: string | null;
  face_search_enabled: boolean;
  status: string;
  category?: Category;
  photographer?: {
    full_name: string;
  };
}

export interface Photo {
  id: string;
  event_id: string;
  storage_path_watermark: string;
  storage_path_original: string;
  price: number;
  metadata: any;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function getEvents({
  category,
  city,
  date,
  search,
  limit = 20,
  offset = 0
}: {
  category?: string;
  city?: string;
  date?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      category:categories(*),
      photographer:profiles(full_name)
    `)
    .eq('status', 'published')
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category.slug', category);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (date) {
    query = query.eq('date', date);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

export async function getEventById(id: string): Promise<Event | null> {
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
    return null;
  }

  return data;
}

export async function getPhotosByEventId(eventId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching photos:', error);
    return [];
  }

  return data || [];
}

export async function getPhotoUrl(storagePath: string, withWatermark: boolean = true): Promise<string> {
  if (!storagePath) return '';

  const bucket = withWatermark ? 'photos' : 'originals';
  
  const { url, error } = await getSignedUrl(bucket, storagePath, 3600);

  if (error || !url) {
    console.error('Error getting signed URL:', error);
    return storagePath;
  }

  return url;
}

export async function getFeaturedEvents(limit: number = 6): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured events:', error);
    return [];
  }

  return data || [];
}

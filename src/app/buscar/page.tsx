import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createServiceClient } from '@/lib/supabase-service';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Buscar eventos | BecoToy',
  description: 'Busque eventos, encontre suas fotos e filtre por categoria ou cidade na BecoToy.',
};

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getInitialData() {
  try {
    const service = createServiceClient();
    const [eventsRes, categoriesRes] = await Promise.all([
      service.from('events')
        .select('id, name, description, city, state, date, cover_image_url, category:categories(id, name, slug)')
        .eq('status', 'published')
        .order('date', { ascending: false })
        .limit(50),
      service.from('categories').select('id, name, slug').order('name'),
    ]);
    const events = (eventsRes.data || []).map((e: any) => ({
      ...e,
      category: Array.isArray(e.category) ? e.category[0] ?? null : e.category ?? null,
    }));
    return { events, categories: categoriesRes.data || [] };
  } catch {
    return { events: [], categories: [] };
  }
}

export default async function SearchPage() {
  const initialData = await getInitialData();
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <SearchPageClient initialEvents={initialData.events} initialCategories={initialData.categories} />
    </Suspense>
  );
}

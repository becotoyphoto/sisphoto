import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase-service';
import CategoriesPageClient from './CategoriesPageClient';

export const metadata: Metadata = {
  title: 'Categorias | BecoToy',
  description: 'Explore todas as categorias de eventos da BecoToy.',
};

async function getCategories() {
  try {
    const service = createServiceClient();
    const { data } = await service.from('categories').select('*').order('name');
    return data || [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesPageClient initialCategories={categories} />;
}

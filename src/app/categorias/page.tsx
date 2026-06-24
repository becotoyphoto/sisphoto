import type { Metadata } from 'next';
import CategoriesPageClient from './CategoriesPageClient';

export const metadata: Metadata = {
  title: 'Categorias | BecoToy',
  description: 'Explore as categorias de eventos da BecoToy e encontre fotos por modalidade, festa ou experiência.',
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}

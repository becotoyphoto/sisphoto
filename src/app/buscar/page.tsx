import type { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Buscar eventos | BecoToy',
  description: 'Busque eventos, encontre suas fotos e filtre por categoria ou cidade na BecoToy.',
};

export default function SearchPage() {
  return <SearchPageClient />;
}

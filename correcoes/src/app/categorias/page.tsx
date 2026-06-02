'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCategories, Category } from '@/lib/database';

const localImages: Record<string, string> = {
  'futebol': '/images/categorias/futebol.jfif',
  'beach-tennis': '/images/categorias/bechtenis.jfif',
  'ciclismo': '/images/categorias/ciclismo.jfif',
  'formaturas': '/images/categorias/formatura.jpg',
  'futsal': '/images/categorias/futsal.jfif',
  'futevolei': '/images/categorias/futvolei.jfif',
  'jiu-jitsu': '/images/categorias/jui-jutsu.jfif',
  'natacao': '/images/categorias/natacao.jfif',
  'automotiva': '/images/categorias/automotivo.jfif',
  'corrida': '/images/categorias/corrida.jpg',
  'grau': '/images/categorias/grau.jfif',
  'motociclismo': '/images/categorias/motocilismo.jfif',
};

const fallbackImages: Record<string, string> = {
  'eventos': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400',
  'volei': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=400',
  'basquete': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400',
  'artes-marciais': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400',
  'surf': 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400',
  'crossfit': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  'padel': '/images/categorias/padel.png',
  'teatro': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=400',
  'tenis': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=400',
  'canoa-havanaina': 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=400',
  'festas': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400',
  'mountain-bike': 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?auto=format&fit=crop&q=80&w=400',
  'treinos': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
  'ginastica': 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&q=80&w=400',
  'hipismo': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400',
  'kite-surf': 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400',
  'trilhas': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=400',
  'altinha': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400',
};

const categoryOrder = [
  'futebol', 'crossfit', 'ciclismo', 'beach-tennis', 'futsal', 'corrida', 'natacao', 'volei',
  'futevolei', 'eventos', 'basquete', 'artes-marciais', 'surf', 'motociclismo', 'formaturas',
  'jiu-jitsu', 'grau', 'padel', 'teatro', 'tenis', 'canoa-havanaina', 'festas', 'automotiva',
  'mountain-bike', 'treinos', 'ginastica', 'hipismo', 'kite-surf', 'trilhas', 'altinha',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const data = await getCategories();
      setCategories(data);
      setIsLoading(false);
    }
    loadCategories();
  }, []);

  const getImageUrl = (category: Category): string => {
    return localImages[category.slug] || fallbackImages[category.slug] || fallbackImages['eventos'];
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.slug);
    const bIndex = categoryOrder.indexOf(b.slug);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Todas as Categorias</h1>
        <p className="text-muted-foreground text-lg">
          Explore fotos de diversos tipos de eventos e atividades
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedCategories.map((category) => (
          <Link
            key={category.id}
            href={`/buscar?categoria=${category.slug}`}
            className="group relative aspect-square rounded-2xl overflow-hidden hover:ring-2 hover:ring-primary transition-all"
          >
            <img
              src={getImageUrl(category)}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white drop-shadow-lg">{category.name}</span>
                <ArrowRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

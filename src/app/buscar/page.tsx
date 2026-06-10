'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, MapPin, Calendar, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatLocalDate } from '@/lib/utils';

interface SearchEvent {
  id: string;
  name: string;
  description: string | null;
  city: string;
  state: string;
  date: string;
  cover_image_url: string | null;
  category: { id: string; name: string; slug: string } | null;
}

interface SearchCategory {
  id: string;
  name: string;
  slug: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<SearchEvent[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('categoria') || '');
  const [city, setCity] = useState(searchParams.get('cidade') || '');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (searchTerm) params.set('q', searchTerm);

      try {
        const [eventsRes, categoriesRes] = await Promise.all([
          fetch(`/api/search?${params.toString()}`),
          fetch('/api/categories')
        ]);

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        } else {
          setEvents([]);
        }
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Error loading search data:', err);
        setEvents([]);
      }
      setIsLoading(false);
    }
    loadData();
  }, [category, city, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    async function runSearch() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (searchTerm) params.set('q', searchTerm);

      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const eventsData = await res.json();
          setEvents(eventsData);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error('Error searching events:', err);
        setEvents([]);
      }
      setIsLoading(false);
    }
    runSearch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 space-y-6">
          <div className="flex items-center gap-2 font-bold text-lg mb-4">
            <Filter className="h-5 w-5" />
            Filtros
          </div>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Nome do evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 pl-10 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 text-white border border-white/10 rounded-lg p-2 focus:ring-primary focus:outline-none"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <input 
                type="text" 
                placeholder="Ex: São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 py-2 rounded-lg font-medium transition-colors"
            >
              Filtrar
            </button>
          </form>
        </aside>

        {/* Results */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Eventos Encontrados</h1>
            <span className="text-muted-foreground text-sm">{events.length} resultados</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-muted-foreground mb-4">Nenhum evento encontrado.</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="group bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all"
                >
                  <div className="relative h-48 overflow-hidden">
                    {event.cover_image_url ? (
                      <img 
                        src={event.cover_image_url} 
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-4xl">📷</span>
                      </div>
                    )}
                    {event.category && (
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
                        {event.category.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{event.name}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.city}, {event.state}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatLocalDate(event.date)}
                      </div>
                    </div>
                    
                    <Link 
                      href={`/evento/${event.id}`}
                      className="block w-full text-center bg-primary/10 hover:bg-primary text-primary hover:text-white py-2 rounded-lg font-medium transition-all"
                    >
                      Ver fotos
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

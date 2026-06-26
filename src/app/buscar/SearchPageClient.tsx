'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Search, MapPin, Calendar, Filter, Loader2, X, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface SearchPageClientProps {
  initialEvents?: SearchEvent[];
  initialCategories?: SearchCategory[];
}

function SearchContent({ initialEvents = [], initialCategories = [] }: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<SearchEvent[]>(initialEvents);
  const [categories, setCategories] = useState<SearchCategory[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Sincroniza estado local com URL apenas no mount
  const [initialized, setInitialized] = useState(false);
  const hasFetched = useRef(false);
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setCategory(searchParams.get('categoria') || '');
    setCity(searchParams.get('cidade') || '');
    setDateFrom(searchParams.get('data') || '');
    setSortBy(searchParams.get('ordenar') || 'recent');
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Busca dados quando filtros mudam (após inicialização)
  useEffect(() => {
    if (!initialized) return;
    // No mount inicial com dados do servidor, não re-fetcha
    // (mesmo que events esteja vazio, o SSR já retornou o resultado correto)
    const hasFilters = Boolean(category || city || searchTerm || dateFrom);
    const isInitialMount = !hasFilters && !hasFetched.current;
    if (isInitialMount) {
      hasFetched.current = true;
      return;
    }
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (city) params.set('city', city);
      if (searchTerm) params.set('q', searchTerm);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const [eventsRes, categoriesRes] = await Promise.all([
          fetch(`/api/search?${params.toString()}`, { signal: controller.signal }),
          fetch('/api/categories', { signal: controller.signal })
        ]);
        clearTimeout(timeoutId);

        if (cancelled) return;

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
        if (!cancelled) {
          console.error('Error loading search data:', err);
          setEvents([]);
        }
      }
      if (!cancelled) setIsLoading(false);
    }
    loadData();

    return () => { cancelled = true; };
  }, [initialized, category, city, searchTerm, dateFrom]);

  // Filtragem por data e ordenação local
  const filteredAndSortedEvents = events
    .filter((event) => {
      if (dateFrom) {
        return event.date >= dateFrom;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.date.localeCompare(b.date);
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'recent':
        default:
          return b.date.localeCompare(a.date);
      }
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    async function runSearch() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('categoria', category);
      if (city) params.set('cidade', city);
      if (searchTerm) params.set('q', searchTerm);
      if (dateFrom) params.set('data', dateFrom);
      if (sortBy !== 'recent') params.set('ordenar', sortBy);

      router.replace(params.toString() ? `/buscar?${params.toString()}` : '/buscar');

      const apiParams = new URLSearchParams();
      if (category) apiParams.set('category', category);
      if (city) apiParams.set('city', city);
      if (searchTerm) apiParams.set('q', searchTerm);

      try {
        const res = await fetch(`/api/search?${apiParams.toString()}`);
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

            <div>
              <label className="block text-sm font-medium mb-2">Data a partir de</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 py-2 rounded-lg font-medium transition-colors"
            >
              Filtrar
            </button>

            {(searchTerm || category || city || dateFrom) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategory('');
                  setCity('');
                  setDateFrom('');
                  setSortBy('recent');
                  router.replace('/buscar');
                  // Re-fetch sem filtros
                  setIsLoading(true);
                  Promise.all([
                    fetch('/api/search').then((r) => r.json()),
                    fetch('/api/categories').then((r) => r.json()),
                  ]).then(([eventsData, categoriesData]) => {
                    setEvents(eventsData);
                    setCategories(categoriesData);
                    setIsLoading(false);
                  }).catch(() => {
                    setEvents([]);
                    setIsLoading(false);
                  });
                }}
                className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Limpar filtros
              </button>
            )}
          </form>
        </aside>

        <section className="flex-1">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Eventos Encontrados</h1>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">
                {filteredAndSortedEvents.length} evento{filteredAndSortedEvents.length !== 1 ? 's' : ''} encontrado{filteredAndSortedEvents.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:ring-primary focus:outline-none"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="name">Nome A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags de filtros ativos */}
          {(searchTerm || category || city || dateFrom) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  Busca: {searchTerm}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                    }}
                    className="hover:text-primary/70 ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  Categoria: {categories.find((c) => c.slug === category)?.name || category}
                  <button
                    onClick={() => {
                      setCategory('');
                    }}
                    className="hover:text-primary/70 ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  Cidade: {city}
                  <button
                    onClick={() => {
                      setCity('');
                    }}
                    className="hover:text-primary/70 ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {dateFrom && (
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  A partir de: {new Date(dateFrom + 'T00:00:00').toLocaleDateString('pt-BR')}
                  <button
                    onClick={() => {
                      setDateFrom('');
                    }}
                    className="hover:text-primary/70 ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-muted-foreground mb-4">Nenhum evento encontrado.</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedEvents.map((event) => (
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
        </section>
      </div>
    </div>
  );
}

export default function SearchPageClient({ initialEvents, initialCategories }: SearchPageClientProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent initialEvents={initialEvents} initialCategories={initialCategories} />
    </Suspense>
  );
}

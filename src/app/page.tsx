'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Search, Camera, Star, Award, Users, Zap, Shield, CreditCard, Smartphone, TrendingUp, Gift, Trophy, Dumbbell, Bike, Waves, GraduationCap, PartyPopper, Play, Target, Car, Dumbbell as Gym, Wind, Mountain, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCategoryImageUrl } from '@/lib/category-images';

const TrustBadges = dynamic(() => import('@/components/TrustBadges'), { ssr: true });
const FaqSection = dynamic(() => import('@/components/FaqSection'), { ssr: false });
const TestimonialHighlight = dynamic(() => import('@/components/TestimonialHighlight'), { ssr: true });

const categories = [
  { name: 'Futebol', slug: 'futebol', icon: Trophy },
  { name: 'Crossfit', slug: 'crossfit', icon: Gym },
  { name: 'Ciclismo', slug: 'ciclismo', icon: Bike },
  { name: 'Beach Tennis', slug: 'beach-tennis', icon: Waves },
  { name: 'Futsal', slug: 'futsal', icon: Trophy },
  { name: 'Corrida', slug: 'corrida', icon: Play },
  { name: 'Natação', slug: 'natacao', icon: Waves },
  { name: 'Vôlei', slug: 'volei', icon: Target },
  { name: 'Futevôlei', slug: 'futevolei', icon: Waves },
  { name: 'Eventos', slug: 'eventos', icon: PartyPopper },
  { name: 'Basquete', slug: 'basquete', icon: Target },
  { name: 'Artes Marciais', slug: 'artes-marciais', icon: Trophy },
  { name: 'Surf', slug: 'surf', icon: Waves },
  { name: 'Motociclismo', slug: 'motociclismo', icon: Bike },
  { name: 'Formaturas', slug: 'formaturas', icon: GraduationCap },
  { name: 'Jiu-jítsu', slug: 'jiu-jitsu', icon: Trophy },
  { name: 'Grau', slug: 'grau', icon: Bike },
  { name: 'Padel', slug: 'padel', icon: Target },
  { name: 'Teatro e Musicais', slug: 'teatro', icon: PartyPopper },
  { name: 'Tênis', slug: 'tenis', icon: Target },
  { name: 'Canoa Havanaina', slug: 'canoa-havanaina', icon: Waves },
  { name: 'Festas', slug: 'festas', icon: PartyPopper },
  { name: 'Automotiva', slug: 'automotiva', icon: Car },
  { name: 'Montain Bike', slug: 'mountain-bike', icon: Mountain },
  { name: 'Treinos', slug: 'treinos', icon: Gym },
  { name: 'Ginástica', slug: 'ginastica', icon: Gym },
  { name: 'Hipismo', slug: 'hipismo', icon: Trophy },
  { name: 'Kite Surf', slug: 'kite-surf', icon: Wind },
  { name: 'Trilhas', slug: 'trilhas', icon: Mountain },
  { name: 'Altinha', slug: 'altinha', icon: Trophy },
];

const mobileCategorySlugs = ['futebol', 'corrida', 'eventos', 'futevolei'];
const mobileCategories = categories.filter(c => mobileCategorySlugs.includes(c.slug));
const heroBackgroundSlugs = [
  'futebol',
  'corrida',
  'eventos',
  'futevolei',
  'ciclismo',
  'crossfit',
  'beach-tennis',
  'natacao',
  'basquete',
  'motociclismo',
  'formaturas',
  'surf',
];

const cities = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Salvador',
  'Curitiba', 'Fortaleza', 'Brasília', 'Manaus', 'Recife', 'Belém', 'Goiânia',
  'Campinas', 'São Luís', 'Maceió', 'Natal', 'João Pessoa', 'Teresina', 'Florianópolis'
];

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) {
      router.push(`/buscar?q=${encodeURIComponent(term)}`);
    } else {
      router.push('/buscar');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="grid h-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2 opacity-50">
            {heroBackgroundSlugs.map((slug, index) => (
              <div
                key={`${slug}-${index}`}
                className="relative min-h-[110px] sm:min-h-[140px] lg:min-h-[170px] overflow-hidden rounded-2xl bg-black/40"
              >
                <Image
                  src={getCategoryImageUrl(slug)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover"
                  loading={index < 3 ? "eager" : "lazy"}
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/35" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/50" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white">
              Reviva cada vitória.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Suas fotos em alta resolução.
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Corrida, futebol, formatura e muito mais — encontre e compre fotos dos seus melhores momentos
            </p>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Buscar evento, categoria ou fotógrafo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-white/20 rounded-full py-5 pl-16 pr-24 text-lg focus:ring-2 focus:ring-primary focus:outline-none shadow-xl"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors duration-200"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Categories Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Categorias</h2>
            <Link href="/categorias" className="text-primary hover:underline font-medium flex items-center gap-2">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Mobile: only 4 specific categories */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            {mobileCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.slug}
                  href={`/buscar?categoria=${category.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-primary transition-all duration-300"
                >
                  <Image 
                    src={getCategoryImageUrl(category.slug)}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 0px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-white" />
                      <span className="text-xs font-bold text-white drop-shadow-lg">{category.name}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {/* Desktop: show 12 categories */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.slug}
                  href={`/buscar?categoria=${category.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-primary transition-all duration-300"
                >
                  <Image 
                    src={getCategoryImageUrl(category.slug)}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 0px, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-white" />
                      <span className="text-xs font-bold text-white drop-shadow-lg">{category.name}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Para Fotógrafos */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold mb-4">
                Para Fotógrafos
              </span>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                A melhor plataforma para vender fotos online.
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                A BecoToy conecta seu talento a quem valoriza seu trabalho.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Pagamentos via PIX</h3>
                    <p className="text-sm text-muted-foreground">Receba direto na sua conta</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Saques instantâneos</h3>
                    <p className="text-sm text-muted-foreground">Sem burocracia, na hora</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Reconhecimento facial</h3>
                    <p className="text-sm text-muted-foreground">Encontre fotos automaticamente</p>
                  </div>
                </div>
              </div>
              
              <Link 
                href="/fotografo/cadastro" 
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-8 py-4 rounded-full font-bold mt-8 transition-all shadow-xl shadow-primary/30"
              >
                Comece grátis!
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-2xl opacity-20" />
              <Image 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80" 
                alt="Fotógrafo profissional"
                width={600}
                height={400}
                className="relative rounded-3xl shadow-2xl object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher a BecoToy?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">100% Seguro</h3>
              <p className="text-muted-foreground">Suas fotos estão protegidas com segurança de nível bancário</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Baixe em qualquer lugar</h3>
              <p className="text-muted-foreground">Acesse suas fotos pelo celular, tablet ou computador</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Entrega rápida</h3>
              <p className="text-muted-foreground">Suas fotos disponíveis em até 48 horas após o evento</p>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimento destaque */}
      <TestimonialHighlight
        quote="A BecoToy transformou meu negócio. Em 3 meses, tripliquei minhas vendas de fotos de corrida. O reconhecimento facial é um diferencial incrível — meus clientes encontram as fotos em segundos."
        authorName="Ricardo Mendes"
        authorCity="São Paulo, SP"
        authorRole="Fotógrafo de corridas"
      />

      {/* Cidades */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Fotos em todo o Brasil</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/buscar?cidade=${encodeURIComponent(city)}`}
                className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-full text-sm font-medium transition-all"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />
    </div>
  );
}

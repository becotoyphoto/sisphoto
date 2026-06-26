import { Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center text-center">
      <span className="text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-none select-none">
        404
      </span>

      <h1 className="mt-8 text-3xl md:text-4xl font-bold">
        Página não encontrada
      </h1>

      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        A página que você procura não existe ou foi movida. Tente voltar ao
        início ou explore nossos eventos disponíveis.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-lg shadow-primary/25"
        >
          <Home className="h-5 w-5" />
          Voltar ao início
        </Link>

        <Link
          href="/buscar"
          className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 font-semibold px-8 py-3 rounded-full transition-colors duration-200"
        >
          <Search className="h-5 w-5" />
          Buscar eventos
        </Link>
      </div>
    </div>
  );
}

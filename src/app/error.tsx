'use client';

import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center text-center">
      <div className="p-5 bg-destructive/10 rounded-2xl mb-8">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold">
        Algo deu errado
      </h1>

      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou volte ao início.
      </p>

      {error.message && (
        <div className="mt-6 w-full max-w-lg bg-card border border-border rounded-2xl p-4 text-left">
          <p className="text-sm text-muted-foreground break-words">
            {error.message}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-lg shadow-primary/25"
        >
          Tentar novamente
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-card hover:bg-muted border border-border font-semibold px-8 py-3 rounded-full transition-colors duration-200"
        >
          <Home className="h-5 w-5" />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

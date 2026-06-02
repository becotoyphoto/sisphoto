'use client';

import Link from 'next/link';
import { Camera, ShoppingCart, User, Menu, LogOut, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              FotoEvento Brasil
            </span>
          </Link>

          <div className="hidden md:flex items-baseline space-x-4">
            <Link href="/" className="hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Início</Link>
            <Link href="/buscar" className="hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Buscar fotos</Link>
            <Link href="/categorias" className="hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Categorias</Link>
            <Link href="/fotografo" className="hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Sou fotógrafo</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/carrinho" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={profile?.role === 'admin' ? '/dashboard/admin' : profile?.role === 'photographer' ? '/dashboard/fotografo' : '/dashboard/cliente'}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  <User className="h-4 w-4" />
                  {profile?.full_name || user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-destructive"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/cadastrar" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  <User className="h-4 w-4" />
                  Criar conta
                </Link>
                <Link href="/login" className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                  <User className="h-4 w-4" />
                  Entrar
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-md hover:bg-white/5">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Início</Link>
            <Link href="/buscar" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Buscar fotos</Link>
            <Link href="/categorias" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Categorias</Link>
            <Link href="/fotografo" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Sou fotógrafo</Link>
            <Link href="/carrinho" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-primary">
              Carrinho ({itemCount})
            </Link>
            {user ? (
              <>
                <Link href="/dashboard/cliente" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium bg-white/5">Minha Conta</Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-white/5"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/cadastrar" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium bg-white/5 mt-4">Criar conta</Link>
                <Link href="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium bg-primary mt-2 text-center">Entrar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, LogOut, ChevronDown, Camera, ScanFace, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    if (servicesOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [servicesOpen]);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.replace('/');
    router.refresh();
  };

  const dashboardHref =
    profile?.role === 'admin'
      ? '/dashboard/admin'
      : profile?.role === 'photographer'
        ? '/dashboard/fotografo'
        : '/dashboard/cliente';

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo />
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Início</Link>
              <Link href="/categorias" className="hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Categorias</Link>
              {/* Services Dropdown */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className="flex items-center gap-1 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Serviços
                  <ChevronDown className={`h-3 w-3 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {servicesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
                    <Link href="/buscar" onClick={() => setServicesOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Buscar fotos</p>
                        <p className="text-xs text-muted-foreground">Encontre fotos de eventos</p>
                      </div>
                    </Link>
                    <Link href="/buscar?reconhecimento=true" onClick={() => setServicesOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <ScanFace className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Reconhecimento facial</p>
                        <p className="text-xs text-muted-foreground">Encontre com uma selfie</p>
                      </div>
                    </Link>
                    <Link href="/fotografo" onClick={() => setServicesOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Sou fotógrafo</p>
                        <p className="text-xs text-muted-foreground">Venda suas fotos</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/carrinho" aria-label="Carrinho" title="Carrinho" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-2">
                {profile?.role === 'admin' && (
                  <Link href="/dashboard/admin" className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <Link href={dashboardHref} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium transition-colors">
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
                <Link href="/cadastrar" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                  Criar conta
                </Link>
                <Link href="/login" className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                  Entrar
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {user ? (
              <>
                <Link href="/carrinho" aria-label="Carrinho" title="Carrinho" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link href={dashboardHref} className="flex items-center gap-1 text-xs font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                  <User className="h-3.5 w-3.5" />
                  {profile?.full_name?.split(' ')[0] || 'Conta'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-1 text-xs font-medium bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors">
                  <User className="h-3.5 w-3.5" />
                  Entrar
                </Link>
                <Link href="/cadastrar" className="flex items-center gap-1 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                  Criar conta
                </Link>
              </>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-white/5">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Início</Link>
            <Link href="/buscar" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Buscar fotos</Link>
            <Link href="/categorias" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Categorias</Link>
            <Link href="/fotografo" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/5">Sou fotógrafo</Link>
            <Link href="/carrinho" className="block px-3 py-2 rounded-md text-base font-medium text-primary">
              Carrinho ({itemCount})
            </Link>
            
            {user ? (
              <>
                {profile?.role === 'admin' && (
                  <Link href="/dashboard/admin" className="block px-3 py-2 rounded-md text-base font-medium bg-primary/10 text-primary">Admin</Link>
                )}
                <Link href={dashboardHref} className="block px-3 py-2 rounded-md text-base font-medium bg-white/5">Minha Conta</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-white/5"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/cadastrar" className="block px-3 py-2 rounded-md text-base font-medium bg-white/5 mt-4">Criar conta</Link>
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium bg-primary mt-2 text-center">Entrar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, ShoppingCart, Image as ImageIcon, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const accountHref =
    profile?.role === 'admin'
      ? '/dashboard/admin'
      : profile?.role === 'photographer'
        ? '/dashboard/fotografo'
        : '/dashboard/cliente';
  const accountLabel = profile?.role === 'photographer' ? 'Painel' : 'Suas fotos';
  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/buscar', label: 'Buscar', icon: Search },
    { href: '/carrinho', label: 'Carrinho', icon: ShoppingCart },
    { href: user ? accountHref : '/login', label: accountLabel, icon: ImageIcon },
    { href: '#opcoes', label: 'Opções', icon: Menu },
  ];

  const handleLogout = async () => {
    try {
      setOpen(false);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.replace('/');
    router.refresh();
  };

  return (
    <>
      {/* Drawer de opções */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-24 left-4 right-4 rounded-3xl border border-border bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#282F3D]">Menu</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-[#475366] hover:text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <Link href="/categorias" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-muted text-[#282F3D]">Categorias</Link>
              <Link href="/fotografo" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-muted text-[#282F3D]">Sou fotógrafo</Link>
            {user ? (
              <>
                <Link href={accountHref} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-muted text-[#282F3D]">
                  Minha conta
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left font-medium text-destructive hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                  <Link href="/login" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-muted text-[#282F3D]">Entrar</Link>
                  <Link href="/cadastrar" onClick={() => setOpen(false)} className="block rounded-2xl bg-primary px-4 py-3 text-center font-medium text-white rounded-2xl">Criar conta</Link>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-4 z-50 px-3">
        <div className="mx-auto max-w-md rounded-[28px] border border-border bg-white text-[#282F3D] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
          <div className="grid h-[74px] grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.href !== '#opcoes' && pathname === tab.href;
            const showBadge = tab.href === '/carrinho' && itemCount > 0;

            if (tab.href === '#opcoes') {
              return (
                <button
                  key={tab.label}
                  onClick={() => setOpen((v) => !v)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[24px] text-[11px] transition-colors ${
                    open ? 'text-primary' : 'text-[#798AA3] hover:text-[#282F3D]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative mx-1 my-2 flex flex-col items-center justify-center gap-1 text-[11px] transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-[#798AA3] hover:text-[#282F3D]'
                }`}
              >
                <span className={`relative flex items-center justify-center ${isActive ? 'rounded-xl bg-primary/10 p-1' : ''}`}>
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white animate-pulse">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
                {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-primary" />}
              </Link>
            );
          })}
          </div>
        </div>
      </nav>
    </>
  );
}

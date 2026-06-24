'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, ShoppingCart, Image as ImageIcon, LogOut, Menu } from 'lucide-react';
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
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-24 left-4 right-4 rounded-3xl border border-white/10 bg-black/85 p-4 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <Link href="/categorias" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-white/10">Categorias</Link>
              <Link href="/fotografo" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-white/10">Sou fotógrafo</Link>
            {user ? (
              <>
                <Link href={accountHref} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-white/10">
                  Minha conta
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left font-medium text-red-300 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <>
                  <Link href="/login" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-medium hover:bg-white/10">Entrar</Link>
                  <Link href="/cadastrar" onClick={() => setOpen(false)} className="block rounded-2xl bg-primary px-4 py-3 text-center font-medium text-white">Criar conta</Link>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-4 z-50 px-3">
        <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-white/95 text-slate-700 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:bg-[#0f172a]/90 dark:text-slate-200">
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
                    open ? 'text-primary' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
                className={`relative mx-1 my-2 flex flex-col items-center justify-center gap-1 rounded-[24px] text-[11px] transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {showBadge && (
                  <span className="absolute right-1/2 top-1 translate-x-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            );
          })}
          </div>
        </div>
      </nav>
    </>
  );
}

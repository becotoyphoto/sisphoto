'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, Image as ImageIcon, Menu } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
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

  return (
    <>
      {/* Drawer de opções */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 glass border-t border-white/10 p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href="/categorias" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-white/10 font-medium">Categorias</Link>
            <Link href="/fotografo" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-white/10 font-medium">Sou fotógrafo</Link>
            {user ? (
              <Link href={accountHref} onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-white/10 font-medium">
                Minha conta
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-white/10 font-medium">Entrar</Link>
                <Link href="/cadastrar" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg bg-primary text-center font-medium">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.href !== '#opcoes' && pathname === tab.href;
            const showBadge = tab.href === '/carrinho' && itemCount > 0;

            if (tab.href === '#opcoes') {
              return (
                <button
                  key={tab.label}
                  onClick={() => setOpen((v) => !v)}
                  className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                className={`relative flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {showBadge && (
                  <span className="absolute top-1 right-1/2 translate-x-4 bg-primary text-white text-[9px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

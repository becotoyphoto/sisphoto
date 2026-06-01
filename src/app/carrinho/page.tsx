'use client';

import { Trash2, CreditCard, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, total, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    
    const data = await response.json();
    
    if (data.init_point) {
      window.location.href = data.init_point;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Seu Carrinho
        </h1>
        <Link href="/buscar" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Continuar comprando
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-card border border-white/10 p-4 rounded-2xl">
                <img 
                  src={item.image_url || 'https://via.placeholder.com/100'} 
                  alt="Item do carrinho"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-sm line-clamp-1">{item.event_name}</h3>
                  <p className="text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => removeItem(item.photo_id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-card border border-white/10 rounded-2xl">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
              <Link 
                href="/buscar"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors"
              >
                Buscar fotos
              </Link>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-white/10 p-6 rounded-2xl sticky top-24">
            <h2 className="text-xl font-bold mb-6">Resumo</h2>
            
            {items.length > 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Itens ({items.length})</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-primary hover:bg-primary/90 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                >
                  <CreditCard className="h-5 w-5" />
                  Pagar com Mercado Pago
                </button>
                
                <button 
                  onClick={clearCart}
                  className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar carrinho
                </button>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Adicione fotos ao carrinho para continuar.
              </p>
            )}
            
            <p className="text-center text-[10px] text-muted-foreground mt-4">
              Ao clicar em pagar, você concorda com nossos Termos de Uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

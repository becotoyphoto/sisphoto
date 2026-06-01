'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase-client';

export interface CartItem {
  id: string;
  photo_id: string;
  event_id: string;
  event_name: string;
  image_url: string;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  cartId: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (photoId: string) => Promise<void>;
  clearCart: () => void;
  isInCart: (photoId: string) => boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const savedCart = localStorage.getItem('fotoevento_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fotoevento_cart', JSON.stringify(items));
  }, [items]);

  const syncWithServer = async () => {
    if (cartId) {
      const { data } = await supabase
        .from('cart_items')
        .select(`
          *,
          photo:photos (
            storage_path_watermark,
            event:events (name)
          )
        `)
        .eq('cart_id', cartId);

      if (data) {
        const serverItems = data.map((item: any) => ({
          id: item.id,
          photo_id: item.photo_id,
          event_id: item.photo?.event?.id || '',
          event_name: item.photo?.event?.name || 'Evento',
          image_url: '',
          price: item.price,
        }));
        setItems(serverItems);
      }
    }
  };

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    if (items.some(i => i.photo_id === item.photo_id)) {
      return;
    }

    setItems(prev => [...prev, { ...item, id: `${Date.now()}-${item.photo_id}` }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        let { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!cart) {
          const { data: newCart } = await supabase
            .from('carts')
            .insert({ user_id: user.id, status: 'active' })
            .select()
            .single();
          
          cart = newCart;
          if (cart) setCartId(cart.id);
        }

        if (cart) {
          await supabase.from('cart_items').insert({
            cart_id: cart.id,
            photo_id: item.photo_id,
            price: item.price,
          });
        }
      }
    } catch (error) {
      console.error('Error syncing cart with server:', error);
    }
  };

  const removeItem = async (photoId: string) => {
    setItems(prev => prev.filter(item => item.photo_id !== photoId));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && cartId) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId)
          .eq('photo_id', photoId);
      }
    } catch (error) {
      console.error('Error removing item from server:', error);
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('fotoevento_cart');
  };

  const isInCart = (photoId: string) => {
    return items.some(item => item.photo_id === photoId);
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        cartId,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

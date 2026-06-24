'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

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

function getCartStorageKey(userId: string | null) {
  return userId ? `fotoevento_cart:${userId}` : 'fotoevento_cart:guest';
}

function parseStoredCart(userId: string | null): CartItem[] {
  try {
    const savedCart = localStorage.getItem(getCartStorageKey(userId));
    return savedCart ? (JSON.parse(savedCart) as CartItem[]) : [];
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) return;

    let active = true;

    const loadCart = async () => {
      setIsLoading(true);

      const localItems = parseStoredCart(user?.id ?? null);
      if (!active) return;

      if (!user) {
        setCartId(null);
        setItems(localItems);
        setIsLoading(false);
        return;
      }

      try {
        const { data: cart, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (cartError) {
          throw cartError;
        }

        if (!active) return;

        if (!cart?.id) {
          setCartId(null);
          setItems(localItems);
          return;
        }

        setCartId(cart.id);

        const { data: serverItemsRaw, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id,
            photo_id,
            price,
            photo:photos (
              event_id,
              event:events (name)
            )
          `)
          .eq('cart_id', cart.id);

        if (itemsError) {
          throw itemsError;
        }

        if (!active) return;

        const serverItems: CartItem[] = (serverItemsRaw ?? []).map((item: any) => ({
          id: item.id,
          photo_id: item.photo_id,
          event_id: item.photo?.event_id || '',
          event_name: item.photo?.event?.name || 'Evento',
          image_url: '',
          price: item.price,
        }));

        setItems(serverItems);
      } catch (error) {
        console.error('Error loading cart:', error);
        if (active) {
          setCartId(null);
          setItems(localItems);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      active = false;
    };
  }, [isAuthLoading, supabase, user?.id]);

  useEffect(() => {
    if (isAuthLoading) return;
    localStorage.setItem(getCartStorageKey(user?.id ?? null), JSON.stringify(items));
  }, [isAuthLoading, items, user?.id]);

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
        }

        if (cart) {
          setCartId(cart.id);
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
    localStorage.removeItem(getCartStorageKey(user?.id ?? null));

    if (user && cartId) {
      void supabase.from('cart_items').delete().eq('cart_id', cartId);
    }
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

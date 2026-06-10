'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Download, Loader2, Camera, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
  id: string;
  order_id: string;
  photo_id: string;
  price_at_purchase: number;
  photo: {
    id: string;
    storage_path_watermark: string;
    storage_path_original: string;
    price: number;
    thumbnail_url: string | null;
  } | null;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  mercadopago_id: string | null;
  created_at: string;
  items: OrderItem[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const statusLabel: Record<string, { label: string; icon: any; color: string }> = {
  paid: { label: 'Pago', icon: CheckCircle, color: 'text-green-500' },
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-500' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-500' },
};

export default function ClientDashboard() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && profile?.role === 'photographer') {
      router.push('/dashboard/fotografo');
      return;
    }

    if (!authLoading && user && profile?.role === 'admin') {
      router.push('/dashboard/admin');
      return;
    }

    if (!authLoading && user) {
      loadOrders();
    }
  }, [user, profile, authLoading, router]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders/my');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
    setIsLoading(false);
  };

  const handleDownload = async (photoId: string) => {
    setDownloading(photoId);
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao baixar foto');
        return;
      }

      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading:', err);
      alert('Erro ao baixar foto');
    }
    setDownloading(null);
  };

  const handleDownloadAll = async (items: OrderItem[]) => {
    const paidItems = items.filter(item => item.photo?.storage_path_original);
    for (const item of paidItems) {
      await handleDownload(item.photo_id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const totalCompras = orders.length;
  const totalFotos = orders.reduce((sum, o) => sum + o.items.length, 0);
  const totalGasto = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const paidOrders = orders.filter(o => o.status === 'paid');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground">Bem-vindo, {profile?.full_name || 'Cliente'}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/buscar"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Camera className="h-4 w-4" />
            Buscar fotos
          </Link>
          <button
            onClick={signOut}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total de compras</p>
          <p className="text-3xl font-bold">{totalCompras}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Fotos compradas</p>
          <p className="text-3xl font-bold">{totalFotos}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Valor total gasto</p>
          <p className="text-3xl font-bold text-primary">{formatPrice(totalGasto)}</p>
        </div>
      </div>

      {/* Orders List */}
      <h2 className="text-2xl font-bold mb-6">Minhas Compras</h2>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground mb-2">Você ainda não tem compras</p>
          <p className="text-sm text-muted-foreground mb-6">
            Busque por eventos e encontre suas fotos!
          </p>
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors"
          >
            <Camera className="h-4 w-4" />
            Buscar eventos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = statusLabel[order.status] || statusLabel.pending;
            const StatusIcon = statusInfo.icon;
            const isPaid = order.status === 'paid';

            return (
              <div key={order.id} className="bg-card border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{formatPrice(order.total_amount)}</span>
                    {isPaid && order.items.length > 1 && (
                      <button
                        onClick={() => handleDownloadAll(order.items)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Baixar todas
                      </button>
                    )}
                  </div>
                </div>

                {order.items.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="relative group aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/10">
                        {item.photo?.thumbnail_url ? (
                          <img
                            src={item.photo.thumbnail_url}
                            alt="Foto"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        {isPaid && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => handleDownload(item.photo_id)}
                              disabled={downloading === item.photo_id}
                              className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                            >
                              {downloading === item.photo_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                              {downloading === item.photo_id ? '...' : 'Baixar'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {order.items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum item neste pedido.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

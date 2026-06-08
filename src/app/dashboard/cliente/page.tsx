'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Camera, Download, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const mockOrders = [
  {
    id: '1',
    eventName: 'Maratona de São Paulo 2024',
    date: '21/04/2024',
    photos: 5,
    total: 75.00,
    status: 'paid',
    images: [
      'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=200',
    ]
  },
  {
    id: '2',
    eventName: 'Copa Regional Curitiba',
    date: '15/05/2024',
    photos: 3,
    total: 45.00,
    status: 'paid',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=200',
    ]
  }
];

export default function ClientDashboard() {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && profile?.role === 'photographer') {
      router.push('/dashboard/fotografo');
      return;
    }

    if (!isLoading && user && profile?.role === 'admin') {
      router.push('/dashboard/admin');
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Minha Conta</h1>
          <p className="text-muted-foreground">Bem-vindo, {profile?.full_name || user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/cliente" 
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium"
          >
            Minhas Compras
          </Link>
          <button 
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-all"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total de compras</p>
              <p className="text-2xl font-bold">{mockOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Camera className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Fotos compradas</p>
              <p className="text-2xl font-bold">{mockOrders.reduce((acc, o) => acc + o.photos, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <CheckCircle className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Valor total gasto</p>
              <p className="text-2xl font-bold">R$ {mockOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-xl font-bold mb-6">Minhas Compras</h2>
        
        <div className="space-y-6">
          {mockOrders.map((order) => (
            <div key={order.id} className="bg-card border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{order.eventName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {order.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        {order.photos} fotos
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-green-500">R$ {order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">Suas fotos:</p>
                  <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-all">
                    <Download className="h-4 w-4" />
                    Baixar todas
                  </button>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {order.images.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img 
                        src={img} 
                        alt={`Foto ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Download className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

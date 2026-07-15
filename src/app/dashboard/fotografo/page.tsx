'use client';

import { useState, useEffect, useEffectEvent } from 'react';
import { Plus, Camera, DollarSign, Image as ImageIcon, Loader2, MapPin, Upload, Eye, EyeOff, TrendingUp, Wallet, ArrowRight, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { formatLocalDate } from '@/lib/utils';
import RoleGuard from '@/components/RoleGuard';

// #region debug-point photographer-dashboard-1
const DEBUG_SERVER_URL = process.env.NEXT_PUBLIC_DEBUG_SERVER_URL || 'http://127.0.0.1:7777/event';
const DEBUG_SESSION_ID = 'photos-not-appearing-dashboard';
async function debugLog(event: string, data: Record<string, unknown>) {
  try {
    await fetch(DEBUG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: DEBUG_SESSION_ID, event, ...data, timestamp: new Date().toISOString() }),
    });
  } catch {}
}
// #endregion debug-point photographer-dashboard-1

interface PhotographerEvent {
  id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  status: string;
  cover_image_url: string | null;
  category: { name: string } | null;
  photos: { count: number }[];
}

interface SalesData {
  totalSales: number;
  totalPhotosSold: number;
  photographerEarnings: number;
  platformCommission: number;
  pendingWithdrawals: number;
}

function getEventStatusInfo(event: PhotographerEvent, hasSales: boolean) {
  const photoCount = event.photos?.[0]?.count || 0;
  const isPublished = event.status === 'published';

  if (isPublished && hasSales) {
    return { label: 'Com Vendas', color: 'bg-purple-500/10 text-purple-500', icon: Sparkles };
  }
  if (isPublished) {
    return { label: 'Publicado', color: 'bg-green-500/10 text-green-500', icon: null };
  }
  if (photoCount > 0) {
    return { label: 'Fotos Enviadas', color: 'bg-blue-500/10 text-blue-500', icon: null };
  }
  return { label: 'Rascunho', color: 'bg-yellow-500/10 text-yellow-500', icon: null };
}

export default function PhotographerDashboardPage() {
  return (
    <RoleGuard allowedRoles={['photographer']}>
      <PhotographerDashboard />
    </RoleGuard>
  );
}

function PhotographerDashboard() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<PhotographerEvent[]>([]);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isApprovedPhotographer = profile?.role === 'photographer' && profile.is_approved;
  const error = profile && !isApprovedPhotographer
    ? 'Voce precisa ser um fotografo aprovado para acessar esta pagina.'
    : null;

  const loadData = useEffectEvent(async () => {
    if (!isApprovedPhotographer) {
      return;
    }

    try {
      setIsLoading(true);
      // #region debug-point photographer-dashboard-2
      await debugLog('photographer-dashboard-load-start', {
        userId: user?.id ?? null,
        profileRole: profile?.role ?? null,
        approved: profile?.is_approved ?? null,
      });
      // #endregion debug-point photographer-dashboard-2
      const [eventsRes, salesRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/photographer/sales'),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
        // #region debug-point photographer-dashboard-3
        await debugLog('photographer-dashboard-events-result', {
          userId: user?.id ?? null,
          count: Array.isArray(eventsData) ? eventsData.length : 0,
          events: Array.isArray(eventsData)
            ? eventsData.map((event: PhotographerEvent) => ({
                id: event.id,
                name: event.name,
                photoCount: event.photos?.[0]?.count || 0,
                status: event.status,
              }))
            : [],
        });
        // #endregion debug-point photographer-dashboard-3
      }

      if (salesRes.ok) {
        const salesDataResult = await salesRes.json();
        setSalesData(salesDataResult);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (!isApprovedPhotographer) {
      return;
    }

    let pendingLoadId: number | null = null;

    const queueLoad = () => {
      if (pendingLoadId !== null) {
        window.clearTimeout(pendingLoadId);
      }

      pendingLoadId = window.setTimeout(() => {
        void loadData();
      }, 0);
    };

    queueLoad();

    const handleWindowRefresh = () => {
      queueLoad();
    };

    window.addEventListener('focus', handleWindowRefresh);
    window.addEventListener('pageshow', handleWindowRefresh);

    return () => {
      if (pendingLoadId !== null) {
        window.clearTimeout(pendingLoadId);
      }
      window.removeEventListener('focus', handleWindowRefresh);
      window.removeEventListener('pageshow', handleWindowRefresh);
    };
  }, [isApprovedPhotographer, profile, user]);

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    const confirmed = window.confirm(`Excluir o evento "${eventName}" e todas as fotos vinculadas?`);

    if (!confirmed) {
      return;
    }

    setActionLoading(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'Nao foi possivel excluir o evento.');
        return;
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Erro ao excluir evento.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishEvent = async (eventId: string, eventName: string) => {
    const confirmed = window.confirm(`Publicar o evento "${eventName}"? Ele ficará visível para clientes.`);
    if (!confirmed) return;

    setActionLoading(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'Não foi possível publicar o evento.');
        return;
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: 'published' } : e))
      );
    } catch (err) {
      console.error('Error publishing event:', err);
      alert('Erro ao publicar evento.');
    } finally {
      setActionLoading(null);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-card border border-white/10 p-8 rounded-2xl">
          <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link 
            href="/dashboard/cliente"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors"
          >
            Voltar para minha conta
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Vendido', value: `R$ ${(salesData?.totalSales || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-500', gradient: 'bg-gradient-to-br from-green-500/5 to-transparent' },
    { label: 'Ganhos', value: `R$ ${(salesData?.photographerEarnings || 0).toFixed(2)}`, icon: TrendingUp, color: 'text-blue-500', gradient: 'bg-gradient-to-br from-blue-500/5 to-transparent' },
    { label: 'Fotos Vendidas', value: salesData?.totalPhotosSold || 0, icon: ImageIcon, color: 'text-purple-500', gradient: 'bg-gradient-to-br from-purple-500/5 to-transparent' },
    { label: 'Eventos Ativos', value: events.filter(e => e.status === 'published').length, icon: Camera, color: 'text-orange-500', gradient: 'bg-gradient-to-br from-orange-500/5 to-transparent' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel do Fotógrafo</h1>
          <p className="text-muted-foreground">Gerencie seus eventos e acompanhe suas vendas</p>
        </div>
        
        <Link 
          href="/dashboard/fotografo/eventos/novo"
          className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="h-5 w-5" />
          Criar Novo Evento
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-card border border-white/10 p-6 rounded-2xl ${stat.gradient}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/20 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-500/20 rounded-xl">
              <Wallet className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo disponível para saque</p>
              <p className="text-3xl font-bold text-green-500">
                R$ {((salesData?.photographerEarnings || 0) - (salesData?.pendingWithdrawals || 0)).toFixed(2)}
              </p>
            </div>
          </div>
          <Link 
            href="/dashboard/fotografo/saques"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            <Wallet className="h-5 w-5" />
            Solicitar Saque
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Seus Eventos</h2>
        </div>
        
        {isLoading || (isApprovedPhotographer && !salesData && events.length === 0) ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-card border border-white/10 rounded-2xl">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum evento ainda</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Comece criando seu primeiro evento e faça upload das fotos.
            </p>
            <Link 
              href="/dashboard/fotografo/eventos/novo"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Criar primeiro evento
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="sm:hidden space-y-4">
              {events.map((event) => {
                const statusInfo = getEventStatusInfo(event, (salesData?.totalPhotosSold || 0) > 0);
                return (
                <div key={event.id} className="bg-card border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {event.cover_image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                        <NextImage
                          src={event.cover_image_url}
                          alt={event.name}
                          fill
                          sizes="48px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                        <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{event.name}</p>
                        {!event.cover_image_url && (
                          <span title="Sem imagem de capa">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.city}, {event.state}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1 ${statusInfo.color}`}>
                      {statusInfo.icon && <statusInfo.icon className="h-3 w-3" />}
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>{formatLocalDate(event.date)}</span>
                    <span>{event.photos?.[0]?.count || 0} fotos</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    {event.status === 'published' && (
                      <Link 
                        href={`/evento/${event.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Ver galeria
                      </Link>
                    )}
                    <div className="flex-1" />
                    <Link 
                      href={`/dashboard/fotografo/eventos/${event.id}`}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Upload de fotos"
                    >
                      <Upload className="h-5 w-5 text-primary" />
                    </Link>
                    <Link 
                      href={`/dashboard/fotografo/eventos/${event.id}/editar`}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Editar Capa"
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link 
                      href={`/dashboard/fotografo/eventos/${event.id}/editar`}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Editar Preço"
                    >
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    {event.status !== 'published' && (
                      <button
                        onClick={() => handlePublishEvent(event.id, event.name)}
                        disabled={actionLoading === event.id}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                        title="Publicar"
                      >
                        {actionLoading === event.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      disabled={actionLoading === event.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir evento"
                    >
                      {actionLoading === event.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-5 w-5 text-red-500" />
                      )}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Desktop table layout */}
            <div className="hidden sm:block bg-card border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 font-semibold">Evento</th>
                      <th className="px-6 py-4 font-semibold">Data</th>
                      <th className="px-6 py-4 font-semibold">Fotos</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {events.map((event) => {
                      const statusInfo = getEventStatusInfo(event, (salesData?.totalPhotosSold || 0) > 0);
                      return (
                      <tr key={event.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {event.cover_image_url ? (
                              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                                <NextImage
                                  src={event.cover_image_url}
                                  alt={event.name}
                                  fill
                                  sizes="48px"
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                                <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{event.name}</p>
                                {!event.cover_image_url && (
                                  <span title="Sem imagem de capa">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.city}, {event.state}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatLocalDate(event.date)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {event.photos?.[0]?.count || 0}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${statusInfo.color}`}>
                            {statusInfo.icon && <statusInfo.icon className="h-3 w-3" />}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link 
                              href={`/dashboard/fotografo/eventos/${event.id}`}
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                              title="Upload de fotos"
                            >
                              <Upload className="h-5 w-5 text-primary" />
                            </Link>
                            <Link 
                              href={`/dashboard/fotografo/eventos/${event.id}/editar`}
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                              title="Editar Capa"
                            >
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </Link>
                            <Link 
                              href={`/dashboard/fotografo/eventos/${event.id}/editar`}
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                              title="Editar Preço"
                            >
                              <DollarSign className="h-5 w-5 text-muted-foreground" />
                            </Link>
                            {event.status === 'published' ? (
                              <Link 
                                href={`/evento/${event.id}`}
                                target="_blank"
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                title="Ver galeria"
                              >
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handlePublishEvent(event.id, event.name)}
                                disabled={actionLoading === event.id}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                title="Publicar"
                              >
                                {actionLoading === event.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                ) : (
                                  <EyeOff className="h-5 w-5 text-primary" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(event.id, event.name)}
                              disabled={actionLoading === event.id}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Excluir evento"
                            >
                              {actionLoading === event.id ? (
                                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="h-5 w-5 text-red-500" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

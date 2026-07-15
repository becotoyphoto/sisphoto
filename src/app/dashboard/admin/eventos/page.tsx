'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Loader2, Trash2, Edit, Eye, Plus, Search, Filter, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminEvent {
  id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  status: string;
  cover_image_url: string | null;
  category: { name: string } | null;
  photographer: { full_name: string } | null;
  photos: { count: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  published: { label: 'Publicado', color: 'text-green-500', bg: 'bg-green-500/10' },
  archived: { label: 'Arquivado', color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

function formatLocalDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch { return dateStr; }
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [photographerFilter, setPhotographerFilter] = useState('');
  const [photographers, setPhotographers] = useState<{ id: string; full_name: string }[]>([]);

  const loadEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (photographerFilter) params.set('photographer_id', photographerFilter);

      const response = await fetch(`/api/events?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading admin events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // Load photographers for filter
    fetch('/api/admin/photographers')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setPhotographers(data.map((p: any) => ({ id: p.id, full_name: p.full_name || 'Sem nome' })));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setIsLoading(true);
    loadEvents();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPhotographerFilter('');
    setIsLoading(true);
    setTimeout(loadEvents, 0);
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    const confirmed = window.confirm(`Excluir o evento "${eventName}" e todas as fotos vinculadas?`);
    if (!confirmed) return;

    setActionLoading(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'Nao foi possivel excluir o evento.');
        return;
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch {
      alert('Erro ao excluir evento.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setActionLoading(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao alterar status.');
        return;
      }

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, status: newStatus } : event
        )
      );
    } catch {
      alert('Erro ao alterar status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">Gerencie todos os eventos da plataforma</p>
        </div>
        <Link
          href="/dashboard/admin/eventos/novo"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Evento
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-card border border-white/10 rounded-xl px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por titulo..."
            className="flex-1 bg-transparent py-3 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setIsLoading(true); setTimeout(loadEvents, 0); }}
          className="bg-card border border-white/10 rounded-xl py-3 px-4 outline-none"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
        {photographers.length > 0 && (
          <select
            value={photographerFilter}
            onChange={(e) => { setPhotographerFilter(e.target.value); setIsLoading(true); setTimeout(loadEvents, 0); }}
            className="bg-card border border-white/10 rounded-xl py-3 px-4 outline-none"
          >
            <option value="">Todos os fotógrafos</option>
            {photographers.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        )}
        {(search || statusFilter || photographerFilter) && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-2xl p-12 text-center">
          <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground text-lg">Nenhum evento encontrado.</p>
          <Link
            href="/dashboard/admin/eventos/novo"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Criar primeiro evento
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 font-semibold text-sm">Evento</th>
                <th className="px-6 py-4 font-semibold text-sm">Fotografo</th>
                <th className="px-6 py-4 font-semibold text-sm">Data</th>
                <th className="px-6 py-4 font-semibold text-sm">Fotos</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {events.map((event) => {
                const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
                return (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                            <Camera className="h-6 w-6 text-muted-foreground" />
                            <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{event.name}</p>
                            {!event.cover_image_url && (
                              <span title="Sem imagem de capa">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{event.city}, {event.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {event.photographer?.full_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {formatLocalDate(event.date)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {event.photos?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {actionLoading !== event.id && (
                          <select
                            className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) handleStatusChange(event.id, e.target.value);
                            }}
                          >
                            <option value="">Mudar</option>
                            {event.status === 'draft' && <option value="published">Publicar</option>}
                            {event.status === 'published' && (
                              <>
                                <option value="draft">Voltar p/ Rascunho</option>
                                <option value="archived">Arquivar</option>
                              </>
                            )}
                            {event.status === 'archived' && <option value="draft">Reabrir</option>}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/admin/eventos/${event.id}`}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-5 w-5 text-primary" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/eventos/${event.id}/editar`}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          title="Editar evento"
                        >
                          <Edit className="h-5 w-5 text-blue-500" />
                        </Link>
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
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Camera, MapPin, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { formatLocalDate } from '@/lib/utils';

interface EventDetail {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  date: string;
  status: string;
  cover_image_url: string | null;
  category: { id: string; name: string } | null;
  photographer: { id: string; full_name: string; pix_key?: string } | null;
  photosCount: number;
  photos: { id: string; url: string; price: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  published: { label: 'Publicado', color: 'text-green-500', bg: 'bg-green-500/10' },
  archived: { label: 'Arquivado', color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export default function AdminEventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else if (response.status === 401) {
        router.push('/login');
      } else if (response.status === 404) {
        setEvent(null);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    const confirmed = window.confirm(`Excluir o evento "${event.name}" e todas as fotos?`);
    if (!confirmed) return;

    setActionLoading('delete');
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/dashboard/admin/eventos');
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir.');
      }
    } catch {
      alert('Erro ao excluir evento.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading('status');
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao alterar status.');
        return;
      }

      setEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
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

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
        <Link href="/dashboard/admin/eventos" className="text-primary hover:underline">
          Voltar para lista de eventos
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/dashboard/admin/eventos"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para eventos
      </Link>

      {/* Header */}
      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden mb-8">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="w-full h-48 sm:h-64 object-cover"
          />
        ) : (
          <div className="w-full h-48 sm:h-64 bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-center">
            <Camera className="h-16 w-16 text-muted-foreground opacity-30" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-2">{event.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.city}, {event.state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatLocalDate(event.date)}
                </span>
                {event.category && (
                  <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary text-xs font-bold">
                    {event.category.name}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>
              {event.description && (
                <p className="mt-4 text-muted-foreground">{event.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/admin/eventos/${id}/editar`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Link>
              {event.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('published')}
                  disabled={actionLoading === 'status'}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Publicar
                </button>
              )}
              {event.status === 'published' && (
                <button
                  onClick={() => handleStatusChange('archived')}
                  disabled={actionLoading === 'status'}
                  className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Arquivar
                </button>
              )}
              {event.status === 'archived' && (
                <button
                  onClick={() => handleStatusChange('draft')}
                  disabled={actionLoading === 'status'}
                  className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reabrir
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="inline-flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 px-4 py-2 rounded-xl text-sm font-bold text-red-500 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Total de Fotos</p>
          <p className="text-2xl font-bold">{event.photosCount}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Fotógrafo</p>
          <p className="text-lg font-bold">{event.photographer?.full_name || '—'}</p>
          {event.photographer?.pix_key && (
            <p className="text-xs text-muted-foreground mt-1">PIX: {event.photographer.pix_key}</p>
          )}
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Preço por Foto</p>
          <p className="text-lg font-bold text-green-500">
            R$ {event.photos.length > 0 ? event.photos[0].price.toFixed(2) : '—'}
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-card border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Fotos</h2>
        {event.photos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma foto enviada ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {event.photos.map((photo) => (
              <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground opacity-30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

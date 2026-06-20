'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Mail, Phone, Globe, Camera, Calendar, MapPin, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { formatLocalDate } from '@/lib/utils';

interface PhotographerDetail {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  phone: string | null;
  portfolio_url: string | null;
  pix_key: string | null;
  is_approved: boolean;
  created_at: string;
  status: string;
  events_count: number;
  photos_count: number;
  avatar_url?: string | null;
  events?: EventSummary[];
}

interface EventSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  status: string;
  cover_image_url?: string | null;
  photos_count?: number;
}

export default function AdminPhotographerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [photographer, setPhotographer] = useState<PhotographerDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/admin/photographers?id=${id}`);

      if (response.ok) {
        const data = await response.json();
        setPhotographer(data);
        setEvents(data.events || []);
      } else {
        setPhotographer(null);
        setEvents([]);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (action: 'approve' | 'reject') => {
    if (!id) return;
    setActionLoading(action);
    try {
      const response = await fetch('/api/admin/photographers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographer_id: id, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Erro ao atualizar status.');
        return;
      }

      const updated = await response.json();
      setPhotographer((prev) => (prev ? { ...prev, ...updated } : null));
    } catch {} finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!photographer) return;
    if (!window.confirm(`Excluir ${photographer.full_name} permanentemente?`)) return;

    setActionLoading('delete');
    try {
      const response = await fetch(`/api/admin/photographers?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        router.push('/dashboard/admin/fotografos');
      } else {
        alert(data.error || 'Erro ao excluir.');
      }
    } catch {} finally {
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

  if (!photographer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Fotógrafo não encontrado</h1>
        <Link href="/dashboard/admin/fotografos" className="text-primary hover:underline">
          Voltar para lista de fotógrafos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/dashboard/admin/fotografos" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Voltar para fotógrafos
      </Link>

      {/* Header */}
      <div className="bg-card border border-white/10 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {photographer.avatar_url ? (
              <img
                src={photographer.avatar_url}
                alt={photographer.full_name}
                className="w-16 h-16 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                {photographer.full_name?.charAt(0) || 'F'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black">{photographer.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mt-1">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{photographer.email}</span>
                {photographer.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{photographer.phone}</span>}
                {photographer.portfolio_url && (
                  <a href={photographer.portfolio_url} target="_blank" className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="h-4 w-4" />Portfólio
                  </a>
                )}
              </div>
              {photographer.pix_key && (
                <p className="text-sm text-green-500 mt-1">PIX: {photographer.pix_key}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/fotografos/${photographer.id}/editar`}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            {!photographer.is_approved ? (
              <button onClick={() => handleStatusChange('approve')} disabled={actionLoading === 'approve'}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                {actionLoading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Aprovar
              </button>
            ) : (
              <button onClick={() => handleStatusChange('reject')} disabled={actionLoading === 'reject'}
                className="inline-flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/40 px-4 py-2 rounded-xl text-sm font-bold text-yellow-500 transition-colors disabled:opacity-50">
                {actionLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Marcar Pendente
              </button>
            )}
            <button onClick={handleDelete} disabled={actionLoading === 'delete'}
              className="inline-flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 px-4 py-2 rounded-xl text-sm font-bold text-red-500 transition-colors disabled:opacity-50">
              {actionLoading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir
            </button>
          </div>
        </div>

        {photographer.bio && (
          <p className="mt-4 text-muted-foreground">{photographer.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Eventos</p>
          <p className="text-2xl font-bold">{photographer.events_count}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Fotos Enviadas</p>
          <p className="text-2xl font-bold">{photographer.photos_count}</p>
        </div>
        <div className="bg-card border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${photographer.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            {photographer.status === 'active' ? 'Ativo' : 'Pendente'}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div className="bg-card border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Eventos</h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum evento associado.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link key={event.id} href={`/dashboard/admin/eventos/${event.id}`}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />{event.city}, {event.state}
                      <Calendar className="h-3 w-3 inline ml-3 mr-1" />{formatLocalDate(event.date)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.photos_count || 0} foto(s)
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${event.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  {event.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

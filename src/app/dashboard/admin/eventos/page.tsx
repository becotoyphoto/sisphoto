'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Loader2, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { formatLocalDate } from '@/lib/utils';

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading admin events:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Error deleting admin event:', error);
      alert('Erro ao excluir evento.');
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Eventos da Plataforma</h1>
          <p className="text-muted-foreground">Administra e exclui eventos e acessa as fotos de cada evento.</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-2xl p-10 text-center">
          <Camera className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum evento encontrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 font-semibold">Evento</th>
                <th className="px-6 py-4 font-semibold">Fotografo</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Fotos</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {event.cover_image_url ? (
                        <img
                          src={event.cover_image_url}
                          alt={event.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.city}, {event.state}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {event.photographer?.full_name || 'Sem nome'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatLocalDate(event.date)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {event.photos?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      event.status === 'published'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {event.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/fotografo/eventos/${event.id}`}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        title="Gerenciar fotos"
                      >
                        <Upload className="h-5 w-5 text-primary" />
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

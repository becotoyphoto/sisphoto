'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Loader2, User, Plus, Search, Eye, Trash2, Phone, Globe } from 'lucide-react';
import Link from 'next/link';

interface Photographer {
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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Ativo', color: 'text-green-500', bg: 'bg-green-500/10' },
  pending: { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

export default function AdminPhotographersPage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadPhotographers = async (filters?: { search?: string; status?: string }) => {
    try {
      const params = new URLSearchParams();
      const nextSearch = filters?.search ?? search;
      const nextStatus = filters?.status ?? statusFilter;

      if (nextSearch) params.set('search', nextSearch);
      if (nextStatus) params.set('status', nextStatus);

      const response = await fetch(`/api/admin/photographers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPhotographers(data);
      }
    } catch (err) {
      console.error('Error loading photographers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhotographers();
  }, []);

  const handleSearch = () => {
    setIsLoading(true);
    loadPhotographers({ search, status: statusFilter });
  };

  const handleStatusChange = async (photographerId: string, action: 'approve' | 'reject') => {
    setActionLoading(photographerId);
    try {
      const response = await fetch('/api/admin/photographers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographer_id: photographerId, action }),
      });

      if (response.ok) {
        const updatedPhotographer = await response.json();
        setPhotographers((prev) =>
          prev.map((p) =>
            p.id === photographerId
              ? { ...p, ...updatedPhotographer }
              : p
          )
        );
      }
    } catch {} finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (photographerId: string, name: string) => {
    if (!window.confirm(`Excluir o fotógrafo "${name}"? Esta ação não pode ser desfeita.`)) return;

    setActionLoading(photographerId);
    try {
      const response = await fetch(`/api/admin/photographers?id=${photographerId}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao excluir.');
        return;
      }

      setPhotographers((prev) => prev.filter((p) => p.id !== photographerId));
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Voltar para dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fotógrafos</h1>
          <p className="text-muted-foreground">Gerencie todos os fotógrafos da plataforma</p>
        </div>
        <Link
          href="/dashboard/admin/fotografos/novo"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Fotógrafo
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
            placeholder="Buscar por nome ou email..."
            className="flex-1 bg-transparent py-3 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            const nextStatus = e.target.value;
            setStatusFilter(nextStatus);
            setIsLoading(true);
            loadPhotographers({ search, status: nextStatus });
          }}
          className="bg-slate-950 text-white border border-white/10 rounded-xl py-3 px-4 outline-none"
        >
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>

      {photographers.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-2xl p-12 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground text-lg">Nenhum fotógrafo encontrado.</p>
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 font-semibold text-sm">Fotógrafo</th>
                <th className="px-6 py-4 font-semibold text-sm">Contato</th>
                <th className="px-6 py-4 font-semibold text-sm">Eventos</th>
                <th className="px-6 py-4 font-semibold text-sm">Fotos</th>
                <th className="px-6 py-4 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {photographers.map((photog) => {
                const statusCfg = STATUS_CONFIG[photog.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={photog.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                          {photog.full_name?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <p className="font-medium">{photog.full_name}</p>
                          <p className="text-xs text-muted-foreground">{photog.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {photog.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {photog.phone}</span>
                        )}
                        {photog.portfolio_url && (
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Portfólio</span>
                        )}
                        {photog.pix_key && <span className="text-green-500">PIX: {photog.pix_key}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{photog.events_count}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{photog.photos_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/admin/fotografos/${photog.id}`}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Ver perfil"
                        >
                          <Eye className="h-5 w-5 text-primary" />
                        </Link>
                        {!photog.is_approved ? (
                          <button
                            onClick={() => handleStatusChange(photog.id, 'approve')}
                            disabled={actionLoading === photog.id}
                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50" title="Aprovar"
                          >
                            {actionLoading === photog.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(photog.id, 'reject')}
                            disabled={actionLoading === photog.id}
                            className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors disabled:opacity-50" title="Marcar como pendente"
                          >
                            {actionLoading === photog.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5 text-yellow-500" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(photog.id, photog.full_name)}
                          disabled={actionLoading === photog.id}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" title="Excluir"
                        >
                          {actionLoading === photog.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5 text-red-500" />}
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

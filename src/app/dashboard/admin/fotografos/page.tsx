'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock, User } from 'lucide-react';
import Link from 'next/link';

interface Photographer {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  is_approved: boolean;
}

export default function AdminPhotographersPage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPhotographers();
  }, []);

  const loadPhotographers = async () => {
    try {
      const response = await fetch('/api/admin/photographers');
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

  const handleAction = async (photographerId: string, action: 'approve' | 'reject') => {
    setActionLoading(photographerId);
    try {
      const response = await fetch('/api/admin/photographers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographer_id: photographerId, action }),
      });

      if (response.ok) {
        setPhotographers(prev => 
          prev.map(p => 
            p.id === photographerId 
              ? { ...p, is_approved: action === 'approve' } 
              : p
          )
        );
      }
    } catch (err) {
      console.error('Error updating photographer:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = photographers.filter(p => !p.is_approved);
  const approved = photographers.filter(p => p.is_approved);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link 
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8">Fotógrafos</h1>

      {/* Pending Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" />
          Pendentes de Aprovação ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="bg-card border border-white/10 rounded-2xl p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum fotógrafo pendente!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((photographer) => (
              <div key={photographer.id} className="bg-card border border-yellow-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                      {photographer.full_name?.charAt(0) || 'F'}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{photographer.full_name || 'Sem nome'}</p>
                      <p className="text-muted-foreground text-sm">{photographer.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solicitou em: {new Date(photographer.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(photographer.id, 'approve')}
                      disabled={actionLoading === photographer.id}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {actionLoading === photographer.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Aprovar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(photographer.id, 'reject')}
                      disabled={actionLoading === photographer.id}
                      className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Aprovados ({approved.length})
        </h2>

        {approved.length === 0 ? (
          <div className="bg-card border border-white/10 rounded-2xl p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum fotógrafo aprovado ainda.</p>
          </div>
        ) : (
          <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 font-semibold">Fotógrafo</th>
                  <th className="px-6 py-4 font-semibold">E-mail</th>
                  <th className="px-6 py-4 font-semibold">Data de Cadastro</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {approved.map((photographer) => (
                  <tr key={photographer.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                          {photographer.full_name?.charAt(0) || 'F'}
                        </div>
                        <span className="font-medium">{photographer.full_name || 'Sem nome'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{photographer.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(photographer.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleAction(photographer.id, 'reject')}
                        disabled={actionLoading === photographer.id}
                        className="text-sm text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === photographer.id ? 'Processando...' : 'Revogar acesso'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

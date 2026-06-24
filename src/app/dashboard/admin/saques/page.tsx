'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Loader2, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Withdrawal {
  id: string;
  photographer_id: string;
  amount: number;
  status: 'requested' | 'completed' | 'rejected';
  requested_at: string;
  completed_at: string | null;
  profiles: {
    full_name: string | null;
    pix_key: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  requested: { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: <Clock className="h-4 w-4" /> },
  completed: { label: 'Pago', color: 'text-green-500', bg: 'bg-green-500/10', icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: 'Rejeitado', color: 'text-red-500', bg: 'bg-red-500/10', icon: <XCircle className="h-4 w-4" /> },
};

export default function AdminSaquesPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'requested' | 'completed' | 'rejected'>('all');

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const response = await fetch('/api/admin/withdrawals');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (id: string, newStatus: 'completed' | 'rejected') => {
    const label = newStatus === 'completed' ? 'aprovar' : 'rejeitar';
    if (!window.confirm(`Confirmar ${label} este saque?`)) return;

    setActionLoading(id);
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        await loadWithdrawals();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Erro ao processar saque.');
      }
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      alert('Erro ao processar saque.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter);
  const pendingCount = withdrawals.filter((w) => w.status === 'requested').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/admin"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            Saques
          </h1>
          <p className="text-muted-foreground">
            {pendingCount} solicitação(ões) pendente(s)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['all', 'requested', 'completed', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'Todos' : STATUS_CONFIG[f].label}
            {f === 'requested' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500/20 text-yellow-500 px-1.5 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-white/10 rounded-2xl">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum saque encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const config = STATUS_CONFIG[w.status];
            return (
              <div
                key={w.id}
                className="bg-card border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Info do fotógrafo */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {w.profiles?.full_name || 'Sem nome'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    PIX: {w.profiles?.pix_key || 'Não informada'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solicitado em {new Date(w.requested_at).toLocaleString('pt-BR')}
                  </p>
                  {w.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Processado em {new Date(w.completed_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Valor e status */}
                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  <span className="text-lg font-bold text-primary">
                    R$ {w.amount.toFixed(2)}
                  </span>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.bg}`}>
                    {config.icon}
                    {config.label}
                  </span>
                </div>

                {/* Ações (apenas para pendentes) */}
                {w.status === 'requested' && (
                  <div className="flex gap-2 sm:flex-shrink-0">
                    <button
                      onClick={() => handleProcess(w.id, 'completed')}
                      disabled={actionLoading === w.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === w.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleProcess(w.id, 'rejected')}
                      disabled={actionLoading === w.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

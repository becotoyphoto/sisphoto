'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Clock, CheckCircle, XCircle, Loader2, Banknote } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  completed_at: string | null;
}

export default function WithdrawalsPage() {
  const { user, profile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pixKey, setPixKey] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [withdrawalsRes, salesRes] = await Promise.all([
          fetch('/api/withdrawals'),
          fetch('/api/photographer/sales'),
        ]);

        if (withdrawalsRes.ok) {
          const withdrawalsData = await withdrawalsRes.json();
          setWithdrawals(withdrawalsData);
        }

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setAvailableBalance(salesData.photographerEarnings - salesData.pendingWithdrawals);
        }

        if (profile?.pix_key) {
          setPixKey(profile.pix_key);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, profile]);

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsRequesting(true);

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Digite um valor válido');
      setIsRequesting(false);
      return;
    }

    if (amount > availableBalance) {
      setError('Valor superior ao saldo disponível');
      setIsRequesting(false);
      return;
    }

    if (!pixKey) {
      setError('Chave PIX é obrigatória');
      setIsRequesting(false);
      return;
    }

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, pix_key: pixKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar saque');
      }

      setSuccess('Saque solicitado com sucesso!');
      setWithdrawAmount('');
      
      const withdrawalsRes = await fetch('/api/withdrawals');
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        setWithdrawals(withdrawalsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar saque');
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Pendente';
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        href="/dashboard/fotografo"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para dashboard
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Request Withdrawal */}
        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Wallet className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Solicitar Saque</h1>
              <p className="text-muted-foreground">Receba via PIX em até 24h</p>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">Saldo disponível</p>
            <p className="text-3xl font-bold text-green-500">R$ {availableBalance.toFixed(2)}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleRequestWithdrawal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chave PIX</label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail ou telefone"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Valor do Saque (R$)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={availableBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isRequesting || availableBalance <= 0}
              className="w-full bg-primary hover:bg-primary/90 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Banknote className="h-5 w-5" />
                  Solicitar Saque
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-card border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Histórico de Saques</h2>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum saque solicitado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-bold">R$ {Number(withdrawal.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    withdrawal.status === 'completed' 
                      ? 'bg-green-500/10 text-green-500'
                      : withdrawal.status === 'rejected'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {getStatusLabel(withdrawal.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

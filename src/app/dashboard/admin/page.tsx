'use client';

import { useState, useEffect } from 'react';
import { Users, Camera, DollarSign, Image as ImageIcon, Clock, CheckCircle, XCircle, Loader2, UserPlus, FolderOpen, ArrowRight, Banknote } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';

interface AdminStats {
  photographersCount: number;
  pendingPhotographersCount: number;
  eventsCount: number;
  photosCount: number;
  usersCount: number;
  totalRevenue: number;
  platformCommission: number;
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminDashboard />
    </RoleGuard>
  );
}

function AdminDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentPhotographers, setRecentPhotographers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState(15);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionDraft, setCommissionDraft] = useState('15');
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/settings'),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setRecentPhotographers(data.recentPhotographers);
        } else if (statsRes.status === 403) {
          setError('Você não tem permissão para acessar esta página.');
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const rate = settings.commission_rate?.rate;
          if (rate != null) {
            const pct = Math.round(Number(rate) * 100);
            setCommissionRate(pct);
            setCommissionDraft(String(pct));
          }
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveCommission = async () => {
    const pct = parseFloat(commissionDraft);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      alert('Valor inválido. Use um número entre 0 e 100.');
      return;
    }

    setSavingCommission(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'commission_rate',
          value: { rate: pct / 100 },
        }),
      });

      if (response.ok) {
        setCommissionRate(pct);
        setEditingCommission(false);
      } else {
        alert('Erro ao salvar comissão.');
      }
    } catch {
      alert('Erro ao salvar comissão.');
    } finally {
      setSavingCommission(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-card border border-white/10 p-8 rounded-2xl">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie a plataforma BecoToy</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Total Fotógrafos</p>
          <h3 className="text-2xl font-bold mt-1">{stats?.photographersCount || 0}</h3>
        </div>

        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Pendentes</p>
          <h3 className="text-2xl font-bold mt-1">{stats?.pendingPhotographersCount || 0}</h3>
        </div>

        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Camera className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Eventos</p>
          <h3 className="text-2xl font-bold mt-1">{stats?.eventsCount || 0}</h3>
        </div>

        <div className="bg-card border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Receita Total</p>
          <h3 className="text-2xl font-bold mt-1 text-green-500">R$ {(stats?.totalRevenue || 0).toFixed(2)}</h3>
        </div>
      </div>

      {/* Financial Card */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/20 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold text-green-500">R$ {(stats?.totalRevenue || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Comissão</p>
            {editingCommission ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionDraft}
                  onChange={(e) => setCommissionDraft(e.target.value)}
                  className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-lg font-bold text-blue-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-blue-500 font-bold">%</span>
                <button
                  onClick={handleSaveCommission}
                  disabled={savingCommission}
                  className="p-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingCommission ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => { setEditingCommission(false); setCommissionDraft(String(commissionRate)); }}
                  className="p-1 bg-white/10 text-muted-foreground hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingCommission(true)}
                className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                title="Clique para editar"
              >
                {commissionRate}% <span className="text-sm font-normal text-muted-foreground">(R$ {(stats?.platformCommission || 0).toFixed(2)})</span>
              </button>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Fotos</p>
            <p className="text-2xl font-bold">{stats?.photosCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link 
          href="/dashboard/admin/fotografos"
          className="bg-card border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-primary/10 rounded-xl">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-bold text-lg mt-4">Aprovar Fotógrafos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {stats?.pendingPhotographersCount || 0} solicitação(ões) pendente(s)
          </p>
        </Link>

        <Link 
          href="/dashboard/admin/categorias"
          className="bg-card border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <FolderOpen className="h-6 w-6 text-secondary" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-bold text-lg mt-4">Gerenciar Categorias</h3>
          <p className="text-sm text-muted-foreground mt-1">Adicione ou edite categorias</p>
        </Link>

        <Link
          href="/dashboard/admin/eventos"
          className="bg-card border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Camera className="h-6 w-6 text-orange-500" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-bold text-lg mt-4">Ver Eventos</h3>
          <p className="text-sm text-muted-foreground mt-1">{stats?.eventsCount || 0} evento(s) cadastrado(s)</p>
        </Link>

        <Link
          href="/dashboard/admin/saques"
          className="bg-card border border-white/10 p-6 rounded-2xl hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Banknote className="h-6 w-6 text-green-500" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-bold text-lg mt-4">Saques</h3>
          <p className="text-sm text-muted-foreground mt-1">Aprovar ou rejeitar solicitações</p>
        </Link>
      </div>

      {/* Recent Photographers */}
      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="font-bold text-lg">Fotógrafos Recentes</h2>
        </div>
        <div className="divide-y divide-white/10">
          {recentPhotographers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum fotógrafo cadastrado ainda.
            </div>
          ) : (
            recentPhotographers.map((photographer) => (
              <div key={photographer.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {photographer.full_name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <p className="font-medium">{photographer.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">
                      Cadastrado em {new Date(photographer.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  photographer.is_approved 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {photographer.is_approved ? 'Aprovado' : 'Pendente'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

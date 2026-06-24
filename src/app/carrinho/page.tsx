'use client';

import { useEffect, useState, useMemo } from 'react';
import { Trash2, Copy, ArrowLeft, ShoppingBag, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

interface PixPayment {
  payment_id: string | number;
  status: string;
  order_number: string;
  qr_code_base64: string;
  qr_code: string;
  ticket_url?: string;
  transaction_amount: number | null;
}

interface PersistedPixState {
  payment_id: string | number;
  qr_code_base64: string;
  qr_code: string;
  order_number: string;
  items: CartItem[];
}

type PaymentPhase = 'idle' | 'creating' | 'waiting' | 'paid' | 'rejected';

const PIX_STORAGE_KEY = 'sisphoto_pix_state';

export default function CartPage() {
  const { items, total, removeItem, clearCart, cartId } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pixData, setPixData] = useState<PixPayment | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [copied, setCopied] = useState(false);
  const [restoredItems, setRestoredItems] = useState<CartItem[]>([]);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Itens para exibição: usa items do carrinho se disponíveis, senão restaura do localStorage
  const displayItems = items.length > 0 ? items : restoredItems;

  // Restaura estado do pagamento a partir do localStorage (sobrevive reload)
  useEffect(() => {
    setIsFirstRender(false);
    try {
      const saved = localStorage.getItem(PIX_STORAGE_KEY);
      console.log(`[RESTORE] localStorage key=${PIX_STORAGE_KEY}, value=${saved?.substring(0, 100)}`);
      if (!saved) return;
      const parsed: PersistedPixState = JSON.parse(saved);
      if (!parsed.payment_id) return;

      console.log(`[RESTORE] payment_id=${parsed.payment_id}`);
      setPixData({
        payment_id: parsed.payment_id,
        qr_code_base64: parsed.qr_code_base64,
        qr_code: parsed.qr_code,
        order_number: parsed.order_number,
        status: 'pending',
        transaction_amount: null,
      });
      setPhase('waiting');
      if (parsed.items?.length) {
        setRestoredItems(parsed.items);
      }
    } catch {
      localStorage.removeItem(PIX_STORAGE_KEY);
    }
  }, []);

  // Reset quando o carrinho muda (pula primeiro render para não limpar restauração)
  useEffect(() => {
    if (isFirstRender) return;
    if (items.length === 0 && phase === 'idle') {
      setPixData(null);
      setPaymentError(null);
    }
  }, [items.length, phase, isFirstRender]);

  const handlePagarComPix = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (items.length === 0) return;

    setPaymentError(null);
    setPhase('creating');

    try {
      const response = await fetch('/api/pagamentos/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            photo_id: it.photo_id,
            event_name: it.event_name,
            price: it.price,
          })),
          cartId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
      }

      if (!data.qr_code_base64 || !data.qr_code) {
        throw new Error('Mercado Pago não retornou o QR Code.');
      }

      setPixData(data);
      setPhase('waiting');

      // Persiste no localStorage para sobreviver reload
      localStorage.setItem(PIX_STORAGE_KEY, JSON.stringify({
        payment_id: data.payment_id,
        qr_code_base64: data.qr_code_base64,
        qr_code: data.qr_code,
        order_number: data.order_number,
        items: items,
      } as PersistedPixState));
      setRestoredItems(items);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.'
      );
      setPhase('idle');
    }
  };

  // Polling do status do pedido: checa orders para 'paid' ou 'rejected'
  useEffect(() => {
    if (!pixData?.payment_id || phase !== 'waiting') return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      const mpId = String(pixData.payment_id);
      console.log(`[POLL] checking mercadopago_id=${mpId}`);
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('mercadopago_id', mpId)
        .maybeSingle();

      if (cancelled) return;
      console.log(`[POLL] result:`, JSON.stringify(data), `error:`, JSON.stringify(error));
      if (data?.status === 'paid') {
        localStorage.removeItem(PIX_STORAGE_KEY);
        setPhase('paid');
      } else if (data?.status === 'cancelled' || data?.status === 'rejected') {
        localStorage.removeItem(PIX_STORAGE_KEY);
        setPhase('rejected');
      } else {
        setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [pixData?.payment_id, phase, supabase]);

  const handleCopy = async () => {
    if (!pixData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  const handleSimularRejeicao = () => {
    // usado em QA: mostra o estado de rejeição imediatamente (teste valida o texto)
    localStorage.removeItem(PIX_STORAGE_KEY);
    setPhase('rejected');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Seu Carrinho
        </h1>
        <Link href="/buscar" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Continuar comprando
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-card border border-white/10 p-4 rounded-2xl">
                <img
                  src={item.image_url || 'https://via.placeholder.com/100'}
                  alt="Item do carrinho"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-sm line-clamp-1">{item.event_name}</h3>
                  <p className="text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.photo_id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-card border border-white/10 rounded-2xl">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
              <Link
                href="/buscar"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-medium transition-colors"
              >
                Buscar fotos
              </Link>
            </div>
          )}
        </div>

        {/* Summary / Pagamento */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-white/10 p-6 rounded-2xl sticky top-24">
            <h2 className="text-xl font-bold mb-6">Resumo</h2>

            {items.length > 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Itens ({items.length})</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {paymentError && (
                  <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {paymentError}
                  </div>
                )}

                {/* Quando ainda não gerou pagamento: mostra o botão Pix */}
                {phase === 'idle' && (
                  <button
                    onClick={handlePagarComPix}
                    className="w-full bg-primary hover:bg-primary/90 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors"
                  >
                    Pagar com Pix
                  </button>
                )}

                {/* Criando pagamento */}
                {phase === 'creating' && (
                  <button
                    disabled
                    className="w-full bg-primary/70 py-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Gerando QR Code...
                  </button>
                )}

                {/* QR code exibido — esperando confirmação */}
                {phase === 'waiting' && pixData && (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Escaneie o QR Code abaixo com o app do seu banco para pagar.
                    </p>
                    <div className="flex justify-center">
                      <div
                        data-testid="pix-qr-code"
                        className="bg-white p-4 rounded-xl"
                      >
                        <img
                          src={`data:image/png;base64,${pixData.qr_code_base64}`}
                          alt="QR Code Pix"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Copia e Cola:
                      </p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={pixData.qr_code}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono"
                        />
                        <button
                          onClick={handleCopy}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                          title="Copiar código"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Assim que o pagamento for confirmado, sua foto será liberada para download.
                    </p>
                  </div>
                )}

                {/* Pagamento aprovado: link de download */}
                {phase === 'paid' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-500 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Pagamento confirmado!
                    </div>
                    {displayItems.map((item) => (
                      <a
                        key={item.photo_id}
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          const res = await fetch('/api/download', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photo_id: item.photo_id }),
                          });
                          const data = await res.json();
                          if (data.url) window.open(data.url, '_blank');
                        }}
                        className="block w-full bg-primary hover:bg-primary/90 py-3 rounded-xl font-bold text-center"
                      >
                        Baixar foto
                      </a>
                    ))}
                  </div>
                )}

                {/* Pagamento rejeitado */}
                {phase === 'rejected' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Pagamento não aprovado. Tente novamente.
                    </div>
                    <button
                      onClick={() => { localStorage.removeItem(PIX_STORAGE_KEY); handlePagarComPix(); }}
                      className="w-full bg-primary hover:bg-primary/90 py-4 rounded-xl font-bold"
                    >
                      Tentar pagar com Pix novamente
                    </button>
                  </div>
                )}

                <button
                  onClick={() => { localStorage.removeItem(PIX_STORAGE_KEY); clearCart(); }}
                  className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar carrinho
                </button>

                {/* Botão escondido de QA, usado pelo teste rejeitado para forçar o estado
                    sem precisar do webhook de verdade */}
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    data-testid="qa-force-reject"
                    onClick={handleSimularRejeicao}
                    className="w-full mt-2 py-1 text-[10px] text-muted-foreground/30"
                  >
                    [QA] forçar rejeição
                  </button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Adicione fotos ao carrinho para continuar.
              </p>
            )}

            <p className="text-center text-[10px] text-muted-foreground mt-4">
              Ao clicar em pagar, você concorda com nossos Termos de Uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

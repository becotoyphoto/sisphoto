'use client';

import { useEffect, Suspense } from 'react';
import { CheckCircle, Download, Camera, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Pagamento Aprovado!</h1>
          <p className="text-muted-foreground">
            Parabéns! Sua compra foi realizada com sucesso. 
            Você já pode baixar suas fotos.
          </p>
          {orderNumber && (
            <p className="text-sm text-muted-foreground mt-2">
              Número do pedido: <span className="font-mono font-bold">{orderNumber}</span>
            </p>
          )}
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-bold">Suas fotos estão disponíveis!</h3>
              <p className="text-sm text-muted-foreground">
                Acesse a qualquer momento em "Minhas Compras"
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/dashboard/cliente"
            className="flex-1 bg-primary hover:bg-primary/90 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="h-5 w-5" />
            Baixar Fotos
          </Link>
          <Link 
            href="/buscar"
            className="flex-1 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            Continuar Comprando
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Você receberá um e-mail com os detalhes da compra.
          <br />
          Em caso de dúvidas, entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

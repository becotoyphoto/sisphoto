'use client';

import { CreditCard, ScanFace, Zap, ShieldCheck } from 'lucide-react';

const badges = [
  {
    icon: CreditCard,
    title: 'Pagamento via PIX',
    description: 'Rápido e seguro, receba suas fotos na hora',
  },
  {
    icon: ScanFace,
    title: 'Reconhecimento Facial',
    description: 'Encontre suas fotos com uma selfie',
  },
  {
    icon: Zap,
    title: 'Saques Instantâneos',
    description: 'Photographers recebem na hora',
  },
  {
    icon: ShieldCheck,
    title: '100% Seguro',
    description: 'Dados protegidos e pagamentos garantidos',
  },
];

export default function TrustBadges() {
  return (
    <section className="py-12 px-4 border-y border-border/50">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div key={badge.title} className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{badge.title}</h3>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

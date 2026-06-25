import type { Metadata } from 'next';
import {
  Camera,
  Search,
  CreditCard,
  Download,
  Star,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contratar Fotógrafo | BecoToy',
  description:
    'Encontre e contrate fotógrafos profissionais para eventos, festas, formaturas e muito mais na BecoToy.',
};

const steps = [
  {
    icon: Search,
    title: 'Busque o evento',
    description:
      'Encontre o evento desejado na plataforma. Navegue por categorias, cidades ou use a busca por reconhecimento facial.',
  },
  {
    icon: Camera,
    title: 'Escolha suas fotos',
    description:
      'Visualize as fotos com marca d\'água e selecione as que deseja comprar. Você vê exatamente o que está levando.',
  },
  {
    icon: CreditCard,
    title: 'Pague com segurança',
    description:
      'Finalize a compra com PIX, cartão de crédito ou boleto. O pagamento é processado pelo Mercado Pago com total proteção.',
  },
  {
    icon: Download,
    title: 'Baixe em alta resolução',
    description:
      'Após a confirmação, baixe suas fotos sem marca d\'água, em alta qualidade, prontas para impressão ou uso digital.',
  },
];

const benefits = [
  {
    icon: Star,
    title: 'Fotógrafos profissionais',
    description: 'Todos os fotógrafos são verificados e aprovados pela nossa equipe.',
  },
  {
    icon: Shield,
    title: 'Compra garantida',
    description: 'Pagamento seguro via Mercado Pago. Suporte em até 7 dias após a compra.',
  },
  {
    icon: CreditCard,
    title: 'Sem taxas extras',
    description: 'Você paga apenas pelo que comprar. Sem assinaturas, sem taxas ocultas.',
  },
];

export default function ContratarFotografoPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-primary/20 via-background to-secondary/20 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold mb-4">
            Para Clientes
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Encontre suas fotos profissionais
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fotos de eventos esportivos, festas, formaturas e muito mais. Compre
            com segurança e baixe em alta resolução.
          </p>
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-primary/30"
          >
            <Search className="h-5 w-5" />
            Buscar fotos agora
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-black/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground">
              Em 4 passos simples você encontra e baixa suas fotos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-card border border-white/10 rounded-2xl p-8 flex gap-5"
              >
                <div className="p-3 bg-primary/10 rounded-xl h-fit">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Por que escolher a BecoToy?</h2>
            <p className="text-muted-foreground">
              Sua experiência do início ao fim é garantida
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-card border border-white/10 rounded-2xl p-8 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <benefit.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black/40">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">É fotógrafo?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Cadastre seus eventos na plataforma e comece a vender suas fotos
            hoje mesmo.
          </p>
          <Link
            href="/fotografo/cadastro"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 px-10 py-4 rounded-full font-bold text-lg transition-all"
          >
            <Camera className="h-5 w-5" />
            Cadastrar como fotógrafo
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

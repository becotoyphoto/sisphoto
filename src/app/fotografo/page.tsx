import { Camera, Check, Star, TrendingUp, Users, Zap, CreditCard, Smartphone, Award, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PhotographerPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/20 via-background to-secondary/20 overflow-hidden">
        <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-3xl opacity-10" />
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold mb-4">
                Para Fotógrafos
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                A melhor plataforma para vender fotos online.
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                A FotoEvento conecta seu talento a quem valoriza seu trabalho.
              </p>
              
              <Link 
                href="/fotografo/cadastro" 
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-primary/30"
              >
                Comece grátis!
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <p className="text-xs text-muted-foreground mt-4">
                Ao criar uma conta você estará concordando com a{' '}
                <Link href="/politica-de-privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
                {' '}e os{' '}
                <Link href="/termos-de-uso" className="text-primary hover:underline">Termos de Serviço</Link>.
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-2xl opacity-20" />
              <img 
                src="https://images.unsplash.com/photo-1502920917128-1aa50076495d?auto=format&fit=crop&q=80" 
                alt="Fotógrafo"
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-black/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Vantagens exclusivas para fotógrafos</h2>
            <p className="text-muted-foreground">Tudo que você precisa para aumentar suas vendas</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Star, title: 'Melhor taxa do mercado', desc: 'Com as menores taxas do mercado, você lucra mais em cada venda.' },
              { icon: TrendingUp, title: '5M+ acessos mensais', desc: 'Alta visibilidade para seu trabalho com milhões de acessos por mês.' },
              { icon: Camera, title: 'Reconhecimento facial', desc: 'Tecnologia de ponta que conecta suas fotos aos clientes automaticamente.' },
              { icon: CreditCard, title: 'Todas as formas de pagamento', desc: 'Seus clientes podem pagar com cartão, PIX ou boleto.' },
              { icon: Smartphone, title: 'Saque via PIX 24h', desc: 'Receba suas vendas em até 24h via PIX, sem burocracia.' },
              { icon: Award, title: 'Material de divulgação', desc: 'Ganhe cartão de visita, camisa, guarda-sol e muito mais.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/30 transition-all">
                <div className="flex-shrink-0">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Parceria Ilimitada" Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-bold mb-4">
              Parceria Ilimitada
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dedicamos nosso tempo e talento para melhorar a vida dos fotógrafos
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Atendimento 24h</h3>
              <p className="text-muted-foreground text-sm">
                Equipe profissional pronta para resolver qualquer demanda sua e dos seus clientes.
              </p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Sorteios mensais</h3>
              <p className="text-muted-foreground text-sm">
                Participe de sorteios exclusivos de equipamentos фотográficos e acessórios.
              </p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Consultoria grátis</h3>
              <p className="text-muted-foreground text-sm">
                Receba orientações especializadas para maximizar suas vendas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-black/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Como funciona?</h2>
            <p className="text-muted-foreground">Comece a vender em 3 passos simples</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Cadastre-se', desc: 'Crie sua conta de fotógrafo de forma rápida e gratuita.' },
              { step: '02', title: 'Publique seus eventos', desc: 'Cadastre seus eventos e envie as fotos com marca d\'água.' },
              { step: '03', title: 'Receba pagamentos', desc: 'Aguarde as vendas e receba via PIX em até 24h.' },
            ].map((item, i) => (
              <div key={i} className="relative p-8 bg-white/5 border border-white/10 rounded-2xl">
                <span className="absolute -top-4 -left-2 text-6xl font-black text-primary/20">{item.step}</span>
                <h3 className="font-bold text-xl mb-2 relative z-10">{item.title}</h3>
                <p className="text-muted-foreground text-sm relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl text-primary mb-6">"</div>
          <blockquote className="text-2xl md:text-3xl font-medium mb-8 italic">
            Venda de fotos esportivas mudou minha vida e a FotoEvento faz parte dessa mudança, é a melhor plataforma pra vender fotos!
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary" />
            <div className="text-left">
              <p className="font-bold">André Vieira</p>
              <p className="text-muted-foreground">Rio de Janeiro, RJ</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar a vender fotos?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Junte-se a milhares de fotógrafos que já estão vendendo na FotoEvento.
          </p>
          
          <Link 
            href="/fotografo/cadastro" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-12 py-5 rounded-full font-bold text-xl transition-all shadow-xl shadow-primary/30"
          >
            <Zap className="h-6 w-6" />
            Criar minha conta grátis
          </Link>
        </div>
      </section>
    </div>
  );
}

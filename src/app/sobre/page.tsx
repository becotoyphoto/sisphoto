import { Camera, Users, Target, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quem Somos | BecoToy',
  description: 'Conheça a BecoToy: marketplace que conecta fotógrafos e clientes para compra e venda de fotos de eventos com segurança e qualidade.',
};

export default function SobrePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black mb-6">Quem somos</h1>
      <p className="text-xl text-muted-foreground mb-12">
        A BecoToy nasceu para conectar fotógrafos e clientes de forma simples, rápida e segura.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card border border-white/10 rounded-2xl p-8">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-3">Nossa Missão</h3>
          <p className="text-muted-foreground">
            Democratizar o acesso a fotos de qualidade. Queremos que cada pessoa
            encontre seus momentos registrados com facilidade, e que cada fotógrafo
            tenha uma plataforma justa para vender seu trabalho.
          </p>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-8">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-3">O que fazemos</h3>
          <p className="text-muted-foreground">
            Marketplace de fotos de eventos esportivos, festas, formaturas e muito mais.
            Fotógrafos sobem as fotos, aplicam marca d&apos;água automática, e clientes
            compram e baixam em alta resolução.
          </p>
        </div>
      </div>

      <div className="mt-12 bg-card border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Nossos valores</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold mb-2">Transparência</h4>
            <p className="text-sm text-muted-foreground">
              Preços claros, sem taxas escondidas. O fotógrafo define o valor e
              recebe 85% de cada venda.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Qualidade</h4>
            <p className="text-sm text-muted-foreground">
              Fotos em alta resolução, com download rápido e seguro.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Agilidade</h4>
            <p className="text-sm text-muted-foreground">
              Fotos disponíveis em até 48 horas após o evento. Saques para
              fotógrafos processados rapidamente via PIX.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Segurança</h4>
            <p className="text-sm text-muted-foreground">
              Seus dados e fotos protegidos com criptografia. Pagamentos
              processados pelo Mercado Pago.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-card border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Entre em contato</h2>
        </div>
        <p className="text-muted-foreground mb-2">
          Tem alguma dúvida ou sugestão? Fale com a gente!
        </p>
        <p className="text-muted-foreground">
          E-mail: contato@becotoy.com.br<br />
          Telefone: (21) 99785-3031
        </p>
      </div>
    </div>
  );
}

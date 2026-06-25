import type { Metadata } from 'next';
import { HelpCircle, CreditCard, Camera, User, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Central de Ajuda | BecoToy',
  description: 'Tire suas dúvidas sobre como usar a BecoToy: como funciona a plataforma, pagamento, download de fotos e gerenciamento da sua conta.',
};

const sections = [
  {
    id: 'como-funciona',
    icon: Search,
    title: 'Como funciona',
    items: [
      {
        question: 'O que é a BecoToy?',
        answer:
          'A BecoToy é um marketplace de fotos de eventos. Fotógrafos publicam fotos com marca d\'água automática e clientes encontram, compram e baixam em alta resolução.',
      },
      {
        question: 'Como encontro minhas fotos?',
        answer:
          'Acesse "Buscar fotos", digite o nome do evento, categoria ou cidade. Você também pode navegar pelas categorias na página inicial.',
      },
      {
        question: 'O que é o reconhecimento facial?',
        answer:
          'Uma tecnologia que permite que clientes encontrem suas fotos automaticamente fazendo upload de uma selfie. O sistema compara o rosto com as fotos do evento.',
      },
    ],
  },
  {
    id: 'pagamentos',
    icon: CreditCard,
    title: 'Pagamentos',
    items: [
      {
        question: 'Quanto custa para clientes?',
        answer:
          'O uso da plataforma é gratuito. Você só paga pelas fotos que comprar. Não há taxas adicionais para o comprador.',
      },
      {
        question: 'Quais formas de pagamento são aceitas?',
        answer:
          'Aceitamos PIX, cartão de crédito e boleto bancário, processados pelo Mercado Pago com total segurança.',
      },
      {
        question: 'Posso pedir reembolso?',
        answer:
          'Sim. Se houver algum problema com a foto comprada (qualidade, erro no download, etc.), entre em contato em até 7 dias após a compra.',
      },
    ],
  },
  {
    id: 'fotos',
    icon: Camera,
    title: 'Fotos',
    items: [
      {
        question: 'Como compro fotos?',
        answer:
          'Navegue até o evento desejado, selecione as fotos que quiser, adicione ao carrinho e finalize a compra.',
      },
      {
        question: 'Baixar as fotos que comprei?',
        answer:
          'Após a confirmação do pagamento, acesse "Suas fotos" no menu. Lá você verá todas as fotos compradas com o botão "Baixar" em alta resolução, sem marca d\'água.',
      },
      {
        question: 'Qual a resolução das fotos?',
        answer:
          'Todas as fotos são disponibilizadas em alta resolução, ideal para impressão e uso digital.',
      },
    ],
  },
  {
    id: 'conta',
    icon: User,
    title: 'Conta',
    items: [
      {
        question: 'Como vendo minhas fotos como fotógrafo?',
        answer:
          'Crie uma conta como fotógrafo, aguarde a aprovação, crie um evento e faça upload das suas fotos. Você recebe 85% de cada venda via PIX.',
      },
      {
        question: 'Quanto recebo por cada venda?',
        answer:
          'O fotógrafo recebe 85% de cada venda realizada. O saldo fica disponível na carteira e pode ser sacado a qualquer momento via PIX.',
      },
      {
        question: 'Esqueci minha senha, o que faço?',
        answer:
          'Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas para o seu e-mail.',
      },
    ],
  },
];

export default function CentralDeAjudaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">Central de Ajuda</h1>
        <p className="text-xl text-muted-foreground">
          Encontre respostas para as dúvidas mais comuns sobre a BecoToy.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="bg-card border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-4 p-6 border-b border-white/10">
              <div className="p-3 bg-primary/10 rounded-xl">
                <section.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">{section.title}</h2>
            </div>

            <div className="divide-y divide-white/5">
              {section.items.map((item, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-white/5 transition-colors">
                    <span className="font-medium pr-4">{item.question}</span>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-card border border-white/10 rounded-2xl p-8 text-center">
        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Não encontrou o que procurava?</h2>
        <p className="text-muted-foreground mb-2">
          Envie um e-mail para a nossa equipe de suporte.
        </p>
        <a
          href="mailto:contato@becotoy.com.br"
          className="text-primary hover:underline font-medium"
        >
          contato@becotoy.com.br
        </a>
        <p className="text-muted-foreground mt-2">Telefone: (21) 99785-3031</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/buscar"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-full font-bold transition-all"
          >
            <Search className="h-4 w-4" />
            Buscar fotos
          </Link>
          <Link
            href="/contratar-fotografo"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 px-6 py-3 rounded-full font-bold transition-all"
          >
            <Camera className="h-4 w-4" />
            Contratar fotógrafo
          </Link>
        </div>
      </div>
    </div>
  );
}

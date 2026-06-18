import { HelpCircle, Search, CreditCard, Download, Upload, Camera, ChevronDown } from 'lucide-react';

const faqItems = [
  {
    question: 'Como encontro minhas fotos?',
    answer: 'Acesse a página "Buscar fotos", digite o nome do evento, categoria ou cidade. Você também pode navegar pelas categorias na página inicial. As fotos com marca d\'água podem ser visualizadas gratuitamente.',
  },
  {
    question: 'Como comprar fotos?',
    answer: 'Navegue até o evento desejado, selecione as fotos que quiser, adicione ao carrinho e finalize a compra. O pagamento é processado pelo Mercado Pago, aceitando PIX, cartão de crédito e boleto.',
  },
  {
    question: 'Como baixar as fotos que comprei?',
    answer: 'Após a confirmação do pagamento, acesse "Suas fotos" no menu. Lá você verá todas as fotos compradas com o botão "Baixar" em cada uma. As fotos vêm em alta resolução, sem marca d\'água.',
  },
  {
    question: 'Sou fotógrafo, como vender minhas fotos?',
    answer: 'Crie uma conta como fotógrafo, aguarde a aprovação do administrador, crie um evento e faça upload das suas fotos. A marca d\'água é aplicada automaticamente. Você recebe 85% de cada venda via PIX.',
  },
  {
    question: 'Qual o prazo para receber o pagamento das vendas?',
    answer: 'O saldo fica disponível na sua carteira assim que o pagamento do cliente é confirmado. Você pode solicitar saque a qualquer momento, e o valor cai na sua conta PIX em até 1 dia útil.',
  },
  {
    question: 'Como funciona o reconhecimento facial?',
    answer: 'O reconhecimento facial permite que clientes encontrem suas fotos automaticamente fazendo upload de uma selfie. O sistema compara o rosto com as fotos do evento e mostra as correspondências.',
  },
  {
    question: 'Posso pedir reembolso?',
    answer: 'Sim. Se houver algum problema com a foto comprada (qualidade, erro no download, etc.), entre em contato pelo e-mail contato@becotoy.com.br em até 7 dias após a compra.',
  },
  {
    question: 'Quanto custa usar a plataforma?',
    answer: 'Para clientes, o uso é gratuito — você só paga pelas fotos que comprar. Para fotógrafos, a plataforma retém 15% de comissão sobre cada venda realizada.',
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

      <div className="space-y-4">
        {faqItems.map((item, i) => (
          <details key={i} className="bg-card border border-white/10 rounded-2xl group">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
              <span className="font-bold pr-4">{item.question}</span>
              <ChevronDown className="h-5 w-5 flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6 text-muted-foreground">
              {item.answer}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-12 bg-card border border-white/10 rounded-2xl p-8 text-center">
        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Não encontrou o que procurava?</h2>
        <p className="text-muted-foreground mb-2">
          Envie um e-mail para a nossa equipe de suporte.
        </p>
        <a href="mailto:contato@becotoy.com.br" className="text-primary hover:underline font-medium">
          contato@becotoy.com.br
        </a>
        <p className="text-muted-foreground mt-2">Telefone: (21) 99785-3031</p>
      </div>
    </div>
  );
}

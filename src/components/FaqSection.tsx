'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqItems = [
  {
    q: 'O que é a BecoToy?',
    a: 'A BecoToy é um marketplace que conecta fotógrafos profissionais a clientes que participaram de eventos esportivos, corridas, formaturas e festas. Você encontra e compra suas fotos em alta resolução de forma rápida e segura.',
  },
  {
    q: 'Como buscar minhas fotos?',
    a: 'É simples: acesse a página Buscar, digite o nome do evento ou selecione uma categoria. Você também pode usar o reconhecimento facial enviando uma selfie para encontrar fotos que contêm seu rosto.',
  },
  {
    q: 'Como comprar fotos e remover a marca d\'água?',
    a: 'Escolha as fotos que deseja, adicione ao carrinho e pague via PIX. Após a confirmação do pagamento, você receberá as fotos em alta resolução sem marca d\'água para download imediato.',
  },
  {
    q: 'Quanto tempo minha foto fica disponível?',
    a: 'As fotos ficam disponíveis por pelo menos 12 meses após o evento. Fotógrafos parceiros podem estender esse período. Você será notificado antes da expiração.',
  },
  {
    q: 'Como funciona o reconhecimento facial?',
    a: 'Envie uma selfie e nosso sistema compara seu rosto com as fotos dos eventos. Em segundos, encontramos todas as fotos em que você aparece. Seus dados faciais são processados de forma segura e não são armazenados.',
  },
  {
    q: 'Como ser fotógrafo parceiro?',
    a: 'Cadastre-se como fotógrafo na página dedicada, envie seus documentos para verificação e comece a vender suas fotos. Você define os preços e recebe saques instantâneos a cada venda.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos PIX como forma principal de pagamento. O processamento é instantâneo e seguro, com proteção total dos seus dados financeiros.',
  },
  {
    q: 'Como funciona o saque para fotógrafos?',
    a: 'Os saques são instantâneos. A cada venda, o valor é creditado disponível para saque imediato na sua conta. Não há valor mínimo para saque.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Perguntas Frequentes
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      openIndex === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

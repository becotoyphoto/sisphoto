export default function TermosDeUsoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black mb-4">Termos de Uso</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Última atualização: 08 de junho de 2026
      </p>

      <div className="bg-card border border-white/10 rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">1. Aceitação dos Termos</h2>
          <p className="text-muted-foreground">
            Ao acessar e usar a plataforma BecoToy (&quot;becotoy.com&quot;), você concorda
            com estes Termos de Uso. Se você não concordar com qualquer parte destes
            termos, não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. Cadastro e Conta</h2>
          <p className="text-muted-foreground">
            Para utilizar determinados recursos da plataforma, é necessário criar uma
            conta fornecendo informações verdadeiras e completas. Você é responsável
            por manter a confidencialidade da sua senha e por todas as atividades
            realizadas em sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. Serviços Oferecidos</h2>
          <p className="text-muted-foreground mb-3">
            A BecoToy oferece uma plataforma de marketplace que conecta fotógrafos e
            clientes para a compra e venda de fotografias digitais. Os serviços incluem:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Upload e armazenamento de fotos por fotógrafos cadastrados</li>
            <li>Aplicação automática de marca d&apos;água</li>
            <li>Venda de fotos digitais em alta resolução</li>
            <li>Download de fotos adquiridas</li>
            <li>Processamento de pagamentos via Mercado Pago</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. Direitos Autorais</h2>
          <p className="text-muted-foreground">
            Os fotógrafos mantêm os direitos autorais sobre suas fotografias. Ao fazer
            upload na plataforma, o fotógrafo concede à BecoToy uma licença não exclusiva
            para exibir e distribuir as fotos com marca d&apos;água para fins de divulgação.
            O cliente que adquire uma foto recebe uma licença de uso pessoal, não
            comercial.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. Pagamentos e Comissões</h2>
          <p className="text-muted-foreground">
            Os pagamentos são processados pelo Mercado Pago. A BecoToy retém 15% de
            comissão sobre cada venda. O valor líquido (85%) fica disponível para saque
            pelo fotógrafo via PIX. Os preços das fotos são definidos exclusivamente
            pelo fotógrafo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. Conteúdo Proibido</h2>
          <p className="text-muted-foreground">
            É proibido o upload de fotos que contenham conteúdo ilegal, pornográfico,
            violento, discriminatório ou que viole direitos de terceiros. A BecoToy
            reserva-se o direito de remover qualquer conteúdo que viole estes termos,
            sem aviso prévio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. Limitação de Responsabilidade</h2>
          <p className="text-muted-foreground">
            A BecoToy não se responsabiliza por perdas ou danos decorrentes do uso da
            plataforma, incluindo indisponibilidade temporária, perda de dados ou
            problemas técnicos. A plataforma é fornecida &quot;como está&quot;, sem garantias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">8. Alterações nos Termos</h2>
          <p className="text-muted-foreground">
            A BecoToy reserva-se o direito de modificar estes Termos de Uso a qualquer
            momento. As alterações entram em vigor imediatamente após sua publicação.
            O uso continuado da plataforma após as alterações constitui aceitação dos
            novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">9. Contato</h2>
          <p className="text-muted-foreground">
            Para dúvidas sobre estes Termos de Uso, entre em contato:<br />
            E-mail: contato@becotoy.com.br<br />
            Telefone: (21) 99785-3031
          </p>
        </section>
      </div>
    </div>
  );
}

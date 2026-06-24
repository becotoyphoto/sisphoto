export default function PoliticaDePrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-black mb-4">Política de Privacidade</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Última atualização: 08 de junho de 2026
      </p>

      <div className="bg-card border border-white/10 rounded-2xl p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">1. Introdução</h2>
          <p className="text-muted-foreground">
            A BecoToy (&quot;nós&quot; ou &quot;nosso&quot;) está comprometida com a proteção da sua
            privacidade. Esta Política de Privacidade explica como coletamos, usamos,
            armazenamos e protegemos suas informações pessoais quando você utiliza
            nossa plataforma becotoy.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. Dados que Coletamos</h2>
          <p className="text-muted-foreground mb-3">
            Coletamos os seguintes tipos de informações:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Dados de cadastro:</strong> nome completo, e-mail, dados de autenticação.</li>
            <li><strong>Dados de perfil:</strong> chave PIX (para fotógrafos), foto de perfil, informações de contato.</li>
            <li><strong>Dados de uso:</strong> fotos visualizadas, compras realizadas, eventos acessados.</li>
            <li><strong>Dados de pagamento:</strong> as transações financeiras são processadas pelo Mercado Pago. Não armazenamos dados de cartão de crédito.</li>
            <li><strong>Fotos:</strong> as fotos enviadas por fotógrafos e selfies enviadas para reconhecimento facial.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. Finalidade do Tratamento</h2>
          <p className="text-muted-foreground">
            Utilizamos seus dados para: fornecer e melhorar nossos serviços, processar
            pagamentos, realizar reconhecimento facial para localização de fotos,
            enviar comunicações relacionadas ao serviço, prevenir fraudes e cumprir
            obrigações legais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">4. Compartilhamento de Dados</h2>
          <p className="text-muted-foreground">
            Seus dados podem ser compartilhados com: processadores de pagamento
            (Mercado Pago), serviços de hospedagem e infraestrutura (Supabase,
            Vercel), e autoridades legais quando exigido por lei. Não vendemos seus
            dados pessoais a terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">5. Armazenamento e Segurança</h2>
          <p className="text-muted-foreground">
            Seus dados são armazenados em servidores seguros com criptografia.
            As fotos são armazenadas no Supabase Storage com acesso controlado.
            Utilizamos práticas de segurança padrão da indústria para proteger suas
            informações contra acesso não autorizado, alteração ou destruição.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">6. Retenção de Dados</h2>
          <p className="text-muted-foreground">
            Mantemos seus dados apenas pelo tempo necessário para cumprir as
            finalidades descritas nesta política, a menos que um período de retenção
            mais longo seja exigido por lei. Fotos de eventos permanecem armazenadas
            enquanto o evento estiver ativo na plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">7. Seus Direitos (LGPD)</h2>
          <p className="text-muted-foreground">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            confirmar a existência de tratamento de dados, acessar seus dados, corrigir
            dados incompletos ou inexatos, solicitar a eliminação de dados
            desnecessários, e revogar o consentimento. Para exercer esses direitos,
            entre em contato pelo e-mail abaixo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">8. Cookies</h2>
          <p className="text-muted-foreground">
            Utilizamos cookies essenciais para o funcionamento da plataforma
            (autenticação, carrinho de compras). Não utilizamos cookies de
            rastreamento para fins publicitários.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">9. Alterações nesta Política</h2>
          <p className="text-muted-foreground">
            Podemos atualizar esta Política de Privacidade periodicamente. A data da
            última atualização será indicada no topo desta página. Recomendamos que
            você revise esta política regularmente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">10. Contato</h2>
          <p className="text-muted-foreground">
            Para dúvidas sobre esta Política de Privacidade ou para exercer seus
            direitos:<br />
            E-mail: contato@becotoy.com.br<br />
            Telefone: (21) 99785-3031<br />
            Responsável: BECOTOY LTDA. - CNPJ em atualização cadastral.
          </p>
        </section>
      </div>
    </div>
  );
}

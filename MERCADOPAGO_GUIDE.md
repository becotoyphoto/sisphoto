# Guia de Configuração do Mercado Pago - FotoEvento Brasil

Para integrar os pagamentos, siga estes passos:

## 1. Conta de Desenvolvedor
- Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel).
- Faça login com sua conta do Mercado Pago.

## 2. Criar Aplicação
- Clique em **Criar aplicação**.
- Dê um nome (ex: FotoEvento Brasil).
- Selecione o tipo de solução: **Checkout Pro**.

## 3. Obter Credenciais
- No menu lateral da sua aplicação, vá em **Credenciais de produção** ou **Credenciais de teste** (recomenda-se começar com teste).
- Copie o **Access Token**.

## 4. Variáveis de Ambiente
- Adicione as chaves ao seu arquivo `.env.local`:
  ```env
  MERCADOPAGO_ACCESS_TOKEN=seu-access-token-aqui
  NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=sua-public-key-aqui
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

## 5. Configurar Webhook (Obrigatório)
- Para atualizar o status do pedido automaticamente quando o pagamento for aprovado:
- Vá em **Webhooks** no painel do Mercado Pago.
- Clique em **Criar webhook**.
- Configure a URL de notificação: `https://seu-dominio.com/api/webhooks/mercadopago`.
- Selecione os eventos:
  - `payment.created`
  - `payment.updated`
- Clique em **Salvar**.

## 6. Configurar o .env para produção
Quando for fazer deploy na Vercel:
```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
MERCADOPAGO_ACCESS_TOKEN=seu-token-de-produção
```

## Fluxo de Pagamento

1. Cliente adiciona fotos ao carrinho
2. Cliente clica em "Pagar com Mercado Pago"
3. Sistema cria preferência no Mercado Pago
4. Cliente é redirecionado para o checkout do Mercado Pago
5. Após pagamento, webhook recebe notificação
6. Sistema cria pedido e limpa carrinho
7. Cliente é redirecionado para página de sucesso

## Testes
- Use o Sandbox do Mercado Pago para testar sem pagar real.
- Cartões de teste disponíveis na documentação do Mercado Pago.

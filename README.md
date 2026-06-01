# FotoEvento Brasil 📸

Um marketplace moderno para venda de fotos de eventos, inspirado em plataformas como Banlek.

## 🚀 Tecnologias

- **Frontend:** Next.js 14, Tailwind CSS, Lucide React
- **Backend:** Supabase (Auth, Database, Storage)
- **Pagamentos:** Mercado Pago SDK
- **Deploy:** Vercel

## 🛠️ Como rodar localmente

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/fotoevento-brasil.git
   cd fotoevento-brasil
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env.local`.
   - Preencha com suas chaves do Supabase e Mercado Pago.

4. **Rodar o projeto:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

## 📦 Configuração dos Serviços

- Veja o [Guia do Supabase](./SUPABASE_GUIDE.md) para configurar o banco e storage.
- Veja o [Guia do Mercado Pago](./MERCADOPAGO_GUIDE.md) para configurar os pagamentos.

## 🚢 Deploy na Vercel

1. Crie um novo projeto na [Vercel](https://vercel.com).
2. Importe o repositório do GitHub.
3. Adicione as variáveis de ambiente que estão no seu `.env.local`.
4. Clique em **Deploy**.

## 📄 Licença

Este projeto está sob a licença MIT.

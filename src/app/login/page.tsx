import type { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Entrar | BecoToy',
  description: 'Entre na sua conta da BecoToy para acessar fotos compradas, pedidos e recursos da plataforma.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}

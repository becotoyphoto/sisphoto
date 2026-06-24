import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="bg-black/80 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              A BecoToy é uma plataforma de fotografia que conecta fotógrafos e clientes para venda de fotos online, com tecnologia de reconhecimento facial e suporte completo 24h.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Avenida Dom Helder Camara, 6001, Engenho de Dentro, cep 20771035
              </p>
            </div>
          </div>

          {/* Nossos serviços */}
          <div>
            <h3 className="font-bold mb-4">Nossos serviços</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/buscar" className="hover:text-primary transition-colors">Buscar fotos</Link></li>
              <li><Link href="/fotografo" className="hover:text-primary transition-colors">Vender fotos</Link></li>
              <li><Link href="/dashboard/cliente" className="hover:text-primary transition-colors">Baixar fotos</Link></li>
              <li><Link href="/central-de-ajuda" className="hover:text-primary transition-colors">Falar com suporte</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-bold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/sobre" className="hover:text-primary transition-colors">Quem somos</Link></li>
              <li><Link href="/central-de-ajuda" className="hover:text-primary transition-colors">Suporte</Link></li>
              <li><Link href="/termos-de-uso" className="hover:text-primary transition-colors">Termos de uso</Link></li>
              <li><Link href="/politica-de-privacidade" className="hover:text-primary transition-colors">Política de privacidade</Link></li>
            </ul>
          </div>
        </div>

        {/* Company Info */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">BECOTOY LTDA.</h4>
              <p>CNPJ em atualização cadastral.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Contato</h4>
              <a href="tel:+5521997853031" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> (21) 99785-3031</a>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@becotoy.com.br</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Redes Sociais</h4>
              <div className="flex gap-4 mt-2">
                <a href="https://www.instagram.com/becotoy/" className="hover:text-primary transition-colors">Instagram</a>
                <a href="https://www.facebook.com/becotoy/" className="hover:text-primary transition-colors">Facebook</a>
                <a href="https://www.tiktok.com/@becotoy" className="hover:text-primary transition-colors">Tiktok</a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} BecoToy. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

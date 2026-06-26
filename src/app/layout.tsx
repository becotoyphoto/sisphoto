import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNavBar from "@/components/BottomNavBar";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'BecoToy | Suas memórias em alta resolução',
    template: '%s | BecoToy',
  },
  description: 'Marketplace de fotos de eventos esportivos, corridas, formaturas e festas. Encontre e compre fotos em alta resolução dos seus melhores momentos.',
  keywords: [
    'marketplace de fotos', 'fotos de corrida', 'fotos de futebol', 'fotos de formatura',
    'vender fotos online', 'comprar fotos de evento', 'fotos esportivas', 'fotos esportivas online',
    'fotos de marathon', 'fotos de competição', 'fotos de festa', 'fotos de formatura online',
    'fotógrafo de eventos', 'fotos em alta resolução', 'download de fotos', 'fotos digitais',
    'fotos de Beach Tennis', 'fotos de ciclismo', 'fotos de natação', 'fotos de Jiu-Jitsu',
    'BecoToy', 'fotos esportivas Brasil', 'vender fotos de evento', 'fotos profissionais',
  ],
  openGraph: {
    title: 'BecoToy | Suas memórias em alta resolução',
    description: 'Marketplace de fotos de eventos esportivos, corridas, formaturas e festas. Encontre e compre fotos em alta resolução.',
    url: 'https://becotoy.com',
    siteName: 'BecoToy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BecoToy — Marketplace de fotos de eventos',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BecoToy | Suas memórias em alta resolução',
    description: 'Marketplace de fotos de eventos esportivos, corridas, formaturas e festas.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://trae.ai" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground pb-24 md:pb-0`}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <BottomNavBar />
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

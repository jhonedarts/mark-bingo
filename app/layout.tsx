import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { faviconUrl } from './src/public-assets';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Marca Bingo',
  description: 'Marcador local para acompanhar até quatro cartelas de bingo.',
  icons: {
    icon: [{ url: faviconUrl, type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { NetworkWarningBanner } from '@/components/web3/NetworkWarningBanner';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pledge | NFT Lending Marketplace',
  description: 'Instant fixed-rate NFT liquidity and lending protocol on Robinhood Chain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Web3Provider>
          <NetworkWarningBanner />
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pledge.fi';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pledge | NFT Lending Marketplace',
    template: '%s | Pledge',
  },
  description: 'Fixed-rate, peer-to-peer NFT liquidity marketplace on Robinhood Chain. Borrow ETH against curated ERC-721 NFTs with zero price liquidation.',
  applicationName: 'Pledge',
  authors: [{ name: 'Pledge Protocol' }],
  generator: 'Next.js',
  keywords: ['NFT lending', 'NFT liquidity', 'Robinhood Chain', 'P2P loans', 'fixed rate', 'ETH loans', 'ERC-721'],
  referrer: 'origin-when-cross-origin',
  creator: 'Pledge Protocol',
  publisher: 'Pledge Protocol',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Pledge',
    title: 'Pledge | NFT Liquidity & Lending Marketplace',
    description: 'Fixed-rate, peer-to-peer NFT liquidity marketplace on Robinhood Chain. Borrow ETH with zero price liquidation.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Pledge - NFT Lending Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pledge | NFT Liquidity & Lending Marketplace',
    description: 'Fixed-rate, peer-to-peer NFT liquidity marketplace on Robinhood Chain. Borrow ETH with zero price liquidation.',
    creator: '@pledge_fi',
    site: '@pledge_fi',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Pledge',
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`,
        description: 'NFT Liquidity & Lending Marketplace on Robinhood Chain',
        sameAs: [
          'https://twitter.com/pledge_fi',
          'https://discord.gg/pledge',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Pledge',
        url: siteUrl,
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('pledge:theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full font-sans bg-[var(--bg)] text-[var(--text)] transition-colors duration-150">
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}

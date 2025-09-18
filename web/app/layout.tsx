import React from 'react';
import './globals.css';
import { Providers } from '@/components/providers';
import { HeaderWallet } from '@/components/header-wallet';

export const metadata = {
  title: 'Kamo Mini App',
  description: 'Farcaster + Zora scheduler',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <header className="border-b border-border bg-[rgb(var(--background)_/_0.85)] backdrop-blur-md">
            <div className="container flex items-center justify-between py-4">
              <div>
                <p className="text-title font-semibold text-foreground">Kamo</p>
                <p className="text-caption text-muted-foreground">Mini App (Next.js)</p>
              </div>
              <HeaderWallet />
            </div>
          </header>
          <main className="container py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

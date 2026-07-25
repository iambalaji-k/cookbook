import type { Metadata, Viewport } from 'next';
import { Orbitron, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Culinary Cookbook & AI Kitchen Assistant',
  description: 'Structured Data First Family Cookbook & AI Staging Pipeline',
  manifest: '/manifest.json',
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cookbook',
  },
};

export const viewport: Viewport = {
  themeColor: '#080706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-[#080706] text-neutral-100 antialiased selection:bg-orange-500 selection:text-white min-h-screen flex flex-col font-sans relative overflow-x-hidden">
        {/* Cybernetic Background Grid Texture */}
        <div className="fixed inset-0 bg-cyber-grid opacity-30 pointer-events-none z-0" />
        <div className="fixed inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-cyan-500/5 pointer-events-none z-0" />

        {/* Top App Header Bar */}
        <Header />

        <div className="flex flex-1 w-full z-10">
          {/* Navigation Sidebar (Desktop) */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 overflow-y-auto w-full max-w-7xl 2xl:max-w-[1700px] mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileNav />
      </body>
    </html>
  );
}


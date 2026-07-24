import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Culinary Cookbook & AI Kitchen Assistant',
  description: 'Structured Data First Family Cookbook & AI Staging Pipeline',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cookbook',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
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
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased selection:bg-orange-500 selection:text-white min-h-screen flex flex-col`}>
        {/* Top App Header Bar */}
        <Header />

        <div className="flex flex-1 max-w-7xl w-full mx-auto">
          {/* Navigation Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

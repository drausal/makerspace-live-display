import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { ChakraUIProvider } from '@/components/providers/chakra-provider';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
});

export const metadata = {
  title: 'HQ Makerspace Live Display',
  description: 'Real-time event display for the Maker Space TV with age group indicators',
  robots: 'noindex, nofollow', // Don't index the display pages
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className="font-sans antialiased">
        <ChakraUIProvider>
          {children}
          <Analytics />
        </ChakraUIProvider>
      </body>
    </html>
  );
}

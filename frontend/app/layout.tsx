import type { Metadata } from 'next';
import { DM_Sans, Bebas_Neue } from 'next/font/google';
import { Providers } from './providers';
import { AppWithCursor } from './AppWithCursor';
import { PwaRegister } from './PwaRegister';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import './globals.css';

// Load DM Sans font with next/font for optimization
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

// Site-wide metadata configuration
export const metadata: Metadata = {
  metadataBase: new URL('https://primedealauto.co.za'),
  title: {
    default: 'Prime Deal Auto',
    template: '%s | Prime Deal Auto',
  },
  description: 'Find your perfect car at Prime Deal Auto. Browse quality used and new vehicles in South Africa.',
  keywords: ['cars', 'used cars', 'new cars', 'South Africa', 'Johannesburg', 'car dealership', 'vehicles'],
  authors: [{ name: 'Prime Deal Auto' }],
  openGraph: {
    type: 'website',
    siteName: 'Prime Deal Auto',
    locale: 'en_ZA',
    title: 'Prime Deal Auto',
    description: 'Find your perfect car at Prime Deal Auto. Browse quality used and new vehicles in South Africa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prime Deal Auto',
    description: 'Find your perfect car at Prime Deal Auto. Browse quality used and new vehicles in South Africa.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${bebasNeue.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <GoogleAnalytics />
        <Providers>
          <PwaRegister />
          <PwaInstallPrompt />
          <AppWithCursor>{children}</AppWithCursor>
        </Providers>
      </body>
    </html>
  );
}

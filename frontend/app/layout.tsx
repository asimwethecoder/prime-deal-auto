import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://primedealauto.co.za'),
  title: {
    default: 'Prime Deal Auto',
    template: '%s | Prime Deal Auto',
  },
  description: 'Find your perfect car at Prime Deal Auto — quality used and new vehicles in South Africa.',
  openGraph: {
    type: 'website',
    siteName: 'Prime Deal Auto',
    locale: 'en_ZA',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

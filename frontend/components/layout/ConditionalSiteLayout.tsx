'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { WhatsAppFloatingButton } from '@/components/layout/WhatsAppFloatingButton';

const DASHBOARD_PREFIXES = ['/dashboard', '/admin'];

export function ConditionalSiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-primary">
        {children}
      </main>
      <Footer />
      <WhatsAppFloatingButton />
      <ChatWidget />
    </>
  );
}

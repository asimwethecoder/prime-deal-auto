'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { WhatsAppFloatingButton } from '@/components/layout/WhatsAppFloatingButton';
import { Icon } from '@/components/ui/Icon';
import { useChatStore } from '@/lib/stores/chat-store';

/** CSS filter to tint black icon to brand blue #405FF2 */
const ACTIVE_ICON_FILTER = 'brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(500%) hue-rotate(220deg)';

const DASHBOARD_PREFIXES = ['/dashboard', '/admin'];

const FOCUS_HERO_SEARCH = 'focus-hero-search';
const PHONE_TEL = 'tel:+27719404596';
const WHATSAPP_LINK = 'https://wa.link/r12kgt';

export function ConditionalSiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isChatOpen = useChatStore((s) => s.isOpen);
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isDashboard) {
    return <>{children}</>;
  }

  const isHome = pathname === '/';
  const isCars = pathname?.startsWith('/cars') ?? false;
  // Check if we're on a VDP (Vehicle Detail Page) - /cars/[carId]
  const isVDP = pathname?.match(/^\/cars\/[^/]+$/) !== null;

  function handleSearchNav() {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent(FOCUS_HERO_SEARCH));
    } else {
      router.push('/#hero-search');
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-primary pb-20 md:pb-0">
        {children}
      </main>
      <Footer />

      {/* Public-facing bottom nav: luxury glassmorphism (mobile only) - hidden on VDP pages and when chat is open */}
      {!isVDP && (
        <nav
          className={`fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/70 backdrop-blur-xl shadow-[0_-5px_25px_rgba(0,0,0,0.03)] border-t border-white/20 pb-[env(safe-area-inset-bottom,20px)] transition-opacity duration-200 ${isChatOpen ? 'opacity-0 pointer-events-none' : ''}`}
          role="navigation"
          aria-label="Mobile bottom navigation"
        >
          <div className="flex justify-around items-center h-[75px]">
            <Link
              href="/"
              className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 py-1 ${isHome ? 'text-[#405FF2]' : 'text-[#050B20]/40'}`}
              aria-current={isHome ? 'page' : undefined}
              data-cursor-magnetic
            >
              <span className="inline-block shrink-0" style={isHome ? { filter: ACTIVE_ICON_FILTER } : { opacity: 0.4 }}>
                <Icon src="home-1-svgrepo-com.svg" width={24} height={24} aria-hidden />
              </span>
              <span className="text-[12px] font-medium">Home</span>
              {isHome && <span className="w-1 h-1 rounded-full bg-[#405FF2]" aria-hidden />}
            </Link>
            <Link
              href="/cars"
              className={`flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 py-1 ${isCars ? 'text-[#405FF2]' : 'text-[#050B20]/40'}`}
              aria-current={isCars ? 'page' : undefined}
              data-cursor-magnetic
            >
              <span className="inline-block shrink-0" style={isCars ? { filter: ACTIVE_ICON_FILTER } : { opacity: 0.4 }}>
                <Icon src="car-svgrepo-com (1).svg" width={24} height={24} aria-hidden />
              </span>
              <span className="text-[12px] font-medium">Cars</span>
              {isCars && <span className="w-1 h-1 rounded-full bg-[#405FF2]" aria-hidden />}
            </Link>
            <a
              href={PHONE_TEL}
              className="flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 py-1 text-[#050B20]/40"
              aria-label="Call us"
              data-cursor-magnetic
            >
              <span className="inline-block shrink-0 opacity-40">
                <Icon src="phone-svgrepo-com.svg" width={24} height={24} aria-hidden />
              </span>
              <span className="text-[12px] font-medium">Phone</span>
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 py-1 text-[#050B20]/40"
              aria-label="Chat on WhatsApp"
              data-cursor-magnetic
            >
              <span className="inline-block shrink-0">
                <Icon src="whatsapp-svgrepo-com.svg" width={28} height={28} aria-hidden />
              </span>
              <span className="text-[12px] font-medium">WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleSearchNav}
              className="flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 py-1 text-[#050B20]/40"
              aria-label="Scroll to top and focus search"
              data-cursor-magnetic
            >
              <span className="inline-block shrink-0 opacity-40">
                <Icon src="search-svgrepo-com.svg" width={24} height={24} aria-hidden />
              </span>
              <span className="text-[12px] font-medium">Search</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-menu'))}
              className="flex flex-col items-center gap-0.5 min-h-[44px] justify-center px-3 py-1 text-[#050B20]/40"
              aria-label="Open menu"
              data-cursor-magnetic
            >
              <span className="inline-block shrink-0 opacity-40">
                <Icon src="hamburger-menu-svgrepo-com.svg" width={24} height={24} aria-hidden />
              </span>
              <span className="text-[12px] font-medium">Menu</span>
            </button>
          </div>
        </nav>
      )}

      <WhatsAppFloatingButton />
      <ChatWidget />
    </>
  );
}

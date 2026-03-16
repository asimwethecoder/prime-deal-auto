'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Car, Phone, Search } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat-store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: 'link' | 'scroll-to-search';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home, action: 'link' },
  { label: 'Cars', href: '/cars', icon: Car, action: 'link' },
  { label: 'Contact', href: '/contact', icon: Phone, action: 'link' },
  { label: 'Search', href: '#search', icon: Search, action: 'scroll-to-search' },
];

/**
 * MobileNavigation Component
 * 
 * Luxury glassmorphism mobile navigation bar with:
 * - Fixed positioning at bottom of viewport
 * - Safe area padding for device notches (iPhone X+)
 * - Backdrop blur with fallback for unsupported browsers
 * - Four nav icons: Home, Cars, Contact, Search
 * - Search triggers scroll to AI Search Bar
 * - Only visible on mobile viewport (< 640px)
 */
export function MobileNavigation() {
  const pathname = usePathname();
  const isChatOpen = useChatStore((s) => s.isOpen);

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.action === 'scroll-to-search') {
      e.preventDefault();
      
      // Try to find the search bar element
      const searchBar = document.querySelector('[data-search-bar]') 
        || document.querySelector('#search-bar')
        || document.querySelector('[role="search"]')
        || document.querySelector('input[type="search"]');
      
      if (searchBar) {
        searchBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the input if it's an input element
        if (searchBar instanceof HTMLInputElement) {
          setTimeout(() => searchBar.focus(), 500);
        }
      } else {
        // Fallback: scroll to top where search usually is
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        sm:hidden
        bg-white/60 backdrop-blur-xl
        border-t border-white/20
        supports-[backdrop-filter]:bg-white/60
        [&:not(:has(~*))]:bg-white/90
        transition-opacity duration-200
        ${isChatOpen ? 'opacity-0 pointer-events-none' : ''}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      }}
      aria-label="Mobile navigation"
    >
      {/* Fallback background for browsers without backdrop-filter */}
      <div 
        className="
          absolute inset-0 bg-white/90 -z-10
          supports-[backdrop-filter]:hidden
        " 
      />
      
      <div className="flex items-center justify-around px-4 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          if (item.action === 'scroll-to-search') {
            return (
              <button
                key={item.label}
                onClick={(e) => handleNavClick(item, e)}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1
                  transition-colors duration-150
                  ${active ? 'text-secondary' : 'text-primary/70 hover:text-primary'}
                `}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 px-3 py-1
                transition-colors duration-150
                ${active ? 'text-secondary' : 'text-primary/70 hover:text-primary'}
              `}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * MobileNavigationSpacer Component
 * 
 * Adds bottom padding to page content to prevent
 * the mobile navigation from covering content.
 * Only visible on mobile viewport.
 */
export function MobileNavigationSpacer() {
  return (
    <div 
      className="sm:hidden h-20"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-hidden="true"
    />
  );
}

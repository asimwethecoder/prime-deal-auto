'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  MessageCircle,
  User,
  LogOut,
} from 'lucide-react';

const SIDEBAR_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/listings', label: 'My Listings', icon: Car },
  { href: '/dashboard/listings/add', label: 'Add Listings', icon: PlusCircle },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { signOut } = await import('aws-amplify/auth');
      await signOut();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050B20]">
      {/* Top header - dark blue */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#050B20] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden rounded-lg p-2 text-white hover:bg-white/10"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <Icon src="hamburger-menu-svgrepo-com.svg" width={24} height={24} className="invert" aria-hidden />
          </button>
          <Link href="/" className="flex items-center shrink-0" aria-label="Prime Deal Auto Home">
            <span className="inline-flex rounded-lg overflow-hidden bg-white px-2 py-1.5">
              <Image
                src="/logo/primedealautologo.jpeg"
                alt="Prime Deal Auto"
                width={120}
                height={40}
                className="h-8 w-auto max-h-8 object-contain rounded-lg"
              />
            </span>
          </Link>
          <Link
            href="/cars"
            className="hidden sm:flex items-center gap-2 text-white/90 hover:text-white text-sm border border-white/30 rounded-full pl-3 pr-4 py-2 min-w-[200px] bg-white/5"
          >
            <Icon src="search-alt-2-svgrepo-com.svg" width={16} height={16} className="invert shrink-0" aria-hidden />
            <span className="truncate">Search Cars eg. Audi Q7</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-white font-medium text-[15px]">
          <Link href="/" className="hover:text-white/90">Home</Link>
          <Link href="/cars" className="hover:text-white/90">Cars</Link>
          <Link href="/contact" className="hover:text-white/90">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Profile"
          >
            <User size={20} />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
        )}

        {/* Sidebar - 300px, dark blue */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 z-40 flex h-[calc(100vh-4rem)] w-[300px] flex-col border-r border-white/10 bg-[#050B20]
            transition-transform duration-200 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="flex flex-col gap-1 p-4" aria-label="Dashboard navigation">
            {SIDEBAR_LINKS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors
                    ${isActive ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white">
                    <IconComponent size={20} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors mt-2"
            >
              <LogOut size={20} className="text-white" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>

      {/* Footer - dark blue */}
      <footer className="border-t border-white/10 bg-[#050B20] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-white/80">
          <span>© {new Date().getFullYear()} Prime Deal Auto. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Notice</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

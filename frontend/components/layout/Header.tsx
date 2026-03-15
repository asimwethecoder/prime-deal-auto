'use client';

// Header Component - Site-wide navigation
// Home: transparent over hero, solid primary on scroll. Other pages: always solid primary (#050B20) with white text.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User, LogOut, LayoutDashboard } from 'lucide-react';

const SCROLL_THRESHOLD = 10;

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Auth state from Zustand store
  const { isAuthenticated, isLoading, user, role, initialize, signOut } = useAuthStore();

  const isHomePage = pathname === '/';
  const isTransparent = isHomePage && !scrolled;
  
  // Check if user is staff (admin or dealer)
  const isStaff = role === 'admin' || role === 'dealer';

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    await signOut();
    closeMobileMenu();
  };

  const navLinkClass = isTransparent
    ? 'text-white hover:text-white/90 transition-colors font-medium text-[15px]'
    : 'text-white hover:text-white/90 transition-colors font-medium text-[15px]';
  const searchPillClass = isTransparent
    ? 'flex items-center gap-2 text-white/90 hover:text-white text-sm border border-white/30 rounded-full pl-3 pr-4 py-2 min-w-[200px] bg-white/5'
    : 'flex items-center gap-2 text-white/90 hover:text-white text-sm border border-white/30 rounded-full pl-3 pr-4 py-2 min-w-[200px] bg-white/5';
  const logoClass = 'flex items-center hover:opacity-90 transition-opacity';

  // Render auth section based on state
  const renderAuthSection = () => {
    // Show loading skeleton while checking auth
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 bg-white/10 rounded animate-pulse" />
        </div>
      );
    }

    // Authenticated user
    if (isAuthenticated && user) {
      return (
        <>
          {isStaff ? (
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 ${navLinkClass}`}
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 ${navLinkClass}`}
            >
              <User className="w-4 h-4" aria-hidden />
              My Account
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-2 ${navLinkClass}`}
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Sign Out
          </button>
        </>
      );
    }

    // Not authenticated
    return (
      <>
        <Link
          href="/login"
          className={`flex items-center gap-2 ${navLinkClass}`}
        >
          <Icon
            src="signin-svgrepo-com.svg"
            width={18}
            height={18}
            className="invert shrink-0"
            aria-hidden
          />
          Sign In
        </Link>
        <Link href="/register" className={navLinkClass}>
          Register
        </Link>
      </>
    );
  };

  // Render mobile auth section
  const renderMobileAuthSection = () => {
    if (isLoading) {
      return (
        <div className="min-h-[44px] flex items-center">
          <div className="w-24 h-6 bg-white/10 rounded animate-pulse" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <>
          {isStaff ? (
            <Link 
              href="/dashboard" 
              className="min-h-[44px] flex items-center gap-2 text-white hover:text-white/90 transition-colors font-medium py-3" 
              onClick={closeMobileMenu}
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden />
              Dashboard
            </Link>
          ) : (
            <Link 
              href="/dashboard" 
              className="min-h-[44px] flex items-center gap-2 text-white hover:text-white/90 transition-colors font-medium py-3" 
              onClick={closeMobileMenu}
            >
              <User className="w-4 h-4" aria-hidden />
              My Account
            </Link>
          )}
          <button 
            onClick={handleSignOut}
            className="min-h-[44px] flex items-center gap-2 text-white hover:text-white/90 transition-colors font-medium py-3 w-full text-left"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Sign Out
          </button>
        </>
      );
    }

    return (
      <>
        <Link href="/login" className="min-h-[44px] flex items-center gap-2 text-white hover:text-white/90 transition-colors font-medium py-3" onClick={closeMobileMenu}>
          <Icon src="signin-svgrepo-com.svg" width={18} height={18} className="invert" aria-hidden />
          Sign In
        </Link>
        <Link href="/register" className="min-h-[44px] flex items-center text-white hover:text-white/90 transition-colors font-medium py-3" onClick={closeMobileMenu}>
          Register
        </Link>
      </>
    );
  };

  return (
    <header
      className={`z-[100] transition-colors duration-300 ${
        isTransparent
          ? 'absolute top-0 left-0 right-0 bg-transparent'
          : 'sticky top-0 left-0 right-0 bg-primary border-b border-primary'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Search pill */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <Link
              href="/"
              className={logoClass}
              aria-label="Prime Deal Auto Home"
            >
              <span
                className={`inline-flex items-center justify-center rounded-lg overflow-hidden ${!isTransparent ? 'bg-white px-2 py-1.5' : ''}`}
              >
                <Image
                  src="/logo/primedealautologo.jpeg"
                  alt="Prime Deal Auto"
                  width={150}
                  height={50}
                  priority
                  className="h-[50px] w-auto rounded-lg max-h-[50px] object-contain"
                />
              </span>
            </Link>
            <Link
              href="/cars"
              className={`hidden lg:flex shrink-0 ${searchPillClass}`}
            >
              <Icon
                src="search-alt-2-svgrepo-com.svg"
                width={16}
                height={16}
                className="invert shrink-0"
                aria-hidden
              />
              <span className="truncate">Search Cars eg. Audi Q7</span>
            </Link>
          </div>

          {/* Right: Nav links + Auth section + Add Listing */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <nav className="flex items-center gap-6" role="navigation" aria-label="Main navigation">
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
              <Link href="/about" className={navLinkClass}>
                About
              </Link>
              <Link href="/cars" className={navLinkClass}>
                Cars
              </Link>
              <Link href="/contact" className={navLinkClass}>
                Contact
              </Link>
            </nav>
            {renderAuthSection()}
            <Link
              href="/ad-listing"
              className="bg-white text-primary px-6 py-2.5 rounded-full text-[15px] font-medium hover:bg-white/90 transition-colors shrink-0"
            >
              Add Listing
            </Link>
          </div>

          {/* Mobile Menu Button - min 44px touch target */}
          <button
            type="button"
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-md transition-colors text-white hover:bg-white/10"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <Icon src="close-square-svgrepo-com.svg" width={24} height={24} className="invert" aria-hidden />
            ) : (
              <Icon src="hamburger-menu-svgrepo-com.svg" width={24} height={24} className="invert" aria-hidden />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            className="lg:hidden py-4 border-t border-white/20"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col">
              <Link href="/" className="min-h-[44px] flex items-center text-white hover:text-white/90 transition-colors font-medium py-3" onClick={closeMobileMenu}>
                Home
              </Link>
              <Link href="/about" className="min-h-[44px] flex items-center text-white hover:text-white/90 transition-colors font-medium py-3" onClick={closeMobileMenu}>
                About
              </Link>
              <Link href="/cars" className="min-h-[44px] flex items-center text-white hover:text-white/90 transition-colors font-medium py-3" onClick={closeMobileMenu}>
                Cars
              </Link>
              <Link href="/contact" className="min-h-[44px] flex items-center text-white hover:text-white/90 transition-colors font-medium py-3" onClick={closeMobileMenu}>
                Contact
              </Link>
              {renderMobileAuthSection()}
              <Link
                href="/ad-listing"
                className="min-h-[44px] flex items-center justify-center bg-white text-primary px-6 py-3 rounded-full text-[15px] font-medium hover:bg-white/90 transition-colors mt-2"
                onClick={closeMobileMenu}
              >
                Add Listing
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

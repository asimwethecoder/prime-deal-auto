'use client';

// Header Component - Site-wide navigation
// Transparent over hero, solid navy on scroll. Logo: Prime Deal Auto.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';

const SCROLL_THRESHOLD = 10;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    handleScroll(); // init in case of scroll restore
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isTransparent = !scrolled;
  const navLinkClass = isTransparent
    ? 'text-white hover:text-white/90 transition-colors font-medium text-[15px]'
    : 'text-primary hover:text-secondary transition-colors font-medium text-[15px]';
  const searchPillClass = isTransparent
    ? 'flex items-center gap-2 text-white/90 hover:text-white text-sm border border-white/30 rounded-full pl-3 pr-4 py-2 min-w-[200px] bg-white/5'
    : 'flex items-center gap-2 text-primary/70 hover:text-primary text-sm border border-border rounded-full pl-3 pr-4 py-2 min-w-[200px]';
  const logoClass = 'flex items-center hover:opacity-90 transition-opacity';

  return (
    <header
      className={`z-[100] transition-colors duration-300 ${
        isTransparent
          ? 'absolute top-0 left-0 right-0 bg-transparent'
          : 'sticky top-0 bg-primary border-b border-primary'
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
              <Image
                src="/logo/primedealautologo.jpeg"
                alt="Prime Deal Auto"
                width={120}
                height={40}
                priority
                className={`h-10 w-auto rounded-lg ${!isTransparent ? 'brightness-0 invert' : ''}`}
              />
            </Link>
            <Link
              href="/cars"
              className={`hidden lg:flex shrink-0 ${searchPillClass}`}
            >
              <Icon
                src="search-alt-2-svgrepo-com.svg"
                width={16}
                height={16}
                className={isTransparent ? 'invert shrink-0' : 'shrink-0'}
                aria-hidden
              />
              <span className="truncate">Search Cars eg. Audi Q7</span>
            </Link>
          </div>

          {/* Right: Nav links + Sign in + Add Listing */}
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
            <Link
              href="/signin"
              className={`flex items-center gap-2 ${navLinkClass}`}
            >
              <Icon
                src="signin-svgrepo-com.svg"
                width={18}
                height={18}
                className={isTransparent ? 'invert shrink-0' : 'shrink-0'}
                aria-hidden
              />
              Sign In
            </Link>
            <Link
              href="/ad-listing"
              className="bg-white text-primary px-6 py-2.5 rounded-full text-[15px] font-medium hover:bg-white/90 transition-colors shrink-0"
            >
              Add Listing
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={`lg:hidden p-2 rounded-md transition-colors ${
              isTransparent ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-bg-1'
            }`}
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <Icon src="close-square-svgrepo-com.svg" width={24} height={24} className={isTransparent ? 'invert' : ''} aria-hidden />
            ) : (
              <Icon src="hamburger-menu-svgrepo-com.svg" width={24} height={24} className={isTransparent ? 'invert' : ''} aria-hidden />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            className="lg:hidden py-4 border-t border-border"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-primary hover:text-secondary transition-colors font-medium py-2" onClick={closeMobileMenu}>
                Home
              </Link>
              <Link href="/about" className="text-primary hover:text-secondary transition-colors font-medium py-2" onClick={closeMobileMenu}>
                About
              </Link>
              <Link href="/cars" className="text-primary hover:text-secondary transition-colors font-medium py-2" onClick={closeMobileMenu}>
                Cars
              </Link>
              <Link href="/contact" className="text-primary hover:text-secondary transition-colors font-medium py-2" onClick={closeMobileMenu}>
                Contact
              </Link>
              <Link href="/signin" className="text-primary hover:text-secondary transition-colors font-medium py-2 flex items-center gap-2" onClick={closeMobileMenu}>
                <Icon src="signin-svgrepo-com.svg" width={18} height={18} aria-hidden />
                Sign In
              </Link>
              <Link
                href="/ad-listing"
                className="bg-white text-primary px-6 py-3 rounded-full text-[15px] font-medium hover:bg-white/90 transition-colors text-center"
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

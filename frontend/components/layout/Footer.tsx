// Footer Component - Matches Figma: navy background, newsletter pill, 5 columns, bottom bar

import Link from 'next/link';
import { Linkedin } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { getPhoneLink, formatPhoneNumber, formatWhatsAppNumber, getWhatsAppLink } from '@/lib/whatsapp';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary bg-[#050B20] text-white rounded-t-[40px] md:rounded-t-[80px] mt-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-6 lg:px-8 py-12 lg:py-16">
        {/* Newsletter block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="text-[30px] leading-[45px] font-medium text-white mb-2">
              Join Prime Deal Auto
            </h2>
            <p className="text-[15px] leading-[26px] text-white/90">
              Receive pricing updates, shopping tips & more!
            </p>
          </div>
          <div className="flex items-center bg-white/10 rounded-full px-6 py-2 border border-white/20 w-full lg:max-w-xl shrink-0">
            <input
              type="email"
              placeholder="Your email address"
              className="bg-transparent text-white placeholder:text-white/70 outline-none flex-grow min-w-0 text-[15px] py-3"
              aria-label="Email for newsletter"
            />
            <button
              type="button"
              className="bg-secondary text-white px-8 py-3 min-h-[54px] rounded-full font-medium text-[15px] shrink-0 hover:bg-secondary/90 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/15 w-full mb-10" aria-hidden />

        {/* Link columns: Company, Quick Links, Our Brands, Vehicles Type, Mobile App + Social */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 mb-10">
          {/* Company */}
          <div>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Company</h3>
            <ul className="flex flex-col gap-1" style={{ lineHeight: '35px' }}>
              <li><Link href="/about" className="text-[15px] text-white hover:text-white/80">About Us</Link></li>
              <li><Link href="/careers" className="text-[15px] text-white hover:text-white/80">Careers</Link></li>
              <li><Link href="/blog" className="text-[15px] text-white hover:text-white/80">Blog</Link></li>
              <li><Link href="/faqs" className="text-[15px] text-white hover:text-white/80">FAQs</Link></li>
              <li><Link href="/contact" className="text-[15px] text-white hover:text-white/80">Finance</Link></li>
              <li><Link href="/contact" className="text-[15px] text-white hover:text-white/80">Contact Us</Link></li>
            </ul>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Quick Links</h3>
            <ul className="flex flex-col gap-1" style={{ lineHeight: '35px' }}>
              <li><Link href="/contact" className="text-[15px] text-white hover:text-white/80">Get in Touch</Link></li>
              <li><Link href="/help" className="text-[15px] text-white hover:text-white/80">Help center</Link></li>
              <li><Link href="/contact" className="text-[15px] text-white hover:text-white/80">Live chat</Link></li>
              <li><Link href="/how-it-works" className="text-[15px] text-white hover:text-white/80">How it works</Link></li>
            </ul>
          </div>
          {/* Our Brands */}
          <div>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Our Brands</h3>
            <ul className="flex flex-col gap-1" style={{ lineHeight: '35px' }}>
              {['Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Ferrari', 'Jaguar', 'Lamborghini'].map((brand) => (
                <li key={brand}>
                  <Link href={`/cars?make=${encodeURIComponent(brand)}`} className="text-[15px] text-white hover:text-white/80">
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Vehicles Type */}
          <div>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Vehicles Type</h3>
            <ul className="flex flex-col gap-1" style={{ lineHeight: '35px' }}>
              {['Pickup', 'Coup', 'Family MPV', 'Sedan', 'SUVs', 'Sport Coupe', 'Convertible', 'Wagon'].map((type) => (
                <li key={type}>
                  <Link href={`/cars?bodyType=${encodeURIComponent(type)}`} className="text-[15px] text-white hover:text-white/80">
                    {type}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Our Mobile App + Connect With Us */}
          <div>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Our Mobile App</h3>
            <div className="flex flex-col gap-3 mb-6">
              <a
                href="#"
                className="flex items-center gap-3 bg-white/[0.07] rounded-[16px] px-4 py-3 text-white hover:bg-white/10 transition-colors"
              >
                <Icon src="apple-173-svgrepo-com.svg" width={32} height={32} className="shrink-0 invert" aria-hidden />
                <div>
                  <span className="block text-[13px] leading-[17px]">Download on the</span>
                  <span className="block text-[15px] leading-[28px] font-medium">Apple Store</span>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 bg-white/[0.07] rounded-[16px] px-4 py-3 text-white hover:bg-white/10 transition-colors"
              >
                <Icon src="google-play-style-svgrepo-com.svg" width={32} height={32} className="shrink-0 invert" aria-hidden />
                <div>
                  <span className="block text-[13px] leading-[17px]">Get it on</span>
                  <span className="block text-[15px] leading-[28px] font-medium">Google Play</span>
                </div>
              </a>
            </div>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Connect With Us</h3>
            <ul className="flex flex-col gap-3 mb-6">
              <li>
                <a href={getPhoneLink()} className="flex items-center gap-3 text-[15px] text-white hover:text-white/80">
                  <Icon src="call-medicine-svgrepo-com.svg" width={18} height={18} className="invert shrink-0" aria-hidden />
                  {formatPhoneNumber()}
                </a>
              </li>
              <li>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[15px] text-white hover:text-white/80">
                  <Icon src="whatsapp-svgrepo-com.svg" width={18} height={18} className="invert shrink-0" aria-hidden />
                  {formatWhatsAppNumber()}
                </a>
              </li>
              <li>
                <a href="mailto:sales@primedealauto.co.za" className="flex items-center gap-3 text-[15px] text-white hover:text-white/80">
                  <Icon src="email-1573-svgrepo-com.svg" width={18} height={18} className="invert shrink-0" aria-hidden />
                  sales@primedealauto.co.za
                </a>
              </li>
              <li>
                <span className="flex items-center gap-3 text-[15px] text-white">
                  <Icon src="location-svgrepo-com.svg" width={18} height={18} className="invert shrink-0" aria-hidden />
                  515 Louis Botha Ave, Bramley
                </span>
              </li>
            </ul>
            <h3 className="text-[20px] leading-[30px] font-medium text-white mb-4">Follow Us</h3>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61567384738083" target="_blank" rel="noopener noreferrer" className="w-[50px] h-[50px] md:w-10 md:h-10 rounded-full bg-white/[0.07] flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="Facebook">
                <Icon src="facebook-svgrepo-com.svg" width={16} height={16} className="invert" aria-hidden />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-[50px] h-[50px] md:w-10 md:h-10 rounded-full bg-white/[0.07] flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="Twitter">
                <Icon src="twitter-svgrepo-com.svg" width={16} height={16} className="invert" aria-hidden />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-[50px] h-[50px] md:w-10 md:h-10 rounded-full bg-white/[0.07] flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="Instagram">
                <Icon src="instagram-svgrepo-com.svg" width={16} height={16} className="invert" aria-hidden />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-[50px] h-[50px] md:w-10 md:h-10 rounded-full bg-white/[0.07] flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/15 w-full mb-6" aria-hidden />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[15px] leading-[26px] text-white">
            © {currentYear} Prime Deal Auto. All rights reserved.
          </p>
          <nav className="flex items-center gap-2 text-[15px] leading-[26px] text-white" aria-label="Legal">
            <Link href="/terms" className="hover:text-white/80">Terms & Conditions</Link>
            <span className="w-1 h-1 rounded-full bg-white shrink-0" aria-hidden />
            <Link href="/privacy" className="hover:text-white/80">Privacy Notice</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

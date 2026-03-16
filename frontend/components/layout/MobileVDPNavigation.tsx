'use client';

import Link from 'next/link';
import Image from 'next/image';
import { generateWhatsAppLink, getPhoneLink } from '@/lib/whatsapp';

interface CarInfo {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
}

interface MobileVDPNavigationProps {
  car: CarInfo;
  onEmailClick: () => void;
}

// SVG Icon components
const PhoneIcon = () => (
  <Image src="/icons/phone-svgrepo-com.svg" alt="" width={20} height={20} />
);

const WhatsAppIcon = () => (
  <Image src="/icons/whatsapp-svgrepo-com.svg" alt="" width={20} height={20} />
);

const MailIcon = () => (
  <Image src="/icons/email-1573-svgrepo-com.svg" alt="" width={20} height={20} />
);

const HomeIcon = () => (
  <Image src="/icons/home-1-svgrepo-com.svg" alt="" width={20} height={20} />
);

/**
 * MobileVDPNavigation Component
 * 
 * Custom mobile bottom navigation for VDP (Vehicle Detail Page) with:
 * - Phone: Direct call to dealership
 * - WhatsApp: Opens WhatsApp with prefilled car enquiry message
 * - Email: Opens contact form modal
 * - Home: Navigate back to homepage
 * 
 * Only visible on mobile viewport (< 640px)
 * Replaces the standard MobileNavigation on VDP pages
 */
export function MobileVDPNavigation({ car, onEmailClick }: MobileVDPNavigationProps) {
  const whatsappLink = generateWhatsAppLink(car);
  const phoneLink = getPhoneLink();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        sm:hidden
        bg-white/80 backdrop-blur-xl
        border-t border-white/20
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
      "
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      }}
      aria-label="Contact options"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {/* Home */}
        <Link
          href="/"
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-gray-100"
          aria-label="Go to homepage"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F9FBFC]">
            <HomeIcon />
          </div>
          <span className="text-[11px] font-medium text-primary">Home</span>
        </Link>

        {/* Phone */}
        <a
          href={phoneLink}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-[#E9F2FF]"
          aria-label="Call dealer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF]">
            <PhoneIcon />
          </div>
          <span className="text-[11px] font-medium text-primary">Call</span>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-[#F3FFF6]"
          aria-label="Chat on WhatsApp"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F5E9]">
            <WhatsAppIcon />
          </div>
          <span className="text-[11px] font-medium text-primary">WhatsApp</span>
        </a>

        {/* Email */}
        <button
          type="button"
          onClick={onEmailClick}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors hover:bg-[#FFE9F3]"
          aria-label="Send email enquiry"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE9F3]">
            <MailIcon />
          </div>
          <span className="text-[11px] font-medium text-primary">Email</span>
        </button>
      </div>
    </nav>
  );
}

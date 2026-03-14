'use client';

import Image from 'next/image';

const WHATSAPP_LINK = 'https://wa.link/r12kgt';

export function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 left-6 w-[60px] h-[60px] rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center z-50 transition-transform duration-150 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:ring-offset-2"
    >
      <Image
        src="/icons/whatsapp-svgrepo-com.svg"
        alt=""
        width={32}
        height={32}
        className="invert"
        aria-hidden
      />
    </a>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Linkedin } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { TiltGlowCard } from '@/components/ui/TiltGlowCard';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Prime Deal Auto – we are here to help you find your perfect car. Send an enquiry and we will respond as soon as we can.',
};

const CONTACT = {
  address: '515 Louis Botha Avenue, Bramley, Johannesburg, South Africa',
  email: 'sales@primedealauto.co.za',
  call: '+27 71 940 4596',
  whatsApp: '+27 73 214 4072',
  whatsAppLink: 'https://wa.link/r12kgt',
};

/** Secondary blue tint for SVG icons (Icon is an img; use filter to get #405FF2) */
const iconSecondaryClass =
  '[filter:invert(28%)_sepia(98%)_saturate(1000%)_hue-rotate(210deg)_brightness(0.95)_contrast(95%)]';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero: dark bar + breadcrumb + title */}
      <section className="bg-primary text-white">
        <div className="max-w-[1700px] mx-auto px-[13.54%] py-8">
          <nav aria-label="Breadcrumb" className="mb-2">
            <Link
              href="/"
              className="text-[15px] leading-[26px] text-secondary hover:underline"
            >
              Home
            </Link>
            <span className="text-white/70 mx-2">/</span>
            <span className="text-[15px] leading-[26px] text-white">Contact Us</span>
          </nav>
          <h1 className="text-[40px] leading-[45px] font-bold font-['DM_Sans',sans-serif]">
            Contact Us
          </h1>
        </div>
        <div className="h-5 bg-white rounded-t-[80px]" aria-hidden />
      </section>

      {/* Main: two-column (form | contact card) */}
      <div className="max-w-[1700px] mx-auto px-[13.54%] py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,567px] gap-10 lg:gap-12">
          <div>
            <h2 className="text-[40px] leading-[55px] font-bold text-primary mb-4">
              Get In Touch
            </h2>
            <p className="text-[15px] leading-[26px] text-primary max-w-[595px] mb-8">
              Have a question about a vehicle, finance, or our stock? Send us a message and our
              team will get back to you as soon as possible. We’re here to help you find the right
              car.
            </p>
            <TiltGlowCard className="shadow-[0px_6px_24px_rgba(0,0,0,0.05)] rounded-[16px] bg-white overflow-visible">
              <ContactForm />
            </TiltGlowCard>
          </div>

          <div>
            <TiltGlowCard className="rounded-[16px] border border-[#E1E1E1] bg-white p-8 h-fit min-h-[fit-content] shadow-[0px_6px_24px_rgba(0,0,0,0.05)]">
              <h3 className="text-[20px] leading-[30px] font-medium text-primary mb-4">
                Contact details
              </h3>
              <p className="text-[15px] leading-[26px] text-primary mb-8 max-w-[489px]">
                Visit us in Bramley, Johannesburg, or reach out by phone, email, or WhatsApp.
                We’re happy to arrange viewings and answer any questions.
              </p>
              <ul className="space-y-6 mb-8">
                <li className="flex gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F9FBFC]"
                    aria-hidden
                  >
                    <Icon
                      src="location-svgrepo-com.svg"
                      width={26}
                      height={26}
                      className={iconSecondaryClass}
                      alt=""
                    />
                  </span>
                  <span className="text-[15px] leading-[26px] font-medium text-primary">
                    {CONTACT.address}
                  </span>
                </li>
                <li className="flex gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F9FBFC]"
                    aria-hidden
                  >
                    <Icon
                      src="email-1573-svgrepo-com.svg"
                      width={26}
                      height={26}
                      className={iconSecondaryClass}
                      alt=""
                    />
                  </span>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="text-[15px] leading-[28px] font-medium text-primary hover:text-secondary transition-colors"
                  >
                    {CONTACT.email}
                  </a>
                </li>
                <li className="flex gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F9FBFC]"
                    aria-hidden
                  >
                    <Icon
                      src="call-medicine-svgrepo-com.svg"
                      width={26}
                      height={26}
                      className={iconSecondaryClass}
                      alt=""
                    />
                  </span>
                  <a
                    href={`tel:${CONTACT.call.replace(/\s/g, '')}`}
                    className="text-[15px] leading-[28px] font-medium text-primary hover:text-secondary transition-colors"
                  >
                    {CONTACT.call}
                  </a>
                </li>
                <li className="flex gap-4">
                  <a
                    href={CONTACT.whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F9FBFC] text-primary hover:bg-[#EEF1FB] transition-colors"
                    aria-label="Chat on WhatsApp"
                  >
                    <Icon
                      src="whatsapp-svgrepo-com.svg"
                      width={26}
                      height={26}
                      alt=""
                      aria-hidden
                    />
                  </a>
                  <a
                    href={CONTACT.whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] leading-[28px] font-medium text-primary hover:text-secondary transition-colors"
                  >
                    {CONTACT.whatsApp}
                  </a>
                </li>
              </ul>
              <p className="text-[15px] leading-[26px] font-medium text-primary mb-3">
                Follow us
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61567384738083"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 rounded-full bg-[#F9FBFC] flex items-center justify-center text-primary hover:bg-[#EEF1FB] hover:text-secondary transition-colors"
                  aria-label="Facebook"
                >
                  <Icon src="facebook-svgrepo-com.svg" width={22} height={22} aria-hidden />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 rounded-full bg-[#F9FBFC] flex items-center justify-center text-primary hover:bg-[#EEF1FB] hover:text-secondary transition-colors"
                  aria-label="Twitter"
                >
                  <Icon src="twitter-svgrepo-com.svg" width={22} height={22} aria-hidden />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 rounded-full bg-[#F9FBFC] flex items-center justify-center text-primary hover:bg-[#EEF1FB] hover:text-secondary transition-colors"
                  aria-label="Instagram"
                >
                  <Icon src="instagram-svgrepo-com.svg" width={22} height={22} aria-hidden />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 rounded-full bg-[#F9FBFC] flex items-center justify-center text-primary hover:bg-[#EEF1FB] hover:text-secondary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-[22px] w-[22px]" />
                </a>
              </div>
            </TiltGlowCard>
          </div>
        </div>
      </div>
    </div>
  );
}

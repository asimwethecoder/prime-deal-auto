import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description:
    'Privacy Notice for Prime Deal Auto – how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
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
            <span className="text-[15px] leading-[26px] text-white">Privacy Notice</span>
          </nav>
          <h1 className="text-[40px] leading-[45px] font-bold font-['DM_Sans',sans-serif]">
            Privacy Notice
          </h1>
        </div>
        <div className="h-5 bg-white rounded-t-[80px]" aria-hidden />
      </section>

      <div className="max-w-[1700px] mx-auto px-[13.54%] py-12 sm:py-16">
        <div className="prose prose-lg max-w-none text-[#050B20]">
          <p className="text-[15px] leading-[26px] mb-4">
            Prime Deal Auto is committed to protecting your privacy. This notice explains how we collect, use, and safeguard your personal information when you use our website and services.
          </p>
          <h2 className="text-[24px] font-bold text-primary mt-8 mb-2">Information we collect</h2>
          <p className="text-[15px] leading-[26px] mb-4">
            We may collect information you provide when you contact us, submit an enquiry, or use our site, including name, email, phone number, and any details you include in messages.
          </p>
          <h2 className="text-[24px] font-bold text-primary mt-8 mb-2">How we use it</h2>
          <p className="text-[15px] leading-[26px] mb-4">
            We use your information to respond to enquiries, improve our services, and communicate with you about vehicles and offers where you have agreed.
          </p>
          <h2 className="text-[24px] font-bold text-primary mt-8 mb-2">Contact</h2>
          <p className="text-[15px] leading-[26px] mb-4">
            For questions about this notice or your data, please contact us at{' '}
            <Link href="/contact" className="text-secondary hover:underline">
              Contact Us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

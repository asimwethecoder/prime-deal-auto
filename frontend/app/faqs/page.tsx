import type { Metadata } from 'next';
import Link from 'next/link';
import { AboutFaq } from '@/components/about/AboutFaq';

export const metadata: Metadata = {
  title: 'FAQs',
  description:
    'Frequently asked questions about buying cars at Prime Deal Auto. Find answers about financing, vehicle history, and more.',
};

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-white rounded-t-[80px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-[15px] leading-[26px]">
            <li>
              <Link href="/" className="text-secondary hover:underline">Home</Link>
            </li>
            <li className="text-primary"> / FAQs</li>
          </ol>
        </nav>
        <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-12 sm:mb-16">
          Frequently Asked Questions
        </h1>

        {/* Reuse the AboutFaq accordion */}
        <AboutFaq />

        {/* Still have questions? */}
        <section className="max-w-3xl mx-auto text-center bg-[#F9FBFC] rounded-[16px] border border-[#E1E1E1] p-8 sm:p-12 mb-16">
          <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">
            Still Have Questions?
          </h2>
          <p className="text-[15px] leading-[26px] text-primary mb-6">
            Our team is here to help. Reach out to us and we'll get back to you as soon as possible.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
          >
            Contact Us
          </Link>
        </section>
      </div>
    </div>
  );
}

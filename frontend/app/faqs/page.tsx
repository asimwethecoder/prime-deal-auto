import type { Metadata } from 'next';
import Link from 'next/link';
import { AboutFaq } from '@/components/about/AboutFaq';

export const metadata: Metadata = {
  title: 'FAQs',
  description:
    'Frequently asked questions about buying cars at Prime Deal Auto. Find answers about financing, vehicle history, and more.',
  alternates: { canonical: '/faqs' },
};

export default function FaqsPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Does Prime Deal Auto own the cars I see online or are they owned by others?', acceptedAnswer: { '@type': 'Answer', text: 'Our listings include both our own stock and selected partner vehicles. Each listing clearly indicates the source. We formalize the process so you are never dealing with unregulated sellers—you can buy with confidence.' } },
      { '@type': 'Question', name: 'How do you choose the cars that you sell?', acceptedAnswer: { '@type': 'Answer', text: 'We use a formalized process and strict quality standards. Every vehicle is inspected for quality and history; only cars that meet our standards are listed.' } },
      { '@type': 'Question', name: 'Can I save my favorite cars to a list I can view later?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Sign in to your account to save favourites and compare vehicles in one place.' } },
      { '@type': 'Question', name: 'Can I be notified when cars I like are added to your inventory?', acceptedAnswer: { '@type': 'Answer', text: 'We are working on alerts for saved searches. For now, check back or contact us for specific makes and models.' } },
      { '@type': 'Question', name: 'What tools do you have to help me find the right car for me and my budget?', acceptedAnswer: { '@type': 'Answer', text: 'Use our search and filters by price, year, make, model, and body type. You can sort by price or year to find options within your budget.' } },
    ],
  };

  return (
    <div className="min-h-screen bg-white rounded-t-[80px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
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

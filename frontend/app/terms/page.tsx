import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms and Conditions for using Prime Deal Auto website and services.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
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
            <span className="text-[15px] leading-[26px] text-white">Terms & Conditions</span>
          </nav>
          <h1 className="text-[40px] leading-[45px] font-bold font-['DM_Sans',sans-serif]">
            Terms & Conditions
          </h1>
        </div>
        <div className="h-5 bg-white rounded-t-[80px]" aria-hidden />
      </section>

      <div className="max-w-[1700px] mx-auto px-[13.54%] py-12 sm:py-16">
        <div className="prose prose-lg max-w-none text-[#050B20]">
          <p className="text-[15px] leading-[26px] mb-4">
            By using the Prime Deal Auto website and services, you agree to these terms. Please read them carefully.
          </p>
          <h2 className="text-[24px] font-bold text-primary mt-8 mb-2">Use of the website</h2>
          <p className="text-[15px] leading-[26px] mb-4">
            You may use this site to browse vehicles, submit enquiries, and access information. You must not use the site for any unlawful purpose or in a way that could harm the site or other users.
          </p>
          <h2 className="text-[24px] font-bold text-primary mt-8 mb-2">Vehicle information</h2>
          <p className="text-[15px] leading-[26px] mb-4">
            We strive to display accurate vehicle details and pricing. All transactions are subject to availability and final confirmation. Please contact us to verify any listing before visiting.
          </p>
          <h2 className="text-[24px] font-bold text-primary mt-8 mb-2">Contact</h2>
          <p className="text-[15px] leading-[26px] mb-4">
            For questions about these terms, please{' '}
            <Link href="/contact" className="text-secondary hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

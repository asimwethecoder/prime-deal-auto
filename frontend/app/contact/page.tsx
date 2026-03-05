import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Prime Deal Auto – we are here to help you find your perfect car.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg-1">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-6">
          Contact Us
        </h1>
        <p className="text-[16px] leading-[28px] text-primary/90 max-w-3xl mb-8">
          Have a question or want to learn more? Reach out and we will get back to you as soon as we can.
        </p>
        <Link
          href="/cars"
          className="inline-block bg-secondary text-white px-8 py-4 rounded-button text-[15px] font-medium hover:bg-secondary/90 transition-colors"
        >
          Browse Cars
        </Link>
      </div>
    </div>
  );
}

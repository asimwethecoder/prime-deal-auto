import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Add Listing',
  description: 'List your car for sale with Prime Deal Auto.',
  alternates: { canonical: '/ad-listing' },
};

export default function AddListingPage() {
  return (
    <div className="min-h-screen bg-bg-1">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-6">
          Add Listing
        </h1>
        <p className="text-[16px] leading-[28px] text-primary/90 max-w-3xl mb-8">
          List your vehicle for sale. Fill in the details and we will help you reach buyers across South Africa.
        </p>
        <Link
          href="/"
          className="inline-block bg-secondary text-white px-8 py-4 rounded-button text-[15px] font-medium hover:bg-secondary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

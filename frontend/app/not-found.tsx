// Custom 404 Not Found Page
// Displayed when a route doesn't exist

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FBFC] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-[16px] p-8 sm:p-12 shadow-[0px_6px_24px_rgba(0,0,0,0.05)] text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <svg
              className="w-32 h-32 mx-auto text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 404 Message */}
          <h1 className="text-[70px] leading-[91px] font-bold text-primary mb-4">
            404
          </h1>
          <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">
            Page Not Found
          </h2>
          <p className="text-[16px] leading-[28px] text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page may have been moved or deleted.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/"
              className="bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/cars"
              className="bg-white border border-[#E1E1E1] text-primary px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-[#F9FBFC] transition-colors"
            >
              Browse Cars
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="border-t border-[#E1E1E1] pt-8">
            <p className="text-[14px] leading-[24px] text-gray-600 mb-4">
              Here are some helpful links instead:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-[14px] leading-[24px]">
              <Link href="/about" className="text-secondary hover:underline">
                About Us
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/contact" className="text-secondary hover:underline">
                Contact
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/cars" className="text-secondary hover:underline">
                Browse Cars
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/ad-listing" className="text-secondary hover:underline">
                List Your Car
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

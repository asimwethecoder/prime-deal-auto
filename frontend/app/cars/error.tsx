'use client';

// Error boundary for Car Listing page
// Displays user-friendly error message with retry functionality

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CarsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Cars page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[16px] p-12 shadow-[0px_6px_24px_rgba(0,0,0,0.05)] text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-[30px] leading-[45px] font-bold text-primary mb-4">
            Something Went Wrong
          </h1>
          <p className="text-[16px] leading-[28px] text-gray-600 mb-8">
            We encountered an error while loading the cars. This could be a temporary issue.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8 text-left">
              <p className="text-sm text-red-800 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="bg-white border border-[#E1E1E1] text-primary px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-[#F9FBFC] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
